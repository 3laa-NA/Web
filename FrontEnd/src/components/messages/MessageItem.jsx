import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { API } from '../../services/api';
import Reply from './Reply';

/**
 * Composant pour afficher un message individuel avec ses réponses
 * Note: Seuls les messages principaux peuvent recevoir des réponses (pas de réponses imbriquées)
 */
function MessageItem({ message, onPostReply, depth = 0 }) {
  const { t } = useTranslation('features');
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [liked, setLiked] = useState(message.likes && Array.isArray(message.likes) && message.likes.includes(localStorage.getItem('userId')));
  const [likeCount, setLikeCount] = useState(Array.isArray(message.likes) ? message.likes.length : 0);
  const [isLiking, setIsLiking] = useState(false);
  
  // Maximum d'imbrication pour les réponses (désormais fixé à 1 niveau)
  const MAX_DEPTH = 1;
  
  // Formatage de la date du message
  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat('default', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  // Affiche/masque le formulaire de réponse
  const toggleReplyForm = () => {
    setShowReplyForm(!showReplyForm);
  };
  
  // Gestionnaire pour poster une réponse
  const handlePostReply = (text) => {
    onPostReply(text, message.id);
    setShowReplyForm(false);
  };

  // Gestionnaire pour le like
  const handleLike = async () => {
    if (isLiking) return; // Prevent multiple clicks
    
    setIsLiking(true);
    try {
      const response = await API.messages.toggleLike(message.id);
      
      if (response.success) {
        setLiked(response.liked);
        setLikeCount(response.likeCount);
      } else {
        console.error('Failed to toggle like:', response.message);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    } finally {
      setIsLiking(false);
    }
  };

  // Ajout de classes conditionnelles pour l'affichage des réponses
  const messageClasses = `message-item ${depth > 0 ? 'message-reply' : ''}`;

  return (
    <li className={messageClasses}>
      <div className="message-header">
        <div className="message-author">
          <div className="avatar">
            {message.avatar || message.user.charAt(0)}
          </div>
          <div className="message-author-info">
            <div className="message-author-name">{message.user || message.login}</div>
          </div>
        </div>
        <time className="message-date">{formatDate(message.timestamp)}</time>
      </div>
      
      <div className="message-content">{message.text}</div>
      
      <div className="message-actions">
        {/* N'afficher le bouton de réponse que pour les messages principaux (non-réponses) */}
        {depth === 0 && (
          <button 
            className={`message-action-btn reply-button ${showReplyForm ? 'active' : ''}`} 
            onClick={toggleReplyForm}
          >
            <span>{t('messages.reply')}</span>
            {message.replies && message.replies.length > 0 && (
              <span className="message-badge">{message.replies.length}</span>
            )}
          </button>
        )}
        
        <button 
          className={`message-action-btn like-button ${liked ? 'active' : ''}`}
          onClick={handleLike}
          disabled={isLiking}
        >
          <span>{t('messages.like')}</span>
          {likeCount > 0 && (
            <span className="message-badge">{likeCount}</span>
          )}
        </button>
        
        <button className="message-action-btn share-button">
          <span>{t('messages.share')}</span>
        </button>
      </div>
      
      {/* Formulaire de réponse */}
      {showReplyForm && (
        <Reply onPostReply={handlePostReply} onCancel={() => setShowReplyForm(false)} />
      )}
      
      {/* Affichage récursif des réponses */}
      {message.replies && message.replies.length > 0 && (
        <ul className="nested-replies">
          {message.replies.map(reply => (
            <MessageItem 
              key={reply.id} 
              message={reply} 
              onPostReply={onPostReply}
              depth={depth + 1}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

export default MessageItem;
