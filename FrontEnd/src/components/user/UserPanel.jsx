import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import Logout from '../auth/Logout';
import ProfilePreview from './ProfilePreview';

/**
 * Panneau utilisateur affiché dans la barre de navigation
 * Montre soit un aperçu du profil et un bouton de déconnexion (si connecté),
 * soit des liens d'authentification (si non connecté)
 */
function UserPanel() {
  const { t } = useTranslation('common');
  const { user } = useAuth();
    // Vérifier si l'utilisateur est le compte développeur spécial
  const isDevAccount = user && user.login === "lmao";
  
  return (
    <div className="user-panel">
      {user ? (
        <>
          <ProfilePreview user={user} />          
          <Logout />
        </>
      ) :(
        <div className="auth-links">          <Link to="/login" className="login-link">{t('navigation.login')}</Link>
          <Link to="/register" className="signup-link">{t('navigation.register')}</Link>
        </div>
      )}
    </div>
  );
}

export default UserPanel;
