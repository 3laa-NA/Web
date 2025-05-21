import { useState } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Formulaire pour créer un nouveau message avec design amélioré
 */
function NewMessage({ onPostMessage }) {
  const { t } = useTranslation('features');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isPosting, setIsPosting] = useState(false);

  // Gestionnaire de soumission du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation du contenu du message
    if (!message.trim()) {
      setError(t('messages.error.empty', { defaultValue: 'Le message ne peut pas être vide' }));
      return;
    }
    
    try {
      setIsPosting(true);
      // Envoi du message
      await onPostMessage(message);
      // Réinitialisation du formulaire
      setMessage('');
      setError('');
    } catch (err) {
      setError(t('messages.error.failed', { defaultValue: 'Échec de l\'envoi du message' }));
    } finally {
      setIsPosting(false);
    }
  };
  return (
    <section className="new-message">
      <h3>{t('messages.newPost', { defaultValue: 'Nouveau message' })}</h3>
      <form onSubmit={handleSubmit} className="form">
        
        <div className="message-input">
          <textarea 
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
              <button 
                type="button" 
                className="tool-button" 
                title={t('messages.addImage', { defaultValue: 'Ajouter une image' })}
              >
                📷
              </button>
              <button 
                type="button" 
                className="tool-button" 
                title={t('messages.addLink', { defaultValue: 'Ajouter un lien' })}
              >
                🔗
              </button>
              <button 
                type="button" 
                className="tool-button" 
                title={t('messages.addEmoji', { defaultValue: 'Ajouter un emoji' })}
              >
                😊
              </button>
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
