const express = require('express');
const router = express.Router();
const { getWeeklyStats, getAvailableYears } = require('../controllers/statistiquesController');
const { authMiddleware } = require('../middleware/auth');

// GET /api/statistiques/years - Récupérer les années disponibles
router.get('/years', authMiddleware, getAvailableYears);

// GET /api/statistiques/weekly - Récupérer les statistiques hebdomadaires
router.get('/weekly', authMiddleware, getWeeklyStats);

module.exports = router;