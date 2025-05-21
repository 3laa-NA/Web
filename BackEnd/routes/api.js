/**
 * Routes API pour Organiz'Asso
 * Point d'entrée principal pour les routes API
 * Regroupe et organise les différentes routes par domaine fonctionnel
 */

const express = require('express');
const router = express.Router();

// Import des différentes routes par domaine avec des noms de fichiers explicites
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const messageRoutes = require('./messageRoutes');
const privateMessageRoutes = require('./privateMessageRoutes');
const adminRoutes = require('./adminRoutes');
const systemRoutes = require('./systemRoutes');

// Montage des routes par domaine avec préfixes appropriés
router.use('/', systemRoutes);             // Routes système (/api/test, /api/status)
router.use('/auth', authRoutes);           // Routes d'authentification (/api/auth/*)
router.use('/user', userRoutes);           // Routes utilisateur (/api/user/*)
router.use('/messages', messageRoutes);    // Routes messages publics (/api/messages/*)
router.use('/private-messages', privateMessageRoutes); // Routes messages privés (/api/private-messages/*)
router.use('/admin', adminRoutes);         // Routes d'administration (/api/admin/*)

module.exports = router;
