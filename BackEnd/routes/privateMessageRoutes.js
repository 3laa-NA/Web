/**
 * Routes pour les messages privés
 * Gestion des conversations privées entre utilisateurs
 */

const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');
const { getCollection } = require('../utils/dbConnection');
const { requireAuth } = require('../middleware/auth');

/**
 * GET /api/private-messages/conversations
 * Récupération des conversations de l'utilisateur connecté
 */
router.get('/conversations', requireAuth, async (req, res) => {
  try {
    const conversationsCollection = await getCollection('conversations');
    const userId = req.user.id;
    
    // Récupérer les conversations où l'utilisateur est un participant
    const conversations = await conversationsCollection.find({
      participants: userId
    }).sort({ updatedAt: -1 }).toArray();
    
    // Formater les données pour le frontend
    const formattedConversations = await Promise.all(conversations.map(async (conv) => {
      // Trouver l'autre participant (dans une conversation à 2)
      const otherParticipantId = conv.participants.find(p => p !== userId);
      
      // Récupérer les informations de l'autre participant
      const usersCollection = await getCollection('users');
      const otherUser = await usersCollection.findOne({ _id: new ObjectId(otherParticipantId) });
      
      return {
        id: conv._id,
        with: otherUser ? `${otherUser.firstName} ${otherUser.lastName}` : 'Utilisateur inconnu',
        withId: otherParticipantId,
        lastMessage: conv.lastMessage?.text || '',
        updatedAt: conv.updatedAt,
        unread: conv.unreadBy && conv.unreadBy.includes(userId) ? 1 : 0
      };
    }));
    
    res.json({
      success: true,
      conversations: formattedConversations
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
 * GET /api/private-messages/conversations/:conversationId
 * Récupération des messages d'une conversation
 */
router.get('/conversations/:conversationId', requireAuth, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;
    
    if (!ObjectId.isValid(conversationId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de conversation invalide'
      });
    }
    
    // Vérifier que l'utilisateur fait partie de cette conversation
    const conversationsCollection = await getCollection('conversations');
    const conversation = await conversationsCollection.findOne({
      _id: new ObjectId(conversationId),
      participants: userId
    });
    
    if (!conversation) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé à cette conversation'
      });
    }
    
    // Récupérer les messages de cette conversation
    const privateMessagesCollection = await getCollection('private_messages');
    const messages = await privateMessagesCollection.find({
      conversationId: conversationId
    }).sort({ timestamp: 1 }).toArray();
    
    // Marquer la conversation comme lue par cet utilisateur
    await conversationsCollection.updateOne(
      { _id: new ObjectId(conversationId) },
      { $pull: { unreadBy: userId } }
    );
    
    res.json({
      success: true,
      messages: messages.map(msg => ({
        id: msg._id,
        senderId: msg.senderId,
        text: msg.text,
        timestamp: msg.timestamp
      }))
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
 * POST /api/private-messages/send
 * Envoi d'un message privé
 */
router.post('/send', requireAuth, async (req, res) => {
  try {
    const { recipientId, text } = req.body;
    const senderId = req.user.id;
    
    if (!recipientId || !text || text.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Destinataire et message sont requis'
      });
    }
    
    // Vérifier si le destinataire existe
    const usersCollection = await getCollection('users');
    let recipientUser;
    
    // Le destinataire peut être un login ou un ID
    if (ObjectId.isValid(recipientId)) {
      recipientUser = await usersCollection.findOne({ _id: new ObjectId(recipientId) });
    } else {
      recipientUser = await usersCollection.findOne({ login: recipientId });
    }
    
    if (!recipientUser) {
      return res.status(404).json({
        success: false,
        message: 'Destinataire introuvable'
      });
    }
    
    const recipient = recipientUser._id.toString();
    
    // Vérifier si une conversation existe déjà entre ces deux utilisateurs
    const conversationsCollection = await getCollection('conversations');
    let conversation = await conversationsCollection.findOne({
      participants: { $all: [senderId, recipient] }
    });
    
    const now = new Date();
    
    // Si la conversation n'existe pas, en créer une
    if (!conversation) {
      const newConversation = {
        participants: [senderId, recipient],
        createdAt: now,
        updatedAt: now,
        unreadBy: [recipient] // Le destinataire n'a pas encore lu cette nouvelle conversation
      };
      
      const result = await conversationsCollection.insertOne(newConversation);
      conversation = {
        ...newConversation,
        _id: result.insertedId
      };
    } else {
      // Mettre à jour la conversation existante
      await conversationsCollection.updateOne(
        { _id: conversation._id },
        { 
          $set: { 
            updatedAt: now,
            'lastMessage.text': text,
            'lastMessage.senderId': senderId,
            'lastMessage.timestamp': now
          },
          $addToSet: { unreadBy: recipient } // Marquer comme non lu pour le destinataire
        }
      );
    }
    
    // Créer le message
    const privateMessagesCollection = await getCollection('private_messages');
    const newMessage = {
      conversationId: conversation._id.toString(),
      senderId: senderId,
      recipientId: recipient,
      text: text.trim(),
      timestamp: now,
      read: false
    };
    
    const messageResult = await privateMessagesCollection.insertOne(newMessage);
    
    res.status(201).json({
      success: true,
      message: 'Message envoyé avec succès',
      conversationId: conversation._id,
      messageId: messageResult.insertedId
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
 * POST /api/private-messages/conversations/:conversationId/read
 * Marque une conversation comme lue
 */
router.post('/conversations/:conversationId/read', requireAuth, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;
    
    if (!ObjectId.isValid(conversationId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de conversation invalide',
        code: 'INVALID_ID'
      });
    }
    
    // Vérifier que l'utilisateur fait partie de cette conversation
    const conversationsCollection = await getCollection('conversations');
    const conversation = await conversationsCollection.findOne({
      _id: new ObjectId(conversationId),
      participants: userId
    });
    
    if (!conversation) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé à cette conversation',
        code: 'ACCESS_DENIED'
      });
    }
    
    // Marquer la conversation comme lue par cet utilisateur
    const result = await conversationsCollection.updateOne(
      { _id: new ObjectId(conversationId) },
      { $pull: { unreadBy: userId } }
    );
    
    res.json({
      success: true,
      message: 'Conversation marquée comme lue'
    });
  } catch (error) {
    console.error('Erreur lors du marquage de la conversation:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      code: 'SERVER_ERROR'
    });
  }
});

module.exports = router;