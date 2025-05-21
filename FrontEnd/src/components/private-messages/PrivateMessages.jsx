import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import ConversationList from './ConversationList';
import MessageThread from './MessageThread';
import { API } from '../../services/api';

/**
 * Composant principal pour la messagerie privée
 * Permet de visualiser et interagir avec les conversations privées
 */
function PrivateMessages() {
  const { t } = useTranslation('features');
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Chargement initial des conversations depuis l'API
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Récupérer les conversations depuis l'API
        const response = await API.privateMessages.getConversations();
        
        if (response.success) {
          // Transform conversation data to match the component requirements
          const processedConversations = response.conversations.map(conv => {
            // Find the other participant
            const otherParticipant = conv.participants?.find(
              p => p !== user?.id
            ) || '';
            
            return {
              id: conv._id || conv.id,
              withId: otherParticipant,
              withName: conv.withName || '',
              lastMessage: conv.lastMessage?.text || '',
              timestamp: conv.updatedAt || conv.lastMessage?.timestamp || new Date(),
              unread: conv.unreadBy?.includes(user?.id) ? 1 : 0
            };
          });          
          setConversations(processedConversations);
        } else {
          throw new Error(response.message || t('privateMessages.failedToLoadConversations', { ns: 'features' }));
        }
      } catch (error) {
        console.error('Erreur lors du chargement des conversations:', error);
        setError(error.message || t('privateMessages.connectionError', { ns: 'features' }));
      } finally {
        setLoading(false);
      }
    };
    
    if (user) {
      fetchConversations();
    }
  }, [user, t]);
  
  // Sélectionner une conversation
  const handleSelectConversation = (conversationId) => {
    setSelectedConversation(conversationId);
    
    // Marquer la conversation comme lue
    const markAsRead = async () => {
      try {
        // Ignorer l'erreur car ce n'est pas critique pour l'expérience utilisateur
      } catch (error) {
        // Ignorer l'erreur car ce n'est pas critique pour l'expérience utilisateur
      }
    };
    
    markAsRead();
  };
    // Gestionnaire pour envoyer un nouveau message
  const handleSendMessage = async (text) => {
    if (!text.trim() || !selectedConversation) return;
    
    try {
      const recipientInfo = conversations.find(conv => conv.id === selectedConversation);
      const recipient = recipientInfo ? recipientInfo.withId : null;
      
      if (!recipient) {
        throw new Error(t('privateMessages.recipientNotFound', { ns: 'features' }));
      }
      
      setError(null);
      
      // Envoyer le message via l'API
      const response = await API.privateMessages.send({ 
        recipientId: recipient,
        text
      });
      
      return { 
        success: response.success,
        messageId: response.messageId
      };
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
      setError(error.message || t('privateMessages.messageSendFailed'));
      return { success: false, error: error.message };
    }
  };
  
  // Filtrer les conversations par recherche
  const [searchTerm, setSearchTerm] = useState('');
  const filteredConversations = searchTerm
    ? conversations.filter(conv => 
        conv.withName.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : conversations;
    return (
    <div className="private-messages">
      <div className="private-messages-header">
        <h2>{t('privateMessages.privateMessages')}</h2>
        <div className="search-box">
          <input
            type="text"
            placeholder={t('privateMessages.searchConversations')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              className="clear-search"
              onClick={() => setSearchTerm('')}
              aria-label={t('privateMessages.clearSearch')}
            >
              ×
            </button>
          )}
        </div>      </div>
      
      {error && <div className="error-message" role="alert">{t(error) || error}</div>}
      
      <div className="private-messages-container">
        <ConversationList
          conversations={filteredConversations}
          loading={loading}
          selectedId={selectedConversation}
          onSelect={handleSelectConversation}
        />
        
        <MessageThread
          conversationId={selectedConversation}
          onSendMessage={handleSendMessage}
        />
      </div>
    </div>
  );
}

export default PrivateMessages;
