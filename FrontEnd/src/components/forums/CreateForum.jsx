import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { API } from '../../services/api';

/**
 * Formulaire de création d'un nouveau forum
 */
function CreateForum({ onClose, onForumCreated }) {
  const { t } = useTranslation(['features', 'common']);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!name.trim()) {
      setError(t('forums.error.nameRequired'));
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await API.forums.create({
        name: name.trim(),
        description: description.trim(),
        isPublic
      });

      if (response.success) {
        onForumCreated(response.forum);
        onClose();
      } else {
        setError(response.message || t('forums.error.creation'));
      }
    } catch (err) {
      setError(t('common:errors.unknown'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="create-forum-modal">
        <div className="modal-header">
          <h2>{t('forums.create.title')}</h2>
          <button className="btn-icon close-btn" onClick={onClose} aria-label={t('common:close')}>×</button>
        </div>
        
        <form onSubmit={handleSubmit} className="form slide-up">
          <div className="form-group">
            <label htmlFor="forum-name">{t('forums.create.name')}</label>
            <input
              id="forum-name"
              type="text"
              className="form-control"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
              placeholder={t('forums.create.namePlaceholder')}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="forum-description">{t('forums.create.description')}</label>
            <textarea
              id="forum-description"
              className="form-control"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isLoading}
              placeholder={t('forums.create.descriptionPlaceholder')}
              rows={4}
            />
          </div>          <div className="form-group">
            <label className="switch-wrapper">
              <span className="switch-label">{t('forums.create.isPublic')}</span>
              <div className="switch">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  disabled={isLoading}
                />
                <span className="slider"></span>
              </div>
            </label>
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="form-actions">
            <button 
              type="button" 
              onClick={onClose}
              disabled={isLoading}
              className="btn btn-secondary"
            >
              {t('common:cancel')}
            </button>
            <button 
              type="submit"
              disabled={isLoading}
              className={`btn btn-primary ${isLoading ? 'loading' : ''}`}
            >
              {t('common:create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateForum;
