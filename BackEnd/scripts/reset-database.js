/**
 * Script unique pour réinitialiser la base de données MongoDB :
 * - suppression des anciennes collections
 * - création des collections et des index
 * - création des comptes admin et développeur
 * - peuplement de quelques utilisateurs et données d'exemple
 *
 * Usage: node scripts/reset-database.js
 */
require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');
const { MONGODB_URI, DB_NAME, COLLECTIONS, INDEXES } = require('../config/database');
const { hashPassword } = require('../utils/securityUtils');

(async () => {
  const client = new MongoClient(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  try {
    await client.connect();
    const db = client.db(DB_NAME);
    console.log('Réinitialisation de la base ' + DB_NAME);

    // 1) Suppression complète de la base
    await db.dropDatabase();
    console.log('Base de données supprimée');

    // 2) Création des collections et des index
    for (const [name, colName] of Object.entries(COLLECTIONS)) {
      await db.createCollection(colName);
      console.log(`+ Collection ${colName} créée`);
      const indexes = INDEXES[colName] || [];
      for (const idx of indexes) {
        await db.collection(colName).createIndex(idx.key, idx.options);
        console.log(`  • Index créé sur ${colName} : ${JSON.stringify(idx.key)}`);
      }
    }

    // 3) Création du compte admin
    const usersCol = db.collection(COLLECTIONS.USERS);
    const adminPass = process.env.ADMIN_DEFAULT_PASSWORD || 'admin123';
    const adminHash = await hashPassword(adminPass);
    await usersCol.insertOne({
      _id: new ObjectId(),
      login: 'admin',
      passwordHash: adminHash,
      firstName: 'Admin',
      lastName: 'System',
      role: 'admin',
      status: 'active',
      createdAt: new Date(),
      lastLogin: null
    });
    console.log('Compte admin créé : admin / ' + adminPass);

    // 4) Création du compte développeur
    const devHash = await hashPassword('lmao');
    await usersCol.insertOne({
      _id: new ObjectId(),
      login: 'lmao',
      passwordHash: devHash,
      firstName: 'Dev',
      lastName: 'Account',
      role: 'admin',
      status: 'active',
      createdAt: new Date(),
      lastLogin: null
    });
    console.log('Compte dev créé : lmao / lmao');

    // 5) Peuplement de quelques utilisateurs de test
    const sample = [
      { login: 'alice.wonder', firstName: 'Alice', lastName: 'Wonder' },
      { login: 'bob.builder', firstName: 'Bob', lastName: 'Builder' },
      { login: 'charlie.brown', firstName: 'Charlie', lastName: 'Brown' }
    ];
    for (const u of sample) {
      const pwHash = await hashPassword(u.login);
      await usersCol.insertOne({
        _id: new ObjectId(),
        login: u.login,
        passwordHash: pwHash,
        firstName: u.firstName,
        lastName: u.lastName,
        role: 'user',
        status: 'active',
        createdAt: new Date(),
        lastLogin: null
      });
      console.log(`• Utilisateur ajouté : ${u.login} / ${u.login}`);
    }

    // 6) Jeu de messages publics réalistes
    const messagesCol = db.collection(COLLECTIONS.MESSAGES);
    const users = await usersCol.find({ status: 'active', role: 'user' }).toArray();
    const sampleTexts = [
      'Bonjour à tous ! Hâte de collaborer sur ce nouveau projet.',
      'Je viens de mettre à jour le document de projet, vos retours sont les bienvenus.',
      'Quelqu’un a des informations concernant la prochaine réunion ?',
      'La réunion est prévue pour vendredi à 14h, pensez à préparer vos questions.',
      'Merci pour le retour rapide sur le ticket #42.',
      'Super initiative ! Continuons sur cette lancée.',
      'Je rencontre une erreur sur le formulaire d’inscription, quelqu’un peut m’aider ?',
      'Félicitations à l’équipe pour le succès de l’événement hier !'
    ];
    const messagesToInsert = sampleTexts.map((text, i) => {
      const user = users[i % users.length];
      const ts = new Date(Date.now() - i * 3600 * 1000);
      return {
        _id: new ObjectId(),
        userId: user._id,
        user: `${user.firstName} ${user.lastName}`,
        login: user.login,
        avatar: (user.firstName.charAt(0) + user.lastName.charAt(0)).toUpperCase(),
        text,
        createdAt: ts,
        timestamp: ts,
        likes: [],
        parentId: null
      };
    });
    await messagesCol.insertMany(messagesToInsert);
    console.log(messagesToInsert.length + ' messages publics insérés');

    // 7) Jeux de conversations privées variées
    const convCol = db.collection(COLLECTIONS.CONVERSATIONS);
    const pmCol = db.collection(COLLECTIONS.PRIVATE_MESSAGES);
    // Récupérer tous les utilisateurs actifs
    const allUsers = await usersCol.find({ status: 'active' }).toArray();
    const devUser = allUsers.find(u => u.login === 'lmao');
    const adminUser = allUsers.find(u => u.login === 'admin');
    const regularUsers = allUsers.filter(u => u.login !== 'lmao' && u.login !== 'admin');
    // Modèles de conversations
    const convTemplates = [
      {
        participants: [devUser._id, regularUsers[0]._id],
        messages: [
          { senderId: devUser._id, text: 'Salut, comment se passe la mise en place du composant ?', timestamp: new Date(Date.now() - 15 * 60 * 1000) },
          { senderId: regularUsers[0]._id, text: 'Ça avance bien, j’ai juste un petit bug sur le style CSS.', timestamp: new Date(Date.now() - 12 * 60 * 1000) },
          { senderId: devUser._id, text: 'Envoie-moi ton code, je regarde ça tout de suite.', timestamp: new Date(Date.now() - 10 * 60 * 1000) }
        ]
      },
      {
        participants: [adminUser._id, regularUsers[1]._id],
        messages: [
          { senderId: regularUsers[1]._id, text: 'Bonjour, j’ai besoin d’un accès admin pour tester la nouvelle fonctionnalité.', timestamp: new Date(Date.now() - 20 * 60 * 1000) },
          { senderId: adminUser._id, text: 'Je viens de t’ajouter au groupe admin, tu devrais recevoir un email.', timestamp: new Date(Date.now() - 18 * 60 * 1000) },
          { senderId: regularUsers[1]._id, text: 'Parfait, merci beaucoup !', timestamp: new Date(Date.now() - 16 * 60 * 1000) }
        ]
      },
      {
        participants: [devUser._id, adminUser._id],
        messages: [
          { senderId: adminUser._id, text: 'Peux-tu faire un point sur la roadmap cette après-midi ?', timestamp: new Date(Date.now() - 30 * 60 * 1000) },
          { senderId: devUser._id, text: 'Absolument, je prépare un récapitulatif et je te l’envoie.', timestamp: new Date(Date.now() - 28 * 60 * 1000) }
        ]
      }
    ];
    // Création des conversations et insertion des messages
    for (const tpl of convTemplates) {
      const now = new Date();
      const convRes = await convCol.insertOne({
        participants: tpl.participants,
        createdAt: tpl.messages[0].timestamp,
        updatedAt: now,
        lastMessage: {
          text: tpl.messages[tpl.messages.length - 1].text,
          senderId: tpl.messages[tpl.messages.length - 1].senderId,
          timestamp: tpl.messages[tpl.messages.length - 1].timestamp
        },
        unreadBy: tpl.participants.slice(1)
      });
      const convId = convRes.insertedId.toString();
      for (const msg of tpl.messages) {
        const recipientId = tpl.participants.find(id => !id.equals(msg.senderId)).toString();
        await pmCol.insertOne({
          conversationId: convId,
          senderId: msg.senderId.toString(),
          recipientId,
          text: msg.text,
          timestamp: msg.timestamp,
          read: false
        });
      }
      console.log('Conversation entre ' + tpl.participants.map(id => allUsers.find(u=>u._id.equals(id)).login).join(' et ') + ' créée');
    }

    console.log('Réinitialisation terminée');
  } catch (err) {
    console.error('Erreur de réinitialisation :', err);
  } finally {
    await client.close();
  }
})();
