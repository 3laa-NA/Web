import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

// Aperçu du profil utilisateur affiché dans le panneau utilisateur
// Montre l'avatar (ou les initiales) et le nom de l'utilisateur
function ProfilePreview({ user }) {
  const { t } = useTranslation(['common', 'features']);
  
  return (
    <div className="profile-preview">
      <div className="avatar">
        {user.avatar ? (
          <img src={user.avatar} alt={`${t('profile.avatarAlt', { name: user.firstName, defaultValue: `${user.firstName}'s avatar` })}`} />
        ) : (
          <div className="avatar-placeholder">
            {user.firstName.charAt(0)}{user.lastName.charAt(0)}
          </div>
        )}
      </div>      <div className="user-info">
        <p className="user-name">{user.login || `${user.firstName || ''} ${user.lastName || ''}`.trim()}</p>
        <Link to="/profile" className="view-profile-link">{t('viewProfile')}</Link>
      </div>
    </div>
  );
}

export default ProfilePreview;
