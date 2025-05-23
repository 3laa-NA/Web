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
   * @param {string} filters.forumId - ID du forum
   * @returns {Promise<Object>} - Réponse avec les messages
   */
  getAll: async ({ forumId } = {}) => {
    try {
      if (!forumId) {
        throw new Error('Forum ID is required');
      }

      const { response, data } = await apiClient.get(ENDPOINTS.MESSAGES, { 
        params: { forumId } 
      });
      
      if (response.status === 403) {
        return {
          success: false,
          error: 'Accès non autorisé à ce forum'
        };
      }

      return {
        success: response.status === 200,
        messages: data.messages || [],
        ...data
      };
    } catch (error) {
      console.error('Erreur de récupération des messages:', error);
      if (error.response?.status === 403) {
        return {
          success: false,
          error: 'Accès non autorisé à ce forum'
        };
      }
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Échec de récupération des messages'
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
   * @param {string} messageData.text - Contenu du message
   * @param {string} messageData.forumId - ID du forum
   * @returns {Promise<Object>} - Réponse avec le message créé
   */
  create: async ({ text, forumId }) => {
    try {
      if (!forumId) {
        throw new Error('Forum ID is required');
      }

      const { response, data } = await apiClient.post(ENDPOINTS.MESSAGES, { text, forumId });
      return {
        success: response.status === 201,
        ...data
      };
    } catch (error) {
      console.error('Erreur de création du message:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Échec de création du message'
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
  },

  /**
   * Basculer le statut 'j'aime' sur une réponse
   * @param {string} messageId - ID du message parent
   * @param {string} replyId - ID de la réponse
   * @returns {Promise<Object>} - Réponse avec le statut du 'j'aime'
   */
  toggleReplyLike: async (messageId, replyId) => {
    try {
      const { response, data } = await apiClient.post(ENDPOINTS.MESSAGE_REPLY_LIKE(messageId, replyId));
      return processResponse(response, data);
    } catch (error) {
      console.error('Erreur de basculement de j\'aime sur la réponse:', error);
      return {
        success: false,
        error: error.message || 'Échec de basculement du statut j\'aime sur la réponse'
      };
    }
  },

  /**
   * Récupérer tous les messages d'un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<Object>} - Réponse avec les messages
   */
  getUserMessages: async (userId) => {
    try {      const { data } = await apiClient.get(`${ENDPOINTS.USER_MESSAGES(userId)}`);
      return {
        success: data.success,
        messages: data.messages || [],
        ...data
      };
    } catch (error) {
      console.error('Erreur de récupération des messages utilisateur:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Échec de récupération des messages'
      };
    }
  },
};

export default messagesApi;