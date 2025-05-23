import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

// Aperçu du profil utilisateur affiché dans le panneau utilisateur
// Montre l'avatar (ou les initiales) et le nom de l'utilisateur
function ProfilePreview({ user }) {
  const { t } = useTranslation(['common', 'features']);
  
  // Fonction pour tronquer le texte
  const truncateText = (text, maxLength = 7) => {
    if (!text) return '';
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  // Obtenir le nom d'affichage
  const displayName = truncateText(user.login || `${user.firstName || ''} ${user.lastName || ''}`.trim());
  
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
      </div>
      <div className="user-info">
        <p className="user-name">{displayName}</p>
        <Link to={`/user/${user.login}`} className="view-profile-link">{t('profile.publicProfile', { ns: 'features' })}</Link>
      </div>
    </div>
  );
}

export default ProfilePreview;
