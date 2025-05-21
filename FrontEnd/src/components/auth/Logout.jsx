import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Composant pour le bouton de déconnexion
 */
function Logout() {
  const { t } = useTranslation('common');
  const { logout } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  
  const handleLogout = async () => {
    setIsLoading(true);
    await logout();
    setIsLoading(false);
  };    return (
    <button 
      className="logout-button" 
      onClick={handleLogout}
      disabled={isLoading}
      aria-label={t('navigation.logout')}
    >
      {isLoading ? t('loading') : t('navigation.logout')}
    </button>
  );
}

export default Logout;
