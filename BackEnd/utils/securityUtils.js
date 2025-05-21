/**
 * Utilitaires de sécurité
 * Fournit des fonctions pour le hachage et la vérification des mots de passe
 */

const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { logger } = require('./logger');

// Nombre de tours pour bcrypt (plus élevé = plus sécurisé mais plus lent)
const SALT_ROUNDS = 12;

/**
 * Génère un hash sécurisé d'un mot de passe
 * @param {string} password - Mot de passe en clair
 * @returns {Promise<string>} Hash du mot de passe
 */
const hashPassword = async (password) => {
  try {
    return await bcrypt.hash(password, SALT_ROUNDS);
  } catch (error) {
    logger.error('Erreur lors du hachage du mot de passe:', { error: error.message });
    throw new Error('Impossible de hacher le mot de passe');
  }
};

/**
 * Vérifie si un mot de passe correspond à un hash
 * @param {string} password - Mot de passe en clair à vérifier
 * @param {string} hash - Hash stocké à comparer
 * @returns {Promise<boolean>} True si le mot de passe correspond, sinon False
 */
const verifyPassword = async (password, hash) => {
  try {
    return await bcrypt.compare(password, hash);
  } catch (error) {
    logger.error('Erreur lors de la vérification du mot de passe:', { error: error.message });
    return false;
  }
};

/**
 * Génère un jeton aléatoire sécurisé
 * @param {number} bytes - Nombre d'octets pour le jeton (par défaut: 32)
 * @returns {string} Jeton sous forme de chaîne hexadécimale
 */
const generateSecureToken = (bytes = 32) => {
  try {
    return crypto.randomBytes(bytes).toString('hex');
  } catch (error) {
    logger.error('Erreur lors de la génération d\'un jeton sécurisé:', { error: error.message });
    throw new Error('Impossible de générer un jeton sécurisé');
  }
};

/**
 * Vérifie si un mot de passe respecte les exigences de complexité
 * @param {string} password - Mot de passe à vérifier
 * @returns {Object} Résultat de la validation { isValid: boolean, errors: string[] }
 */
const validatePasswordStrength = (password) => {
  const errors = [];
  
  // Vérifier la longueur minimale
  if (!password || password.length < 8) {
    errors.push('Le mot de passe doit contenir au moins 8 caractères');
  }
  
  // Vérifier la présence d'au moins un chiffre
  if (!/\d/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins un chiffre');
  }
  
  // Vérifier la présence d'au moins une lettre minuscule
  if (!/[a-z]/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins une lettre minuscule');
  }
  
  // Vérifier la présence d'au moins une lettre majuscule
  if (!/[A-Z]/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins une lettre majuscule');
  }
  
  // Vérifier la présence d'au moins un caractère spécial
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins un caractère spécial');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Compare deux hash de façon sécurisée (évite les attaques timing)
 * @param {string} a - Premier hash
 * @param {string} b - Second hash
 * @returns {boolean} True si les hash sont identiques
 */
const safeCompare = (a, b) => {
  try {
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch (error) {
    logger.error('Erreur lors de la comparaison sécurisée:', { error: error.message });
    return false;
  }
};

module.exports = {
  hashPassword,
  verifyPassword,
  generateSecureToken,
  validatePasswordStrength,
  safeCompare
};
