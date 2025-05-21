/**
 * Service API Messages publics
 */
import { apiClient, processResponse } from '../apiClient';
import { ENDPOINTS } from '../../config/api';

/**
 * Points de terminaison de l'API Messages publics
 */
export const messagesApi = {
  /**
   * Récupérer tous les messages avec filtrage optionnel
   * @param {Object} filters - Paramètres de filtrage
   * @returns {Promise<Object>} - Réponse avec les messages
   */
  getAll: async (filters = {}) => {
    try {
      const { response, data } = await apiClient.get(ENDPOINTS.MESSAGES, { params: filters });
      return processResponse(response, data);    } catch (error) {
      console.error('Erreur de récupération des messages:', error);
      return {
        success: false,
        error: error.message || 'Échec de récupération des messages'
      };
    }
  },
  
  /**
   * Récupérer un message spécifique par ID
   * @param {string} id - ID du message
   * @returns {Promise<Object>} - Réponse avec les données du message
   */
  getById: async (id) => {
    try {
      const { response, data } = await apiClient.get(ENDPOINTS.MESSAGE_DETAIL(id));
      return processResponse(response, data);    } catch (error) {
      console.error('Erreur de récupération du message:', error);
      return {
        success: false,
        error: error.message || 'Échec de récupération du message'
      };
    }
  },
  
  /**
   * Créer un nouveau message
   * @param {Object} messageData - Données du message
   * @returns {Promise<Object>} - Réponse avec le message créé
   */
  create: async (messageData) => {
    try {
      const { response, data } = await apiClient.post(ENDPOINTS.MESSAGES, messageData);
      return processResponse(response, data);    } catch (error) {
      console.error('Erreur de création du message:', error);
      return {
        success: false,
        error: error.message || 'Échec de création du message'
      };
    }
  },
  
  /**
   * Mettre à jour un message existant
   * @param {string} id - ID du message
   * @param {Object} messageData - Données mises à jour du message
   * @returns {Promise<Object>} - Réponse avec le message mis à jour
   */
  update: async (id, messageData) => {
    try {
      const { response, data } = await apiClient.put(ENDPOINTS.MESSAGE_DETAIL(id), messageData);
      return processResponse(response, data);    } catch (error) {
      console.error('Erreur de mise à jour du message:', error);
      return {
        success: false,
        error: error.message || 'Échec de mise à jour du message'
      };
    }
  },
  
  /**
   * Supprimer un message
   * @param {string} id - ID du message
   * @returns {Promise<Object>} - Réponse avec le résultat
   */
  delete: async (id) => {
    try {
      const { response, data } = await apiClient.delete(ENDPOINTS.MESSAGE_DETAIL(id));
      return processResponse(response, data);    } catch (error) {
      console.error('Erreur de suppression du message:', error);
      return {
        success: false,
        error: error.message || 'Échec de suppression du message'
      };
    }
  },
  
  /**
   * Ajouter une réponse à un message
   * @param {string} id - ID du message parent
   * @param {Object} replyData - Données de la réponse
   * @returns {Promise<Object>} - Réponse avec la réponse créée
   */
  addReply: async (id, replyData) => {
    try {
      const { response, data } = await apiClient.post(ENDPOINTS.MESSAGE_REPLIES(id), replyData);
      return processResponse(response, data);    } catch (error) {
      console.error('Erreur d\'ajout de réponse:', error);
      return {
        success: false,
        error: error.message || 'Échec d\'ajout de réponse'
      };
    }
  },
  
  /**
   * Récupérer les réponses d'un message
   * @param {string} id - ID du message parent
   * @returns {Promise<Object>} - Réponse avec les réponses
   */
  getReplies: async (id) => {
    try {
      const { response, data } = await apiClient.get(ENDPOINTS.MESSAGE_REPLIES(id));
      return processResponse(response, data);    } catch (error) {
      console.error('Erreur de récupération des réponses:', error);
      return {
        success: false,
        error: error.message || 'Échec de récupération des réponses'
      };
    }
  },
  
  /**
   * Basculer le statut 'j'aime' sur un message
   * @param {string} id - ID du message
   * @returns {Promise<Object>} - Réponse avec le statut du 'j'aime'
   */
  toggleLike: async (id) => {
    try {
      const { response, data } = await apiClient.post(ENDPOINTS.MESSAGE_LIKE(id));
      return processResponse(response, data);    } catch (error) {
      console.error('Erreur de basculement de j\'aime:', error);
      return {
        success: false,
        error: error.message || 'Échec de basculement du statut j\'aime'
      };
    }
  }
};

export default messagesApi;