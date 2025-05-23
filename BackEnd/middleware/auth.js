/**
 * Middleware d'authentification
 * Vérifie et valide les tokens JWT pour protéger les routes
 */

const { verifyToken, extractTokenFromHeader } = require('../utils/jwtUtils');
const { getCollection } = require('../utils/dbConnection');
const { ObjectId } = require('mongodb');
const { logger } = require('../utils/logger');

/**
 * Middleware pour authentifier les requêtes avec JWT
 * Vérifie le token d'accès dans le header Authorization
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Fonction Express next
 */
const authenticate = async (req, res, next) => {
  try {
    // Extraire le token du header
    const token = extractTokenFromHeader(req);
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise',
        code: 'AUTH_REQUIRED'
      });
    }
    
    // Vérifier et décoder le token
    const decoded = verifyToken(token);
    
    if (!decoded || !decoded.userId) {
      return res.status(401).json({
        success: false,
        message: 'Token invalide',
        code: 'INVALID_TOKEN'
      });
    }
    
    // Récupérer les informations utilisateur depuis la base de données
    try {
      const usersCollection = await getCollection('users');
      const user = await usersCollection.findOne({ _id: new ObjectId(decoded.userId) });
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Utilisateur non trouvé',
          code: 'USER_NOT_FOUND'
        });
      }
      
      if (user.status !== 'active') {
        return res.status(403).json({
          success: false,
          message: 'Compte utilisateur inactif',
          code: 'INACTIVE_ACCOUNT'
        });
      }
        // Stocker les informations utilisateur dans la requête
      req.user = user;
      // Ajouter l'ID sous format string pour être cohérent
      req.user.id = user._id.toString();
      req.token = token;
      req.tokenPayload = decoded;
      
      next();
    } catch (dbError) {
      logger.error('Erreur lors de la récupération des données utilisateur:', { error: dbError.message });
      return res.status(500).json({
        success: false,
        message: 'Erreur serveur lors de l\'authentification',
        code: 'AUTH_SERVER_ERROR'
      });
    }
  } catch (error) {
    logger.warn('Échec d\'authentification:', { error: error.message });
    return res.status(401).json({
      success: false,
      message: 'Échec d\'authentification: ' + error.message,
      code: 'AUTH_FAILED'
    });
  }
};

/**
 * Middleware pour vérifier si l'utilisateur est administrateur
 * Doit être utilisé après le middleware authenticate
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Fonction Express next
 */
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentification requise',
      code: 'AUTH_REQUIRED'
    });
  }
  
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Accès non autorisé. Droits administrateur requis.',
      code: 'ADMIN_REQUIRED'
    });
  }
  
  next();
};

/**
 * Middleware pour autorisation basée sur les rôles
 * @param {Array} allowedRoles - Liste des rôles autorisés
 * @returns {Function} Middleware Express
 */
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise',
        code: 'AUTH_REQUIRED'
      });
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé. Rôle requis: ' + allowedRoles.join(', '),
        code: 'ROLE_REQUIRED'
      });
    }
    
    next();
  };
};

/**
 * Middleware facultatif pour obtenir des informations utilisateur si disponibles
 * Ne rejette pas la requête si l'authentification échoue
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Fonction Express next
 */
const optionalAuth = async (req, res, next) => {
  try {
    const token = extractTokenFromHeader(req);
    
    if (!token) {
      return next();
    }
    
    try {
      const decoded = verifyToken(token);
      
      if (decoded && decoded.userId) {
        const usersCollection = await getCollection('users');
        const user = await usersCollection.findOne({ _id: new ObjectId(decoded.userId) });
        
        if (user && user.status === 'active') {
          req.user = user;
          req.token = token;
          req.tokenPayload = decoded;
        }
      }
    } catch (tokenError) {
      // Ignore les erreurs de token dans l'auth optionnelle
      logger.debug('Token invalide en auth optionnelle:', { error: tokenError.message });
    }
    
    next();
  } catch (error) {
    next();
  }
};

// Added requireAuth as an alias for authenticate for backward compatibility
const requireAuth = authenticate;

module.exports = {
  authenticate,
  requireAuth, // Added for backward compatibility
  requireAdmin,
  requireRole,
  optionalAuth
};