/**
 * Configuration de l'application Express
 * Fichier principal pour la configuration du serveur backend,
 * incluant les middlewares et les routes
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

// Importation de nos utilitaires et middlewares personnalisés
const { logger, requestLogger } = require('./utils/logger');
const { errorHandler } = require('./utils/errorHandling');
const validateEnv = require('./config/env');
const { connectToDatabase } = require('./utils/dbConnection');
const apiRoutes = require('./routes/api');
const forumRoutes = require('./routes/forumRoutes');

// Validation des variables d'environnement
const config = validateEnv();

// Initialisation de l'application Express
const app = express();

// Configuration des middlewares de sécurité et de base
app.use(helmet()); // Protection contre diverses vulnérabilités web
app.use(requestLogger); // Notre logger personnalisé
app.use(express.json({ limit: '1mb' }));  // Analyse du corps JSON des requêtes avec limite
app.use(express.urlencoded({ extended: true, limit: '1mb' })); // Analyse des corps urlencoded avec limite

// Configuration du middleware pour servir les fichiers statiques
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Configuration CORS plus flexible
app.use(cors({
  origin: function(origin, callback) {
    // Permettre les requêtes sans origine (comme les appels d'API mobile)
    if (!origin) return callback(null, true);
    
    // Vérifier si l'origine est autorisée
    if (config.CORS_ALLOWED_ORIGINS.indexOf(origin) === -1) {
      const msg = `L'origine ${origin} n'est pas autorisée par la politique CORS`;
      return callback(new Error(msg), false);
    }
    
    return callback(null, true);
  },
  credentials: true
}));

// Connexion à la base de données
(async () => {
  try {
    await connectToDatabase();
    logger.info('Connected to MongoDB');
  } catch (error) {
    logger.error('Failed to connect to database:', error);
    process.exit(1);
  }
})();

// Montage des routes API
app.use('/api', apiRoutes);
app.use('/api/forums', forumRoutes);

// Route racine pour vérifier l'état du serveur
app.get('/', (req, res) => {
  res.send('Serveur backend Organiz\'Asso opérationnel');
});

// Gestion des routes non trouvées (404)
app.use((req, res) => {
  res.status(404).json({ 
    success: false,
    message: 'Route non trouvée',
    path: req.originalUrl
  });
});

// Middleware de gestion globale des erreurs
app.use(errorHandler);

// Exportation de l'app pour le serveur et les tests
module.exports = app;
