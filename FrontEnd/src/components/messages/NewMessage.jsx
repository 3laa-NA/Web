import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import EmojiPicker from 'emoji-picker-react';

/**
 * Formulaire pour créer un nouveau message avec design amélioré
 */
function NewMessage({ onPostMessage }) {
  const { t } = useTranslation('features');
  const { forumId } = useParams();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const textareaRef = useRef(null);

  // Gestionnaire de soumission du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation du contenu du message
    if (!message.trim()) {
      setError(t('messages.error.empty', { defaultValue: 'Le message ne peut pas être vide' }));
      return;
    }

    if (!forumId) {
      setError(t('messages.error.invalidForum', { defaultValue: 'Forum invalide' }));
      return;
    }
    
    try {
      setIsPosting(true);
      await onPostMessage(message, forumId);
      setMessage('');
      setError('');
    } catch (err) {
      setError(t('messages.error.failed', { defaultValue: 'Échec de l\'envoi du message' }));
    } finally {
      setIsPosting(false);
    }
  };

  // Gestionnaire pour l'ajout d'une image
  const handleImageClick = () => {
    setError(t('messages.error.imageNotSupported', { 
      defaultValue: 'La fonctionnalité d\'ajout d\'images n\'est pas encore disponible. Elle sera implémentée dans une future mise à jour.' 
    }));
    setTimeout(() => setError(''), 5000); // Effacer le message après 5 secondes
  };

  // Gestionnaire pour l'ajout d'un emoji
  const onEmojiClick = (emojiData) => {
    insertAtCursor(emojiData.emoji);
    setShowEmojiPicker(false);
  };

  // Fonction utilitaire pour insérer du texte à la position du curseur
  const insertAtCursor = (text) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newMessage = message.substring(0, start) + text + message.substring(end);
    setMessage(newMessage);

    // Remettre le focus et la position du curseur
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + text.length, start + text.length);
    }, 0);
  };

  return (
    <section className="new-message">
      <h3>{t('messages.newPost', { defaultValue: 'Nouveau message' })}</h3>
      <form onSubmit={handleSubmit} className="form">
        <div className="message-input">
          <textarea 
            ref={textareaRef}
            className={`form-control ${error ? 'error' : ''}`}
            placeholder={t('messages.writeSomething', { defaultValue: 'Écrivez quelque chose...' })}
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              if (error) setError('');
            }}
            aria-required="true"
            aria-invalid={error ? 'true' : 'false'}
          ></textarea>
          
          {error && <p className="form-error" role="alert">{error}</p>}
          
          <div className="message-input-actions">
            <div className="message-input-tools">
              {/* Bouton upload image */}
              <button 
                type="button" 
                className="tool-button" 
                title={t('messages.addImage', { defaultValue: 'Ajouter une image' })}
                onClick={handleImageClick}
              >
                📷
              </button>
              
              {/* Bouton emoji */}
              <div className="emoji-picker-container">
                <button 
                  type="button" 
                  className="tool-button" 
                  title={t('messages.addEmoji', { defaultValue: 'Ajouter un emoji' })}
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                >
                  😊
                </button>
                {showEmojiPicker && (
                  <>
                    <div className="emoji-picker-overlay" onClick={() => setShowEmojiPicker(false)} />
                    <div className="emoji-picker-popup">
                      <EmojiPicker 
                        onEmojiClick={onEmojiClick}
                        lazyLoadEmojis={true}
                        width={350}
                        height={450}
                        previewConfig={{
                          showPreview: false
                        }}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
            
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={isPosting}
            >
              {isPosting ? (
                <span className="btn-loading">{t('messages.posting', { defaultValue: 'Envoi...' })}</span>
              ) : (
                <>📤 <span>{t('messages.post', { defaultValue: 'Publier' })}</span></>
              )}
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}

export default NewMessage;
