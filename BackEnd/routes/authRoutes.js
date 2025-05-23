/**
 * Routes d'authentification
 * Gestion de la connexion, déconnexion et des tokens
 */

const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');
const { getCollection } = require('../utils/dbConnection');
const { hashPassword, verifyPassword } = require('../utils/securityUtils');
const { generateAccessToken, generateRefreshToken } = require('../utils/jwtUtils');
const { authenticate } = require('../middleware/auth'); // Changed from requireAuth to authenticate

/**
 * GET /api/auth/check-auth
 * Vérifie si le token d'authentification est valide
 */
router.get('/check-auth', authenticate, (req, res) => {
  // Si le middleware authenticate a réussi, le token est valide
  res.json({
    success: true,
    user: req.user
  });
});

/**
 * GET /api/auth/refresh-token
 * Rafraîchit le token d'authentification
 */
router.get('/refresh-token', authenticate, async (req, res) => {
  try {
    // Ajouter l'user agent à l'utilisateur pour le stockage du token
    const userData = {
      userId: req.user._id.toString(),
      role: req.user.role
    };
    
    // Générer un nouveau token
    const accessToken = generateAccessToken(userData);
    const refreshToken = generateRefreshToken(userData);
    
    res.json({
      success: true,
      accessToken,
      refreshToken
    });
  } catch (error) {
    console.error('Erreur lors du rafraîchissement du token:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du rafraîchissement du token'
    });
  }
});

/**
 * GET /api/auth/logout
 * Déconnexion de l'utilisateur
 */
router.get('/logout', authenticate, async (req, res) => {
  // Pour une vraie implémentation de logout avec JWT, 
  // on pourrait ajouter le token à une liste noire en base de données
  res.json({
    success: true,
    message: 'Déconnexion réussie'
  });
});

/**
 * POST /api/auth/logout-all
 * Déconnexion de toutes les sessions de l'utilisateur
 * Note: Avec notre implémentation actuelle de JWT, cette fonctionnalité nécessiterait
 * une liste noire de tokens maintenue en base de données.
 */
router.post('/logout-all', authenticate, async (req, res) => {
  // Cette implémentation est simplifiée
  // Pour une implémentation complète, il faudrait ajouter tous les tokens
  // de l'utilisateur à une liste noire en base de données
  res.json({
    success: true,
    message: 'Déconnexion de toutes les sessions réussie'
  });
});

/**
 * POST /api/auth/register
 * Création d'un nouvel utilisateur
 */
router.post('/register', async (req, res) => {
  try {
    const { login, password, password2, firstname, lastname, email } = req.body;
    
    // Validation de base
    if (!login || !password || !password2 || !firstname || !lastname) {
      return res.status(400).json({
        success: false, 
        message: 'Tous les champs sont obligatoires'
      });
    }
    
    if (password !== password2) {
      return res.status(400).json({
        success: false,
        message: 'Les mots de passe ne correspondent pas'
      });
    }

    // Validation de l'email si fourni
    if (email && !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      return res.status(400).json({
        success: false,
        message: 'Format d\'email invalide'
      });
    }
    
    const usersCollection = await getCollection('users');
    
    // Vérifier si le login existe déjà
    const existingUser = await usersCollection.findOne({ login });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Ce nom d\'utilisateur est déjà pris'
      });
    }
    
    // Hacher le mot de passe
    const hashedPassword = await hashPassword(password);
    
    // Créer le nouvel utilisateur avec le statut 'pending'
    const user = {      login,
      passwordHash: hashedPassword,
      firstName: firstname,
      lastName: lastname,
      email: email || '',
      bio: '',
      role: 'user',
      status: 'pending', // Par défaut, le statut est 'pending'
      createdAt: new Date(),
      lastLogin: null
    };
    
    const result = await usersCollection.insertOne(user);
    
    if (!result.acknowledged) {
      throw new Error('Échec de création de l\'utilisateur');
    }

    // Ne pas renvoyer le mot de passe dans la réponse
    const { password: _, ...userWithoutPassword } = user;
    
    res.status(201).json({
      success: true,
      message: 'Inscription réussie, en attente d\'approbation par un administrateur',
      user: userWithoutPassword
    });
    
  } catch (error) {
    console.error('Erreur d\'inscription:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'inscription'
    });
  }
});

/**
 * POST /api/auth/login
 * Connexion d'un utilisateur - Renvoie un JWT
 */
router.post('/login', async (req, res) => {
  try {
    const { login, password } = req.body;
    
    if (!login || !password) {
      return res.status(400).json({
        success: false, 
        message: 'Identifiant et mot de passe requis'
      });
    }
    
    const usersCollection = await getCollection('users');
    
    const user = await usersCollection.findOne({ login });
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Identifiant ou mot de passe incorrect'
      });
    }
    
    // Vérification du statut de l'utilisateur
    if (user.status === 'pending') {
      return res.status(403).json({
        success: false,
        message: 'Votre compte est en attente d\'approbation par un administrateur'
      });
    } else if (user.status === 'inactive' || user.status === 'rejected') {
      return res.status(403).json({
        success: false,
        message: 'Votre compte a été désactivé. Contactez un administrateur.'
      });
    }
    
    const passwordMatch = await verifyPassword(password, user.passwordHash);
    
    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Identifiant ou mot de passe incorrect'
      });
    }
    
    const userData = {
      userId: user._id.toString(),
      login: user.login,
      role: user.role
    };
    
    try {
      // Générer les tokens JWT
      const accessToken = generateAccessToken(userData);
      const refreshToken = generateRefreshToken(userData);
      
      // Mettre à jour la date de dernière connexion
      await usersCollection.updateOne(
        { _id: user._id },
        { $set: { lastLogin: new Date() } }
      );
      
      res.json({
        success: true,
        message: 'Connexion réussie',
        user: {
          id: user._id.toString(),
          login: user.login,
          firstName: user.firstName || user.firstname,
          lastName: user.lastName || user.lastname,
          role: user.role
        },
        accessToken,
        refreshToken
      });
    } catch (tokenError) {
      console.error('Erreur lors de la génération du token:', tokenError);
      res.status(500).json({
        success: false,
        message: 'Impossible de créer une session sécurisée. Vérifiez la connexion à la base de données.'
      });
    }
    
  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

module.exports = router;