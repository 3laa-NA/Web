/**
 * Routes de débogage
 * Utilisées uniquement pour le développement et le débogage
 */

const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { getCollection } = require('../utils/dbConnection');

/**
 * GET /api/debug/current-user
 * Renvoie les informations sur l'utilisateur actuellement connecté
 */
router.get('/current-user', requireAuth, (req, res) => {
  // Ne pas exposer des données sensibles
  const { passwordHash, ...safeUserData } = req.user;

  // Ajouter des infos utiles pour le débogage
  const userData = {
    ...safeUserData,
    id: req.user.id || (req.user._id ? req.user._id.toString() : null),
    _idType: req.user._id ? typeof req.user._id : null,
    _idToString: req.user._id ? req.user._id.toString() : null,
    authMethod: req.tokenPayload ? 'jwt' : 'unknown'
  };

  res.json({
    success: true,
    user: userData
  });
});

/**
 * GET /api/debug/search-users
 * Recherche d'utilisateurs sans authentification (MODE DEBUG UNIQUEMENT)
 * Utile pour tester si le problème d'affichage vient de l'authentification
 */
router.get('/search-users', async (req, res) => {
  try {
    const { q: searchTerm } = req.query;
    
    if (!searchTerm || searchTerm.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Le terme de recherche doit contenir au moins 2 caractères'
      });
    }
    
    console.log('Recherche d\'utilisateurs avec le terme (mode debug):', searchTerm);
    
    const usersCollection = await getCollection('users');
    
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
        login: 1,
        avatar: 1
      },
      limit: 10
    }).toArray();
    
    console.log('Utilisateurs trouvés (mode debug):', users.length);
    
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
    console.error('Erreur lors de la recherche d\'utilisateurs (mode debug):', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

module.exports = router;
