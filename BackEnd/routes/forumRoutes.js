/**
 * Routes pour la gestion des forums
 */

const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');
const { getCollection } = require('../utils/dbConnection');
const { requireAuth } = require('../middleware/auth');

// Middleware pour vérifier si l'utilisateur est admin
const requireAdmin = async (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Accès réservé aux administrateurs'
    });
  }
  next();
};

/**
 * GET /api/forums
 * Récupération de tous les forums visibles pour l'utilisateur
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const forumsCollection = await getCollection('forums');
    
    // Si l'utilisateur est admin, récupérer tous les forums
    // Sinon, récupérer uniquement les forums publics
    const query = req.user.role === 'admin' 
      ? {} 
      : { isPublic: true };
    
    const forums = await forumsCollection
      .find(query)
      .sort({ name: 1 })
      .toArray();
    
    res.json({
      success: true,
      forums
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
 * POST /api/forums
 * Création d'un nouveau forum (admin uniquement)
 */
router.post('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { name, description, isPublic } = req.body;
    
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Le nom du forum est requis'
      });
    }
    
    const forumsCollection = await getCollection('forums');
    
    // Vérifier si un forum avec le même nom existe déjà
    const existingForum = await forumsCollection.findOne({ 
      name: name.trim() 
    });
    
    if (existingForum) {
      return res.status(400).json({
        success: false,
        message: 'Un forum avec ce nom existe déjà'
      });
    }
    
    const newForum = {
      name: name.trim(),
      description: description?.trim() || '',
      isPublic: Boolean(isPublic),
      createdAt: new Date(),
      createdBy: req.user.id
    };
    
    const result = await forumsCollection.insertOne(newForum);
    
    res.status(201).json({
      success: true,
      message: 'Forum créé avec succès',
      forum: {
        ...newForum,
        _id: result.insertedId
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
 * GET /api/forums/:forumId
 * Récupération d'un forum spécifique par son ID
 */
router.get('/:forumId', requireAuth, async (req, res) => {
  try {
    const { forumId } = req.params;

    if (!ObjectId.isValid(forumId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de forum invalide'
      });
    }

    const forumsCollection = await getCollection('forums');
    const forum = await forumsCollection.findOne({ 
      _id: new ObjectId(forumId)
    });

    if (!forum) {
      return res.status(404).json({
        success: false,
        message: 'Forum non trouvé'
      });
    }

    // Vérifier si l'utilisateur a accès au forum
    if (!forum.isPublic && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé à ce forum'
      });
    }

    res.json({
      success: true,
      forum
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
 * GET /api/forums/admin/all
 * Récupération de tous les forums pour l'administration
 */
router.get('/admin/all', requireAuth, requireAdmin, async (req, res) => {
  try {
    const forumsCollection = await getCollection('forums');
    const forums = await forumsCollection
      .find({})
      .sort({ name: 1 })
      .toArray();
    
    res.json({
      success: true,
      forums
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
 * PUT /api/forums/:forumId/access
 * Mise à jour de l'accessibilité d'un forum
 */
router.put('/:forumId/access', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { forumId } = req.params;
    const { isPublic } = req.body;

    if (!ObjectId.isValid(forumId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de forum invalide'
      });
    }

    const forumsCollection = await getCollection('forums');
    const result = await forumsCollection.updateOne(
      { _id: new ObjectId(forumId) },
      { $set: { isPublic } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Forum non trouvé'
      });
    }

    res.json({
      success: true,
      message: 'Accessibilité du forum mise à jour'
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
 * DELETE /api/forums/:forumId
 * Suppression d'un forum et de tous ses messages
 */
router.delete('/:forumId', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { forumId } = req.params;

    if (!ObjectId.isValid(forumId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de forum invalide'
      });
    }

    // Récupérer tous les messages du forum
    const messagesCollection = await getCollection('messages');
    const messages = await messagesCollection
      .find({ forumId: new ObjectId(forumId) })
      .toArray();

    // Supprimer chaque message
    for (const message of messages) {
      await messagesCollection.deleteOne({ _id: message._id });
    }

    // Supprimer le forum
    const forumsCollection = await getCollection('forums');
    const result = await forumsCollection.deleteOne({ 
      _id: new ObjectId(forumId)
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Forum non trouvé'
      });
    }

    res.json({
      success: true,
      message: 'Forum et messages supprimés avec succès'
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
