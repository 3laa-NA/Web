import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { API } from '../../services/api';
import MessageList from './MessageList';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Section principale d'affichage des messages
 */
function MessageSection({ searchQuery, dateFilter, onRefresh, refreshTrigger }) {
  const { t } = useTranslation(['features', 'common']);
  const { user } = useAuth();
  const { forumId } = useParams();  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [welcomeMessage, setWelcomeMessage] = useState(null);
  const [forumInfo, setForumInfo] = useState(null);
  
  // Helper function to check if we're in dashboard
  const isDashboard = window.location.pathname === '/dashboard';

  // Chargement initial des messages et rafraîchissement
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setLoading(true);
        setError(null);
        setWelcomeMessage(null);        if (!forumId) {
          if (isDashboard) {
            setWelcomeMessage(t('messages.error.selectForum', { defaultValue: 'Bienvenue ! Choisissez un forum dans la barre latérale pour commencer à participer aux discussions.' }));
          } else {
            setError(t('forums.errors.invalid'));
          }
          setLoading(false);
          return;
        }

        // Récupérer les informations du forum
        try {
          const forumResponse = await API.forums.getById(forumId);
          if (forumResponse.success) {
            setForumInfo(forumResponse.forum);
          }
        } catch (error) {
          console.error('Erreur lors de la récupération des informations du forum:', error);
        }
        
        const response = await API.messages.getAll({ forumId });
        
        if (response.success) {
          setMessages(response.messages || []);
        } else {
          // Handle specific error cases
          if (response.error?.includes('Accès non autorisé')) {
            setError(t('messages.error.unauthorized', { defaultValue: 'Accès non autorisé à ce forum' }));
          } else {
            setError(t('messages.error.loading', { defaultValue: 'Erreur lors du chargement des messages' }));
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement des messages:', error);
        if (error.response?.status === 403) {
          setError(t('messages.error.unauthorized', { defaultValue: 'Accès non autorisé à ce forum' }));
        } else {
          setError(t('messages.error.unexpected', { defaultValue: 'Une erreur inattendue est survenue' }));
        }
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [t, forumId, refreshTrigger]);

  // Filtrage des messages
  const filteredMessages = messages.filter(msg => {
    // Filtre de recherche
    const messageText = msg.text.toLowerCase();
    const searchMatch = !searchQuery || messageText.includes(searchQuery.toLowerCase());
    
    // Filtre de date
    const messageDate = new Date(msg.timestamp);
    const afterStartDate = dateFilter.start 
      ? messageDate >= new Date(dateFilter.start) 
      : true;
    const beforeEndDate = dateFilter.end 
      ? messageDate <= new Date(dateFilter.end) 
      : true;
      
    return searchMatch && afterStartDate && beforeEndDate;
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
  
  // Fonction pour gérer la création d'un nouveau message
  const handlePostMessage = async (messageText) => {
    try {
      const response = await API.messages.create({ 
        text: messageText,
        forumId
      });

      if (response.success) {
        // Rafraîchir la liste des messages
        await fetchMessages();
      } else {
        setError(t('messages.error.failed', { defaultValue: 'Échec de l\'envoi du message' }));
      }
    } catch (error) {
      console.error('Erreur lors de la création du message:', error);
      setError(t('messages.error.unexpected', { defaultValue: 'Une erreur inattendue est survenue' }));
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
      if (!forumId) {
        const errorMessage = isDashboard 
          ? t('messages.error.selectForum', { defaultValue: 'Veuillez sélectionner un forum pour voir les messages' })
          : t('forums.errors.invalid', { defaultValue: 'Forum invalide' });
        setError(errorMessage);
        return;
      }

      setLoading(true);
      setError(null);

      const response = await API.messages.getAll({ forumId });
      
      if (response.success) {
        // Formater les messages comme dans le chargement initial
        const raw = response.messages || response.data?.messages || [];
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
            parentId: msg._id || msg.id,
            userId: reply.userId,
            user: reply.user || `${reply.firstName || ''} ${reply.lastName || ''}`.trim() || reply.login,
            avatar: reply.avatar || (reply.firstName && reply.firstName.charAt(0)) || (msg.user && msg.user.charAt(0)) || '?',
            login: reply.login,
            text: reply.text,
            timestamp: reply.timestamp || reply.createdAt,
            likes: Array.isArray(reply.likes) ? reply.likes : []
          })) : []
        }));
        setMessages(formattedMessages);
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
      <div className="section-header">        
        <div className="section-title-container">        
          <div className="section-title-row">
            <h2 className="section-title">
              {t('navigation.messages', { ns: 'common' })}
              {filteredMessages.length > 0 && <span>({filteredMessages.length})</span>}
            </h2>
            {forumInfo?.description && (
              <div className="forum-description">{forumInfo.description}</div>
            )}
            <button 
              className="section-title-action" 
              onClick={handleRefresh}
              disabled={loading}
            >
              🔄 {t('refresh', { ns: 'common', defaultValue: 'Actualiser' })}
            </button>
          </div>
        </div>        
      </div>
      {error && <div className="error-message" role="alert">{error}</div>}
      {welcomeMessage && (
        <div className="welcome-message">
          <h3>{t('messages.welcome')}</h3>
          <p>{welcomeMessage}</p>
        </div>
      )}
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
