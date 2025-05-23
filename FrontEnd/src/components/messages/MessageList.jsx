import MessageItem from './MessageItem';

/**
 * Liste des messages
 * Affiche une liste de messages principaux avec leurs réponses (un seul niveau d'imbrication)
 */
function MessageList({ messages, onPostReply }) {
  return (
    <section className="card">
      <ul className="message-list">        {messages.map(message => (
          <MessageItem 
            key={message.id || message._id} 
            message={{
              ...message,
              id: message.id || message._id // Ensure message has an id
            }}
            onPostReply={onPostReply} 
          />
        ))}
      </ul>
    </section>
  );
}

export default MessageList;
