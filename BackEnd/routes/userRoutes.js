/**
 * Routes utilisateur
 * Gestion des profils utilisateur
 */

const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');
const fs = require('fs');
const path = require('path');
const { getCollection } = require('../utils/dbConnection');
const { requireAuth } = require('../middleware/auth');
const { uploadAvatar } = require('../middleware/upload');

/**
 * GET /api/user/profile
 * Récupération des informations du profil de l'utilisateur connecté
 */
router.get('/profile', requireAuth, async (req, res) => {
  try {
    const usersCollection = await getCollection('users');
    
    const user = await usersCollection.findOne(
      { _id: new ObjectId(req.user.id) },
      { projection: { password: 0 } }
    );
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }
    
    res.json({
      success: true,
      profile: {
        login: user.login,
        firstName: user.firstName || user.firstname,
        lastName: user.lastName || user.lastname,
        email: user.email,
        bio: user.bio,
        role: user.role,
        avatar: user.avatar,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      }
    });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

/**
 * PUT /api/user/profile
 * Mise à jour des informations du profil de l'utilisateur connecté
 */
router.put('/profile', requireAuth, async (req, res) => {
  try {
    const { firstName, lastName, email, bio } = req.body;
    
    if (!firstName || !lastName) {
      return res.status(400).json({
        success: false,
        message: 'Prénom et nom sont requis'
      });
    }

    // Validation basique de l'email si fourni
    if (email && !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      return res.status(400).json({
        success: false,
        message: 'Format d\'email invalide'
      });
    }
    
    const usersCollection = await getCollection('users');
    
    // Préparer les champs à mettre à jour
    const updateFields = {
      firstName,
      lastName,
      updatedAt: new Date()
    };

    // Inclure l'email seulement s'il est fourni
    if (email !== undefined) {
      updateFields.email = email;
    }

    // Inclure le bio même s'il est vide
    if (bio !== undefined) {
      updateFields.bio = bio;
    }

    // Utiliser les opérateurs $set et $unset selon les besoins
    const updateOperation = {
      $set: updateFields
    };

    await usersCollection.updateOne(
      { _id: new ObjectId(req.user.id) },
      updateOperation
    );
    
    res.json({
      success: true,
      message: 'Profil mis à jour avec succès'
    });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

/**
 * POST /api/user/avatar
 * Téléchargement d'un avatar d'utilisateur
 */
router.post('/avatar', requireAuth, uploadAvatar.single('avatar'), async (req, res) => {
  try {
    // Vérifier si un fichier a été téléchargé
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Aucun fichier n\'a été téléchargé'
      });
    }
    
    const usersCollection = await getCollection('users');
    
    // Récupérer l'utilisateur pour vérifier s'il a déjà un avatar
    const user = await usersCollection.findOne(
      { _id: new ObjectId(req.user.id) }
    );
    
    // Si l'utilisateur avait déjà un avatar, le supprimer
    if (user.avatar && user.avatar.startsWith('/uploads/avatars/')) {
      const oldAvatarPath = path.join(__dirname, '../..', user.avatar);
      if (fs.existsSync(oldAvatarPath)) {
        fs.unlinkSync(oldAvatarPath);
      }
    }
    
    // Chemin relatif pour stocker dans la base de données
    const avatarRelativePath = `/uploads/avatars/${req.file.filename}`;
    
    // Mettre à jour l'avatar dans la base de données
    await usersCollection.updateOne(
      { _id: new ObjectId(req.user.id) },
      { 
        $set: { 
          avatar: avatarRelativePath,
          updatedAt: new Date()
        } 
      }
    );
    
    res.json({
      success: true,
      message: 'Avatar téléchargé avec succès',
      avatarUrl: avatarRelativePath
    });
  } catch (error) {
    console.error('Erreur lors du téléchargement de l\'avatar:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du téléchargement de l\'avatar'
    });
  }
});

/**
 * GET /api/user/messages/:userId?
 * Récupérer les messages publiés par l'utilisateur
 * Si userId n'est pas fourni et l'utilisateur est connecté, retourne ses messages
 * Si userId est fourni, retourne les messages publics de cet utilisateur
 */
router.get('/messages/:userId?', async (req, res) => {
  try {
    const { userId } = req.params;
    const authenticatedUserId = req.user?.id;
    const targetUserId = userId || authenticatedUserId;

    // Si pas d'userId et pas connecté, erreur
    if (!targetUserId) {
      return res.status(400).json({
        success: false,
        message: 'ID utilisateur requis'
      });
    }

    // Vérifier si l'ID utilisateur est valide
    if (!ObjectId.isValid(targetUserId)) {
      return res.status(400).json({
        success: false,
        message: 'ID utilisateur invalide'
      });
    }

    const messagesCollection = await getCollection('messages');
    const forumsCollection = await getCollection('forums');
    
    // Définir la visibilité des messages en fonction de l'authentification
    let forumIds;
    const isOwnProfile = authenticatedUserId && targetUserId === authenticatedUserId;
    const isAdmin = req.user?.role === 'admin';

    if (isOwnProfile || isAdmin) {
      // L'utilisateur authentifié voit tous ses messages ou un admin voit tout
      const allForums = await forumsCollection.find({}).toArray();
      forumIds = allForums.map(forum => forum._id);
    } else {
      // Utilisateur non connecté ou consultant un autre profil : uniquement les forums publics
      const publicForums = await forumsCollection.find({ isPublic: true }).toArray();
      forumIds = publicForums.map(forum => forum._id);
    }
    
    // Récupérer les messages avec la bonne visibilité
    const messages = await messagesCollection.find({
      userId: targetUserId,
      forumId: { $in: forumIds }
    })
    .sort({ createdAt: -1 })
    .toArray();

    // Si on a trouvé des messages, récupérer le nom des forums
    const forums = await forumsCollection.find({
      _id: { $in: messages.map(msg => new ObjectId(msg.forumId)) }
    }).toArray();

    const forumNames = forums.reduce((acc, forum) => {
      acc[forum._id.toString()] = forum.name;
      return acc;
    }, {});

    res.json({
      success: true,
      messages: messages.map(msg => ({
        id: msg._id,
        text: msg.text,
        createdAt: msg.createdAt,
        likes: msg.likes || [],
        replies: msg.replies || [],
        forumId: msg.forumId,
        forumName: forumNames[msg.forumId?.toString()] || 'Forum inconnu'
      }))
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des messages:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

/**
 * GET /api/user/search
 * Recherche d'utilisateurs par nom, prénom ou login
 */
router.get('/search', requireAuth, async (req, res) => {
  try {
    const { q: searchTerm } = req.query;
    
    if (!searchTerm || searchTerm.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Le terme de recherche doit contenir au moins 2 caractères'
      });
    }
    
    const usersCollection = await getCollection('users');
    
    // Créer un index de recherche textuelle si ce n'est pas déjà fait
    try {
      await usersCollection.createIndex({ 
        firstName: "text", 
        lastName: "text", 
        login: "text" 
      });
    } catch (error) {
      console.log('Index déjà créé ou erreur:', error);
    }
    
    // Rechercher par correspondance partielle avec une expression régulière
    const searchRegex = new RegExp(searchTerm, 'i');
    
    const users = await usersCollection.find({
      $or: [
        { firstName: { $regex: searchRegex } },
        { lastName: { $regex: searchRegex } },
        { login: { $regex: searchRegex } }
      ]
    }, { 
      projection: { 
        _id: 1, 
        firstName: 1, 
        lastName: 1, 
        login: 1 
      },
      limit: 10
    }).toArray();
    
    // Formater les résultats
    const formattedUsers = users.map(user => ({
      id: user._id.toString(),
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      login: user.login || '',
      avatar: user.avatar || null
    }));
    
    res.json({
      success: true,
      users: formattedUsers
    });
  } catch (error) {
    console.error('Erreur lors de la recherche d\'utilisateurs:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

/**
 * GET /api/user/profile/:login
 * Récupération du profil public d'un utilisateur par son login
 */
router.get('/profile/:login', async (req, res) => {
  try {
    const { login } = req.params;
    const usersCollection = await getCollection('users');
    
    const user = await usersCollection.findOne(
      { login: login },
      { projection: { 
        password: 0,
        email: 0,
        // Ne pas exposer les données sensibles
        status: 0,
        lastLogin: 0 
      } }
    );
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Récupérer les messages publics de l'utilisateur
    const messagesCollection = await getCollection('messages');
    const forumsCollection = await getCollection('forums');

    // Récupérer d'abord tous les forums publics
    const publicForums = await forumsCollection.find({ isPublic: true }).toArray();
    const publicForumIds = publicForums.map(forum => forum._id);

    // Récupérer les messages de l'utilisateur dans les forums publics
    const messages = await messagesCollection.find({
      userId: user._id,
      forumId: { $in: publicForumIds }
    })
    .sort({ createdAt: -1 })
    .toArray();
    
    res.json({
      success: true,
      profile: {
        login: user.login,
        firstName: user.firstName,
        lastName: user.lastName,
        bio: user.bio,
        role: user.role,
        avatar: user.avatar,
        createdAt: user.createdAt,
        messages: messages
      }
    });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

/**
 * GET /api/user/:login
 * Récupération du profil public d'un utilisateur
 */
router.get('/:login', async (req, res) => {
  try {
    const { login } = req.params;
    const usersCollection = await getCollection('users');
    
    const user = await usersCollection.findOne(
      { login },
      { projection: { 
        password: 0,
        email: 0,
        status: 0,
        lastLogin: 0 
      } }
    );
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Récupérer les messages publics de l'utilisateur 
    const messagesCollection = await getCollection('messages');
    const forumsCollection = await getCollection('forums');
    
    // Récupérer d'abord tous les forums publics
    const publicForums = await forumsCollection.find({ isPublic: true }).toArray();
    const publicForumIds = publicForums.map(forum => forum._id);
    
    // Récupérer les messages de l'utilisateur dans les forums publics uniquement
    const messages = await messagesCollection.find({
      userId: user._id,
      forumId: { $in: publicForumIds }
    })
    .sort({ createdAt: -1 })
    .toArray();

    res.json({
      success: true,
      profile: {
        ...user,
        messages: messages.map(msg => ({
          id: msg._id,
          text: msg.text,
          createdAt: msg.createdAt,
          forumName: publicForums.find(f => f._id.toString() === msg.forumId.toString())?.name || 'Forum inconnu'
        }))
      }
    });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

module.exports = router;