/**
 * Configuration de la base de données
 * Centralise les noms de collections et les paramètres MongoDB
 */

// Récupérer les valeurs depuis les variables d'environnement ou utiliser des valeurs par défaut
const MONGODB_HOST = process.env.MONGODB_HOST || 'localhost';
const MONGODB_PORT = process.env.MONGODB_PORT || '27017';
const MONGODB_USERNAME = process.env.MONGODB_USERNAME || '';
const MONGODB_PASSWORD = process.env.MONGODB_PASSWORD || '';
const DB_NAME = process.env.DB_NAME || 'organiz_asso';

// Construire l'URI de connexion en fonction des identifiants disponibles
let MONGODB_URI;

if (MONGODB_USERNAME && MONGODB_PASSWORD) {
  // URI avec authentification
  MONGODB_URI = `mongodb://${MONGODB_USERNAME}:${encodeURIComponent(MONGODB_PASSWORD)}@${MONGODB_HOST}:${MONGODB_PORT}/${DB_NAME}`;
} else {
  // URI sans authentification
  MONGODB_URI = `mongodb://${MONGODB_HOST}:${MONGODB_PORT}/${DB_NAME}`;
}

// Noms des collections MongoDB
const COLLECTIONS = {
  USERS: 'users',
  MESSAGES: 'messages',
  PRIVATE_MESSAGES: 'private_messages',
  CONVERSATIONS: 'conversations',
  SETTINGS: 'settings',
  FORUMS: 'forums'
};

// Index à créer pour optimiser les requêtes
const INDEXES = {
  [COLLECTIONS.USERS]: [
    { key: { login: 1 }, options: { unique: true } },
    { key: { status: 1 }, options: {} },
    { key: { role: 1 }, options: {} }
  ],
  [COLLECTIONS.MESSAGES]: [
    { key: { userId: 1 }, options: {} },
    { key: { createdAt: -1 }, options: {} }
  ],
  [COLLECTIONS.CONVERSATIONS]: [
    { key: { participants: 1 }, options: {} },
    { key: { updatedAt: -1 }, options: {} }
  ],
  [COLLECTIONS.PRIVATE_MESSAGES]: [
    { key: { conversationId: 1 }, options: {} },
    { key: { timestamp: 1 }, options: {} }
  ],
  [COLLECTIONS.FORUMS]: [
    { key: { name: 1 }, options: { unique: true } },
    { key: { isPublic: 1 }, options: {} },
    { key: { createdAt: -1 }, options: {} }
  ]
};

// Options de connexion MongoDB
const CONNECTION_OPTIONS = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  connectTimeoutMS: 10000, // 10 secondes
  socketTimeoutMS: 45000, // 45 secondes
  maxPoolSize: 50, // Nombre maximal de connexions simultanées
  minPoolSize: 5 // Nombre minimal de connexions maintenues
};

module.exports = {
  MONGODB_URI,
  DB_NAME,
  COLLECTIONS,
  INDEXES,
  CONNECTION_OPTIONS
};
