import { apiClient } from '../apiClient';
import { ENDPOINTS } from '../../config/api';

const userApi = {
  // ...existing code...

  /**
   * Récupérer le profil public d'un utilisateur
   * @param {string} login - Login de l'utilisateur
   * @returns {Promise<Object>} Profil de l'utilisateur
   */
  getPublicProfile: async (login) => {
    try {
      const { data } = await apiClient.get(`/api/user/profile/${login}`);
      return data;
    } catch (error) {
      console.error('Erreur de récupération du profil:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  },
};

export default userApi;