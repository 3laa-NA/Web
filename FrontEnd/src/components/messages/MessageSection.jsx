import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import NewMessage from './NewMessage';
import MessageList from './MessageList';
import { API } from '../../services/api';

/**
 * Section principale d'affichage des messages
 */
function MessageSection({ searchQuery, dateFilter }) {
  const { t } = useTranslation('features');
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Chargement initial des messages depuis l'API
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Récupérer les messages depuis l'API
        const response = await API.messages.getAll();
        
        if (response.success) {
          const raw = response.data?.messages || [];
          // Traiter les messages pour correspondre aux attentes du composant
          const formattedMessages = raw.map(msg => ({
            id: msg._id || msg.id,
            userId: msg.userId,
            user: msg.user || `${msg.firstName || ''} ${msg.lastName || ''}`.trim() || msg.login,
            avatar: msg.avatar || (msg.firstName && msg.firstName.charAt(0)) || (msg.user && msg.user.charAt(0)) || '?',
            login: msg.login,
            text: msg.text,
            createdAt: msg.createdAt || msg.timestamp,
            timestamp: msg.timestamp || msg.createdAt,
            likes: Array.isArray(msg.likes) ? msg.likes : [],
            replies: Array.isArray(msg.replies) ? msg.replies.map(reply => ({
              id: reply._id || reply.id,
              userId: reply.userId,
              user: reply.user || `${reply.firstName || ''} ${reply.lastName || ''}`.trim() || reply.login,
              avatar: reply.avatar || (reply.firstName && reply.firstName.charAt(0)) || (reply.user && reply.user.charAt(0)) || '?',
              login: reply.login,
              text: reply.text,
              timestamp: reply.timestamp || reply.createdAt,
              likes: Array.isArray(reply.likes) ? reply.likes : []
            })) : []
          }));
          
          setMessages(formattedMessages);
        } else {
          throw new Error(response.error || t('messages.failedToLoadMessages', { ns: 'features' }));
        }
      } catch (error) {
        console.error('Erreur lors du chargement des messages:', error);
        setError(error.message || t('messages.connectionError', { ns: 'features' }));
        setMessages([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchMessages();
  }, [t]);
  
  // Filtrage des messages
  const filteredMessages = messages.filter(message => {
    const matchesSearch = searchQuery 
      ? message.text.toLowerCase().includes(searchQuery.toLowerCase()) 
      : true;
      
    const messageDate = new Date(message.createdAt || message.timestamp);
    const afterStartDate = dateFilter.start 
      ? messageDate >= new Date(dateFilter.start) 
      : true;
    const beforeEndDate = dateFilter.end 
      ? messageDate <= new Date(dateFilter.end) 
      : true;
      
    return matchesSearch && afterStartDate && beforeEndDate;
  });
    // Fonction pour ajouter une réponse à un message principal uniquement
  const addReplyToMessage = (messagesList, messageId, newReply) => {
    return messagesList.map(message => {
      // Vérifier si c'est le message principal auquel on veut répondre
      if (message.id === messageId || message._id === messageId) {
        return {
          ...message,
          replies: [...(message.replies || []), newReply]
        };
      }
      
      // Si ce n'est pas le message cible, retourner le message sans modification
      return message;
    });
  };
  
  // Gestionnaire pour poster un nouveau message
  const handlePostMessage = async (text) => {
    if (!text.trim()) return;
    
    try {
      setError(null);
      
      // Créer le nouveau message pour une mise à jour immédiate de l'interface
      const newMessage = {
        id: `temp-${Date.now()}`,
        user: user.firstName + ' ' + user.lastName,
        avatar: user.firstName.charAt(0) + user.lastName.charAt(0),
        text,
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        likes: 0,
        replies: []
      };
      
      // Ajouter d'abord le message au state pour une meilleure UX
      setMessages([newMessage, ...messages]);
      
      const response = await API.messages.create({ text });
      
      if (response.success) {
        // Mettre à jour l'ID du message avec l'ID fourni par le serveur
        setMessages(prevMessages => 
          prevMessages.map(msg => 
            msg.id === newMessage.id 
              ? { ...msg, id: response.messageId || response.createdMessage._id } 
              : msg
          )
        );      } else {
        setError(response.message || t('messages.unexpectedError', { ns: 'features' }));
      }
    } catch (error) {
      console.error('Erreur lors de la publication du message:', error);
      setError(error.message || t('messages.unexpectedError', { ns: 'features' }));
    }
  };
    // Gestionnaire pour poster une réponse
  const handlePostReply = async (text, parentId) => {
    if (!text.trim()) return;
    
    try {
      setError(null);
      
      // Vérifier si le parent est un message principal (non une réponse)
      const isParentMainMessage = messages.some(msg => 
        (msg.id === parentId || msg._id === parentId)
      );
      
      if (!isParentMainMessage) {
        setError(t('messages.error.replyToReply', { defaultValue: 'Impossible de répondre à une réponse, uniquement aux messages principaux' }));
        return;
      }
      
      // Créer la nouvelle réponse pour une mise à jour immédiate de l'interface
      const newReply = {
        id: `temp-reply-${Date.now()}`,
        user: user.firstName + ' ' + user.lastName,
        avatar: user.firstName.charAt(0) + user.lastName.charAt(0),
        text,
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        parentId,
        isReply: true,
        likes: []
      };
      
      // Ajouter d'abord la réponse au state pour une meilleure UX
      setMessages(addReplyToMessage(messages, parentId, newReply));
      
      const response = await API.messages.addReply(parentId, { text });
      
      if (response.success) {
        // Mettre à jour l'ID de la réponse avec l'ID fourni par le serveur
        const serverReplyId = response.replyId || Date.now();
        setMessages(prevMessages => 
          prevMessages.map(msg => {
            if (msg.replies && msg.replies.length > 0) {
              return {
                ...msg,
                replies: msg.replies.map(reply => 
                  reply.id === newReply.id 
                    ? { ...reply, id: serverReplyId } 
                    : reply
                )
              };
            }
            return msg;
          })
        );      } else {
        setError(response.message || t('messages.unexpectedError', { ns: 'features' }));
      }
    } catch (error) {
      console.error('Erreur lors de la publication de la réponse:', error);
      setError(error.message || t('messages.unexpectedError', { ns: 'features' }));
    }
  };

  // Gestionnaire pour rafraîchir les messages
  const handleRefresh = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await API.messages.getAll();
      
      if (response.success) {
        setMessages(response.data?.messages || []);
      } else {
        throw new Error(response.error || t('messages.unexpectedError', { ns: 'features' }));
      }
    } catch (error) {
      console.error('Erreur lors du rafraîchissement des messages:', error);
      setError(error.message || t('messages.connectionError', { ns: 'features' }));
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };
    return (
    <div className="messages-container">
      <h2 className="section-title">
        {t('navigation.messages', { ns: 'common' })}
        {filteredMessages.length > 0 && <span>({filteredMessages.length})</span>}
        <button 
          className="section-title-action" 
          onClick={handleRefresh}
          disabled={loading}
        >
          🔄 {t('refresh', { ns: 'common', defaultValue: 'Actualiser' })}
        </button>
      </h2>
      
      {error && <div className="error-message" role="alert">{t(error) || error}</div>}
      {loading ? (
        <div className="loading-messages">{t('messages.loading')}</div>
      ) : filteredMessages.length === 0 ? (
        <div className="no-messages"><p>{t('messages.noMessages', { ns: 'features' })}</p></div>
      ) : (
        <MessageList messages={filteredMessages} onPostReply={handlePostReply} />
      )}
    </div>
  );
}

export default MessageSection;
