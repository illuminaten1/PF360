const express = require('express');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const {
  getUsers,
  getUsersStats,
  createUser,
  updateUser,
  deleteUser
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

// Supprimer un utilisateur
router.delete('/:id', adminMiddleware, deleteUser);

module.exports = router;