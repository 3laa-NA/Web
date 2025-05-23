/**
 * Configuration de l'API pour le frontend
 * Ce module définit les paramètres de connexion à l'API backend
 */

// L'URL de base de l'API backend
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Timeout pour les requêtes API (en millisecondes)
export const API_TIMEOUT = 30000;

// Configuration des endpoints API
export const ENDPOINTS = {
  // Authentification
  LOGIN: '/auth/login',
  LOGOUT: '/auth/logout',
  REGISTER: '/user',
  CHECK_AUTH: '/auth/check-auth',
  REFRESH_TOKEN: '/auth/refresh-token',
  
  // Messages publics
  MESSAGES: '/messages',
  MESSAGE_DETAIL: (messageId) => `/messages/${messageId}`,
  MESSAGE_LIKE: (messageId) => `/messages/${messageId}/like`,
  MESSAGE_REPLIES: (messageId) => `/messages/${messageId}/replies`,  MESSAGE_REPLY_LIKE: (messageId, replyId) => `/messages/${messageId}/replies/${replyId}/like`,
  USER_MESSAGES: (userId) => `/user/messages/${userId}`,
  
  // Messages privés
  CONVERSATIONS: '/private-messages/conversations',
  CONVERSATION_DETAIL: (conversationId) => `/private-messages/conversations/${conversationId}`,
  SEND_PRIVATE_MESSAGE: '/private-messages/send',
    // Forums
  FORUMS: '/forums',
  FORUM_DETAIL: (forumId) => `/forums/${forumId}`,
  ADMIN_FORUMS: '/forums/admin/all',
  FORUM_ACCESS: (forumId) => `/forums/${forumId}/access`,
  FORUM_DELETE: (forumId) => `/forums/${forumId}`,
  
  // Administration
  ADMIN_USERS: '/admin/users',
  PENDING_USERS: '/admin/users/pending',
  APPROVE_USER: (userId) => `/admin/users/${userId}/approve`,
  REJECT_USER: (userId) => `/admin/users/${userId}/reject`,
  CHANGE_USER_ROLE: (userId) => `/admin/users/${userId}/role`,
  ADMIN_SETTINGS: '/admin/settings',
  
  // Utilitaires
  TEST_CONNECTION: '/test',
  SERVER_STATUS: '/status'
};

// Configuration des options de requête par défaut
export const DEFAULT_OPTIONS = {
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
};

// Noms des stockages locaux
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'auth_access_token',
  REFRESH_TOKEN: 'auth_refresh_token',
  USER: 'auth_user'
};

// Configuration des statuts de réponse HTTP
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  SERVER_ERROR: 500
};

// Gestion des codes d'erreur
export const ERROR_CODES = {
  CONNECTION_ERROR: 'CONNECTION_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
};

// Messages d'erreur correspondant aux codes
export const ERROR_MESSAGES = {
  [ERROR_CODES.CONNECTION_ERROR]: 'Impossible de se connecter au serveur',
  [ERROR_CODES.NETWORK_ERROR]: 'Erreur réseau, veuillez vérifier votre connexion',
  [ERROR_CODES.AUTHENTICATION_ERROR]: 'Erreur d\'authentification',
  [ERROR_CODES.VALIDATION_ERROR]: 'Les données saisies sont invalides',
  [ERROR_CODES.SERVER_ERROR]: 'Erreur serveur, veuillez réessayer plus tard',
  [ERROR_CODES.UNKNOWN_ERROR]: 'Une erreur inconnue s\'est produite'
};

export default {
  API_BASE_URL,
  API_TIMEOUT,
  ENDPOINTS,
  DEFAULT_OPTIONS,
  STORAGE_KEYS,
  HTTP_STATUS,
  ERROR_CODES,
  ERROR_MESSAGES
};