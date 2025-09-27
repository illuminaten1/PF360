const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const { getDashboardStats } = require('../controllers/dashboardController');

const router = express.Router();

router.use(authMiddleware);

// GET /api/dashboard/stats - Récupérer les statistiques du dashboard pour l'utilisateur connecté
router.get('/stats', getDashboardStats);

module.exports = router;