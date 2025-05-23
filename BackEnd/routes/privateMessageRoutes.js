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
    // Assurer que nous avons un ID utilisateur valide
    if (!req.user || (!req.user.id && !req.user._id)) {
      return res.status(401).json({
        success: false,
        message: 'Session utilisateur invalide'
      });
    }
    
    // Log pour debugging 
    console.log('User in request:', req.user);
    const userId = req.user.id || (req.user._id ? req.user._id.toString() : null);
    console.log('Using userId:', userId);
      if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'ID utilisateur invalide'
      });
    }    // Debug: vérifier le format de la recherche
    console.log('Recherche de conversations avec critère:', { participants: userId });
      // Récupérer les conversations où l'utilisateur est un participant
    // L'id peut être stocké dans différents formats (string, ObjectId), cherchons toutes les formes possibles
    let conversations;
    try {
      // Utiliser $or pour chercher toutes les formes possibles de l'ID en une seule requête
      const userIdObj = ObjectId.isValid(userId) ? new ObjectId(userId) : null;
      const userIdStr = userId.toString();
      
      const query = {
        $or: [
          { participants: userIdStr },
          { participants: userId }
        ]
      };
      
      // Ajouter la recherche par ObjectId si l'ID est valide
      if (userIdObj) {
        query.$or.push({ participants: userIdObj });
      }
      
      console.log('Recherche de conversations avec requête:', JSON.stringify(query));
      conversations = await conversationsCollection.find(query).sort({ updatedAt: -1 }).toArray();
      
      console.log(`Trouvé ${conversations.length} conversations pour l'utilisateur ${userId}`);
    } catch (error) {
      console.error('Erreur lors de la recherche des conversations:', error);
      conversations = [];
    }
    
    console.log('Found conversations:', conversations.length, conversations);
      // Formater les données pour le frontend
    const formattedConversations = await Promise.all(conversations.map(async (conv) => {      // Trouver l'autre participant (dans une conversation à 2)
      // Convertir tous les IDs en strings pour comparaison cohérente
      const userIdStr = userId.toString();
      const participantsStr = conv.participants.map(p => p.toString ? p.toString() : p);
      
      const otherParticipantId = participantsStr.find(p => p !== userIdStr);
      console.log('Autre participant identifié:', otherParticipantId);
      
      // Récupérer les informations de l'autre participant
      const usersCollection = await getCollection('users');
      let otherUser = null;
      
      if (otherParticipantId) {
        // Essayer d'abord avec ObjectId si valide
        if (ObjectId.isValid(otherParticipantId)) {
          otherUser = await usersCollection.findOne({ _id: new ObjectId(otherParticipantId) });
        }
        
        // Si pas trouvé, essayer avec l'ID comme string
        if (!otherUser) {
          otherUser = await usersCollection.findOne({ _id: otherParticipantId });
        }
        
        // Si toujours pas trouvé, essayer une recherche plus large
        if (!otherUser) {
          console.log('Recherche utilisateur élargie pour ID:', otherParticipantId);
          otherUser = await usersCollection.findOne({
            $or: [
              { _id: otherParticipantId },
              { _id: ObjectId.isValid(otherParticipantId) ? new ObjectId(otherParticipantId) : otherParticipantId }
            ]
          });
        }
      }
      
      // Pour le debugging
      console.log('Conversation pour utilisateur', userId, ':', {
        id: conv._id.toString(),
        participants: conv.participants,
        otherUser: otherUser ? {
          id: otherUser._id.toString(),
          name: `${otherUser.firstName} ${otherUser.lastName}`
        } : null
      });
      
      // Personnaliser le nom de la conversation pour cet utilisateur spécifiquement
      return {
        id: conv._id.toString(), // Convert ObjectId to string
        with: otherUser ? `${otherUser.firstName} ${otherUser.lastName}` : 'Utilisateur inconnu',
        withId: otherParticipantId,
        withLogin: otherUser ? otherUser.login : '',
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
    // Assurer que nous avons un ID utilisateur valide
    if (!req.user || (!req.user.id && !req.user._id)) {
      return res.status(401).json({
        success: false,
        message: 'Session utilisateur invalide'
      });
    }
    
    const userId = req.user.id || (req.user._id ? req.user._id.toString() : null);
    console.log('Using userId for conversation access:', userId);
    
    if (!ObjectId.isValid(conversationId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de conversation invalide'
      });
    }
    
    // Vérifier que l'utilisateur fait partie de cette conversation
    const conversationsCollection = await getCollection('conversations');
    console.log('Checking access for conversation:', conversationId, 'with userId:', userId);
    
    // Essayons de trouver la conversation avec différentes formes d'ID utilisateur
    let conversation = await conversationsCollection.findOne({
      _id: new ObjectId(conversationId),
      participants: userId
    });
    
    // Si pas trouvé, essayer avec une autre forme d'ID
    if (!conversation && ObjectId.isValid(userId)) {
      conversation = await conversationsCollection.findOne({
        _id: new ObjectId(conversationId),
        participants: { $in: [userId, new ObjectId(userId)] }
      });
    }
    
    if (!conversation) {
      console.log('Access denied to conversation:', conversationId, 'for user:', userId);
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
    // Gérer les différents formats possibles de l'ID utilisateur
    if (conversation.unreadBy && Array.isArray(conversation.unreadBy)) {
      // Supprimer toutes les formes possibles de l'ID utilisateur
      await conversationsCollection.updateOne(
        { _id: new ObjectId(conversationId) },
        { 
          $pull: { 
            unreadBy: { 
              $in: [
                userId, 
                // Si ID est valide pour ObjectId, inclure cette forme aussi
                ...(ObjectId.isValid(userId) ? [new ObjectId(userId)] : [])
              ] 
            } 
          } 
        }
      );
      console.log('Conversation marked as read');
    }
    
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
  try {    const { recipientId, text, conversationId } = req.body;
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
    try {
      if (ObjectId.isValid(recipientId)) {
        // Essayer d'abord avec ObjectId
        recipientUser = await usersCollection.findOne({ _id: new ObjectId(recipientId) });
      }
      
      // Si pas trouvé avec ObjectId, essayer comme string ID ou login
      if (!recipientUser) {
        recipientUser = await usersCollection.findOne({
          $or: [
            { login: recipientId },
            // Chercher aussi l'ID comme string
            { _id: recipientId }
          ]
        });
      }

      // Si toujours pas trouvé et que c'est un ID de conversation, chercher le destinataire via la conversation
      if (!recipientUser && conversationId && ObjectId.isValid(conversationId)) {
        const conversation = await conversationsCollection.findOne({ _id: new ObjectId(conversationId) });
        if (conversation) {
          // Trouver l'autre participant qui n'est pas l'expéditeur
          const otherParticipantId = conversation.participants.find(p => p !== senderId);
          if (otherParticipantId) {
            if (ObjectId.isValid(otherParticipantId)) {
              recipientUser = await usersCollection.findOne({ _id: new ObjectId(otherParticipantId) });
            }
            if (!recipientUser) {
              recipientUser = await usersCollection.findOne({ _id: otherParticipantId });
            }
          }
        }
      }
    } catch (error) {
      console.error('Error looking up recipient:', error);
    }
    
    if (!recipientUser) {
      console.error('Recipient not found for ID:', recipientId);
      return res.status(404).json({
        success: false,
        message: 'Destinataire introuvable'
      });
    }
    
    const recipient = recipientUser._id.toString();
    console.log('Found recipient:', recipient);
      // Rechercher la conversation existante
    const conversationsCollection = await getCollection('conversations');
    let conversation;
    
    if (conversationId && ObjectId.isValid(conversationId)) {
      // Si un ID de conversation est fourni, vérifier qu'elle existe
      conversation = await conversationsCollection.findOne({
        _id: new ObjectId(conversationId)
      });
      
      // Si la conversation est trouvée, vérifier que l'utilisateur en fait partie
      if (conversation) {
        const participantIds = conversation.participants.map(p => 
          ObjectId.isValid(p) ? p.toString() : p
        );
        
        if (!participantIds.includes(senderId.toString())) {
          console.error('User', senderId, 'not in conversation', conversationId);
          return res.status(403).json({
            success: false,
            message: 'Accès refusé à cette conversation'
          });
        }
      }
    }
      // Si pas de conversation trouvée avec l'ID fourni ou pas d'ID fourni, chercher par participants
    if (!conversation) {
      // Convertir les IDs en strings pour la recherche
      const senderIdStr = senderId.toString();
      const recipientIdStr = recipient.toString();
      
      // Créer un tableau avec toutes les combinaisons possibles des participants
      const participantPairs = [
        [senderIdStr, recipientIdStr],
        [recipientIdStr, senderIdStr]
      ];
      
      console.log('Recherche conversation existante entre:', senderIdStr, 'et', recipientIdStr);
      
      // Rechercher avec OR pour toutes les combinaisons possibles
      conversation = await conversationsCollection.findOne({
        $or: participantPairs.map(pair => ({
          participants: { $all: pair }
        }))
      });
      
      console.log('Conversation existante trouvée:', conversation ? 'Oui' : 'Non');
    }const now = new Date();
    console.log('Creating/updating conversation between:', senderId, 'and', recipient);    // Si la conversation n'existe pas, en créer une
    if (!conversation) {
      // Convertir les IDs en strings pour assurer la cohérence
      const participantIds = [senderId.toString(), recipient.toString()];
      
      const newConversation = {
        participants: participantIds,
        createdAt: now,
        updatedAt: now,
        lastMessage: {
          text: text.trim(),
          senderId: senderId.toString(),
          timestamp: now
        },
        unreadBy: [recipient.toString()]
      };
      
      const result = await conversationsCollection.insertOne(newConversation);
      conversation = {
        ...newConversation,
        _id: result.insertedId
      };
    } else {
      // Mettre à jour la conversation existante
      const updateResult = await conversationsCollection.updateOne(
        { _id: conversation._id },
        { 
          $set: { 
            updatedAt: now,
            lastMessage: {
              text: text.trim(),
              senderId: senderId,
              timestamp: now
            }
          },
          $addToSet: { unreadBy: recipient }
        }
      );
      console.log('Conversation updated:', updateResult.modifiedCount, 'document(s)');
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
    // Assurer que nous avons un ID utilisateur valide
    if (!req.user || (!req.user.id && !req.user._id)) {
      return res.status(401).json({
        success: false,
        message: 'Session utilisateur invalide'
      });
    }
    
    const userId = req.user.id || (req.user._id ? req.user._id.toString() : null);
    console.log('Using userId for marking conversation as read:', userId);
    
    if (!ObjectId.isValid(conversationId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de conversation invalide',
        code: 'INVALID_ID'
      });
    }
    
    // Vérifier que l'utilisateur fait partie de cette conversation
    const conversationsCollection = await getCollection('conversations');
    console.log('Checking access for marking as read:', conversationId, 'with userId:', userId);
    
    // Essayons de trouver la conversation avec différentes formes d'ID utilisateur
    let conversation = await conversationsCollection.findOne({
      _id: new ObjectId(conversationId),
      participants: userId
    });
    
    // Si pas trouvé, essayer avec une autre forme d'ID
    if (!conversation && ObjectId.isValid(userId)) {
      conversation = await conversationsCollection.findOne({
        _id: new ObjectId(conversationId),
        participants: { $in: [userId, new ObjectId(userId)] }
      });
    }
    
    if (!conversation) {
      console.log('Access denied for marking conversation as read:', conversationId, 'for user:', userId);
      return res.status(403).json({
        success: false,
        message: 'Accès refusé à cette conversation',
        code: 'ACCESS_DENIED'
      });
    }
      // Marquer la conversation comme lue par cet utilisateur
    // Gérer les différents formats possibles de l'ID utilisateur
    const result = await conversationsCollection.updateOne(
      { _id: new ObjectId(conversationId) },
      { 
        $pull: { 
          unreadBy: { 
            $in: [
              userId, 
              // Si ID est valide pour ObjectId, inclure cette forme aussi
              ...(ObjectId.isValid(userId) ? [new ObjectId(userId)] : [])
            ] 
          } 
        } 
      }
    );
    console.log('Conversation marked as read, result:', result.modifiedCount);
    
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