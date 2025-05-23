import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { API } from '../../services/api';
import '../../styles/private-messages.css';

/**
 * Modal pour créer une nouvelle conversation
 * Permet de rechercher un utilisateur et de démarrer une conversation
 */
const NewConversationModal = ({ isOpen, onClose, onConversationStart }) => {
  const { t } = useTranslation('features');
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const searchInputRef = useRef(null);

  // Focus the search input when the modal opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Effectuer la recherche d'utilisateurs
  const searchUsers = async (e) => {
    e?.preventDefault();
    
    if (!searchTerm || searchTerm.length < 2) {
      setUsers([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Ajout de log de débogage
      console.log('Recherche d\'utilisateurs avec le terme:', searchTerm);
      
      // Appeler l'API pour rechercher des utilisateurs
      const response = await API.users.search(searchTerm);
      console.log('Réponse de recherche d\'utilisateurs:', response);
        if (response.success) {
        // Les utilisateurs peuvent être dans response.users ou dans response.data.users
        const foundUsers = response.users || response.data?.users || [];
        console.log('Utilisateurs trouvés:', foundUsers);
        setUsers(foundUsers);
      } else {
        console.error('Erreur API lors de la recherche:', response.message || 'Erreur inconnue');
        
        // Si c'est une erreur d'authentification, essayer de recharger les infos utilisateur
        if (response.code === 'AUTH_REQUIRED') {
          console.log('Problème d\'authentification détecté, vérification de l\'état de l\'authentification');
          const authStatus = await API.auth.check();
          console.log('Statut d\'authentification:', authStatus);
        }
        
        setError(response.message || t('privateMessages.searchError'));
      }
    } catch (error) {
      console.error('Erreur lors de la recherche des utilisateurs:', error);
      if (error.response) {
        console.error('Détails de l\'erreur API:', error.response.status, error.response.data);
      }
      setError(t('privateMessages.searchError'));
    } finally {
      setLoading(false);
    }
  };

  // Démarrer une nouvelle conversation avec un utilisateur
  const startConversation = async (recipientId) => {
    if (!message.trim()) {
      setError(t('privateMessages.emptyMessage'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Envoyer un message pour créer la conversation
      const response = await API.privateMessages.send({
        recipientId,
        text: message
      });

      if (response.success) {
        // Informer le composant parent pour rafraîchir la liste des conversations
        onConversationStart(response.conversationId);
        
        // Fermer le modal
        resetAndClose();
      } else {
        setError(response.message || t('privateMessages.startConversationError'));
      }
    } catch (error) {
      console.error('Erreur lors de la création de la conversation:', error);
      setError(t('privateMessages.startConversationError'));
    } finally {
      setLoading(false);
    }
  };

  // Réinitialiser le formulaire et fermer le modal
  const resetAndClose = () => {
    setSearchTerm('');
    setUsers([]);
    setMessage('');
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content new-conversation-modal">
        <div className="modal-header">
          <h2>{t('privateMessages.newConversation', { defaultValue: 'Nouvelle conversation' })}</h2>
          <button className="close-button" onClick={resetAndClose}>×</button>
        </div>

        <div className="modal-body">
          {error && <div className="error-message">{error}</div>}
          
          <div className="search-section">
            <form onSubmit={searchUsers} className="search-form">
              <label htmlFor="userSearch">
                {t('privateMessages.searchUser', { defaultValue: 'Rechercher un utilisateur' })}
              </label>
              <div className="search-input-container">
                <input
                  id="userSearch"
                  type="text"
                  ref={searchInputRef}
                  placeholder={t('privateMessages.searchUserPlaceholder', { defaultValue: 'Nom, prénom ou login' })}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  disabled={loading}
                />
                <button 
                  type="submit" 
                  disabled={loading || searchTerm.length < 2}
                  aria-label={t('privateMessages.search', { defaultValue: 'Rechercher' })}
                >
                  <svg 
                    width="16" 
                    height="16" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    <circle cx="11" cy="11" r="8"/>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                </button>
              </div>
            </form>
          </div>

          <div className="users-list">
            {loading && <div className="loading-indicator">{t('privateMessages.searching', { defaultValue: 'Recherche...' })}</div>}
            
            {!loading && users.length === 0 && searchTerm.length >= 2 && (
              <div className="no-results">{t('privateMessages.noUsersFound', { defaultValue: 'Aucun utilisateur trouvé' })}</div>
            )}
            
            {!loading && users.map(user => (
              <div key={user.id} className="user-item">
                <div className="user-info">
                  <div className="user-name">{user.firstName} {user.lastName}</div>
                  <div className="user-login">@{user.login}</div>
                </div>
                
                <div className="message-input-container">
                  <input
                    type="text"
                    placeholder={t('privateMessages.writeMessage', { defaultValue: 'Écrire un message...' })}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                  <button 
                    className="send-button"
                    onClick={() => startConversation(user.id)}
                    disabled={!message.trim() || loading}
                  >
                    {t('privateMessages.send', { defaultValue: 'Envoyer' })}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="modal-footer">
          <button className="cancel-button" onClick={resetAndClose}>
            {t('privateMessages.cancel', { defaultValue: 'Annuler' })}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewConversationModal;