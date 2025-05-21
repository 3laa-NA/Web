import { useTranslation } from 'react-i18next';
import SearchBar from '../common/SearchBar';
import DateFilters from '../common/DateFilters';
import ConnectionStatus from '../common/ConnectionStatus';

// En-tête du tableau de bord - simplifié
function Header({ onSearch, onDateFilter, user }) {
  const { t } = useTranslation('common');
  const userName = user ? (user.login || `${user.firstName || ''} ${user.lastName || ''}`.trim()) : t('defaultUser', { defaultValue: 'utilisateur' });
  return (
    <header className="dashboard-header">
      <div className="logo">
        <h1>{t('navigation.dashboard')} <span className="dashboard-badge">📊</span></h1>
        <p>{t('welcome')}, <span className="username-highlight">{userName}</span>!</p>
      </div>
      
      <div className="search-zone">
        <div className="search-container">
          <span className="search-icon">🔍</span>
          <input 
            type="text" 
            placeholder={t('search')}
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>
        
        <div className="date-filters">
          <div className="date-input">
            <input type="date" id="start-date" aria-label={t('from')} />
          </div>
          
          <div className="date-input">
            <input type="date" id="end-date" aria-label={t('to')} />
          </div>
          
          <button className="apply" onClick={() => {
            const start = document.getElementById('start-date').value;
            const end = document.getElementById('end-date').value;
            onDateFilter({ start, end });
          }}>{t('apply')}</button>
          
          <button className="reset" onClick={() => {
            document.getElementById('start-date').value = '';
            document.getElementById('end-date').value = '';
            onDateFilter({ start: '', end: '' });
          }}>{t('cancel')}</button>
        </div>
      </div>
      
      {/* Indicateur de statut de connexion au backend */}
      <div className="header-tools">
        <ConnectionStatus />
      </div>
    </header>
  );
}

export default Header;
