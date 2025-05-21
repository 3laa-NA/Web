import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { API } from '../../services/api';

/**
 * Panneau d'administration
 * Permet aux administrateurs de gérer les utilisateurs et les approbations
 */
function AdminPanel() {
  const { t } = useTranslation('admin');
  const [users, setUsers] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Chargement des données utilisateurs depuis l'API
  useEffect(() => {
    const fetchUsersData = async () => {
      try {
        setLoading(true);
        setError(null);
          // Récupérer les utilisateurs actifs
        const usersResponse = await API.admin.getUsers();
        
        if (!usersResponse.success) {
          throw new Error(usersResponse.message || t('failedToLoadUsers', { ns: 'admin' }));
        }
        
        setUsers(usersResponse.users || []);
        
        // Récupérer les utilisateurs en attente d'approbation
        const pendingResponse = await API.admin.getPendingUsers();
        
        if (!pendingResponse.success) {
          throw new Error(pendingResponse.message || t('failedToLoadPendingUsers', { ns: 'admin' }));
        }
        
        setPendingUsers(pendingResponse.users || []);
        
      } catch (err) {
        console.error('Erreur lors du chargement des données admin:', err);
        setError(err.message || t('unexpectedError'));
      } finally {
        setLoading(false);
      }
    };
    
    fetchUsersData();
  }, [t]);
  
  // Gestionnaire pour approuver un utilisateur en attente
  const handleApproveUser = async (userId) => {
    try {
      const response = await API.admin.approveUser(userId);
      
      if (response.success) {
        // Mettre à jour les listes d'utilisateurs
        const approvedUser = pendingUsers.find(user => user._id === userId);
        if (approvedUser) {
          approvedUser.status = 'active';
          setUsers(prev => [...prev, approvedUser]);        setPendingUsers(prev => prev.filter(user => user._id !== userId));
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
        // Supprimer l'utilisateur de la liste des utilisateurs en attente
        setPendingUsers(prev => prev.filter(user => user._id !== userId));
      } else {
        throw new Error(response.message || t('rejectionFailed'));
      }
    } catch (err) {
      console.error('Erreur lors du rejet:', err);
      alert(err.message || t('rejectionFailed', { ns: 'admin' }));
    }
  };
  
  // Gestionnaire pour modifier le rôle d'un utilisateur
  const handleChangeRole = async (userId, newRole) => {
    try {
      const response = await API.admin.updateUserRole(userId, { role: newRole });
      
      if (response.success) {
        // Mettre à jour le rôle dans l'interface utilisateur
        setUsers(users.map(user =>        user._id === userId ? { ...user, role: newRole } : user
        ));
      } else {
        throw new Error(response.message || t('roleChangeFailed', { ns: 'admin' }));
      }
    } catch (err) {
      console.error('Erreur lors du changement de rôle:', err);
      alert(err.message || t('roleChangeFailed', { ns: 'admin' }));
    }
  };
  
  // Affichage d'un indicateur de chargement si nécessaire
  if (loading) {
    return <div className="loading" role="status">{t('loadingAdminPanel')}</div>;
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
      <h2>{t('adminPanel')}</h2>
      
      {/* Section des utilisateurs en attente d'approbation */}
      <section className="pending-approvals">
        <h3>{t('pendingApprovals')}</h3>
        {pendingUsers.length === 0 ? (
          <p>{t('noPendingApprovals')}</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>{t('login')}</th>
                <th>{t('name')}</th>
                <th>{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {pendingUsers.map(user => (
                <tr key={user._id}>
                  <td>{user.login}</td>
                  <td>{user.firstName} {user.lastName}</td>
                  <td>
                    <button onClick={() => handleApproveUser(user._id)}>{t('approve')}</button>
                    <button onClick={() => handleRejectUser(user._id)}>{t('reject')}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
      
      {/* Section de gestion des utilisateurs existants */}
      <section className="user-management">
        <h3>{t('userManagement')}</h3>
        <table>
          <thead>
            <tr>
              <th>{t('login')}</th>
              <th>{t('name')}</th>
              <th>{t('role')}</th>
              <th>{t('actions')}</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user._id}>
                <td>{user.login}</td>
                <td>{user.firstName} {user.lastName}</td>
                <td>{user.role}</td>
                <td>
                  <select 
                    value={user.role}
                    onChange={(e) => handleChangeRole(user._id, e.target.value)}
                  >
                    <option value="user">{t('roleUser')}</option>
                    <option value="mod">{t('roleModerator')}</option>
                    <option value="admin">{t('roleAdmin')}</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

export default AdminPanel;
