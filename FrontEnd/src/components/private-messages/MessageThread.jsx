import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { API } from '../../services/api';

/**
 * Fil de messages d'une conversation privée
 * Affiche les messages échangés entre deux utilisateurs
 */
function MessageThread({ conversationId, onSendMessage, conversations }) {
  const { t } = useTranslation('features');
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const messageEndRef = useRef(null);
    // Chargement des messages de la conversation depuis l'API
  useEffect(() => {
    const fetchMessages = async () => {
      if (!conversationId) {
        setMessages([]);
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        
        // Récupérer les messages depuis l'API
        const response = await API.privateMessages.getMessages(conversationId);
        
        if (response.success) {
          // Process messages to ensure they have the right format
          const formattedMessages = response.messages.map(msg => ({
            id: msg._id || msg.id,
            senderId: msg.senderId,
            text: msg.text,
            timestamp: msg.timestamp || new Date(),
            read: msg.read || false
          }));          
          setMessages(formattedMessages);
        } else {
          throw new Error(response.message || t('privateMessages.failedToLoadMessages'));
        }
      } catch (error) {
        console.error('Erreur lors du chargement des messages:', error);
        setError(error.message || t('privateMessages.connectionError', { ns: 'features' }));
      } finally {
        setLoading(false);
      }
    };
    
    fetchMessages();
  }, [conversationId, t]);
  
  // Scroll automatique vers le dernier message
  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  // Gestionnaire pour l'envoi d'un nouveau message
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    
    try {
      // Ajouter immédiatement le message à l'interface pour une meilleure UX
      const tempMessageData = {
        id: `temp-${Date.now()}`, // ID temporaire qui sera remplacé par l'ID réel
        senderId: user?.id,
        text: newMessage,
        timestamp: new Date().toISOString(),
        isPending: true // Indicateur pour montrer que le message est en cours d'envoi
      };
      
      setMessages(prevMessages => [...prevMessages, tempMessageData]);
      
      // Envoi du message à l'API via le handler parent
      const result = await onSendMessage(newMessage);
      
      if (result && result.success) {
        // Remplacer le message temporaire par celui confirmé par le serveur
        setMessages(prevMessages => 
          prevMessages.map(msg => 
            msg.id === tempMessageData.id 
              ? { ...tempMessageData, id: result.messageId, isPending: false } 
              : msg
          )
        );
        
        // Vider le champ de saisie
        setNewMessage('');
      } else {
        // En cas d'erreur, marquer le message comme échoué
        setMessages(prevMessages => 
          prevMessages.map(msg => 
            msg.id === tempMessageData.id 
              ? { ...tempMessageData, error: true, isPending: false } 
              : msg
          )
        );
        
        throw new Error(result?.error || t('privateMessages.messageSendFailed', { ns: 'features' }));
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
      setError(error.message || t('privateMessages.messageSendFailed', { ns: 'features' }));
    }
  };
  
  // Formatage de la date pour l'affichage
  const formatMessageDate = (timestamp) => {
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat('default', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };    // Récupérer le nom de l'interlocuteur de la conversation active
    const getConversationName = () => {
      if (!conversationId) {
        return '';
      }
      
      // Si les conversations sont disponibles, chercher le nom de la conversation
      if (conversations && Array.isArray(conversations)) {
        const activeConversation = conversations.find(conv => conv.id === conversationId);
        if (activeConversation && activeConversation.withName) {
          return activeConversation.withName;
        }
      }
      
      // Par défaut, retourner "Conversation"
      return t('privateMessages.conversation');
    };
    
    return (
    <div className="message-thread">
      {!conversationId ? (
        <div className="no-conversation-selected">
          <p>{t('privateMessages.selectConversation')}</p>
        </div>
      ) : (
        <>
          <div className="thread-header">
            <h3>{getConversationName()}</h3>
          </div>
          <div className="thread-messages">
            {loading ? (
              <div className="loading-messages">{t('privateMessages.loading')}</div>
            ) : error ? (
              <div className="thread-error">{error}</div>
            ) : messages.length === 0 ? (
              <div className="no-messages">{t('privateMessages.noMessages')}</div>
            ) : (
              messages.map((message) => (
                <div 
                  key={message.id}
                  className={`thread-message ${message.senderId === user?.id ? 'sent' : 'received'} ${message.isPending ? 'pending' : ''} ${message.error ? 'error' : ''}`}
                >
                  <div className="message-text">{message.text}</div>                  <div className="message-time">
                    {formatMessageDate(message.timestamp)}
                    {message.isPending && <span className="pending-indicator" title={t('privateMessages.sending')}> ⌛</span>}
                    {message.error && <span className="error-indicator" title={t('privateMessages.sendError')}> ⚠️</span>}
                  </div>
                </div>
              ))
            )}
            <div ref={messageEndRef} />
          </div>
          
          <form className="thread-input" onSubmit={handleSubmit}>
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={t('privateMessages.typeMessage')}
              disabled={loading}
            />
            <button type="submit" disabled={loading || !newMessage.trim()}>
              {t('privateMessages.send')}
            </button>
          </form>
        </>
      )}
    </div>
  );
}

export default MessageThread;
