import { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AppContext } from '../../contexts/AppContext';

/**
 * Barre latérale (ou sidebar) contenant les liens de navigation secondaires
 * Affiche différents liens selon le rôle de l'utilisateur
 */
function Sidebar() {
  const { user } = useContext(AppContext);
  const { t } = useTranslation('common');
  return (
    <aside className="sidebar">
      <h3>{t('forums', { defaultValue: 'Forums' })}</h3>
      <nav className="sidebar-nav">
        <ul>
          <li className="sidebar-item">
            <NavLink to="/dashboard" className="sidebar-link">
              <span className="icon">🌐</span>
              {t('navigation.public', { defaultValue: 'Public' })}
            </NavLink>
          </li>
          {user && user.role === 'admin' && (
            <li className="sidebar-item">
              <NavLink to="/admin" className="sidebar-link">
                <span className="icon">🔒</span>
                {t('navigation.private', { defaultValue: 'Private' })}
              </NavLink>
            </li>
          )}
        </ul>
      </nav>
    </aside>
  );
}

export default Sidebar;
