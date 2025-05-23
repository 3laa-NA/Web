import { useState, useContext } from 'react';
import { AppContext } from '../../contexts/AppContext';
import Header from '../layout/Header';
import Sidebar from '../layout/Sidebar';
import MessageSection from '../messages/MessageSection';
import NewMessage from '../messages/NewMessage';
import { API } from '../../services/api';

/**
 * Page principale du tableau de bord
 * Affiche l'en-tête, la barre latérale et la section des messages
 */
function Dashboard() {
  const { user } = useContext(AppContext);
  
  // États pour la recherche et le filtrage des messages
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState({ start: '', end: '' });
  const [refreshTrigger, setRefreshTrigger] = useState(0); // Pour forcer le rafraîchissement

  // Gestionnaire pour la recherche de messages
  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  // Gestionnaire pour le filtrage par date
  const handleDateFilter = (filter) => {
    setDateFilter(filter);
  };
  
  // Gestionnaire pour forcer le rafraîchissement
  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };
  
  // Gestionnaire pour poster un nouveau message
  const handlePostMessage = async (text, forumId) => {
    try {
      if (!forumId) {
        throw new Error('Forum ID is required');
      }
      
      const response = await API.messages.create({ text, forumId });
      if (response.success) {
        handleRefresh(); // Forcer le rafraîchissement après un post réussi
        return true;
      } else {
        throw new Error(response.error);
      }
    } catch (error) {
      console.error('Error posting message:', error);
      throw error;
    }
  };

  return (
    <div className="dashboard">
      <Header 
        onSearch={handleSearch} 
        onDateFilter={handleDateFilter} 
        user={user}
      />
      <main className="dashboard-main">
        <div className="dashboard-top-row">
          <div className="dashboard-menu">
            <Sidebar />
          </div>
          <div className="dashboard-new-message">
            <NewMessage onPostMessage={handlePostMessage} />
          </div>
        </div>
        <div className="dashboard-bottom-row">
          <MessageSection 
            searchQuery={searchQuery} 
            dateFilter={dateFilter}
            refreshTrigger={refreshTrigger}
            onRefresh={handleRefresh}
          />
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
