/**
 * Service API d'authentification
 */
import { apiClient, tokenManager, processResponse } from '../apiClient';
import { ENDPOINTS } from '../../config/api';
import { getErrorMessage } from '../../utils/errorHandling';

/**
 * Points de terminaison de l'API d'authentification
 */
export const authApi = {
  /**
   * Connexion avec identifiants
   * @param {Object} credentials - Identifiants utilisateur (login/mot de passe)
   * @returns {Promise<Object>} - Réponse avec l'utilisateur et le token
   */  login: async (credentials) => {
    try {
      const { response, data } = await apiClient.post(ENDPOINTS.LOGIN, credentials);
      // Traiter la réponse
      const result = processResponse(response, data);

      if (result.success && data.accessToken) {
        console.log('Connexion réussie, stockage des tokens et des données utilisateur');
        tokenManager.setToken(data.accessToken, data.refreshToken);
        tokenManager.setUser(data.user);
        result.user = data.user;
      } else {
        console.warn('Échec de la connexion :', data.message || 'Erreur inconnue');
      }

      return result;
    } catch (error) {
      console.error('Erreur de connexion:', error);

      return {
        success: false,
        error: getErrorMessage(error, 'Échec d\'authentification'),
        errorCode: error.response?.data?.code || 'AUTH_ERROR'
      };
    }
  },

  /**
   * Enregistrer un nouvel utilisateur
   * @param {Object} userData - Données d'inscription de l'utilisateur
   * @returns {Promise<Object>} - Réponse avec le résultat
   */
  register: async (userData) => {
    try {
      const { response, data } = await apiClient.put(ENDPOINTS.REGISTER, userData);
      return processResponse(response, data);
    } catch (error) {
      console.error('Erreur d\'inscription:', error);
      
      return {
        success: false,
        error: getErrorMessage(error, 'Échec d\'inscription'),
        errorCode: error.response?.data?.code || 'REGISTRATION_ERROR'
      };
    }
  },

  /**
   * Déconnexion de l'utilisateur actuel
   * @returns {Promise<Object>} - Réponse avec le résultat
   */
  logout: async () => {
    try {      // Essayer d'appeler le point de terminaison de déconnexion
      try {
        const { response, data } = await apiClient.get(ENDPOINTS.LOGOUT);
      } catch (error) {
        console.warn('L\'appel API de déconnexion a échoué, effacement des tokens quand même:', error);
      }
      
      // Toujours effacer les tokens localement quel que soit le résultat serveur
      tokenManager.clear();
      
      return {
        success: true
      };    } catch (error) {
      console.error('Erreur de déconnexion:', error);
      // Toujours effacer les tokens localement en cas d\'erreur
      tokenManager.clear();
      return {
        success: true,
        error: error.message
      };
    }
  },

  /**
   * Vérifier le statut d'authentification
   * @returns {Promise<Object>} - Réponse avec données utilisateur si authentifié
   */
  check: async () => {
    try {      // Ignorer l'appel API si aucun token n'existe
      if (!tokenManager.getToken()) {
        console.log('Aucun token trouvé, vérification d\'authentification ignorée');
        return { success: false, error: 'Aucun token d\'authentification' };
      }
      
      const { response, data } = await apiClient.get(ENDPOINTS.CHECK_AUTH);
      
      // Traiter et enrichir la réponse
      const result = processResponse(response, data);
      
      // Mettre à jour les données utilisateur dans le stockage si succès
      if (result.success && data.user) {
        tokenManager.setUser(data.user);
        result.user = data.user;
      }
      
      return result;
    } catch (error) {
      console.error('Erreur de vérification d\'authentification:', error);
      return { 
        success: false, 
        error: error.message || 'La vérification d\'authentification a échoué' 
      };
    }
  },

  /**
   * Rafraîchir le token d'authentification
   * @returns {Promise<Object>} - Réponse avec le nouveau token
   */
  refreshToken: async () => {
    try {
      const { response, data } = await apiClient.get(ENDPOINTS.REFRESH_TOKEN);
      
      const result = processResponse(response, data);
      
      // Mettre à jour le token dans le stockage si succès
      if (result.success && data.token) {
        tokenManager.setToken(data.token);
        
        // Mettre à jour les données utilisateur si fournies
        if (data.user) {
          tokenManager.setUser(data.user);
        }
      }
      
      return result;
    } catch (error) {
      console.error('Erreur de rafraîchissement du token:', error);
      return {
        success: false,
        error: getErrorMessage(error, 'Échec du rafraîchissement du token'),
        errorCode: error.response?.data?.code || 'TOKEN_REFRESH_ERROR'
      };
    }
  }
};