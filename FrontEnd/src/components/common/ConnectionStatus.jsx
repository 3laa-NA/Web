import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { API } from '../../services/api';

/**
 * Composant d'indicateur de statut de connexion au backend
 */
function ConnectionStatus() {
  const { t } = useTranslation('common');
  const [connectionState, setConnectionState] = useState(API.connectionState.CHECKING);

  useEffect(() => {
    // Vérification initiale de la connexion
    const checkConnection = async () => {
      await API.testConnection();
    };

    checkConnection();

    // S'abonner aux changements d'état de connexion
    const unsubscribe = API.subscribeToConnectionState(setConnectionState);
    
    return () => {
      unsubscribe(); // Nettoyer l'abonnement lors du démontage
    };
  }, []);

  // Déterminer la classe CSS et l'icône selon l'état de connexion
  let statusClass, statusIcon, statusText;
  
  switch (connectionState) {    case API.connectionState.CONNECTED:
      statusClass = "status-connected";
      statusIcon = "✓";
      statusText = t('connection.backendConnected');
      break;
    case API.connectionState.DISCONNECTED:
      statusClass = "status-disconnected";
      statusIcon = "✗";
      statusText = t('connection.backendDisconnected');
      break;
    default:
      statusClass = "status-checking";
      statusIcon = "⟳";
      statusText = t('connection.checkingConnection');
  }

  // Gestionnaire de clic pour réessayer manuellement la connexion
  const handleClick = async () => {
    if (connectionState === API.connectionState.DISCONNECTED) {
      setConnectionState(API.connectionState.CHECKING);
      await API.testConnection();
    }
  };
  return (
    <div 
      className={`connection-status ${statusClass}`} 
      onClick={handleClick}
      title={connectionState === API.connectionState.DISCONNECTED ? t('clickToRetry', { defaultValue: 'Cliquer pour réessayer la connexion' }) : statusText}
    >
      <span className="status-icon">{statusIcon}</span>
      <span className="status-text">{statusText}</span>
    </div>
  );
}

export default ConnectionStatus;
