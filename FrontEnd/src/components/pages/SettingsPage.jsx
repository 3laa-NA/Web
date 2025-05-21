import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import apiService from '../../services/api';

/**
 * Page des paramètres de l'utilisateur
 */
function SettingsPage() {
  const { t } = useTranslation('features');
  const { user } = useAuth();
  const [settings, setSettings] = useState({
    notifications: true,
    language: 'fr',
    theme: 'light',
  });
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState(null);

  // Fonction pour gérer les changements de paramètres
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Fonction pour sauvegarder les paramètres
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      setSaveSuccess(false);
      
      // Appel à l'API (à implémenter côté backend)
      // const response = await apiService.profile.updateSettings(settings);
      
      // Simulation de sauvegarde réussie (à remplacer par l'appel API réel)
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setSaveSuccess(true);
      
      // Masquer le message de succès après 3 secondes
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    } catch (err) {
      setError(err.message || t('saveFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="settings-page">
      <h2 className="form-title">{t('settings')}</h2>
        {error && (
        <div className="alert alert-error alert-icon" role="alert">
          {error}
        </div>
      )}
      
      {saveSuccess && (
        <div className="alert alert-success alert-icon" role="alert">
          {t('settingsSaved')}
        </div>
      )}
      
      <form onSubmit={handleSaveSettings} className="form">
        <div className="settings-section">
          <h3>{t('generalSettings')}</h3>
          
          <div className="form-group">
            <label htmlFor="language">{t('language')}</label>
            <select
              id="language"
              name="language"
              className="form-control"
              value={settings.language}
              onChange={handleChange}
            >
              <option value="fr">Français</option>
              <option value="en">English</option>
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="theme">{t('theme')}</label>
            <select
              id="theme"
              name="theme"
              className="form-control"
              value={settings.theme}
              onChange={handleChange}
            >
              <option value="light">{t('light')}</option>
              <option value="dark">{t('dark')}</option>
              <option value="system">{t('system')}</option>
            </select>
          </div>
        </div>
        
        <div className="settings-section">
          <h3>{t('notificationSettings')}</h3>
          
          <div className="checkbox">
            <input
              type="checkbox"
              id="notifications"
              name="notifications"
              checked={settings.notifications}
              onChange={handleChange}
            />
            <label htmlFor="notifications">{t('enableNotifications')}</label>
          </div>
        </div>
        
        <div className="settings-section">
          <h3>{t('accountSettings')}</h3>
          <p className="settings-info">
            {t('accountInfo', { email: user?.login || t('notAvailable') })}
          </p>
        </div>
        
        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? t('saving') : t('saveSettings')}
          </button>
        </div>
      </form>
    </div>
  );
}

export default SettingsPage;
