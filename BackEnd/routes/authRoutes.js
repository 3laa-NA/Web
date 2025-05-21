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
    const { login, password, password2, firstname, lastname } = req.body;
    
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
    
    const usersCollection = await getCollection('users');
    
    // Vérification de l'unicité du login
    const existingUser = await usersCollection.findOne({ login });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Un utilisateur avec ce login existe déjà'
      });
    }
    
    // Récupération des paramètres système
    const settingsCollection = await getCollection('settings');
    const settings = await settingsCollection.findOne({ key: 'system' });
    
    // Détermination du statut initial de l'utilisateur
    const requiresApproval = settings?.registrationRequiresApproval || false;
    const initialStatus = requiresApproval ? 'pending' : 'active';
    
    // Hachage du mot de passe et création de l'utilisateur
    const hashedPassword = await hashPassword(password);
    
    const result = await usersCollection.insertOne({
      login,
      passwordHash: hashedPassword,
      firstName: firstname,
      lastName: lastname,
      role: 'user',
      status: initialStatus,
      createdAt: new Date()
    });
    
    res.status(201).json({
      success: true,
      message: requiresApproval 
        ? 'Compte créé avec succès. En attente d\'approbation par un administrateur.' 
        : 'Utilisateur créé avec succès',
      userId: result.insertedId
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