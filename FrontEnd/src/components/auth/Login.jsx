import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { API } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const Login = () => {
  const { t } = useTranslation(['auth', 'common']);
  const [credentials, setCredentials] = useState({
    login: '',
    password: '',
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(API.connectionState.CHECKING);
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Vérifier le statut de la connexion au montage du composant
  useEffect(() => {
    const checkConnection = async () => {
      await API.testConnection();
    };
    
    checkConnection();
    
    // S'abonner aux changements d'état de connexion
    const unsubscribe = API.subscribeToConnectionState(setConnectionStatus);
    
    return () => {
      unsubscribe(); // Nettoyer l'abonnement lors du démontage du composant
    };
  }, []);

  // Rediriger si l'utilisateur est déjà authentifié
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials((prev) => ({
      ...prev,
      [name]: value,
    }));
    
    // Réinitialiser l'erreur quand l'utilisateur recommence à taper
    if (error) {
      setError(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
      // Validation simple
    if (!credentials.login || !credentials.password) {
      setError(t('errors.requiredField'));
      setLoading(false);
      return;
    }
    
    try {      // Vérifier d'abord la connexion au serveur
      if (connectionStatus === API.connectionState.DISCONNECTED) {
        const isConnected = await API.testConnection();
        if (!isConnected) {
          setError(t('errors.serverConnectionFailed', { ns: 'auth' }));
          setLoading(false);
          return;
        }
      }
      
      // Procéder à la connexion
      const result = await login(credentials);      if (!result.success) {
        // Traitement spécifique pour différents types d'erreurs
        if (result.errorCode === 'ACCOUNT_PENDING') {
          setError(t('errors.accountPending', { ns: 'auth' }));
        } else {
          // Afficher le message retourné par l'API
          setError(result.error || result.message || t('errors.authFailed', { ns: 'auth' }));
        }
        setLoading(false);
        return;
      }
       // La redirection se fera automatiquement grâce à isAuthenticated
    } catch (err) {
      console.error('Login error:', err);
      // Gérer les différents cas d'erreur avec des messages clairs
      if (err.isNetworkError || connectionStatus === API.connectionState.DISCONNECTED) {
        setError(t('errors.serverUnavailable', { ns: 'auth' }));      } else if (err.status === 401 || err.status === 403) {
        // Authentication specific errors
        if (err.code === 'INVALID_CREDENTIALS') {
          setError(t('errors.invalidCredentials', { ns: 'auth' }));
        } else if (err.code === 'ACCOUNT_LOCKED') {
          setError(t('errors.accountLocked', { ns: 'auth' }));
        } else if (err.code === 'ACCOUNT_INACTIVE') {
          setError(t('errors.accountInactive', { ns: 'auth' }));
        } else if (err.message && err.message.includes('attente')) {
          // Message d'erreur spécifique pour les comptes en attente d'approbation
          setError(t('errors.accountPending', { ns: 'auth' }));
        } else {
          setError(t('errors.authFailed', { ns: 'auth' }));
        }
      } else {
        setError(t('errors.errorOccurred', { ns: 'auth' }));
      }
    } finally {
      setLoading(false);
    }
  };
  // Afficher un message d'état de connexion si hors-ligne
  const renderConnectionStatus = () => {
    if (connectionStatus === API.connectionState.CHECKING) {
      return <div className="connection-status checking">{t('connection.checkingConnection', { ns: 'common' })}</div>;
    } else if (connectionStatus === API.connectionState.DISCONNECTED) {
      return (
        <div className="connection-status error">
          {t('connection.backendDisconnected', { ns: 'common' })}
          <button 
            onClick={async () => {
              setConnectionStatus(API.connectionState.CHECKING);
              await API.testConnection();
            }} 
            className="retry-button"
          >
            {t('retry', { ns: 'common', defaultValue: 'Retry' })}
          </button>
        </div>
      );
    }
    return null;
  };  return (
    <div className="auth-container">
      <h2>{t('loginTitle')}</h2>
      {renderConnectionStatus()}
      
      {error && <div className="error-message">{t('errors.incorrectCredentials') || error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="login">{t('username')}</label>
          <input
            type="text"
            id="login"
            name="login"
            value={credentials.login}
            onChange={handleChange}
            disabled={loading}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="password">{t('password')}</label>
          <input
            type="password"
            id="password"
            name="password"
            value={credentials.password}
            onChange={handleChange}
            disabled={loading}
            required
          />
        </div>
        
        <div className="auth-actions">
          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={loading || connectionStatus === API.connectionState.DISCONNECTED}
          >
            {loading ? t('loading', { ns: 'common' }) : t('loginSubmit')}
          </button>
        </div>
        
        <div className="auth-link">
          <div className="form-links">
            <Link to="/forgot-password">{t('forgotPassword')}</Link>
            <Link to="/register">{t('registerTitle')}</Link>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Login;
