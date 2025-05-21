import { useState } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Formulaire pour répondre à un message principal
 */
function Reply({ onPostReply, onCancel }) {
  const { t } = useTranslation('features');
  const [reply, setReply] = useState('');
  const [error, setError] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  
  // Gestionnaire de soumission du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation du contenu de la réponse
    if (!reply.trim()) {
      setError(t('messages.error.empty', { defaultValue: 'Le message ne peut pas être vide' }));
      return;
    }
    
    try {
      setIsPosting(true);
      // Envoi de la réponse
      await onPostReply(reply);
      // Réinitialisation du formulaire
      setReply('');
      setError('');
    } catch (err) {
      setError(t('messages.error.failed', { defaultValue: 'Échec de l\'envoi de la réponse' }));
    } finally {
      setIsPosting(false);
    }
  };
  
  return (
    <form className="reply-form" onSubmit={handleSubmit}>
      <div className="message-input">
        <textarea
          className={`form-control ${error ? 'error' : ''}`}
          value={reply}
          onChange={(e) => {
            setReply(e.target.value);
            if (error) setError('');
          }}
          placeholder={t('messages.writeReply', { defaultValue: 'Écrivez votre réponse...' })}
          aria-label={t('messages.replyText', { defaultValue: 'Texte de la réponse' })}
          rows="2"
        ></textarea>
        
        {error && <p className="form-error" role="alert">{error}</p>}
        
        <div className="form-actions">
          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={onCancel}
            disabled={isPosting}
          >
            {t('cancel', { ns: 'common' })}
          </button>
          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={isPosting}
          >
            {isPosting ? (
              <span className="btn-loading">{t('messages.posting', { defaultValue: 'Envoi...' })}</span>
            ) : (
              t('post', { ns: 'common', defaultValue: 'Envoyer' })
            )}
          </button>
        </div>
      </div>
    </form>  );
}

export default Reply;
