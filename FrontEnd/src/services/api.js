/**
 * Service API principal qui intègre tous les modules API
 */
import { apiClient, API_DOMAIN, API_BASE_URL, tokenManager, CONNECTION_STATES, subscribeToConnectionState } from './apiClient';
import { authApi } from './api/auth';
import { usersApi } from './api/users';
import { messagesApi } from './api/messages';
import { adminApi } from './api/admin';
import { privateMessagesApi } from './api/privateMessages';

/**
 * Tester la connexion au backend
 */
async function testConnection() {
  try {
    const { response } = await apiClient.get('/test', { timeout: 5000 });
    return response.status >= 200 && response.status < 300;
  } catch (error) {
    console.error('Connection test failed:', error);
    return false;
  }
}

/**
 * Objet API unifié regroupant tous les modules API
 */
export const API = {
  // Domain-specific API modules
  auth: authApi,
  users: usersApi,
  messages: messagesApi,
  admin: adminApi,
  privateMessages: privateMessagesApi,
  
  // Connection state and management
  connectionState: CONNECTION_STATES,
  subscribeToConnectionState,
  
  // Token management
  tokens: tokenManager,
  
  // Utility methods
  isAuthenticated: async () => {
    const result = await authApi.check();
    return result.success;
  },
  
  // Check server connectivity
  testConnection,
  
  // Get server status
  getServerStatus: async () => {
    try {
      const { response, data } = await apiClient.get('/status');
      return {
        success: response.status >= 200 && response.status < 300,
        status: data?.status || 'unknown',
        data: data
      };
    } catch (error) {
      console.error('Server status check failed:', error);
      return {
        success: false,
        status: 'error',
        error: error.message
      };
    }
  }
};

// Exporter pour utilisation dans d'autres modules
export { API_DOMAIN, API_BASE_URL, apiClient, tokenManager, CONNECTION_STATES, subscribeToConnectionState };

// Pour compatibilité ascendante, exporter l'API par défaut
export default API;