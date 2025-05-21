import { useContext } from 'react';
import { AppContext } from '../../contexts/AppContext';
import { useTranslation } from 'react-i18next';

// Composant pour basculer entre les thèmes clair et sombre
function ThemeSwitch({ onChange }) {
  const { theme } = useContext(AppContext);
  const { t } = useTranslation('common');
  
  const handleToggle = () => {
    if (onChange) {
      onChange();
    }
  };
  
  return (
    <button 
      className="theme-toggle" 
      onClick={handleToggle} 
      aria-label={t('switchTheme', { theme: theme === 'light' ? t('darkTheme') : t('lightTheme'), defaultValue: `Passer au thème ${theme === 'light' ? 'sombre' : 'clair'}` })}
    >
      {theme === 'light' ? '🌙' : '☀️'}
    </button>
  );
}

export default ThemeSwitch;
