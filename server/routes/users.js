const express = require('express');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const {
  getUsers,
  getUsersStats,
  createUser,
  updateUser,
  deactivateUser,
  reactivateUser,
  transferAssignments
} = require('../controllers/userController');

const router = express.Router();

router.use(authMiddleware);

// Récupérer tous les utilisateurs
router.get('/', adminMiddleware, getUsers);

// Récupérer les statistiques des utilisateurs
router.get('/stats', adminMiddleware, getUsersStats);

// Créer un utilisateur
router.post('/', adminMiddleware, createUser);

// Mettre à jour un utilisateur
router.put('/:id', adminMiddleware, updateUser);

// Désactiver un utilisateur
router.put('/:id/deactivate', adminMiddleware, deactivateUser);

// Réactiver un utilisateur
router.put('/:id/reactivate', adminMiddleware, reactivateUser);

// Transférer les assignations entre rédacteurs
router.post('/transfer-assignments', adminMiddleware, transferAssignments);

module.exports = router;