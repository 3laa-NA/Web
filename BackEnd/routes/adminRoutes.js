/**
 * Routes d'administration
 * Gestion des utilisateurs et des paramètres système
 */

const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');
const { getCollection } = require('../utils/dbConnection');
const { requireAuth, requireAdmin } = require('../middleware/auth');

/**
 * GET /api/admin/users
 * Récupération de tous les utilisateurs (admin uniquement)
 */
router.get('/users', requireAuth, requireAdmin, async (req, res) => {
  try {
    const usersCollection = await getCollection('users');
    const users = await usersCollection.find({}, { 
      projection: { password: 0 } 
    }).toArray();
    
    res.json({
      success: true,
      users
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
 * GET /api/admin/users/pending
 * Récupération des utilisateurs en attente d'approbation
 */
router.get('/users/pending', requireAuth, requireAdmin, async (req, res) => {
  try {
    const usersCollection = await getCollection('users');
    const pendingUsers = await usersCollection.find(
      { status: 'pending' }, 
      { projection: { password: 0 } }
    ).toArray();
    
    res.json({
      success: true,
      users: pendingUsers
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
 * POST /api/admin/users/:userId/approve
 * Approuver un utilisateur en attente
 */
router.post('/users/:userId/approve', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'ID d\'utilisateur invalide'
      });
    }
    
    const usersCollection = await getCollection('users');
    
    const result = await usersCollection.updateOne(
      { _id: new ObjectId(userId), status: 'pending' },
      { $set: { status: 'active' } }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé ou déjà approuvé'
      });
    }
    
    res.json({
      success: true,
      message: 'Utilisateur approuvé avec succès'
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
 * POST /api/admin/users/:userId/reject
 * Rejeter un utilisateur en attente
 */
router.post('/users/:userId/reject', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'ID d\'utilisateur invalide'
      });
    }
    
    const usersCollection = await getCollection('users');
    
    const result = await usersCollection.updateOne(
      { _id: new ObjectId(userId), status: 'pending' },
      { $set: { status: 'rejected' } }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé ou déjà traité'
      });
    }
    
    res.json({
      success: true,
      message: 'Utilisateur rejeté avec succès'
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
 * PUT /api/admin/users/:userId/role
 * Modifier le rôle d'un utilisateur
 */
router.put('/users/:userId/role', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;
    
    if (!ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'ID d\'utilisateur invalide'
      });
    }
    
    if (!role || !['user', 'admin', 'mod'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Rôle invalide. Les valeurs autorisées sont: user, admin, mod'
      });
    }
    
    const usersCollection = await getCollection('users');
    
    const result = await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      { $set: { role } }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }
    
    res.json({
      success: true,
      message: 'Rôle de l\'utilisateur modifié avec succès'
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
 * GET /api/admin/settings
 * Récupérer les paramètres système
 */
router.get('/settings', requireAuth, requireAdmin, async (req, res) => {
  try {
    const settingsCollection = await getCollection('settings');
    const settings = await settingsCollection.findOne({ key: 'system' });
    
    res.json({
      success: true,
      settings: settings || { key: 'system' }
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
 * PUT /api/admin/settings
 * Mettre à jour les paramètres système
 */
router.put('/settings', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { settings } = req.body;
    
    if (!settings) {
      return res.status(400).json({
        success: false,
        message: 'Paramètres requis'
      });
    }
    
    const settingsCollection = await getCollection('settings');
    
    await settingsCollection.updateOne(
      { key: 'system' },
      { $set: { ...settings, updatedAt: new Date() } },
      { upsert: true }
    );
    
    res.json({
      success: true,
      message: 'Paramètres mis à jour avec succès'
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
 * POST /api/admin/users/:userId/deactivate
 * Désactive un compte utilisateur
 */
router.post('/users/:userId/deactivate', requireAuth, async (req, res) => {
  try {
    // Vérifier que l'utilisateur est admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    const userId = req.params.userId;
    
    // Vérifier qu'un administrateur ne peut pas se désactiver lui-même
    if (userId === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Un administrateur ne peut pas désactiver son propre compte'
      });
    }

    const usersCollection = await getCollection('users');
    
    // Vérifier que l'utilisateur existe et est actif
    const user = await usersCollection.findOne({ _id: new ObjectId(userId) });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    if (user.role === 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Impossible de désactiver un autre administrateur'
      });
    }

    // Mettre à jour le statut de l'utilisateur
    const result = await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      { $set: { 
        status: 'inactive',
        updatedAt: new Date()
      }}
    );

    if (!result.matchedCount) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    res.json({
      success: true,
      message: 'Utilisateur désactivé avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de la désactivation de l\'utilisateur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la désactivation de l\'utilisateur'
    });
  }
});

/**
 * Change le statut d'un utilisateur (active/inactive)
 * @route PUT /api/admin/users/:userId/status
 */
router.put('/users/:userId/status', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.body;

    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Valeur de statut invalide' });
    }

    const usersCollection = await getCollection('users');
    
    const result = await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      { $set: { status } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
    }

    res.json({
      success: true,
      message: `Statut de l'utilisateur changé en ${status}`
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut de l\'utilisateur:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la mise à jour du statut de l\'utilisateur' });
  }
});

module.exports = router;