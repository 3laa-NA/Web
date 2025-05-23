import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { API } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import ConfirmDialog from '../common/ConfirmDialog';
import '../../styles/AdminPanel.css';

/**
 * Panneau d'administration
 * Permet aux administrateurs de gérer les utilisateurs, les approbations et les paramètres système
 */
function AdminPanel() {
  const { t } = useTranslation(['admin', 'common']);
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('pending');
  const [users, setUsers] = useState([]);
  const [inactiveUsers, setInactiveUsers] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [systemSettings, setSystemSettings] = useState({
    registrationRequiresApproval: true
  });
  const [forums, setForums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [settingsUpdated, setSettingsUpdated] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    message: '',
    onConfirm: null
  });

  // Chargement des données utilisateurs depuis l'API
  useEffect(() => {
    const fetchUsersData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Récupérer les utilisateurs actifs
        const usersResponse = await API.admin.getUsers();
        
        if (!usersResponse.success) {
          throw new Error(usersResponse.message || t('failedToLoadUsers'));
        }
        
        // Séparer les utilisateurs actifs et inactifs
        const activeUsers = (usersResponse.users || []).filter(user => 
          user.status === 'active' && user._id !== currentUser?.id
        );
        const nonActiveUsers = (usersResponse.users || []).filter(user => 
          user.status === 'inactive' && user._id !== currentUser?.id
        );
        
        setUsers(activeUsers);
        setInactiveUsers(nonActiveUsers);
        
        // Récupérer les utilisateurs en attente d'approbation
        const pendingResponse = await API.admin.getPendingUsers();
        
        if (!pendingResponse.success) {
          throw new Error(pendingResponse.message || t('failedToLoadPendingUsers'));
        }
        
        setPendingUsers(pendingResponse.users || []);
        
        // Récupérer les paramètres système
        const settingsResponse = await API.admin.getSettings();
        
        if (!settingsResponse.success) {
          throw new Error(settingsResponse.message || t('failedToLoadSettings'));
        }
        
        setSystemSettings(prev => ({
          ...prev,
          ...(settingsResponse.settings || {})
        }));
        
      } catch (err) {
        console.error('Erreur lors du chargement des données admin:', err);
        setError(err.message || t('unexpectedError'));
      } finally {
        setLoading(false);
      }
    };
    
    fetchUsersData();
  }, [t, currentUser]);
  
  // Chargement des données des forums
  useEffect(() => {
    if (activeTab === 'forums') {
      const fetchForums = async () => {
        try {
          setLoading(true);
          const response = await API.forums.getAllForAdmin();
          if (response.success) {
            setForums(response.forums);
          } else {
            throw new Error(response.error || t('failedToLoadForums'));
          }
        } catch (err) {
          console.error('Erreur lors du chargement des forums:', err);
          setError(err.message || t('unexpectedError'));
        } finally {
          setLoading(false);
        }
      };
      
      fetchForums();
    }
  }, [t, activeTab]);

  // Gestionnaire pour désactiver un utilisateur
  const handleDeactivateUser = async (userId) => {
    setConfirmDialog({
      isOpen: true,
      message: t('confirmDeactivateUser'),
      onConfirm: async () => {
        try {
          const response = await API.admin.updateUserStatus(userId, 'inactive');
          
          if (response.success) {
            setUsers(prev => prev.filter(user => user._id !== userId));
            const deactivatedUser = users.find(user => user._id === userId);
            if (deactivatedUser) {
              setInactiveUsers(prev => [...prev, { ...deactivatedUser, status: 'inactive' }]);
            }
          } else {
            throw new Error(response.message);
          }
        } catch (err) {
          console.error('Erreur lors de la désactivation:', err);
          alert(err.message || t('unexpectedError'));
        } finally {
          setConfirmDialog({ isOpen: false, message: '', onConfirm: null });
        }
      }
    });
  };

  // Gestionnaire pour activer un utilisateur
  const handleActivateUser = async (userId) => {
    try {
      const response = await API.admin.updateUserStatus(userId, 'active');
      
      if (response.success) {
        setInactiveUsers(prev => prev.filter(user => user._id !== userId));
        const activatedUser = inactiveUsers.find(user => user._id === userId);
        if (activatedUser) {
          setUsers(prev => [...prev, { ...activatedUser, status: 'active' }]);
        }
      } else {
        throw new Error(response.message);
      }
    } catch (err) {
      console.error('Erreur lors de l\'activation:', err);
      alert(err.message || t('unexpectedError'));
    }
  };

  // Gestionnaire pour approuver un utilisateur en attente
  const handleApproveUser = async (userId) => {
    try {
      const response = await API.admin.approveUser(userId);
      
      if (response.success) {
        const approvedUser = pendingUsers.find(user => user._id === userId);
        if (approvedUser) {
          approvedUser.status = 'active';
          setUsers(prev => [...prev, approvedUser]);
          setPendingUsers(prev => prev.filter(user => user._id !== userId));
        }
      } else {
        throw new Error(response.message || t('approvalFailed', { ns: 'admin' }));
      }
    } catch (err) {
      console.error('Erreur lors de l\'approbation:', err);
      alert(err.message || t('approvalFailed', { ns: 'admin' }));
    }
  };
  
  // Gestionnaire pour rejeter une demande d'utilisateur
  const handleRejectUser = async (userId) => {
    try {
      const response = await API.admin.rejectUser(userId);
      
      if (response.success) {
        setPendingUsers(prev => prev.filter(user => user._id !== userId));
      } else {
        throw new Error(response.message || t('rejectionFailed', { ns: 'admin' }));
      }
    } catch (err) {
      console.error('Erreur lors du rejet:', err);
      alert(err.message || t('rejectionFailed', { ns: 'admin' }));
    }
  };
  
  // Gestionnaire pour mettre à jour les paramètres système
  const handleUpdateSettings = async () => {
    try {
      const response = await API.admin.updateSettings(systemSettings);
      
      if (response.success) {
        setSettingsUpdated(true);
        setTimeout(() => setSettingsUpdated(false), 3000);
      } else {
        throw new Error(response.message || t('settingsUpdateFailed', { ns: 'admin' }));
      }
    } catch (err) {
      console.error('Erreur lors de la mise à jour des paramètres:', err);
      alert(err.message || t('settingsUpdateFailed', { ns: 'admin' }));
    }
  };
  
  // Gestionnaire pour changer le rôle d'un utilisateur
  const handleChangeRole = async (userId, newRole) => {
    if (!window.confirm(t('confirmChangeRole', { 
      ns: 'admin', 
      defaultValue: `Êtes-vous sûr de vouloir changer le rôle de cet utilisateur en "${newRole}" ?`
    }))) {
      return;
    }

    try {
      const response = await API.admin.changeUserRole(userId, newRole);
      
      if (response.success) {
        // Mettre à jour la liste des utilisateurs
        setUsers(prev => prev.map(user => 
          user._id === userId ? { ...user, role: newRole } : user
        ));
        setError(null);
      } else {
        throw new Error(response.message || t('roleChangeFailed', { ns: 'admin' }));
      }
    } catch (err) {
      console.error('Erreur lors du changement de rôle:', err);
      setError(err.message || t('roleChangeFailed', { ns: 'admin' }));
    }
  };

  // Gestionnaire pour changer l'accessibilité d'un forum
  const handleForumAccessChange = async (forumId, isPublic) => {
    try {
      const response = await API.forums.updateAccess(forumId, isPublic);
      if (response.success) {
        setForums(prev => prev.map(forum => 
          forum._id === forumId ? { ...forum, isPublic } : forum
        ));
      } else {
        throw new Error(response.error);
      }
    } catch (err) {
      console.error('Erreur lors de la mise à jour de l\'accessibilité:', err);
      alert(err.message || t('unexpectedError'));
    }
  };

  // Gestionnaire pour supprimer un forum
  const handleDeleteForum = async (forumId) => {
    setConfirmDialog({
      isOpen: true,
      message: t('confirmDeleteForum'),
      onConfirm: async () => {
        try {
          const response = await API.forums.delete(forumId);
          if (response.success) {
            setForums(prev => prev.filter(forum => forum._id !== forumId));
          } else {
            throw new Error(response.error);
          }
        } catch (err) {
          console.error('Erreur lors de la suppression:', err);
          alert(err.message || t('unexpectedError'));
        } finally {
          setConfirmDialog({ isOpen: false, message: '', onConfirm: null });
        }
      }
    });
  };

  // Rendu de la liste des utilisateurs
  const renderUsersList = () => (
    <div className="users-list">
      <h3>{t('activeUsers')}</h3>
      {users.length > 0 ? (
        <table className="admin-table">
          <thead>
            <tr>
              <th>{t('name', { ns: 'common' })}</th>
              <th>{t('email', { ns: 'common' })}</th>
              <th>{t('role', { ns: 'admin' })}</th>
              <th>{t('actions', { ns: 'common' })}</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user._id}>
                <td>{user.firstName} {user.lastName}</td>
                <td>{user.email || '-'}</td>
                <td>
                  <select
                    value={user.role}
                    onChange={(e) => handleChangeRole(user._id, e.target.value)}
                    className="role-select"
                  >
                    <option value="user">{t('roleUser')}</option>
                    <option value="admin">{t('roleAdmin')}</option>
                  </select>
                </td>
                <td className="action-buttons">
                  <button
                    onClick={() => handleDeactivateUser(user._id)}
                    className="btn btn-danger btn-sm"
                    title={t('deactivateUser')}
                  >
                    {t('deactivate')}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="no-data">{t('noActiveUsers')}</p>
      )}

      {/* Liste des utilisateurs inactifs */}
      <h3>{t('inactiveUsers')}</h3>
      {inactiveUsers.length > 0 ? (
        <table className="admin-table">
          <thead>
            <tr>
              <th>{t('name', { ns: 'common' })}</th>
              <th>{t('email', { ns: 'common' })}</th>
              <th>{t('role', { ns: 'admin' })}</th>
              <th>{t('actions', { ns: 'common' })}</th>
            </tr>
          </thead>
          <tbody>
            {inactiveUsers.map(user => (
              <tr key={user._id}>
                <td>{user.firstName} {user.lastName}</td>
                <td>{user.email || '-'}</td>
                <td>
                  <select
                    value={user.role}
                    onChange={(e) => handleChangeRole(user._id, e.target.value)}
                    className="role-select"
                  >
                    <option value="user">{t('roleUser')}</option>
                    <option value="admin">{t('roleAdmin')}</option>
                  </select>
                </td>
                <td className="action-buttons">
                  <button
                    onClick={() => handleActivateUser(user._id)}
                    className="btn btn-success btn-sm"
                    title={t('activateUser')}
                  >
                    {t('activate')}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="no-data">{t('noInactiveUsers', { defaultValue: 'No inactive users' })}</p>
      )}
    </div>
  );

  // Rendu de la liste des utilisateurs en attente
  const renderPendingList = () => (
    <div className="pending-list">
      <h3>{t('pendingApprovals', { ns: 'admin' })}</h3>
      {pendingUsers.length > 0 ? (
        <table className="admin-table">
          <thead>
            <tr>
              <th>{t('name', { ns: 'common' })}</th>
              <th>{t('email', { ns: 'common' })}</th>
              <th>{t('actions', { ns: 'common' })}</th>
            </tr>
          </thead>
          <tbody>
            {pendingUsers.map(user => (
              <tr key={user._id}>
                <td>{user.firstName} {user.lastName}</td>
                <td>{user.email || '-'}</td>
                <td>
                  <button
                    onClick={() => handleApproveUser(user._id)}
                    className="btn btn-success btn-sm"
                  >
                    {t('approve', { ns: 'admin' })}
                  </button>
                  <button
                    onClick={() => handleRejectUser(user._id)}
                    className="btn btn-danger btn-sm"
                  >
                    {t('reject', { ns: 'admin' })}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="no-data">{t('noPendingApprovals', { ns: 'admin' })}</p>
      )}
    </div>
  );

  // Rendu des paramètres système
  const renderSettings = () => (
    <div className="settings-section">
      <h3>{t('systemSettings', { ns: 'admin' })}</h3>
      <div className="setting-item">
        <label>
          <input
            type="checkbox"
            checked={systemSettings.registrationRequiresApproval}
            onChange={(e) => setSystemSettings(prev => ({
              ...prev,
              registrationRequiresApproval: e.target.checked
            }))}
          />
          {t('requireApproval', { ns: 'admin' })}
        </label>
      </div>
      <button
        onClick={handleUpdateSettings}
        className="btn btn-primary"
      >
        {t('saveSettings', { ns: 'admin' })}
      </button>
      {settingsUpdated && (
        <div className="alert alert-success">
          {t('settingsUpdated', { ns: 'admin' })}
        </div>
      )}
    </div>
  );
  // Rendu de la liste des forums
  const renderForumsList = () => (
    <div className="forums-list">
      <h3>{t('forumManagement', { ns: 'admin', defaultValue: 'Gestion des forums' })}</h3>
      {forums.length > 0 ? (
        <table className="admin-table">
          <thead>
            <tr>
              <th>{t('name', { ns: 'common' })}</th>
              <th>{t('description', { ns: 'common' })}</th>
              <th>{t('accessibility', { ns: 'admin', defaultValue: 'Accessibilité' })}</th>
              <th>{t('actions', { ns: 'common' })}</th>
            </tr>
          </thead>
          <tbody>
            {forums.map(forum => (
              <tr key={forum._id}>
                <td>{forum.name}</td>
                <td>{forum.description || '-'}</td>
                <td>
                  <select
                    value={forum.isPublic ? 'public' : 'private'}
                    onChange={(e) => handleForumAccessChange(forum._id, e.target.value === 'public')}
                    className="role-select"
                  >
                    <option value="public">{t('public', { ns: 'admin', defaultValue: 'Public' })}</option>
                    <option value="private">{t('private', { ns: 'admin', defaultValue: 'Privé' })}</option>
                  </select>
                </td>
                <td className="action-buttons">
                  <button
                    onClick={() => handleDeleteForum(forum._id)}
                    className="btn btn-danger btn-sm"
                    title={t('deleteForum', { ns: 'admin', defaultValue: 'Supprimer le forum' })}
                  >
                    {t('delete', { ns: 'common', defaultValue: 'Supprimer' })}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="no-data">{t('noForums', { ns: 'admin', defaultValue: 'Aucun forum trouvé' })}</p>
      )}
    </div>
  );

  // Affichage d'un indicateur de chargement si nécessaire
  if (loading) {
    return <div className="loading">{t('loading', { ns: 'common' })}</div>;
  }

  // Affichage d'une erreur si nécessaire
  if (error) {
    return (
      <div className="admin-panel">
        <div className="admin-error" role="alert">
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>{t('refresh')}</button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="admin-panel">
      <div className="admin-tabs">
        <button
          className={`tab-button ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          {t('pendingApprovals', { ns: 'admin' })}
        </button>
        <button
          className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          {t('userManagement', { ns: 'admin' })}
        </button><button
          className={`tab-button ${activeTab === 'forums' ? 'active' : ''}`}
          onClick={() => setActiveTab('forums')}
        >
          {t('forumManagement', { ns: 'admin', defaultValue: 'Gestion des forums' })}
        </button>        
        <button
          className={`tab-button ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          {t('settings', { ns: 'admin' })}
        </button>
        
      </div><div className="admin-content">
        {activeTab === 'pending' && renderPendingList()}
        {activeTab === 'users' && renderUsersList()}
        {activeTab === 'settings' && renderSettings()}
        {activeTab === 'forums' && renderForumsList()}
      </div>

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ isOpen: false, message: '', onConfirm: null })}
      />
    </div>
  );
}

export default AdminPanel;
