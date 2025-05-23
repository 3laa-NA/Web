import { useContext, useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AppContext } from '../../contexts/AppContext';
import { useAuth } from '../../contexts/AuthContext';
import CreateForum from '../forums/CreateForum';
import { API } from '../../services/api';

/**
 * Barre latérale (ou sidebar) contenant les liens de navigation secondaires
 * Affiche différents liens selon le rôle de l'utilisateur
 */
function Sidebar() {
  const { user } = useContext(AppContext);
  const { t } = useTranslation(['features', 'common']);
  const { user: authUser } = useAuth();
  const [forums, setForums] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadForums = async () => {
      try {
        const response = await API.forums.getAll();
        if (response.success) {
          setForums(response.forums);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des forums:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadForums();
  }, []);

  const handleForumCreated = async (newForum) => {
    const response = await API.forums.getAll();
    if (response.success) {
      setForums(response.forums);
    }
    setShowCreateModal(false);
  };

  return (
    <aside className="sidebar">
      <h3>{t('navigation.forums')}</h3>
      <nav className="sidebar-nav">
        <ul>
          {isLoading ? (
            <li className="loading-item">{t('common:loading')}</li>
          ) : (
            forums.map(forum => (
              <li key={forum._id} className="sidebar-item">
                <NavLink to={`/forum/${forum._id}`} className="sidebar-link">
                  <span className="icon">{forum.isPublic ? '🌐' : '🔒'}</span>
                  {forum.name}
                </NavLink>
              </li>
            ))
          )}
        </ul>
      </nav>

      {authUser?.role === 'admin' && (
        <div className="sidebar-bottom">
          <button
            className="sidebar-create-btn"
            onClick={() => setShowCreateModal(true)}
            title={t('forums.create.hint')}
          >
            <span className="icon">➕</span>
            {t('forums.create.button')}
          </button>
        </div>
      )}

      {showCreateModal && (
        <div className="modal-overlay">
          <CreateForum
            onClose={() => setShowCreateModal(false)}
            onForumCreated={handleForumCreated}
          />
        </div>
      )}
    </aside>
  );
}

export default Sidebar;
