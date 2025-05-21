import { useTranslation } from 'react-i18next';
import Profile from '../user/Profile';

/**
 * Page qui encapsule le composant Profile
 * Ajoute un titre traduit à la page de profil
 */
function ProfilePage() {
  const { t } = useTranslation('common');
  
  return (
    <div className="page-container">
      <h1>{t('navigation.profile')}</h1>
      <Profile />
    </div>
  );
}

export default ProfilePage;
