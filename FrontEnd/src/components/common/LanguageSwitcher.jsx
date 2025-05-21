import { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { AppContext } from '../../contexts/AppContext';
import { AVAILABLE_LANGUAGES } from '../../utils/i18n';

/**
 * Composant pour changer la langue de l'application
 * Inclut actuellement le français et l'anglais
 */
function LanguageSwitcher() {
  const { language, changeLanguage } = useContext(AppContext);
  const { t, i18n } = useTranslation('common');
  
  const handleLanguageChange = (lang) => {
    // Changer la langue dans i18next
    i18n.changeLanguage(lang);
    // Mettre à jour également dans le contexte de l'App
    changeLanguage(lang);
  };
    return (
    <div className="language-switcher">
      <select 
        value={language || i18n.language} 
        onChange={(e) => handleLanguageChange(e.target.value)}
        aria-label={t('selectLanguage', 'Select Language')}
      >
        {AVAILABLE_LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.name}
          </option>
        ))}
      </select>
    </div>
  );
}

export default LanguageSwitcher;
