/**
 * Routes pour les messages publics
 * Gestion des messages, réponses et likes
 */

const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');
const { getCollection } = require('../utils/dbConnection');
const { requireAuth } = require('../middleware/auth');

/**
 * GET /api/messages
 * Récupération des messages avec filtrage optionnel par forum
 */
router.get('/', async (req, res) => {
  try {
    const { forumId } = req.query;
    const messagesCollection = await getCollection('messages');
    
    // Construire la requête de filtrage
    let query = {};
    
    // Si un forumId est fourni, filtrer par ce forum
    if (forumId) {
      if (!ObjectId.isValid(forumId)) {
        return res.status(400).json({
          success: false,
          message: 'ID de forum invalide'
        });
      }
      query.forumId = new ObjectId(forumId);
    }
    
    const messages = await messagesCollection
      .find(query)
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

/**
 * POST /api/messages
 * Création d'un nouveau message
 */
router.post('/', requireAuth, async (req, res) => {
  try {
    const { text, forumId } = req.body;
    
    if (!text || typeof text !== 'string' || text.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Le message ne peut pas être vide'
      });
    }
    
    if (!forumId || !ObjectId.isValid(forumId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de forum requis et valide'
      });
    }
    
    // Vérifier que le forum existe
    const forumsCollection = await getCollection('forums');
    const forum = await forumsCollection.findOne({ _id: new ObjectId(forumId) });
    
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
      const messagesCollection = await getCollection('messages');    const newMessage = {
      userId: new ObjectId(req.user.id), // Stocker comme ObjectId pour la cohérence
      user: `${req.user.firstName} ${req.user.lastName}`,
      login: req.user.login,
      avatar: req.user.firstName.charAt(0) + req.user.lastName.charAt(0),
      text: text.trim(),
      forumId: new ObjectId(forumId),
      createdAt: new Date(),
      likes: [],
      replies: []
    };
    
    const result = await messagesCollection.insertOne(newMessage);
    
    res.status(201).json({
      success: true,
      message: 'Message créé avec succès',
      messageId: result.insertedId,
      createdMessage: { ...newMessage, _id: result.insertedId }
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
 * GET /api/messages/:messageId
 * Récupération d'un message spécifique par ID
 */
router.get('/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params;
    
    if (!ObjectId.isValid(messageId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de message invalide',
        code: 'INVALID_ID'
      });
    }
    
    const messagesCollection = await getCollection('messages');
    const message = await messagesCollection.findOne({
      _id: new ObjectId(messageId)
    });
    
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message non trouvé',
        code: 'NOT_FOUND'
      });
    }
    
    res.json({
      success: true,
      message: message
    });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      code: 'SERVER_ERROR'
    });
  }
});

/**
 * POST /api/messages/:messageId/replies
 * Ajout d'une réponse à un message
 */
router.post('/:messageId/replies', requireAuth, async (req, res) => {
  try {
    const { messageId } = req.params;
    const { text } = req.body;
    
    if (!ObjectId.isValid(messageId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de message invalide'
      });
    }
    
    if (!text || typeof text !== 'string' || text.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'La réponse ne peut pas être vide'
      });
    }
    
    const messagesCollection = await getCollection('messages');
    
    const message = await messagesCollection.findOne({
      _id: new ObjectId(messageId)
    });
    
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message non trouvé'
      });
    }    const newReply = {
      id: new ObjectId().toString(),
      userId: new ObjectId(req.user.id), // Stocker comme ObjectId pour la cohérence
      user: `${req.user.firstName} ${req.user.lastName}`,
      login: req.user.login,
      avatar: req.user.firstName.charAt(0) + req.user.lastName.charAt(0),
      text: text.trim(),
      timestamp: new Date(),
      likes: []
    };
    
    await messagesCollection.updateOne(
      { _id: new ObjectId(messageId) },
      { $push: { replies: newReply } }
    );
    
    res.status(201).json({
      success: true,
      message: 'Réponse ajoutée avec succès',
      replyId: newReply.id,
      reply: newReply
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
 * POST /api/messages/:messageId/like
 * Ajout/suppression d'un like sur un message
 */
router.post('/:messageId/like', requireAuth, async (req, res) => {
  try {
    const { messageId } = req.params;
    
    if (!ObjectId.isValid(messageId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de message invalide'
      });
    }    const messagesCollection = await getCollection('messages');
    const userId = req.user.id; // Utiliser l'ID comme string
    const userObjectId = new ObjectId(userId); // Aussi préparer la version ObjectId pour les anciens likes
    
    const message = await messagesCollection.findOne({
      _id: new ObjectId(messageId)
    });
    
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message non trouvé'
      });
    }
      // Vérifier si l'utilisateur a déjà liké ce message (chercher dans les deux formats)
    const alreadyLiked = message.likes && (
      message.likes.includes(userId) || 
      message.likes.some(like => like instanceof ObjectId && like.toString() === userId)
    );
    
    let operation;
    let actionMessage;
    
    if (alreadyLiked) {
      // Supprimer le like (dans les deux formats possibles)
      operation = {
        $pull: { 
          likes: { 
            $in: [userId, userObjectId] 
          } 
        }
      };
      actionMessage = 'Like supprimé avec succès';
    } else {    // Ajouter le like (maintenant comme ObjectId pour la cohérence)
      operation = {
        $addToSet: { likes: new ObjectId(userId) }
      };
      actionMessage = 'Like ajouté avec succès';
    }
    
    await messagesCollection.updateOne(
      { _id: new ObjectId(messageId) },
      operation
    );
    
    // Récupérer le message mis à jour pour connaître le nombre de likes
    const updatedMessage = await messagesCollection.findOne({
      _id: new ObjectId(messageId)
    });
    
    res.json({
      success: true,
      message: actionMessage,
      liked: !alreadyLiked,
      likeCount: updatedMessage.likes ? updatedMessage.likes.length : 0
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
 * PUT /api/messages/:messageId
 * Mise à jour d'un message existant
 */
router.put('/:messageId', requireAuth, async (req, res) => {
  try {
    const { messageId } = req.params;
    const { text } = req.body;
    
    if (!ObjectId.isValid(messageId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de message invalide',
        code: 'INVALID_ID'
      });
    }
    
    if (!text || typeof text !== 'string' || text.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Le message ne peut pas être vide',
        code: 'EMPTY_MESSAGE'
      });
    }
    
    const messagesCollection = await getCollection('messages');
      // Vérifier que l'utilisateur est le propriétaire du message
    const message = await messagesCollection.findOne({
      _id: new ObjectId(messageId)
    });
    
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message non trouvé',
        code: 'NOT_FOUND'
      });
    }    // Gérer les deux formats possibles de userId (string legacy et ObjectId nouveau)
    const messageUserId = message.userId ? message.userId.toString() : null;
    if (messageUserId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'êtes pas autorisé à modifier ce message',
        code: 'UNAUTHORIZED'
      });
    }
    
    // Mettre à jour le message
    const result = await messagesCollection.updateOne(
      { _id: new ObjectId(messageId) },
      { 
        $set: { 
          text: text.trim(),
          updatedAt: new Date()
        } 
      }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Message non trouvé',
        code: 'NOT_FOUND'
      });
    }
    
    // Récupérer le message mis à jour
    const updatedMessage = await messagesCollection.findOne({
      _id: new ObjectId(messageId)
    });
    
    res.json({
      success: true,
      message: 'Message mis à jour avec succès',
      updatedMessage
    });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      code: 'SERVER_ERROR'
    });
  }
});

