/**
 * Système de logging avancé pour l'application
 * Utilise Winston pour gérer différents niveaux de logs et formats
 */

const winston = require('winston');
const path = require('path');
const fs = require('fs');

// S'assurer que le répertoire de logs existe
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Format personnalisé pour les logs
const customFormat = winston.format.printf(({ level, message, timestamp, ...meta }) => {
  return `${timestamp} [${level.toUpperCase()}]: ${message} ${Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''}`;
});

// Créer le logger Winston
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    customFormat
  ),
  defaultMeta: { service: 'api' },
  transports: [
    // Écrire dans les fichiers de log
    new winston.transports.File({ 
      filename: path.join(logsDir, 'error.log'), 
      level: 'error',
      maxsize: 10485760, // 10MB
      maxFiles: 5
    }),
    new winston.transports.File({ 
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 10485760, // 10MB
      maxFiles: 5
    })
  ],
  exceptionHandlers: [
    new winston.transports.File({ 
      filename: path.join(logsDir, 'exceptions.log'),
      maxsize: 10485760, // 10MB
      maxFiles: 5
    })
  ],
  rejectionHandlers: [
    new winston.transports.File({ 
      filename: path.join(logsDir, 'rejections.log'),
      maxsize: 10485760, // 10MB
      maxFiles: 5
    })
  ]
});

// Ajouter la sortie console en développement
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

// Créer un middleware Express pour logger les requêtes
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Poursuivre le traitement de la requête
  next();
  
  // Une fois la réponse envoyée
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logLevel = res.statusCode >= 400 ? 'warn' : 'info';
    const userId = req.user ? req.user._id : 'anonymous';
    
    logger.log(logLevel, `${req.method} ${req.url} ${res.statusCode} - ${duration}ms`, {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration,
      userId,
      ip: req.ip
    });
  });
};

module.exports = {
  logger,
  requestLogger
};