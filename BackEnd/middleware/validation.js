/**
 * Middleware de validation des requêtes
 * Définit des validateurs pour les différentes routes de l'API
 */

const { body, param, query, validationResult } = require('express-validator');
const { COLLECTIONS } = require('../config/database');
const { getCollection } = require('../utils/dbConnection');

/**
 * Vérifie les résultats de validation et renvoie une erreur si nécessaire
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Fonction Express next
 * @returns {Object|undefined} Erreur de validation ou passe au middleware suivant
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Échec de validation',
      errors: errors.array()
    });
  }
  next();
};

/**
 * Validations pour l'inscription d'un utilisateur
 */
const registerValidation = [
  body('login')
    .trim()
    .isLength({ min: 3, max: 50 }).withMessage('Le login doit contenir entre 3 et 50 caractères')
    .matches(/^[a-zA-Z0-9._-]+$/).withMessage('Le login ne peut contenir que des lettres, chiffres, points, tirets et underscores')
    .custom(async (value) => {
      const usersCollection = await getCollection(COLLECTIONS.USERS);
      const existingUser = await usersCollection.findOne({ login: value });
      if (existingUser) {
        throw new Error('Ce login est déjà utilisé');
      }
      return true;
    }),
  
  body('password')
    .isLength({ min: 6 }).withMessage('Le mot de passe doit contenir au moins 6 caractères')
    .matches(/\d/).withMessage('Le mot de passe doit contenir au moins un chiffre')
    .matches(/[a-z]/).withMessage('Le mot de passe doit contenir au moins une lettre minuscule')
    .matches(/[A-Z]/).withMessage('Le mot de passe doit contenir au moins une lettre majuscule'),
  
  body('password2')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Les mots de passe ne correspondent pas');
      }
      return true;
    }),
  
  body('firstname')
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('Le prénom doit contenir entre 2 et 50 caractères'),
  
  body('lastname')
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('Le nom doit contenir entre 2 et 50 caractères'),
  
  validate
];

/**
 * Validations pour la connexion d'un utilisateur
 */
const loginValidation = [
  body('login')
    .trim()
    .notEmpty().withMessage('Login requis'),
  
  body('password')
    .notEmpty().withMessage('Mot de passe requis'),
  
  validate
];

/**
 * Validations pour la mise à jour du profil
 */
const updateProfileValidation = [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('Le prénom doit contenir entre 2 et 50 caractères'),
  
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('Le nom doit contenir entre 2 et 50 caractères'),
  
  validate
];

/**
 * Validations pour l'ajout d'un message
 */
const messageValidation = [
  body('text')
    .trim()
    .notEmpty().withMessage('Le contenu du message est requis')
    .isLength({ max: 1000 }).withMessage('Le message ne peut pas dépasser 1000 caractères'),
  
  validate
];

/**
 * Validations pour les paramètres d'ID (ObjectId)
 */
const objectIdValidation = (paramName) => [
  param(paramName)
    .isString().withMessage(`L'identifiant ${paramName} doit être une chaîne de caractères`)
    .matches(/^[0-9a-fA-F]{24}$/).withMessage(`L'identifiant ${paramName} n'est pas valide`),
  
  validate
];

module.exports = {
  validate,
  registerValidation,
  loginValidation,
  updateProfileValidation,
  messageValidation,
  objectIdValidation
};