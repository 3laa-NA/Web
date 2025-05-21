import { createContext, useState, useEffect, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { API } from '../services/api';

// Contexte pour gérer l'état d'authentification
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const { t } = useTranslation(['auth', 'common']);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Vérification du token lors du chargement initial
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setLoading(true);
        
        // Vérifier si l'utilisateur est connecté via l'API
        const response = await API.auth.check();
        
        if (response.success && response.user) {
          setUser(response.user);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Erreur de vérification d\'authentification:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, []);
  
  // Fonction de connexion
  const login = async (credentials) => {
    // Appel du service d'authentification
    const response = await API.auth.login(credentials);
    if (response.success && response.user) {
      setUser(response.user);
    } else {
      setUser(null);
    }
    // Retourner toute la réponse (success, error, errorCode, user)
    return response;
  };
  
  // Fonction de déconnexion
  const logout = async () => {
    try {
      await API.auth.logout();
      setUser(null);
      return { success: true };
    } catch (error) {
      console.error('Erreur de déconnexion:', error);
      return {
        success: false,
        message: error.message || 'Une erreur est survenue lors de la déconnexion'
      };
    }
  };
  
  // Fonction d'inscription
  const register = async (userData) => {
    try {
      const response = await API.auth.register(userData);
        if (response.success) {
        return { success: true };
      } else {
        throw new Error(response.message || t('errors.registrationFailed', { ns: 'auth' }));
      }
    } catch (error) {
      console.error('Erreur d\'inscription:', error);
      return {
        success: false,
        message: error.message || t('errors.errorOccurred', { ns: 'auth' })
      };
    }
  };
    // Récupération du profil utilisateur  
  const getProfile = async () => {
    try {
      if (!user) {
        throw new Error(t('errors.notAuthenticated', { ns: 'auth', defaultValue: 'Utilisateur non authentifié' }));
      }
      
      const response = await API.auth.getProfile();
      
      if (response.success && response.profile) {
        setUser(prevUser => ({
          ...prevUser,
          ...response.profile
        }));
        return { success: true, profile: response.profile };
      } else {
        throw new Error(response.message || 'Échec de récupération du profil');
      }
    } catch (error) {
      console.error('Erreur de récupération du profil:', error);
      return {
        success: false,
        message: error.message || 'Une erreur est survenue lors de la récupération du profil'
      };
    }
  };
  
  // Mise à jour du profil utilisateur
  const updateProfile = async (profileData) => {
    try {
      if (!user) {
        throw new Error('Utilisateur non authentifié');
      }
      
      const response = await API.auth.updateProfile(profileData);
      
      if (response.success) {
        // Mettre à jour les données utilisateur localement
        setUser(prevUser => ({
          ...prevUser,
          ...profileData
        }));
        return { success: true };
      } else {
        throw new Error(response.message || 'Échec de mise à jour du profil');
      }
    } catch (error) {
      console.error('Erreur de mise à jour du profil:', error);
      return {
        success: false,
        message: error.message || 'Une erreur est survenue lors de la mise à jour du profil'
      };
    }
  };
  
  // Valeur partagée avec le contexte
  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    logout,
    register,
    getProfile,
    updateProfile
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook personnalisé pour utiliser le contexte d'authentification
export const useAuth = () => useContext(AuthContext);
