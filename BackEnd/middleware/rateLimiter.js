/**
 * Middleware de limitation de débit (rate limiting)
 * Protège l'API contre les abus et les attaques de force brute
 */

const rateLimit = require('express-rate-limit');
const { logger } = require('../utils/logger');
const validateEnv = require('../config/env');

// Récupérer la configuration
const config = validateEnv();

// Configuration globale pour toutes les routes API
const apiLimiter = rateLimit({
  windowMs: config.RATE_LIMIT.WINDOW_MS,
  max: config.RATE_LIMIT.MAX_REQUESTS,
  standardHeaders: true, // Retourne les headers 'RateLimit-*'
  legacyHeaders: false, // Désactive les headers 'X-RateLimit-*'
  handler: (req, res, next, options) => {
    logger.warn(`Rate limit exceeded: ${req.ip}`, {
      path: req.path,
      method: req.method,
      ip: req.ip,
      userId: req.user?.id || 'anonymous'
    });
    
    res.status(options.statusCode).json({
      success: false,
      message: 'Trop de requêtes, veuillez réessayer plus tard',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: Math.ceil(options.windowMs / 1000 / 60) // En minutes
    });
  }
});

// Configuration plus stricte pour les routes d'authentification
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 tentatives max par période
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    logger.warn(`Authentication rate limit exceeded: ${req.ip}`, {
      path: req.path,
      method: req.method,
      ip: req.ip
    });
    
    res.status(options.statusCode).json({
      success: false,
      message: 'Trop de tentatives de connexion, veuillez réessayer plus tard',
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
      retryAfter: 15 // En minutes
    });
  }
});

// Configuration pour les requêtes sensibles comme la réinitialisation de mot de passe
const sensitiveActionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 3, // 3 tentatives max par période
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    logger.warn(`Sensitive action rate limit exceeded: ${req.ip}`, {
      path: req.path,
      method: req.method,
      ip: req.ip,
      userId: req.user?.id || 'anonymous'
    });
    
    res.status(options.statusCode).json({
      success: false,
      message: 'Trop de requêtes pour cette action sensible, veuillez réessayer plus tard',
      code: 'SENSITIVE_ACTION_RATE_LIMIT_EXCEEDED',
      retryAfter: 60 // En minutes
    });
  }
});

module.exports = {
  apiLimiter,
  authLimiter,
  sensitiveActionLimiter
};