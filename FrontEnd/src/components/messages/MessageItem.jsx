import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { API } from '../../services/api';
import Reply from './Reply';

/**
 * Composant pour afficher un message individuel avec ses réponses
 * Note: Seuls les messages principaux peuvent recevoir des réponses (pas de réponses imbriquées)
 */
function MessageItem({ message, onPostReply, depth = 0 }) {
  const { t } = useTranslation('features');
  const { user } = useAuth();
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [liked, setLiked] = useState(message.likes && Array.isArray(message.likes) && message.likes.includes(user?.id));
  const [likeCount, setLikeCount] = useState(Array.isArray(message.likes) ? message.likes.length : 0);
  const [isLiking, setIsLiking] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  
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
      // Si c'est une réponse (depth > 0), utiliser toggleReplyLike avec l'ID du message parent
      const response = depth > 0
        ? await API.messages.toggleReplyLike(message.parentId, message.id)
        : await API.messages.toggleLike(message.id);
      
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
  // Gère le clic sur le bouton de partage
  const handleShare = async () => {
    try {
      // Copier le texte du message
      await navigator.clipboard.writeText(message.text);
      setShareSuccess(true);
      
      // Réinitialiser l'état après 2 secondes
      setTimeout(() => {
        setShareSuccess(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to copy URL:', error);
    }
  };
  
  // Ajout de classes conditionnelles pour l'affichage des réponses
  const messageClasses = `message-item ${depth > 0 ? 'message-reply' : ''}`;

  return (
    <li className={messageClasses}>
      <div className="message-header">        <div className="message-author">
          <Link to={`/user/${message.login}`} className="avatar">
            {message.avatar || (message.user && message.user.charAt(0)) || message.login?.charAt(0) || '?'}
          </Link>
          <div className="message-author-info">
            <Link to={`/user/${message.login}`} className="message-author-name">
              {message.user || message.login || t('messages.unknownUser', { ns: 'features' })}
            </Link>
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
          title={liked ? t('messages.unlike') : t('messages.like')}
        >
          <span className="heart-icon">{liked ? '❤️' : '🤍'}</span>
          {likeCount > 0 && (
            <span className="message-badge">{likeCount}</span>
          )}
        </button>
        
        <button 
          className={`message-action-btn share-button ${shareSuccess ? 'success' : ''}`}
          onClick={handleShare}
          title={shareSuccess ? t('messages.copied') : t('messages.share')}
        >
          <span className="share-icon">🔗</span>
          <span>{shareSuccess ? t('messages.copied') : t('messages.share')}</span>
        </button>
      </div>
      
      {/* Formulaire de réponse */}
      {showReplyForm && (
        <Reply onPostReply={handlePostReply} onCancel={() => setShowReplyForm(false)} />
      )}
        {/* Affichage récursif des réponses */}
      {message.replies && message.replies.length > 0 && (
        <ul className="nested-replies">
          {message.replies.map((reply, index) => {
            const replyId = reply.id || reply._id || `${message.id}-reply-${index}`;
            return (
              <MessageItem 
                key={replyId}                message={{
                  ...reply,
                  id: replyId, // Ensure reply has a unique id
                  parentId: message.id // Add parent message ID
                }}
                onPostReply={onPostReply}
                depth={depth + 1}
              />
            );
          })}
        </ul>
      )}
    </li>
  );
}

export default MessageItem;
