/**
 * Validation des variables d'environnement
 * Ce module vérifie la présence et la validité des variables d'environnement requises
 */

/**
 * Vérifie si une variable d'environnement est définie
 * @param {string} key - Nom de la variable d'environnement
 * @param {*} defaultValue - Valeur par défaut à utiliser si non définie
 * @returns {string} Valeur de la variable d'environnement ou valeur par défaut
 * @throws {Error} Si la variable est requise mais non définie
 */
const getEnvVariable = (key, defaultValue = undefined) => {
  if (process.env[key] === undefined) {
    if (defaultValue === undefined) {
      throw new Error(`La variable d'environnement ${key} est requise mais n'est pas définie`);
    }
    return defaultValue;
  }
  return process.env[key];
};

/**
 * Valide les variables d'environnement et retourne la configuration
 * @returns {Object} Configuration validée
 */
const validateEnv = () => {
  try {
    // Port pour le serveur HTTP
    const PORT = parseInt(getEnvVariable('PORT', '8000'));
    
    // Environnement (development, production, test)
    const NODE_ENV = getEnvVariable('NODE_ENV', 'development');
    
    // Secret pour les sessions et JWT
    const SESSION_SECRET = getEnvVariable('SESSION_SECRET', NODE_ENV === 'development' ? 'dev_secret_key' : undefined);
    const JWT_SECRET = getEnvVariable('JWT_SECRET', NODE_ENV === 'development' ? 'dev_jwt_secret' : undefined);
    
    // Configuration MongoDB
    const MONGODB = {
      HOST: getEnvVariable('MONGODB_HOST', 'localhost'),
      PORT: getEnvVariable('MONGODB_PORT', '27017'),
      USERNAME: getEnvVariable('MONGODB_USERNAME', ''),
      PASSWORD: getEnvVariable('MONGODB_PASSWORD', ''),
      DB_NAME: getEnvVariable('DB_NAME', 'organiz_asso')
    };

    // Configuration CORS
    const CORS_ALLOWED_ORIGINS = getEnvVariable('CORS_ALLOWED_ORIGINS', 'http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173').split(',');
    
    // Configuration du rate limiting
    const RATE_LIMIT = {
      WINDOW_MS: parseInt(getEnvVariable('RATE_LIMIT_WINDOW_MS', '60000')), // 1 minute par défaut
      MAX_REQUESTS: parseInt(getEnvVariable('RATE_LIMIT_MAX_REQUESTS', '100')) // 100 requêtes par minute
    };
    
    // Configuration des sessions
    const SESSION = {
      DURATION: parseInt(getEnvVariable('SESSION_DURATION', '86400000')) // 24 heures par défaut
    };
    
    // Configuration des téléchargements
    const UPLOAD = {
      MAX_SIZE: parseInt(getEnvVariable('UPLOAD_MAX_SIZE', '5000000')), // 5MB par défaut
      ALLOWED_TYPES: getEnvVariable('UPLOAD_ALLOWED_TYPES', 'image/jpeg,image/png,image/gif').split(',')
    };

    return {
      PORT,
      NODE_ENV,
      SESSION_SECRET,
      JWT_SECRET,
      MONGODB,
      CORS_ALLOWED_ORIGINS,
      RATE_LIMIT,
      SESSION,
      UPLOAD,
      IS_DEVELOPMENT: NODE_ENV === 'development',
      IS_PRODUCTION: NODE_ENV === 'production',
      IS_TEST: NODE_ENV === 'test'
    };
  } catch (error) {
    console.error('Erreur de configuration:', error.message);
    process.exit(1);
  }
};

module.exports = validateEnv;