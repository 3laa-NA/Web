import ConversationItem from './ConversationItem';
import { useTranslation } from 'react-i18next';

// Liste des conversations privées
// Affiche les différentes conversations de l'utilisateur
function ConversationList({ conversations, loading, selectedId, onSelect }) {
  const { t } = useTranslation('features');
  
  // Affiche un indicateur de chargement si nécessaire
  if (loading) {
    return <div className="loading">{t('privateMessages.loading')}</div>;
  }
    return (
    <div className="conversation-list">
      <h3>{t('privateMessages.myConversations', { defaultValue: 'Mes conversations' })}</h3>
      
      {conversations.length === 0 ? (
        <p>{t('privateMessages.noMessages')}</p>
      ) : (
        <ul>
          {conversations.map(conversation => (
            <ConversationItem 
              key={conversation.id} 
              conversation={conversation} 
              isSelected={selectedId === conversation.id}
              onClick={() => onSelect(conversation.id)} 
            />
          ))}
        </ul>
      )}
    </div>
  );
}

export default ConversationList;
