import React, { createContext, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import API, { CONNECTION_STATES, subscribeToConnectionState } from '../services/api';

// Création du contexte
export const AppContext = createContext();

/**
 * Provider du contexte d'application
 * Gère l'état global partagé entre les composants:
 * - Gestion de la langue
 * - État de la connexion au backend
 * - Thème de l'application
 */
export function AppProvider({ children, value }) {
  const { i18n } = useTranslation();
  
  // État pour la langue sélectionnée (fr par défaut)
  const [language, setLanguage] = useState(
    localStorage.getItem('language') || 'fr'
  );
  
  // État pour le thème (clair par défaut)
  const [theme, setTheme] = useState(
    localStorage.getItem('theme') || 'light'
  );
  
  // État pour la connexion au backend
  const [backendStatus, setBackendStatus] = useState({
    connected: false,
    lastChecked: null
  });
  
  // État pour les messages d'erreur globaux
  const [globalError, setGlobalError] = useState(null);

  // Fonction pour changer de langue
  const changeLanguage = (newLanguage) => {
    if (newLanguage === 'fr' || newLanguage === 'en') {
      setLanguage(newLanguage);
      localStorage.setItem('language', newLanguage);
      i18n.changeLanguage(newLanguage);
    }
  };
  
  // Fonction pour changer de thème
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    
    // Appliquer le thème avec animation de transition
    document.documentElement.classList.add('theme-transition');
    document.documentElement.setAttribute('data-theme', newTheme);
    
    // Supprimer la classe de transition après l'animation
    setTimeout(() => {
      document.documentElement.classList.remove('theme-transition');
    }, 500);
  };
  
  // Fonction pour afficher une erreur globale
  const showGlobalError = (message, duration = 5000) => {
    setGlobalError(message);
    
    // Effacer automatiquement l'erreur après la durée spécifiée
    if (duration > 0) {
      setTimeout(() => {
        setGlobalError(null);
      }, duration);
    }
  };
  
  // Fonction pour effacer une erreur globale
  const clearGlobalError = () => {
    setGlobalError(null);
  };
    // Suppression de la fonction t redondante - utilisez useTranslation dans les composants à la place
  
  // S'abonner à l'état de connexion du service API
  useEffect(() => {
    // Vérifier la connexion au chargement
    API.testConnection();
    
    // S'abonner aux changements d'état de connexion
    const unsubscribe = subscribeToConnectionState((connectionState) => {
      setBackendStatus({
        connected: connectionState === CONNECTION_STATES.CONNECTED,
        lastChecked: new Date()
      });
    });
    
    // Vérifier périodiquement la connexion (toutes les 60 secondes)
    const intervalId = setInterval(() => {
      API.testConnection();
    }, 60000);
    
    // Appliquer le thème au chargement
    document.documentElement.setAttribute('data-theme', theme);
    
    return () => {
      clearInterval(intervalId);
      unsubscribe();
    };
  }, []);
    // Valeurs exposées par le contexte
  const contextValue = {
    language,
    changeLanguage,
    theme,
    toggleTheme,
    backendStatus,
    checkBackendConnection: API.testConnection,
    globalError,
    showGlobalError,
    clearGlobalError
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
      
      {/* Affichage des erreurs globales */}
      {globalError && (
        <div className="global-error-message">
          <span>{globalError}</span>
          <button onClick={clearGlobalError}>×</button>
        </div>
      )}
    </AppContext.Provider>
  );
}

// Hook personnalisé pour utiliser le contexte d'application
export function useAppContext() {
  const context = React.useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext doit être utilisé à l\'intérieur d\'un AppProvider');
  }
  return context;
}
