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

  // Gestionnaire pour la recherche de messages
  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  // Gestionnaire pour le filtrage par date
  const handleDateFilter = (filter) => {
    setDateFilter(filter);
  };
  
  // Gestionnaire pour poster un nouveau message
  const handlePostMessage = async (text) => {
    try {
      const response = await API.messages.post({ text });
      if (response.success) {
        // Trigger refresh in MessageSection by changing a prop
        setDateFilter({ ...dateFilter });
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
          />
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
