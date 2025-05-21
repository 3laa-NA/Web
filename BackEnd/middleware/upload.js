/**
 * Middleware de gestion des uploads de fichiers
 * Configuration de multer pour les téléchargements de fichiers
 */

const multer = require('multer');
const path = require('path');

// Configuration de multer pour le stockage des avatars
const avatarStorage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, path.join(__dirname, '../uploads/avatars'));
  },
  filename: function(req, file, cb) {
    // Utiliser l'ID de l'utilisateur et l'horodatage pour éviter les conflits de noms
    const userId = req.user.id;
    const timestamp = Date.now();
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${userId}-${timestamp}${ext}`);
  }
});

// Filtre pour n'autoriser que les images
const imageFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Type de fichier non autorisé. Seuls JPG, PNG et GIF sont acceptés.'), false);
  }
};

// Configuration pour les avatars
const uploadAvatar = multer({ 
  storage: avatarStorage,
  limits: { fileSize: 2 * 1024 * 1024 }, // Limite à 2 MB
  fileFilter: imageFilter 
});

module.exports = {
  uploadAvatar
};