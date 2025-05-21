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
    const { firstName, lastName } = req.body;
    
    if (!firstName || !lastName) {
      return res.status(400).json({
        success: false,
        message: 'Prénom et nom sont requis'
      });
    }
    
    const usersCollection = await getCollection('users');
    
    await usersCollection.updateOne(
      { _id: new ObjectId(req.user.id) },
      { 
        $set: { 
          firstName: firstName,
          lastName: lastName,
          updatedAt: new Date()
        } 
      }
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
 * GET /api/user/messages
 * Récupérer les messages publiés par l'utilisateur connecté
 */
router.get('/messages', requireAuth, async (req, res) => {
  try {
    const messagesCollection = await getCollection('messages');
    
    const messages = await messagesCollection
      .find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .toArray();
    
    res.json({
      success: true,
      messages
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