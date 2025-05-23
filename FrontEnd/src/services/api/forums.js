/**
 * Service API Forums
 */
import { apiClient } from '../apiClient';
import { ENDPOINTS } from '../../config/api';

export const forumsApi = {
  /**
   * Récupérer tous les forums accessibles
   */
  getAll: async () => {
    try {
      const { response, data } = await apiClient.get(ENDPOINTS.FORUMS);
      return {
        success: response.status === 200,
        ...data
      };
    } catch (error) {
      console.error('Erreur de récupération des forums:', error);
      return {
        success: false,
        error: error.message || 'Échec de récupération des forums'
      };
    }
  },

  /**
   * Créer un nouveau forum (admin uniquement)
   */
  create: async (forumData) => {
    try {
      const { response, data } = await apiClient.post(ENDPOINTS.FORUMS, forumData);
      return {
        success: response.status === 201,
        ...data
      };
    } catch (error) {
      console.error('Erreur de création du forum:', error);
      return {
        success: false,
        error: error.message || 'Échec de création du forum'
      };
    }
  },

  /**
   * Récupérer les détails d'un forum par son ID
   */
  getById: async (forumId) => {
    try {
      const { response, data } = await apiClient.get(ENDPOINTS.FORUM_DETAIL(forumId));
      return {
        success: response.status === 200,
        forum: data.forum
      };
    } catch (error) {
      console.error('Erreur de récupération du forum:', error);
      return {
        success: false,
        error: error.message || 'Échec de récupération du forum'
      };
    }
  },

  /**
   * Récupérer tous les forums (admin uniquement)
   */
  getAllForAdmin: async () => {
    try {
      const { response, data } = await apiClient.get(ENDPOINTS.ADMIN_FORUMS);
      return {
        success: response.status === 200,
        forums: data.forums || []
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des forums:', error);
      return {
        success: false,
        error: error.message || 'Échec de récupération des forums'
      };
    }
  },

  /**
   * Mettre à jour l'accessibilité d'un forum
   */
  updateAccess: async (forumId, isPublic) => {
    try {
      const { response, data } = await apiClient.put(ENDPOINTS.FORUM_ACCESS(forumId), { isPublic });
      return {
        success: response.status === 200,
        message: data.message
      };
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'accessibilité:', error);
      return {
        success: false,
        error: error.message || 'Échec de la mise à jour de l\'accessibilité'
      };
    }
  },

  /**
   * Supprimer un forum
   */
  delete: async (forumId) => {
    try {
      const { response, data } = await apiClient.delete(ENDPOINTS.FORUM_DELETE(forumId));
      return {
        success: response.status === 200,
        message: data.message
      };
    } catch (error) {
      console.error('Erreur lors de la suppression du forum:', error);
      return {
        success: false,
        error: error.message || 'Échec de la suppression du forum'
      };
    }
  }
};

export default forumsApi;
