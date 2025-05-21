/**
 * Service API Utilisateurs
 */
import { apiClient, processResponse } from '../apiClient';
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
  }
};

export default usersApi;