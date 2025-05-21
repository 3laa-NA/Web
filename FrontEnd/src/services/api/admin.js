/**
 * Service API Admin
 */
import { apiClient, processResponse } from '../apiClient';
import { ENDPOINTS } from '../../config/api';

/**
 * Points de terminaison de l'API Admin
 */
export const adminApi = {
  /**
   * Récupérer tous les utilisateurs avec filtrage optionnel
   * @param {Object} filters - Paramètres de filtrage
   * @returns {Promise<Object>} - Réponse avec les utilisateurs
   */
  getUsers: async (filters = {}) => {
    try {
      const { response, data } = await apiClient.get(ENDPOINTS.ADMIN_USERS, { params: filters });
      return processResponse(response, data);    } catch (error) {
      console.error('Erreur de récupération des utilisateurs:', error);
      return {
        success: false,
        error: error.message || 'Échec de récupération des utilisateurs'
      };
    }
  },
  
  /**
   * Récupérer les inscriptions des utilisateurs en attente
   * @returns {Promise<Object>} - Réponse avec les utilisateurs en attente
   */
  getPendingUsers: async () => {
    try {
      const { response, data } = await apiClient.get(ENDPOINTS.PENDING_USERS);
      return processResponse(response, data);    } catch (error) {
      console.error('Erreur de récupération des utilisateurs en attente:', error);
      return {
        success: false,
        error: error.message || 'Échec de récupération des utilisateurs en attente'
      };
    }
  },
  
  /**
   * Approuver l'inscription d'un utilisateur
   * @param {string} userId - ID de l'utilisateur à approuver
   * @returns {Promise<Object>} - Réponse avec le résultat
   */
  approveUser: async (userId) => {
    try {
      const { response, data } = await apiClient.post(ENDPOINTS.APPROVE_USER(userId));
      return processResponse(response, data);    } catch (error) {
      console.error('Erreur d\'approbation d\'utilisateur:', error);
      return {
        success: false,
        error: error.message || 'Échec d\'approbation d\'utilisateur'
      };
    }
  },
  
  /**
   * Rejeter l'inscription d'un utilisateur
   * @param {string} userId - ID de l'utilisateur à rejeter
   * @returns {Promise<Object>} - Réponse avec le résultat
   */
  rejectUser: async (userId) => {
    try {
      const { response, data } = await apiClient.post(ENDPOINTS.REJECT_USER(userId));
      return processResponse(response, data);    } catch (error) {
      console.error('Erreur de rejet d\'utilisateur:', error);
      return {
        success: false,
        error: error.message || 'Échec de rejet d\'utilisateur'
      };
    }
  },
  
  /**
   * Mettre à jour le rôle d'un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @param {Object} roleData - Données de rôle avec le nouveau rôle
   * @returns {Promise<Object>} - Réponse avec le résultat
   */
  updateUserRole: async (userId, roleData) => {
    try {
      const { response, data } = await apiClient.put(ENDPOINTS.CHANGE_USER_ROLE(userId), roleData);
      return processResponse(response, data);    } catch (error) {
      console.error('Erreur de mise à jour du rôle utilisateur:', error);
      return {
        success: false,
        error: error.message || 'Échec de mise à jour du rôle utilisateur'
      };
    }
  }
};

export default adminApi;