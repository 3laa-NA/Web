/**
 * Utilitaires pour la gestion standardisée des erreurs
 * Permet de créer et d'envoyer des réponses d'erreur cohérentes
 */

// Codes d'erreur standard pour l'API
const ErrorCodes = {
  // Erreurs d'authentification (401)
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  
  // Erreurs d'autorisation (403)
  UNAUTHORIZED: 'UNAUTHORIZED',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  
  // Erreurs de ressources (404)
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  MESSAGE_NOT_FOUND: 'MESSAGE_NOT_FOUND',
  CONVERSATION_NOT_FOUND: 'CONVERSATION_NOT_FOUND',
  
  // Erreurs de validation (400)
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',
  
  // Erreurs serveur (500)
  DATABASE_ERROR: 'DATABASE_ERROR',
  SERVER_ERROR: 'SERVER_ERROR'
};

/**
 * Classe personnalisée pour les erreurs API
 */
class ApiError extends Error {
  constructor(code, message, statusCode = 500, details = null) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.timestamp = new Date().toISOString();
    Error.captureStackTrace(this, this.constructor);
  }
    static badRequest(message = 'Requête invalide', code = ErrorCodes.VALIDATION_ERROR, details = null) {
    return new ApiError(code, message, 400, details);
  }
  
  static unauthorized(message = 'Non autorisé', code = ErrorCodes.UNAUTHORIZED) {
    return new ApiError(code, message, 401);
  }
  
  static forbidden(message = 'Accès interdit', code = ErrorCodes.INSUFFICIENT_PERMISSIONS) {
    return new ApiError(code, message, 403);
  }
  
  static notFound(message = 'Ressource non trouvée', code = null) {
    return new ApiError(code, message, 404);
  }
  
  static internal(message = 'Erreur interne du serveur', code = ErrorCodes.SERVER_ERROR, details = null) {
    return new ApiError(code, message, 500, details);
  }
  
  static database(message = 'Erreur de base de données', details = null) {
    return new ApiError(ErrorCodes.DATABASE_ERROR, message, 500, details);
  }
}

/**
 * Middleware pour la gestion globale des erreurs
 */
const errorHandler = (err, req, res, next) => {
  if (err instanceof ApiError) {
    // Erreur API connue
    const response = {
      success: false,
      message: err.message,
      code: err.code,
      statusCode: err.statusCode
    };
    
    if (process.env.NODE_ENV === 'development' && err.details) {
      response.details = err.details;
    }
    
    console.error(`API Error [${err.code}]: ${err.message}`);
    return res.status(err.statusCode).json(response);
  }
    // Erreur non gérée
  console.error('Erreur non gérée:', err);
  
  const response = {
    success: false,
    message: 'Erreur interne du serveur',
    code: ErrorCodes.SERVER_ERROR,
    statusCode: 500
  };
  
  if (process.env.NODE_ENV === 'development') {
    response.error = err.message;
    response.stack = err.stack;
  }
  
  res.status(500).json(response);
};

/**
 * Wrapper pour simplifier la gestion des promesses dans les routes asynchrones
 * @param {Function} fn - Fonction asynchrone à exécuter
 * @returns {Function} Middleware Express avec gestion d'erreur
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  ErrorCodes,
  ApiError,
  errorHandler,
  asyncHandler
};