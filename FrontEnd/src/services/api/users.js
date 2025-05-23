/**
 * Service API Utilisateurs
 */
import { apiClient, processResponse, tokenManager } from '../apiClient';
import { ENDPOINTS } from '../../config/api';

/**
 * Points de terminaison de l'API Utilisateurs
 */
export const usersApi = {
  /**
   * Obtenir les données de profil pour un utilisateur spécifique ou l'utilisateur courant si id est 'me'
   * @param {string} userId - ID de l'utilisateur ou 'me' pour l'utilisateur courant
   * @returns {Promise<Object>} - Réponse avec les données de profil utilisateur
   */
  getProfile: async (userId = 'me') => {
    try {
      const endpoint = userId === 'me' ? '/user/profile' : `/users/${userId}`;
      const { response, data } = await apiClient.get(endpoint);
      return processResponse(response, data);    } catch (error) {
      console.error('Erreur de récupération du profil:', error);
      return {
        success: false,
        error: error.message || 'Échec de récupération du profil'
      };
    }
  },
  
  /**
   * Mettre à jour les données de profil pour l'utilisateur courant
   * @param {Object} profileData - Données de profil à mettre à jour
   * @returns {Promise<Object>} - Réponse avec les données utilisateur mises à jour
   */
  updateProfile: async (profileData) => {
    try {
      const { response, data } = await apiClient.put('/user/profile', profileData);
      return processResponse(response, data);    } catch (error) {
      console.error('Erreur de mise à jour du profil:', error);
      return {
        success: false,
        error: error.message || 'Échec de mise à jour du profil'
      };
    }
  },
    /**
   * Télécharger l'avatar utilisateur
   * @param {FormData} formData - Données du formulaire contenant le fichier avatar
   * @returns {Promise<Object>} - Réponse avec l'URL de l'avatar
   */
  uploadAvatar: async (formData) => {
    try {
      const { response, data } = await apiClient.post(
        '/user/avatar',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      return processResponse(response, data);    } catch (error) {
      console.error('Erreur de téléchargement d\'avatar:', error);
      return {
        success: false,
        error: error.message || 'Échec de téléchargement d\'avatar'
      };
    }
  },
  /**
   * Rechercher des utilisateurs par terme de recherche
   * @param {string} searchTerm - Terme de recherche (nom, prénom, login)
   * @returns {Promise<Object>} - Réponse avec la liste des utilisateurs trouvés
   */
  search: async (searchTerm) => {
    try {
      console.log('Envoi de la requête de recherche avec terme:', searchTerm);
      
      // Vérifier si un token est disponible
      const token = tokenManager.getToken();
      console.log('Token disponible:', !!token);
      
      const { response, data } = await apiClient.get('/user/search', {
        params: { q: searchTerm }
      });
      
      console.log('Réponse brute de l\'API:', response.status, data);
      
      return processResponse(response, data);
    } catch (error) {
      console.error('Erreur de recherche d\'utilisateurs:', error);
      
      // Afficher plus d'informations sur l'erreur pour faciliter le débogage
      if (error.response) {
        console.error('Détails de l\'erreur:', error.response.status, error.response.data);
        
        // Si c'est une erreur 401, c'est probablement un problème d'authentification
        if (error.response.status === 401) {
          return {
            success: false,
            code: 'AUTH_REQUIRED',
            error: 'Authentification requise',
            message: 'Vous devez être connecté pour effectuer cette action'
          };
        }
        
        // Renvoyer les détails de l'erreur du serveur si disponibles
        return {
          success: false,
          code: error.response.data.code || 'API_ERROR',
          error: error.message,
          message: error.response.data.message || 'Échec de recherche d\'utilisateurs'
        };
      }
      
      return {
        success: false,
        error: error.message || 'Échec de recherche d\'utilisateurs',
        message: 'Une erreur est survenue lors de la recherche d\'utilisateurs'
      };
    }
  },
  /**
   * Obtenir le profil public d'un utilisateur
   * @param {string} login - Login de l'utilisateur
   * @returns {Promise<Object>} - Réponse avec le profil public
   */
  getPublicProfile: async (login) => {
    try {
      const { response, data } = await apiClient.get(`/user/${login}`);
      return processResponse(response, data);
    } catch (error) {
      console.error('Erreur de récupération du profil public:', error);
      return {
        success: false,
        error: error.message || 'Échec de récupération du profil public'
      };
    }
  },
};

export default usersApi;