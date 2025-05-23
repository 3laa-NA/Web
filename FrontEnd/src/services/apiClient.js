/**
 * Configuration et mise en place du client API
 */
import axios from 'axios';
import { API_BASE_URL, API_TIMEOUT, DEFAULT_OPTIONS, STORAGE_KEYS } from '../config/api';

// Réexporter les constantes de configuration pour d'autres modules
export { API_BASE_URL };

// Extraction du domaine de l'API pour d'autres utilisations
export const API_DOMAIN = new URL(API_BASE_URL).origin;

// Fonction utilitaire de traitement des réponses
export const processResponse = (response, data) => {
  // Pour faciliter le débogage
  console.log(`Traitement réponse API ${response.config?.url}:`, {
    status: response.status,
    success: response.status >= 200 && response.status < 300,
    data: data
  });

  if (response.status >= 200 && response.status < 300) {
    // Conserver la structure originale de la réponse pour compatibilité
    return {
      ...data,
      success: data.success !== undefined ? data.success : true,
      error: null
    };
  }
  
  // En cas d'erreur, préserver plus d'informations
  return {
    success: false,
    data: null,
    error: data?.message || 'Request failed',
    message: data?.message || 'Une erreur est survenue',
    code: data?.code || `HTTP_${response.status}`,
    status: response.status
  };
};

// Gestion des tokens pour l'authentification
export const tokenManager = {
  // Récupérer le token d'accès (principal pour les requêtes API)
  getToken: () => {
    try {
      // Try localStorage first
      let token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      
      // Si absent de localStorage, essayer sessionStorage en secours
      if (!token) {
        token = sessionStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      }
      
      // Validation basique du format du token – sans le supprimer automatiquement
      if (token && (!token.includes('.') || token.split('.').length !== 3)) {
        console.warn('Potentially invalid token format, but keeping it:', 
          token.substring(0, 15) + '...');
      }      return token;
    } catch (error) {
      console.error('Erreur lors de la récupération du token d\'accès depuis le stockage:', error);
      return null;
    }
  },
  
  // Get the refresh token (used to get a new access token)
  getRefreshToken: () => {
    try {
      // Try localStorage first
      let token = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
      
      // Si absent de localStorage, essayer sessionStorage en secours
      if (!token) {
        token = sessionStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
      }
        return token;
    } catch (error) {
      console.error('Erreur lors de la récupération du token de rafraîchissement depuis le stockage:', error);
      return null;
    }
  },
    setToken: (accessToken, refreshToken) => {    try {
      // Basic validation before saving
      if (!accessToken || typeof accessToken !== 'string') {
        console.error('Token d\'accès invalide fourni à setToken:', accessToken);
        return false;
      }
      
      // Store access token in both localStorage and sessionStorage for redundancy
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
      sessionStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
      
      // Store refresh token if provided
      if (refreshToken && typeof refreshToken === 'string') {
        localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
        sessionStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
      }
        return true;
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement des tokens dans le stockage:', error);
      return false;
    }
  },
  
  removeToken: () => {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    sessionStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    sessionStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  },
  
  getUser: () => {
    try {
      // Try localStorage first
      let userJson = localStorage.getItem(STORAGE_KEYS.USER);
      
      // Si absent de localStorage, essayer sessionStorage en secours
      if (!userJson) {
        userJson = sessionStorage.getItem(STORAGE_KEYS.USER);
      }
        return userJson ? JSON.parse(userJson) : null;
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'utilisateur depuis le stockage:', error);
      return null;
    }
  },
  
  setUser: (user) => {
    try {
      const userJson = JSON.stringify(user);
      localStorage.setItem(STORAGE_KEYS.USER, userJson);
      sessionStorage.setItem(STORAGE_KEYS.USER, userJson);    } catch (error) {
      console.error('Erreur lors de l\'enregistrement de l\'utilisateur dans le stockage:', error);
    }
  },
  
  removeUser: () => {
    localStorage.removeItem(STORAGE_KEYS.USER);
    sessionStorage.removeItem(STORAGE_KEYS.USER);
  },
  
  clear: () => {
    tokenManager.removeToken();
    tokenManager.removeUser();
  }
};

// Gestion de l'état de connexion
export const CONNECTION_STATES = {
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
  CHECKING: 'checking'
};

let connectionState = CONNECTION_STATES.CHECKING;
let connectionListeners = [];

export const updateConnectionState = (newState) => {
  if (connectionState !== newState) {
    connectionState = newState;
    // Notify all subscribers
    connectionListeners.forEach(listener => {      try {
        listener(connectionState);
      } catch (error) {
        console.error('Erreur dans l\'écouteur d\'état de connexion:', error);
      }
    });
  }
};

