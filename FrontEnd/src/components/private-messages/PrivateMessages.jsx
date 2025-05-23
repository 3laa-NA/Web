import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import ConversationList from './ConversationList';
import MessageThread from './MessageThread';
import { API } from '../../services/api';
import NewConversationModal from './NewConversationModal';

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
  const [searchTerm, setSearchTerm] = useState(''); // État pour le terme de recherche
  const [showNewConversationModal, setShowNewConversationModal] = useState(false); // État pour le modal de nouvelle conversation
  // Fonction pour rafraîchir les conversations
  const fetchConversations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Current user from context:', user);
      
      if (!user || !user.id) {
        throw new Error('Utilisateur non authentifié ou ID utilisateur non disponible');
      }
      
      // Récupérer les conversations depuis l'API
      const response = await API.privateMessages.getConversations();
      
      // Debug la réponse pour comprendre le format
      console.log('API Response:', response);
      
      if (response.success && response.conversations) {
        if (response.conversations.length === 0) {
          console.log('Aucune conversation trouvée pour l\'utilisateur');
        }
        
        // Transform conversation data to match the component requirements
        const processedConversations = response.conversations.map(conv => {
          console.log('Processing conversation:', conv);
          return {
            id: conv.id,
            withId: conv.withId,
            withName: conv.with || '', // Backend renvoie 'with' comme nom d'affichage
            withLogin: conv.withLogin || '',
            lastMessage: conv.lastMessage || '',
            timestamp: conv.updatedAt || new Date(),
            unread: conv.unread || 0,
            unreadBy: conv.unread > 0 ? [user.id] : []
          };
        });
        
        console.log('Processed conversations:', processedConversations);
        setConversations(processedConversations);
      } else {
        throw new Error(response.message || t('privateMessages.failedToLoadConversations'));
      }
    } catch (error) {
      console.error('Erreur lors du chargement des conversations:', error);
      setError(error.message || t('privateMessages.connectionError'));
    } finally {
      setLoading(false);
    }
  };
    // Chargement initial des conversations depuis l'API
  useEffect(() => {
    // Déboguer l'utilisateur actuel via l'objet user du contexte
    if (user) {
      console.log('Current user from context:', user);
      fetchConversations();
    } else {
      setError('Vous devez être connecté pour voir vos messages privés');
      setLoading(false);
    }
  }, [user]);

  // Sélectionner une conversation
  const handleSelectConversation = (conversationId) => {
    setSelectedConversation(conversationId);
    
    // Marquer la conversation comme lue
    const markAsRead = async () => {
      try {
        setError(null); // Effacer les erreurs précédentes
        
        // Appeler l'API pour marquer comme lu
        console.log('Marquage de la conversation comme lue:', conversationId);
        const result = await API.privateMessages.markAsRead(conversationId);
        console.log('Marquer comme lu résultat:', result);
        
        // Mettre à jour l'état local si succès
        if (result && result.success) {
          setConversations(prevConvs => 
            prevConvs.map(conv => 
              conv.id === conversationId 
                ? {...conv, unread: 0, unreadBy: []} 
                : conv
            )
          );
        } else if (result && !result.success) {
          console.warn('Échec du marquage comme lu:', result.message);
          // Ne pas afficher d'erreur à l'utilisateur car pas critique
        }
      } catch (error) {
        console.error('Erreur lors du marquage comme lu:', error);
        
        // En cas d'erreur grave d'autorisation, afficher un message discret
        if (error.response?.status === 403) {
          setError(t('privateMessages.conversationAccessError', { 
            defaultValue: 'Problème d\'accès à certaines conversations. Veuillez actualiser la page.' 
          }));
        }
        // Sinon ignorer l'erreur car pas critique pour l'UX
      }
    };
    
    markAsRead();
  };  // Gestionnaire pour envoyer un nouveau message
  const handleSendMessage = async (text) => {
    if (!text.trim() || !selectedConversation) return;
    
    try {
      const recipientInfo = conversations.find(conv => conv.id === selectedConversation);
      const recipient = recipientInfo ? recipientInfo.withId : null;
      
      if (!recipient) {
        throw new Error(t('privateMessages.recipientNotFound', { ns: 'features' }));
      }
      
      setError(null);
      
      // Update local state immediately for better UX
      const now = new Date();
      setConversations(prevConvs => {
        const updatedConvs = prevConvs.map(conv => 
          conv.id === selectedConversation
            ? {
                ...conv,
                lastMessage: text,
                timestamp: now,
              }
            : conv
        );
        
        // Move the updated conversation to the top
        const [updatedConv] = updatedConvs.filter(c => c.id === selectedConversation);
        const otherConvs = updatedConvs.filter(c => c.id !== selectedConversation);
        return [updatedConv, ...otherConvs];
      });      // Récupérer la conversation sélectionnée pour s'assurer d'avoir les bonnes infos
      const conversation = conversations.find(conv => conv.id === selectedConversation);
      if (!conversation) {
        throw new Error('Conversation introuvable');
      }

      // Envoyer le message via l'API
      const response = await API.privateMessages.send({ 
        recipientId: conversation.withId,
        text,
        conversationId: conversation.id
      });
      if (!response.success) {
        // Revert the local change if API call failed
        throw new Error(response.message || t('privateMessages.messageSendFailed'));
      }
      
      // Update conversations to reflect server state
      const updatedConversationsResponse = await API.privateMessages.getConversations();
      if (updatedConversationsResponse.success && updatedConversationsResponse.conversations) {
        const processedConversations = updatedConversationsResponse.conversations.map(conv => ({
          id: conv.id,
          withId: conv.withId,
          withName: conv.with || '',
          withLogin: conv.withLogin || '',
          lastMessage: conv.lastMessage || '',
          timestamp: conv.updatedAt || new Date(),
          unread: conv.unread || 0,
          unreadBy: conv.unread > 0 ? [user.id] : []
        }));
        setConversations(processedConversations);
      }
      
      return { 
        success: response.success,
        messageId: response.messageId
      };
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
      setError(error.message || t('privateMessages.messageSendFailed'));
      
      // Re-fetch conversations to ensure consistent state
      const response = await API.privateMessages.getConversations();
      if (response.success && response.conversations) {
        setConversations(response.conversations.map(conv => ({
          id: conv.id,
          withId: conv.withId,
          withName: conv.with || '',
          withLogin: conv.withLogin || '',
          lastMessage: conv.lastMessage || '',
          timestamp: conv.updatedAt || new Date(),
          unread: conv.unread || 0,
          unreadBy: conv.unread > 0 ? [user.id] : []
        })));
      }
      
      return { success: false, error: error.message };
    }
  };

  // Filtrer les conversations par recherche
  const filteredConversations = searchTerm
    ? conversations.filter(conv => 
        conv.withName.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : conversations;  // Fonction pour créer une nouvelle conversation
  const handleNewConversation = () => {
    setShowNewConversationModal(true);
  };
  
  // Fonction pour gérer la fermeture du modal
  const handleCloseModal = () => {
    setShowNewConversationModal(false);
  };
  
  // Fonction pour gérer la création d'une nouvelle conversation
  const handleConversationStart = (conversationId) => {
    // Rafraîchir la liste des conversations
    fetchConversations();
    
    // Sélectionner la nouvelle conversation
    setSelectedConversation(conversationId);
  };
  return (
    <div className="private-messages">      <div className="private-messages-header">
        <div className="header-left">
          <h1>{t('privateMessages.inbox', { defaultValue: 'Boîte de réception' })}</h1>
        </div>
        <div className="header-right">
          <div className="search-box">
            <i className="search-icon">🔍</i>
            <input
              type="text"
              placeholder={t('privateMessages.searchConversations', { defaultValue: 'Rechercher une conversation...' })}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                className="clear-search"
                onClick={() => setSearchTerm('')}
                aria-label={t('privateMessages.clearSearch', { defaultValue: 'Effacer la recherche' })}
              >
                ×
              </button>
            )}
          </div>
          <button 
            className="new-conversation-btn" 
            onClick={handleNewConversation}
            title={t('privateMessages.newConversation', { defaultValue: 'Nouvelle conversation' })}
          >
            <i className="icon">✉️</i>
            <span>{t('privateMessages.new', { defaultValue: 'Nouveau' })}</span>
          </button>
        </div>
      </div>
      
      {error && <div className="error-message" role="alert">{error}</div>}
      {loading && <div className="loading-indicator">{t('privateMessages.loading', { defaultValue: 'Chargement...' })}</div>}
      
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
          conversations={conversations}
        />      </div>
      
      {/* Modal de création de nouvelle conversation */}
      <NewConversationModal
        isOpen={showNewConversationModal}
        onClose={handleCloseModal}
        onConversationStart={handleConversationStart}
      />
    </div>
  );
}

export default PrivateMessages;
