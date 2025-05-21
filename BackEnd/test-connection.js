/**
 * Script pour tester la connexion à MongoDB
 * 
 * Usage: node test-connection.js
 */

require('dotenv').config();
const { getDbConnection, closeDbConnection } = require('./utils/dbConnection');

async function testConnection() {
  console.log('🔄 Test de connexion à MongoDB...');
  console.log('URI: ' + require('./config/database').MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@'));
  
  try {
    // Tenter d'établir la connexion
    const { client, db } = await getDbConnection();
    
    // Tester avec un ping
    await db.command({ ping: 1 });
    console.log('✅ Connexion réussie!');
    
    // Afficher les informations sur la base de données
    const databaseInfo = await db.admin().serverInfo();
    console.log('📊 Informations sur le serveur MongoDB:');
    console.log(`  - Version: ${databaseInfo.version}`);
    console.log(`  - Moteur de stockage: ${databaseInfo.storageEngines[0]}`);
    
    // Lister les collections disponibles
    const collections = await db.listCollections().toArray();
    console.log(`🗂️  Collections dans la base de données (${collections.length}):`);
    
    if (collections.length === 0) {
      console.log('  Aucune collection trouvée. Exécutez "npm run init-db" pour initialiser la base de données.');
    } else {
      collections.forEach((collection) => {
        console.log(`  - ${collection.name}`);
      });
    }
    
    // Fermer proprement la connexion
    await closeDbConnection();
  } catch (error) {
    console.error('❌ Erreur de connexion:', error.message);
    console.log('\n🔍 Vérifiez que:');
    console.log('  1. MongoDB est installé et en cours d\'exécution');
    console.log('  2. L\'URI de connexion dans le fichier .env est correcte');
    console.log('  3. Le pare-feu permet la connexion sur le port MongoDB (27017 par défaut)');
    process.exit(1);
  }
}

// Exécuter le test
testConnection();