import { Link, NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useContext } from 'react';
import { AppContext } from '../../contexts/AppContext';
import UserPanel from '../user/UserPanel';
import LanguageSwitcher from '../common/LanguageSwitcher';
import ThemeSwitch from '../common/ThemeSwitch';

/**
 * Panneau de navigation principal de l'application
 * Affiche les liens de navigation, les réglages et le panel utilisateur
 */
function NavigationPanel() {
  const { t } = useTranslation('common');
  const { user } = useAuth();
  const { toggleTheme } = useContext(AppContext);
  
  return (
    <nav className="navbar">
      <div className="navbar-container">        <Link to="/" className="navbar-brand">
          <img src="/logo.svg" alt="Logo" className="navbar-logo" />
          <span>{t('appName')}</span>
        </Link>
        
        <ul className="navbar-nav">          {user && (
            <>
              <li><NavLink to="/dashboard" className="nav-link">{t('navigation.dashboard')}</NavLink></li>
              <li><NavLink to="/messages" className="nav-link">{t('navigation.privateMessages')}</NavLink></li>
              <li><NavLink to="/profile" className="nav-link">{t('navigation.profile')}</NavLink></li>
              {user.role === 'admin' && <li><NavLink to="/admin" className="nav-link">{t('navigation.admin')}</NavLink></li>}
            </>
          )}
        </ul>
        
        <div className="navbar-tools">
          <LanguageSwitcher />
          <ThemeSwitch onChange={toggleTheme} />
          <UserPanel />
        </div>
      </div>
    </nav>
  );
}

export default NavigationPanel;
