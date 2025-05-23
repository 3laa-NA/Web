import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { API } from '../../services/api';
import MessageList from '../messages/MessageList';

/**
 * Composant pour afficher le profil public d'un utilisateur
 */
function UserProfile() {
  const { login } = useParams();
  const { t } = useTranslation(['features', 'common']);
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);        setError(null);
        
        // Même si c'est le profil de l'utilisateur connecté, montrer la vue publique
        const response = await API.users.getPublicProfile(login);
        
        if (response.success && response.profile) {
          setProfile(response.profile);
        } else {
          throw new Error(response.message || t('profile.notFound', { ns: 'features' }));
        }
      } catch (err) {
        console.error('Erreur lors du chargement du profil:', err);
        setError(err.message || t('profile.loadError', { ns: 'features' }));
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [login, t, user]);

  if (loading) {
    return <div className="loading">{t('loading', { ns: 'common' })}</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (!profile) {
    return <div className="not-found">{t('profile.notFound', { ns: 'features' })}</div>;
  }

  return (
    <div className="user-profile">
      <div className="profile-header">
        <div className="profile-avatar">
          {profile.avatar ? (
            <img src={profile.avatar} alt={profile.login} />
          ) : (
            <div className="avatar-placeholder">
              {profile.firstName?.charAt(0)}{profile.lastName?.charAt(0)}
            </div>
          )}
        </div>
        <div className="profile-info">
          <h2>{profile.firstName} {profile.lastName}</h2>
          <p className="profile-login">@{profile.login}</p>
          {profile.role === 'admin' && (
            <span className="admin-badge">{t('profile.adminBadge', { ns: 'features' })}</span>
          )}
          <p className="profile-bio">{profile.bio || t('profile.noBio', { ns: 'features' })}</p>
          <p className="profile-member-since">
            {t('profile.memberSince', {
              ns: 'features',
              date: new Date(profile.createdAt).toLocaleDateString()
            })}
          </p>
        </div>
      </div>

      <div className="profile-messages">
        <h3>{t('profile.publicMessages', { ns: 'features' })}</h3>
        {profile.messages.length > 0 ? (
          <MessageList messages={profile.messages} />
        ) : (
          <p>{t('profile.noPublicMessages', { ns: 'features' })}</p>
        )}
      </div>
    </div>
  );
}

export default UserProfile;
