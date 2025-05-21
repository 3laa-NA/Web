/**
 * Routes système
 * Points de terminaison pour vérifier l'état de l'application et la connectivité
 */

const express = require('express');
const router = express.Router();
const { getDbConnection } = require('../utils/dbConnection');

/**
 * GET /api/test
 * Point de terminaison simple pour vérifier le bon fonctionnement de l'API
 */
router.get('/test', async (req, res) => {
  try {
    // Vérifier la connexion à la base de données
    const { db, client } = await getDbConnection();
    
    // Utiliser une commande ping pour vérifier la connexion
    const pingResult = await db.command({ ping: 1 });
    const dbStatus = (pingResult && pingResult.ok === 1) ? 'connected' : 'disconnected';
    
    // Renvoyer les informations sur l'état du serveur
    res.json({
      success: true,
      message: 'API fonctionne correctement',
      timestamp: new Date(),
      serverInfo: {
        environment: process.env.NODE_ENV || 'development',
        version: process.env.npm_package_version || '1.0.0',
      },
      database: {
        status: dbStatus,
        name: process.env.DB_NAME || 'organiz_asso'
      },
      connected: true
    });
  } catch (error) {
    console.error('Test connection error:', error);
    res.status(500).json({
      success: false,
      message: 'Error while testing connection',
      error: process.env.NODE_ENV === 'production' ? 'Server error' : error.message,
      connected: false
    });
  }
});

/**
 * GET /api/status
 * Route pour l'état détaillé du serveur
 */
router.get('/status', async (req, res) => {
  try {
    // Vérifier l'état de la base de données
    const startTime = Date.now();
    const { db, client } = await getDbConnection();
    const dbConnectTime = Date.now() - startTime;
    
    // Obtenir des statistiques sur la base de données
    const dbStats = await db.stats();
    
    res.json({
      success: true,
      status: 'operational',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      database: {
        status: 'connected',
        responseTime: dbConnectTime,
        collections: dbStats.collections,
        documents: dbStats.objects
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      status: 'degraded',
      error: process.env.NODE_ENV === 'production' ? 'Server error' : error.message,
      database: {
        status: 'disconnected'
      }
    });
  }
});

module.exports = router;