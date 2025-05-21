/**
 * Utilitaires JWT
 * Gestion des tokens d'authentification JWT
 */

const jwt = require('jsonwebtoken');
const { logger } = require('./logger');
const validateEnv = require('../config/env');

// Récupérer la configuration
const config = validateEnv();

// Durée de validité des tokens
const ACCESS_TOKEN_EXPIRY = '15m'; // 15 minutes
const REFRESH_TOKEN_EXPIRY = '7d'; // 7 jours

/**
 * Génère un token d'accès JWT
 * @param {Object} userData - Données utilisateur à inclure dans le token
 * @returns {string} Token JWT
 */
const generateAccessToken = (userData) => {
  try {
    return jwt.sign(
      userData,
      config.JWT_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRY }
    );
  } catch (error) {
    logger.error('Erreur lors de la génération du token d\'accès:', { error: error.message });
    throw new Error('Impossible de générer le token d\'accès');
  }
};

/**
 * Génère un token de rafraîchissement JWT
 * @param {Object} userData - Données utilisateur à inclure dans le token
 * @returns {string} Token JWT de rafraîchissement
 */
const generateRefreshToken = (userData) => {
  try {
    return jwt.sign(
      userData,
      config.JWT_SECRET + '_refresh', // Sel différent pour les refresh tokens
      { expiresIn: REFRESH_TOKEN_EXPIRY }
    );
  } catch (error) {
    logger.error('Erreur lors de la génération du token de rafraîchissement:', { error: error.message });
    throw new Error('Impossible de générer le token de rafraîchissement');
  }
};

/**
 * Vérifie et décode un token JWT
 * @param {string} token - Token JWT à vérifier
 * @param {boolean} isRefreshToken - Indique s'il s'agit d'un token de rafraîchissement
 * @returns {Object} Payload décodé du token
 */
const verifyToken = (token, isRefreshToken = false) => {
  try {
    const secret = isRefreshToken ? config.JWT_SECRET + '_refresh' : config.JWT_SECRET;
    return jwt.verify(token, secret);
  } catch (error) {
    logger.warn('Erreur lors de la vérification du token:', { error: error.message });
    throw new Error(`Token invalide: ${error.message}`);
  }
};

/**
 * Extrait le token de l'en-tête Authorization
 * @param {Object} req - Objet requête Express
 * @returns {string|null} Token extrait ou null
 */
const extractTokenFromHeader = (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.split(' ')[1];
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  extractTokenFromHeader,
  ACCESS_TOKEN_EXPIRY,
  REFRESH_TOKEN_EXPIRY
};