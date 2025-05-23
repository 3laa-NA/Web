/**
 * Module API pour la messagerie privée
 */
import { apiClient } from '../apiClient';

/**
 * Récupérer toutes les conversations pour l'utilisateur courant
 */
export async function getConversations() {
  try {
    console.log('Requesting private messages conversations...');
    const { data } = await apiClient.get('/private-messages/conversations');
    console.log('API response for conversations:', data);
    return data;
  } catch (error) {
    console.error('Échec de récupération des conversations:', error);
    // Log more detailed error info for debugging
    if (error.response) {
      console.error('Error response:', error.response.status, error.response.data);
    } else if (error.request) {
      console.error('No response received:', error.request);
    }
    
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'Échec de chargement des conversations'
    };
  }
}

/**
 * Récupérer les messages d'une conversation spécifique
 *
 * @param {string} conversationId - ID de la conversation
 */
export async function getMessages(conversationId) {
  try {
    const { data } = await apiClient.get(`/private-messages/conversations/${conversationId}`);
    return data;  } catch (error) {
    console.error(`Échec de récupération des messages pour la conversation ${conversationId}:`, error);
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'Échec de chargement des messages'
    };
  }
}

/**
 * Envoyer un message privé
 *
 * @param {object} messageData - Données du message
 * @param {string} messageData.recipientId - ID du destinataire
 * @param {string} messageData.text - Contenu du message
 */
export async function send(messageData) {
  try {
    const { data } = await apiClient.post('/private-messages/send', messageData);
    return data;  } catch (error) {
    console.error('Échec d\'envoi du message privé:', error);
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'Échec d\'envoi du message'
    };
  }
}

/**
 * Marquer une conversation comme lue
 *
 * @param {string} conversationId - ID de la conversation
 */
export async function markAsRead(conversationId) {
  try {
    const { data } = await apiClient.post(`/private-messages/conversations/${conversationId}/read`);
    return data;  } catch (error) {
    console.error(`Échec de marquage de la conversation ${conversationId} comme lue:`, error);
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'Échec de mise à jour du statut de conversation'
    };
  }
}

export const privateMessagesApi = {
  getConversations,
  getMessages,
  send,
  markAsRead
};