import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import MessageList from '../messages/MessageList';
import { API } from '../../services/api';

/**
 * Page de profil utilisateur
 * Permet de consulter et modifier les informations de profil
 * et d'afficher les messages postés par l'utilisateur
 */
function Profile() {
  const { t } = useTranslation(['common', 'features']);
  const { user, updateProfile } = useAuth();
  
  // État pour gérer le mode édition et les données du profil
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    bio: user?.bio || ''
  });
  
  // État pour stocker les messages de l'utilisateur
  const [userMessages, setUserMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Charger les messages de l'utilisateur au chargement du composant
  useEffect(() => {
    const fetchUserMessages = async () => {
      if (!user) return;
        try {
        setLoading(true);
        // Récupérer les messages de l'utilisateur via getAll() avec filtre
        const response = await API.messages.getAll({ userId: user.id });
        
        if (response.success) {
          // Transformer les messages pour inclure un timestamp utilisable
          const rawMessages = response.data?.messages || [];
          const formatted = rawMessages.map(msg => ({
            id: msg._id || msg.id,
            user: user.firstName + ' ' + user.lastName,
            avatar: user.firstName.charAt(0) + user.lastName.charAt(0),
            text: msg.text,
            timestamp: msg.timestamp || msg.createdAt
          }));
          setUserMessages(formatted);
        } else {
          setError(response.message || t('profile.failedToLoadMessages', { ns: 'features' }));
        }
      } catch (err) {
        console.error('Erreur lors du chargement des messages:', err);
        setError(err.message || t('profile.connectionError', { ns: 'features' }));
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserMessages();
  }, [user, t]);

  // Gestionnaire pour mettre à jour les champs du formulaire
  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfileData({
      ...profileData,
      [name]: value
    });
  };

  // Gestionnaire de soumission du formulaire d'édition
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const result = await updateProfile(profileData);
      if (result.success) {
        setIsEditing(false);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        setError(result.message || t('profile.profileUpdateFailed', { ns: 'features' }));
      }
    } catch (err) {
      console.error('Erreur lors de la mise à jour du profil:', err);
      setError(err.message || t('profile.connectionError', { ns: 'features' }));
    }
  };
  
  return (
    <div className="profile">
      <h2 className="form-title">{t('profile.userProfile', { ns: 'features' })}</h2>
      
      {error && <div className="form-error" role="alert">{t(error) || error}</div>}
      {saveSuccess && <div className="form-success" role="alert">{t('profile.profileUpdated', { ns: 'features', defaultValue: 'Profil mis à jour avec succès' })}</div>}
      
      <div className="profile-container">
        <div className="profile-info">
          {isEditing ? (
            // Formulaire d'édition du profil
            <form onSubmit={handleSubmit} className="form">
              <div className="form-group">
                <label htmlFor="firstName">{t('profile.firstName', { ns: 'features' })}</label>
                <input
                  id="firstName"
                  name="firstName"
                  className="form-control"
                  value={profileData.firstName}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="lastName">{t('profile.lastName', { ns: 'features' })}</label>
                <input
                  id="lastName"
                  name="lastName"
                  className="form-control"
                  value={profileData.lastName}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="email">{t('profile.email', { ns: 'features' })}</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  className="form-control"
                  value={profileData.email}
                  onChange={handleChange}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="bio">{t('profile.bio', { ns: 'features' })}</label>
                <textarea
                  id="bio"
                  name="bio"
                  className="form-control"
                  value={profileData.bio}
                  onChange={handleChange}
                  rows="4"
                ></textarea>
              </div>
              
              <div className="form-actions">
                <button type="button" onClick={() => setIsEditing(false)} className="btn btn-secondary">
                  {t('cancel', { ns: 'common' })}
                </button>
                <button type="submit" className="btn btn-primary">
                  {t('save', { ns: 'common' })}
                </button>
              </div>
            </form>
          ) : (
            // Affichage des informations de profil
            <div className="profile-display">
              <h3>{profileData.firstName} {profileData.lastName}</h3>
              {profileData.email && <p><strong>{t('profile.email', { ns: 'features' })}:</strong> {profileData.email}</p>}
              <p><strong>{t('profile.bio', { ns: 'features' })}:</strong> {profileData.bio || t('profile.noBioSet', { ns: 'features' })}</p>
              <button onClick={() => setIsEditing(true)} className="btn btn-primary">
                {t('profile.editProfile', { ns: 'features' })}
              </button>
            </div>
          )}
        </div>
        
        <div className="user-messages">
          <h3>{t('profile.yourMessages', { ns: 'features' })}</h3>
          {loading ? (
            <div className="loading">{t('loading', { ns: 'common' })}</div>
          ) : userMessages.length > 0 ? (
            <MessageList messages={userMessages} />
          ) : (
            <p>{t('profile.noPostedMessages', { ns: 'features' })}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Profile;
