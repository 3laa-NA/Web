import { useTranslation } from 'react-i18next';

// Élément individuel d'une conversation dans la liste
// Affiche un aperçu de la conversation avec l'indicateur de messages non lus
function ConversationItem({ conversation, isSelected, onClick }) {
  const { t } = useTranslation('features');
  
  // Extract the user data from the conversation
  const displayName = conversation.withName || t('privateMessages.unknownUser', { defaultValue: 'Utilisateur inconnu' });
  const avatarText = displayName.charAt(0).toUpperCase();
  const previewText = conversation.lastMessage || t('privateMessages.noMessages');
  const unreadCount = conversation.unreadBy?.length || 0;
  return (
    <li 
      className={`conversation-item ${isSelected ? 'selected' : ''} ${unreadCount > 0 ? 'unread' : ''}`}
      onClick={onClick}
    >
      <div className="conversation-avatar">
        {avatarText}
      </div>
      <div className="conversation-content">
        <div className="conversation-name">{displayName}</div>
        <div className="conversation-preview">{previewText}</div>
      </div>
      {unreadCount > 0 && (
        <div className="unread-badge">{unreadCount}</div>
      )}
    </li>
  );
}

export default ConversationItem;