export const subscribeToConnectionState = (callback) => {
  connectionListeners.push(callback);
  // Immediately call with current state
  callback(connectionState);
  
  // Return unsubscribe function
  return () => {
    connectionListeners = connectionListeners.filter(cb => cb !== callback);
  };
};

// Fonctionnalité de rafraîchissement des tokens
let isRefreshing = false;
let refreshSubscribers = [];

// S'abonner au rafraîchissement des tokens
const subscribeToTokenRefresh = (callback) => {
  refreshSubscribers.push(callback);
};

// Notifier les abonnés lorsque le token est rafraîchi
const onTokenRefreshed = (accessToken) => {
  refreshSubscribers.forEach((callback) => callback(accessToken));
  refreshSubscribers = [];
};

// Gérer le rafraîchissement du token
const refreshAuthToken = async () => {
  if (isRefreshing) {
    return new Promise((resolve) => {
      subscribeToTokenRefresh((token) => resolve(token));
    });
  }
  
  isRefreshing = true;
  
  try {
    const currentRefreshToken = tokenManager.getRefreshToken();
    
    if (!currentRefreshToken) {
      throw new Error('No refresh token available');
    }
    
    // Create a new axios instance for refresh to avoid interceptor loop
    const refreshClient = axios.create({
      baseURL: API_BASE_URL,
      timeout: API_TIMEOUT,
      headers: DEFAULT_OPTIONS.headers
    });
    
    const { data } = await refreshClient.get('/auth/refresh-token', {
      headers: {
        Authorization: `Bearer ${currentRefreshToken}`
      }
    });
    
    if (data.success && data.accessToken) {
      // Save the new tokens
      tokenManager.setToken(data.accessToken, data.refreshToken || currentRefreshToken);
      
      // Notify subscribers
      onTokenRefreshed(data.accessToken);
      
      return data.accessToken;
    } else {
      throw new Error('Failed to refresh token');
    }  } catch (error) {
    // On failure, clear tokens and force logout
    console.error('Échec du rafraîchissement du token:', error);
    tokenManager.removeToken();
    tokenManager.removeUser();
    window.location.href = '/login?session_expired=true';
    throw error;
  } finally {
    isRefreshing = false;
  }
};

// Create the axios instance with base configuration
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  ...DEFAULT_OPTIONS
});

// Request interceptor for authentication
apiClient.interceptors.request.use(
  (config) => {
    try {
      const token = tokenManager.getToken();
        if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        // Only log in development environment
        if (process.env.NODE_ENV === 'development') {
          console.log(`Added auth token to ${config.url}`);
        }
      } else {
        // Only log in development environment
        if (process.env.NODE_ENV === 'development') {
          console.log(`No auth token available for ${config.url}`);
        }
        
        // Check if we should have a token (user logged in but token missing)
        const user = tokenManager.getUser();
        if (user) {
          console.warn('User data exists but no token found - inconsistent state');
        }
      }    } catch (error) {
      console.error('Erreur dans l\'intercepteur de requête:', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling and token refresh
apiClient.interceptors.response.use(
  (response) => {
    // Update connection state when we get a response
    updateConnectionState(CONNECTION_STATES.CONNECTED);
    return {
      response,
      data: response.data
    };
  },
  async (error) => {
    // Check if error is due to expired token (401 Unauthorized)
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Check the error message to determine if it's a token issue
      const isTokenError = error.response.data?.code === 'INVALID_TOKEN' || 
                          error.response.data?.message?.toLowerCase().includes('token');
      
      if (isTokenError && tokenManager.getRefreshToken()) {
        originalRequest._retry = true;
        
        try {          // Try to refresh the token
          const newAccessToken = await refreshAuthToken();
          
          // Update the authorization header with new token
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          
          // Retry the original request
          return apiClient(originalRequest);
        } catch (refreshError) {
          // If refresh fails, propagate the error
          return Promise.reject(refreshError);
        }
      }
    }
    
    // Handle network errors
    if (!error.response) {
      updateConnectionState(CONNECTION_STATES.DISCONNECTED);
      console.warn('Network error occurred, but not clearing session');
      return Promise.reject({ 
        message: 'Serveur inaccessible', 
        originalError: error, 
        isNetworkError: true
      });
    }    // Handle HTTP error responses
    updateConnectionState(CONNECTION_STATES.CONNECTED);
    
    // Process data for consistent error format
    const errorObject = {
      response: error.response,
      status: error.response.status,
      data: error.response?.data,
      message: error.response?.data?.message || 'An error occurred'
    };

    return Promise.reject(errorObject);
  }
);

export default apiClient;