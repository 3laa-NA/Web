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
  
  // États du profil
  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    bio: user?.bio || ''
  });
  
  // États des messages
  const [userMessages, setUserMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Mettre à jour les données du formulaire quand l'utilisateur change
  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        bio: user.bio || ''
      });
    }
  }, [user]);  // Chargement des messages
  const fetchUserMessages = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await API.messages.getUserMessages(user.id);
      
      if (response?.success && Array.isArray(response.messages)) {
        const formatted = response.messages.map(msg => ({
          id: msg._id || msg.id,
          user: msg.user || `${user.firstName} ${user.lastName}`,
          avatar: msg.avatar || `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`,
          text: msg.text,
          timestamp: msg.timestamp || msg.createdAt,
          createdAt: msg.createdAt || msg.timestamp,
          forumId: msg.forumId,
          likes: Array.isArray(msg.likes) ? msg.likes : [],
          replies: Array.isArray(msg.replies) ? msg.replies.map(reply => ({
            id: reply._id || reply.id,
            parentId: msg._id || msg.id,
            user: reply.user,
            avatar: reply.avatar,
            text: reply.text,
            timestamp: reply.timestamp || reply.createdAt,
            likes: Array.isArray(reply.likes) ? reply.likes : []
          })) : [],
          canDelete: msg.userId === user.id || user.role === 'admin'
        }));
        setUserMessages(formatted);
        setError(null);
      } else {
        console.error('Format de réponse invalide:', response);
        setError(t('profile.failedToLoadMessages', { ns: 'features' }));
        setUserMessages([]);
      }
    } catch (err) {
      console.error('Erreur lors du chargement des messages:', err);
      setError(t('profile.connectionError', { ns: 'features' }));
      setUserMessages([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserMessages();
  }, [user, t]);

  // Gestion du formulaire de profil
  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
    // Effacer l'erreur du champ modifié
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    // Effacer l'erreur générale si elle existe
    if (error) {
      setError(null);
    }
  };

  const validateForm = (data) => {
    const errors = {};
    
    // Validation du prénom
    if (!data.firstName?.trim()) {
      errors.firstName = t('profile.firstNameRequired', { ns: 'features', defaultValue: 'Le prénom est requis' });
    }
    
    // Validation du nom
    if (!data.lastName?.trim()) {
      errors.lastName = t('profile.lastNameRequired', { ns: 'features', defaultValue: 'Le nom est requis' });
    }
    
    // Validation optionnelle de l'email
    if (data.email && !data.email.trim().match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      errors.email = t('profile.invalidEmail', { ns: 'features', defaultValue: 'Email invalide' });
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Réinitialiser les erreurs
    setError(null);
    setFieldErrors({});    // Ne soumettre que les champs qui ont été modifiés
    const changedFields = {};
    Object.keys(profileData).forEach(key => {
      const value = profileData[key]?.trim();
      // Pour la bio, permettre les valeurs vides
      if (key === 'bio' || (value && value !== user[key])) {
        changedFields[key] = value;
      }
    });

    // S'assurer que firstName et lastName sont toujours inclus même s'ils n'ont pas changé
    if (!changedFields.firstName) changedFields.firstName = user?.firstName || profileData.firstName;
    if (!changedFields.lastName) changedFields.lastName = user?.lastName || profileData.lastName;

    // Valider le formulaire
    if (!validateForm(changedFields)) {
      return;
    }

    try {
      const result = await updateProfile(changedFields);
      
      if (result.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        // Gérer les erreurs de validation du serveur
        if (result.message === 'Prénom et nom sont requis') {
          setFieldErrors({
            firstName: t('profile.firstNameRequired', { ns: 'features' }),
            lastName: t('profile.lastNameRequired', { ns: 'features' })
          });
        } else {
          setError(result.message || t('profile.updateFailed', { ns: 'features' }));
        }
      }
    } catch (err) {
      console.error('Erreur lors de la mise à jour du profil:', err);
      setError(t('profile.connectionError', { ns: 'features' }));
    }
  };

  // Gestion des messages
  const handleDeleteMessage = async (messageId) => {
    if (deleteConfirm !== messageId) {
      setDeleteConfirm(messageId);
      return;
    }

    try {
      const response = await API.messages.delete(messageId);
      if (response.success) {
        setUserMessages(prev => prev.filter(msg => msg.id !== messageId));
        setDeleteConfirm(null);
      } else {
        setError(t('profile.deleteMessageFailed', { ns: 'features' }));
      }
    } catch (err) {
      console.error('Erreur lors de la suppression du message:', err);
      setError(t('profile.connectionError', { ns: 'features' }));
    }
  };

  return (
    <div className="profile">
      <h2 className="form-title">{t('profile.userProfile', { ns: 'features' })}</h2>
      
      {error && (
        <div className="alert alert-error" role="alert">
          {error}
          <button type="button" className="alert-close" onClick={() => setError(null)}>
            <span>&times;</span>
          </button>
        </div>
      )}
      
      {saveSuccess && (
        <div className="alert alert-success" role="alert">
          {t('profile.profileUpdated', { ns: 'features', defaultValue: 'Profil mis à jour avec succès' })}
        </div>
      )}
      
      <div className="profile-container">
        <div className="profile-info">
          <form onSubmit={handleSubmit} className="form">
            <div className="form-group">
              <label htmlFor="firstName">
                {t('profile.firstName', { ns: 'features' })} *
              </label>
              <input
                id="firstName"
                name="firstName"
                className={`form-control ${fieldErrors.firstName ? 'is-invalid' : ''}`}
                value={profileData.firstName}
                onChange={handleChange}
              />
              {fieldErrors.firstName && (
                <div className="invalid-feedback">{fieldErrors.firstName}</div>
              )}
            </div>
            
            <div className="form-group">
              <label htmlFor="lastName">
                {t('profile.lastName', { ns: 'features' })} *
              </label>
              <input
                id="lastName"
                name="lastName"
                className={`form-control ${fieldErrors.lastName ? 'is-invalid' : ''}`}
                value={profileData.lastName}
                onChange={handleChange}
              />
              {fieldErrors.lastName && (
                <div className="invalid-feedback">{fieldErrors.lastName}</div>
              )}
            </div>
            
            <div className="form-group">
              <label htmlFor="email">{t('profile.email', { ns: 'features' })}</label>
              <input
                id="email"
                name="email"
                type="email"
                className={`form-control ${fieldErrors.email ? 'is-invalid' : ''}`}
                value={profileData.email}
                onChange={handleChange}
              />
              {fieldErrors.email && (
                <div className="invalid-feedback">{fieldErrors.email}</div>
              )}
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
              <button type="submit" className="btn btn-primary">
                {t('save', { ns: 'common' })}
              </button>
            </div>
          </form>
        </div>

        <div className="user-messages">
          <h3>{t('profile.yourMessages', { ns: 'features' })}</h3>
          {loading ? (
            <div className="loading">{t('loading', { ns: 'common' })}</div>
          ) : userMessages && userMessages.length > 0 ? (
            <div className="messages-list">
              {userMessages.map(message => (
                <div key={message.id} className="message-item">
                  <MessageList messages={[message]} />
                  <div className="message-actions">
                    {deleteConfirm === message.id ? (
                      <>
                        <button
                          onClick={() => handleDeleteMessage(message.id)}
                          className="btn btn-danger btn-sm"
                        >
                          {t('confirm', { ns: 'common' })}
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="btn btn-secondary btn-sm"
                        >
                          {t('cancel', { ns: 'common' })}
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleDeleteMessage(message.id)}
                        className="btn btn-outline-danger btn-sm"
                      >
                        {t('delete', { ns: 'common' })}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p>{t('profile.noPostedMessages', { ns: 'features' })}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Profile;
