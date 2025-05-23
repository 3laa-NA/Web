/**
 * Script complet pour réinitialiser la base de données MongoDB avec des données réalistes :
 * - suppression des anciennes collections
 * - création des collections et des index
 * - création des comptes admin et développeur
 * - peuplement d'utilisateurs variés dans tous les états (active, inactive, pending)
 * - création de forums avec messages et réponses réalistes
 * - génération de conversations privées riches et contextuelles
 * - données adaptées au contexte d'une association
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
    const adminId = new ObjectId();
    await usersCol.insertOne({
      _id: adminId,
      login: 'admin',
      passwordHash: adminHash,
      firstName: 'Admin',
      lastName: 'System',
      role: 'admin',
      status: 'active',
      email: 'admin@system.com',
      bio: 'Administrateur système',
      createdAt: new Date(),
      lastLogin: null
    });
    console.log('Compte admin créé : admin / ' + adminPass);

    // 4) Création du compte développeur
    const devHash = await hashPassword('lmao');
    const devId = new ObjectId();
    await usersCol.insertOne({
      _id: devId,
      login: 'lmao',
      passwordHash: devHash,
      firstName: 'Dev',
      lastName: 'Account',
      role: 'admin',
      status: 'active',
      email: 'dev@example.com',
      bio: 'Compte développeur',
      createdAt: new Date(),
      lastLogin: null
    });
    console.log('Compte dev créé : lmao / lmao');

    // 5) Création des forums par défaut
    const forumsCol = db.collection(COLLECTIONS.FORUMS);
    const publicForumId = new ObjectId();
    const privateForumId = new ObjectId();
    
    await forumsCol.insertMany([
      {
        _id: publicForumId,
        name: 'Forum Public',
        description: 'Forum accessible à tous les utilisateurs',
        isPublic: true,
        createdAt: new Date(),
        createdBy: adminId
      },
      {
        _id: privateForumId,
        name: 'Forum Admin',
        description: 'Forum réservé aux administrateurs',
        isPublic: false,
        createdAt: new Date(),
        createdBy: adminId
      }
    ]);
    console.log('Forums par défaut créés');    // 6) Peuplement d'utilisateurs variés et réalistes pour une association
    const associationMembers = [
      // Membres actifs - Bureau de l'association
      { login: 'marie.president', firstName: 'Marie', lastName: 'Dubois', email: 'marie.dubois@asso.org', bio: 'Présidente de l\'association depuis 2023. Passionnée par les projets communautaires.', role: 'user', status: 'active' },
      { login: 'pierre.tresorier', firstName: 'Pierre', lastName: 'Martin', email: 'pierre.martin@asso.org', bio: 'Trésorier et responsable des finances. Expert-comptable de formation.', role: 'user', status: 'active' },
      { login: 'sophie.secretaire', firstName: 'Sophie', lastName: 'Bernard', email: 'sophie.bernard@asso.org', bio: 'Secrétaire générale. Coordonne les événements et la communication.', role: 'user', status: 'active' },
      
      // Membres actifs - Bénévoles réguliers
      { login: 'julien.event', firstName: 'Julien', lastName: 'Rousseau', email: 'julien.rousseau@email.com', bio: 'Responsable événementiel. Organise nos sorties et activités de groupe.', role: 'user', status: 'active' },
      { login: 'claire.comm', firstName: 'Claire', lastName: 'Petit', email: 'claire.petit@email.com', bio: 'Chargée de communication. Gère nos réseaux sociaux et newsletters.', role: 'user', status: 'active' },
      { login: 'antoine.tech', firstName: 'Antoine', lastName: 'Garcia', email: 'antoine.garcia@email.com', bio: 'Responsable technique. Développeur web et soutien informatique.', role: 'user', status: 'active' },
      { login: 'emma.benevole', firstName: 'Emma', lastName: 'Leroy', email: 'emma.leroy@email.com', bio: 'Bénévole active depuis 1 an. Participe à tous les projets !', role: 'user', status: 'active' },
      { login: 'lucas.sport', firstName: 'Lucas', lastName: 'Moreau', email: 'lucas.moreau@email.com', bio: 'Animateur sportif. Organise les tournois et activités physiques.', role: 'user', status: 'active' },
      { login: 'camille.culture', firstName: 'Camille', lastName: 'Simon', email: 'camille.simon@email.com', bio: 'Responsable culturelle. Passionnée d\'art et d\'histoire locale.', role: 'user', status: 'active' },
      { login: 'thomas.jeunes', firstName: 'Thomas', lastName: 'Laurent', email: 'thomas.laurent@email.com', bio: 'Animateur jeunesse. Coordonne les activités pour les 16-25 ans.', role: 'user', status: 'active' },
      
      // Nouveaux membres en attente d'approbation
      { login: 'lisa.nouvelle', firstName: 'Lisa', lastName: 'Roux', email: 'lisa.roux@email.com', bio: 'Nouvelle arrivante en ville. Souhaite s\'impliquer dans la vie associative.', role: 'user', status: 'pending' },
      { login: 'hugo.etudiant', firstName: 'Hugo', lastName: 'Durand', email: 'hugo.durand@student.edu', bio: 'Étudiant en sociologie. Recherche une association pour mon engagement citoyen.', role: 'user', status: 'pending' },
      { login: 'nadia.retraite', firstName: 'Nadia', lastName: 'Blanc', email: 'nadia.blanc@email.com', bio: 'Récemment retraitée. Souhaite donner de mon temps pour aider la communauté.', role: 'user', status: 'pending' },
      { login: 'kevin.motivation', firstName: 'Kevin', lastName: 'Fabre', email: 'kevin.fabre@email.com', bio: 'Très motivé pour rejoindre l\'équipe ! Expérience en organisation d\'événements.', role: 'user', status: 'pending' },
      
      // Anciens membres inactifs
      { login: 'michel.ancien', firstName: 'Michel', lastName: 'Girard', email: 'michel.girard@email.com', bio: 'Ancien président (2019-2022). Moins disponible actuellement.', role: 'user', status: 'inactive' },
      { login: 'sylvie.pause', firstName: 'Sylvie', lastName: 'Mercier', email: 'sylvie.mercier@email.com', bio: 'En pause temporaire pour raisons personnelles.', role: 'user', status: 'inactive' },
      { login: 'paul.demenage', firstName: 'Paul', lastName: 'Legrand', email: 'paul.legrand@email.com', bio: 'A déménagé dans une autre région. Compte revenir un jour !', role: 'user', status: 'inactive' },
    ];
      const userIds = {};
    for (const member of associationMembers) {
      const pwHash = await hashPassword(member.login);
      const userId = new ObjectId();
      userIds[member.login] = userId; // Stocker en ObjectId pour les messages
      
      await usersCol.insertOne({
        _id: userId,
        login: member.login,
        passwordHash: pwHash,
        firstName: member.firstName,
        lastName: member.lastName,
        email: member.email,
        bio: member.bio,
        role: member.role,
        status: member.status,
        createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000), // Dates d'inscription variées sur l'année
        lastLogin: member.status === 'active' ? new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) : null
      });
      console.log(`• ${member.status.toUpperCase()} - ${member.firstName} ${member.lastName} (${member.login})`);
    }
    
    // Stocker aussi les IDs admin et dev
    userIds['admin'] = adminId;
    userIds['lmao'] = devId;

    // 7) Configuration des paramètres système
    const settingsCol = db.collection(COLLECTIONS.SETTINGS);
    await settingsCol.insertOne({
      key: 'system',
      registrationRequiresApproval: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    console.log('• Paramètres système initialisés avec approbation requise pour l\'inscription');
      // 8) Messages réalistes pour l'association avec réponses et interactions
    const messagesCol = db.collection(COLLECTIONS.MESSAGES);
    
    // Messages pour le forum public - Vie de l'association
    const publicForumMessages = [
      {
        userId: userIds['marie.president'],
        text: "Bonjour à tous ! J'espère que vous allez bien. Je tenais à vous informer que notre assemblée générale annuelle aura lieu le samedi 15 juin à 14h dans la salle des fêtes. Nous ferons le bilan de l'année et présenterons les projets pour 2024. Votre présence est importante !",
        timestamp: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        replies: [
          {
            userId: userIds['pierre.tresorier'],
            text: "Merci Marie ! Je prépare le bilan financier. Très positif cette année grâce à vos efforts à tous 💪",
            timestamp: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000)
          },
          {
            userId: userIds['sophie.secretaire'],
            text: "Je confirme ma présence. J'ai déjà préparé le rapport d'activités. Hâte de voir tout le monde !",
            timestamp: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000)
          }
        ]
      },
      {
        userId: userIds['julien.event'],
        text: "🎉 Le festival d'été approche ! Nous cherchons encore des bénévoles pour l'organisation. Si vous avez quelques heures à nous consacrer les 20-21 juillet, n'hésitez pas à me contacter. Ambiance garantie !",
        timestamp: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
        replies: [
          {
            userId: userIds['emma.benevole'],
            text: "Je suis partante ! Comme d'habitude 😊 Sur quels créneaux as-tu le plus besoin d'aide ?",
            timestamp: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000 + 1 * 60 * 60 * 1000)
          },
          {
            userId: userIds['lucas.sport'],
            text: "Moi aussi je peux aider ! Surtout pour monter/démonter les structures si besoin.",
            timestamp: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000)
          },
          {
            userId: userIds['julien.event'],
            text: "@emma @lucas Parfait ! Je vous envoie un message privé avec les détails 👍",
            timestamp: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000)
          }
        ]
      },
      {
        userId: userIds['claire.comm'],
        text: "📸 N'oubliez pas de taguer @AssoVilleVerte sur vos photos des événements ! Notre page Facebook grandit et on atteint bientôt les 500 abonnés. Merci pour votre soutien !",
        timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        replies: [
          {
            userId: userIds['camille.culture'],
            text: "Super travail Claire ! Les posts sur l'expo d'art local ont eu beaucoup de succès 🎨",
            timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000)
          }
        ]
      },
      {
        userId: userIds['antoine.tech'],
        text: "🔧 Maintenance du site web prévue dimanche matin entre 8h et 10h. Le site pourrait être inaccessible pendant cette période. Désolé pour la gêne !",
        timestamp: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
        replies: []
      },
      {
        userId: userIds['thomas.jeunes'],
        text: "🏀 Tournoi de basket 3x3 organisé pour les jeunes de l'association le mercredi 28 juin ! Inscriptions ouvertes, équipes mixtes encouragées. Qui est chaud ? 🔥",
        timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        replies: [
          {
            userId: userIds['lucas.sport'],
            text: "Excellente idée ! Je peux vous prêter du matériel si besoin. J'ai des ballons et des chasubles.",
            timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 45 * 60 * 1000)
          },
          {
            userId: userIds['emma.benevole'],
            text: "Moi je veux bien arbitrer quelques matchs ! Ça me rappellera mes années de club 😄",
            timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)
          }
        ]
      },
      {
        userId: userIds['camille.culture'],
        text: "🎭 Retour sur notre soirée théâtre de samedi dernier : un franc succès ! 80 personnes présentes, ambiance chaleureuse et spectacle de qualité. Merci à tous ceux qui ont participé. Prochaine soirée culturelle en septembre !",
        timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        replies: [
          {
            userId: userIds['marie.president'],
            text: "Bravo Camille pour l'organisation ! Ces moments de partage sont précieux pour tisser des liens. 👏",
            timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000)
          }
        ]
      },
      {
        userId: userIds['pierre.tresorier'],
        text: "💰 Point finances : grâce à vos cotisations et aux bénéfices des événements, nous avons pu financer 3 nouveaux projets ce trimestre. La situation financière de l'association est saine. Détails en AG !",
        timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        replies: []
      },
      {
        userId: userIds['sophie.secretaire'],
        text: "📋 Rappel : les comptes-rendus des réunions sont disponibles dans l'espace membre du site. N'hésitez pas à les consulter pour rester au courant des décisions prises.",
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        replies: []
      },
      {
        userId: userIds['emma.benevole'],
        text: "🌱 Journée plantation d'arbres samedi prochain au parc municipal ! RDV 9h entrée principale. Gants et outils fournis. Qui vient verdir notre belle ville avec nous ? 🌳",
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        replies: [
          {
            userId: userIds['antoine.tech'],
            text: "Je serai là ! Ça fait du bien de mettre les mains dans la terre après des heures devant l'écran 😅",
            timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000)
          },
          {
            userId: userIds['thomas.jeunes'],
            text: "Super initiative ! J'amène mes jeunes, ça leur fera un bon projet éco-citoyen.",
            timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
          }
        ]
      }
    ];

    // Messages pour le forum admin - Gestion interne
    const adminForumMessages = [
      {
        userId: userIds['admin'],
        text: "Réunion bureau prévue jeudi 15h en visio. Points à l'ordre du jour : budget festival, nouveaux adhérents, partenariats locaux. Merci de confirmer votre présence.",
        timestamp: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        replies: [
          {
            userId: userIds['marie.president'],
            text: "Présente ! J'ai préparé le dossier partenariats avec la mairie.",
            timestamp: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000 + 1 * 60 * 60 * 1000)
          },
          {
            userId: userIds['pierre.tresorier'],
            text: "OK pour moi. Le budget festival est bouclé, on peut valider.",
            timestamp: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000)
          }
        ]
      },
      {
        userId: userIds['lmao'],
        text: "Mise à jour système effectuée. Nouvelles fonctionnalités de modération activées. Pensez à tester vos accès admin.",
        timestamp: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000),
        replies: []
      },
      {
        userId: userIds['marie.president'],
        text: "4 nouvelles demandes d'adhésion cette semaine. Profils intéressants, motivations solides. Je propose qu'on les valide en bureau. Qu'en pensez-vous ?",
        timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
        replies: [
          {
            userId: userIds['sophie.secretaire'],
            text: "J'ai vérifié les dossiers, tout semble en ordre. On pourrait faire un petit entretien informel ?",
            timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000)
          },
          {
            userId: userIds['admin'],
            text: "Bonne idée l'entretien. Ça permet de mieux connaître leurs motivations. Je peux organiser ça.",
            timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
          }
        ]
      },
      {
        userId: userIds['pierre.tresorier'],
        text: "Subvention mairie accordée ! 2500€ pour le projet jeunesse. On peut lancer les activités prévues. Thomas, tu peux démarrer l'organisation.",
        timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        replies: [
          {
            userId: userIds['thomas.jeunes'],
            text: "Génial ! Je lance les inscriptions dès demain. Merci Pierre pour ton travail sur le dossier 🙏",
            timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
          }
        ]
      }
    ];    // Fonction pour créer les messages avec leurs réponses
    const createMessagesWithReplies = async (messages, forumId) => {
      for (const msg of messages) {
        const messageDoc = {
          _id: new ObjectId(),
          userId: new ObjectId(msg.userId), // Uniformiser en ObjectId
          forumId: forumId,
          user: await getUserDisplayName(msg.userId),
          login: await getUserLogin(msg.userId),
          avatar: await getUserAvatar(msg.userId),
          text: msg.text,
          createdAt: msg.timestamp,
          likes: [],
          replies: []
        };

        // Ajouter les réponses si elles existent
        if (msg.replies && msg.replies.length > 0) {
          for (const reply of msg.replies) {
            messageDoc.replies.push({
              id: new ObjectId().toString(),
              userId: new ObjectId(reply.userId), // Uniformiser en ObjectId
              user: await getUserDisplayName(reply.userId),
              login: await getUserLogin(reply.userId),
              avatar: await getUserAvatar(reply.userId),
              text: reply.text,
              timestamp: reply.timestamp,
              likes: []
            });
          }
        }

        await messagesCol.insertOne(messageDoc);
      }
    };    // Fonctions helper pour récupérer les infos utilisateur
    async function getUserDisplayName(userId) {
      if (userId.equals(adminId)) return 'Admin System';
      if (userId.equals(devId)) return 'Dev Account';
      
      const member = associationMembers.find(m => userIds[m.login].equals(userId));
      return member ? `${member.firstName} ${member.lastName}` : 'Utilisateur Inconnu';
    }

    async function getUserLogin(userId) {
      if (userId.equals(adminId)) return 'admin';
      if (userId.equals(devId)) return 'lmao';
      
      const member = associationMembers.find(m => userIds[m.login].equals(userId));
      return member ? member.login : 'unknown';
    }

    async function getUserAvatar(userId) {
      const displayName = await getUserDisplayName(userId);
      const names = displayName.split(' ');
      return names.length >= 2 ? (names[0].charAt(0) + names[1].charAt(0)).toUpperCase() : displayName.charAt(0).toUpperCase();
    }

    // Créer les messages pour les deux forums
    await createMessagesWithReplies(publicForumMessages, publicForumId);
    await createMessagesWithReplies(adminForumMessages, privateForumId);
    
    console.log(`${publicForumMessages.length} messages créés dans le forum public`);
    console.log(`${adminForumMessages.length} messages créés dans le forum admin`);

    // 9) Jeux de conversations privées variées
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