/**
 * DELETE /api/messages/:messageId
 * Suppression d'un message
 */
router.delete('/:messageId', requireAuth, async (req, res) => {
  try {
    const { messageId } = req.params;
    
    if (!ObjectId.isValid(messageId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de message invalide',
        code: 'INVALID_ID'
      });
    }
    
    const messagesCollection = await getCollection('messages');      // Vérifier que l'utilisateur est le propriétaire du message ou un administrateur
    const message = await messagesCollection.findOne({
      _id: new ObjectId(messageId)
    });
    
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message non trouvé',
        code: 'NOT_FOUND'
      });
    }
      // Gérer les deux formats possibles de userId (string legacy et ObjectId nouveau)
    const messageUserId = message.userId ? message.userId.toString() : null;
    if (messageUserId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'êtes pas autorisé à supprimer ce message',
        code: 'UNAUTHORIZED'
      });
    }
    
    // Supprimer le message
    const result = await messagesCollection.deleteOne({
      _id: new ObjectId(messageId)
    });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Message non trouvé',
        code: 'NOT_FOUND'
      });
    }
    
    res.json({
      success: true,
      message: 'Message supprimé avec succès'
    });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      code: 'SERVER_ERROR'
    });
  }
});

/**
 * POST /api/messages/:messageId/replies/:replyId/like
 * Ajout/suppression d'un like sur une réponse
 */
router.post('/:messageId/replies/:replyId/like', requireAuth, async (req, res) => {
  try {
    const { messageId, replyId } = req.params;
    
    if (!ObjectId.isValid(messageId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de message invalide'
      });
    }    const messagesCollection = await getCollection('messages');
    const userId = req.user.id; // Utiliser l'ID comme string
    const userObjectId = new ObjectId(userId); // Aussi préparer la version ObjectId pour les anciens likes
    
    // Find the parent message
    const message = await messagesCollection.findOne({
      _id: new ObjectId(messageId)
    });
    
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message non trouvé'
      });
    }
    
    // Find the reply within the message
    const replyIndex = message.replies?.findIndex(reply => reply.id === replyId);
    
    if (replyIndex === -1 || replyIndex === undefined) {
      return res.status(404).json({
        success: false,
        message: 'Réponse non trouvée'
      });
    }
      // Vérifier si l'utilisateur a déjà liké cette réponse (chercher dans les deux formats)
    const reply = message.replies[replyIndex];
    const alreadyLiked = reply.likes && (
      reply.likes.includes(userId) || 
      reply.likes.some(like => like instanceof ObjectId && like.toString() === userId)
    );
    
    let operation;
    let actionMessage;
    
    if (alreadyLiked) {
      // Supprimer le like (dans les deux formats possibles)
      operation = {
        $pull: { 
          [`replies.${replyIndex}.likes`]: { 
            $in: [userId, userObjectId] 
          } 
        }
      };
      actionMessage = 'Like supprimé avec succès';
    } else {    // Ajouter le like (maintenant comme ObjectId pour la cohérence)
      operation = {
        $addToSet: { [`replies.${replyIndex}.likes`]: new ObjectId(userId) }
      };
      actionMessage = 'Like ajouté avec succès';
    }
    
    await messagesCollection.updateOne(
      { _id: new ObjectId(messageId) },
      operation
    );
    
    // Récupérer le message mis à jour pour connaître le nombre de likes sur la réponse
    const updatedMessage = await messagesCollection.findOne({
      _id: new ObjectId(messageId)
    });
    
    const updatedReply = updatedMessage.replies[replyIndex];
    
    res.json({
      success: true,
      message: actionMessage,
      liked: !alreadyLiked,
      likeCount: updatedReply.likes ? updatedReply.likes.length : 0
    });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// Note: Les messages des utilisateurs sont gérés dans userRoutes.js via /api/user/messages/:userId

module.exports = router;