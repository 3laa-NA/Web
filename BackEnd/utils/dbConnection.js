/**
 * Utilitaire de connexion à la base de données MongoDB
 * Ce module gère la connexion MongoDB et la réutilise entre les requêtes
 */

const { MongoClient } = require('mongodb');
const { MONGODB_URI, DB_NAME, CONNECTION_OPTIONS, COLLECTIONS, INDEXES } = require('../config/database');
const { logger } = require('./logger');

// Instance client MongoDB partagée
let client;
let dbInstance;

/**
 * Établit une connexion à la base de données MongoDB
 * Réutilise la connexion existante si disponible
 * @returns {Promise<Object>} Objet contenant le client et la base de données
 */
exports.getDbConnection = async () => {
  if (client && dbInstance) {
    try {
      // Vérifier si la connexion est toujours active avec un ping
      await client.db("admin").command({ ping: 1 });
      return { client, db: dbInstance };
    } catch (error) {
      logger.warn('La connexion MongoDB existante n\'est plus valide, tentative de reconnexion...', { error: error.message });
      // La connexion est morte, on va la recréer ci-dessous
      client = null;
      dbInstance = null;
    }
  }
  
  try {
    logger.info('Tentative de connexion à MongoDB...');
    client = new MongoClient(MONGODB_URI, CONNECTION_OPTIONS);
    await client.connect();
    dbInstance = client.db(DB_NAME);
    
    logger.info(`Connexion à MongoDB établie avec succès (base de données: ${DB_NAME})`);
    
    // Créer les index nécessaires s'ils n'existent pas déjà
    await createIndexes();
    
    return { client, db: dbInstance };
  } catch (error) {
    logger.error('Erreur de connexion à MongoDB:', { error: error.message, stack: error.stack });
    throw new Error(`Impossible de se connecter à MongoDB: ${error.message}`);
  }
};

/**
 * Retourne le client MongoDB pour les opérations qui nécessitent l'objet client directement
 * Utile pour la configuration de connect-mongo et autres outils
 * @returns {Promise<MongoClient>} Instance client MongoDB connectée
 */
exports.connectToDatabase = async () => {
  try {
    const { client } = await exports.getDbConnection();
    return client;
  } catch (error) {
    logger.error('Erreur lors de l\'obtention du client MongoDB:', { error: error.message });
    throw error;
  }
};

/**
 * Ferme proprement la connexion à MongoDB
 */
exports.closeDbConnection = async () => {
  if (client) {
    try {
      await client.close();
      client = null;
      dbInstance = null;
      logger.info('Connexion à MongoDB fermée proprement');
    } catch (error) {
      logger.error('Erreur lors de la fermeture de la connexion MongoDB:', { error: error.message });
      throw error;
    }
  }
};

/**
 * Récupère une collection MongoDB avec gestion des erreurs
 * @param {string} collectionName - Nom de la collection à récupérer
 * @returns {Promise<Collection>} Instance de la collection MongoDB
 */
exports.getCollection = async (collectionName) => {
  try {
    const { db } = await exports.getDbConnection();
    return db.collection(collectionName);
  } catch (error) {
    logger.error(`Erreur lors de l'accès à la collection ${collectionName}:`, { error: error.message });
    throw error;
  }
};

/**
 * Crée les index définis dans la configuration de la base de données
 */
async function createIndexes() {
  try {
    const { db } = await exports.getDbConnection();
    
    // Pour chaque collection avec des index définis
    for (const [collectionName, collectionIndexes] of Object.entries(INDEXES)) {
      if (collectionIndexes && collectionIndexes.length > 0) {
        const collection = db.collection(collectionName);
        
        // Créer chaque index
        for (const indexDef of collectionIndexes) {
          try {
            await collection.createIndex(indexDef.key, indexDef.options);
            logger.debug(`Index créé pour ${collectionName}:`, indexDef.key);
          } catch (indexError) {
            logger.warn(`Erreur lors de la création de l'index pour ${collectionName}:`, 
              { key: indexDef.key, error: indexError.message });
          }
        }
      }
    }
    
    logger.info('Indexes MongoDB vérifiés');
  } catch (error) {
    logger.error('Erreur lors de la création des indexes:', { error: error.message });
  }
}

// Écouteur pour fermer proprement la connexion à la fin du processus
process.on('SIGINT', async () => {
  logger.info('Signal d\'arrêt reçu, fermeture de la connexion MongoDB...');
  await exports.closeDbConnection();
  process.exit(0);
});

// Exporter les collections pour faciliter l'accès
exports.COLLECTIONS = COLLECTIONS;
