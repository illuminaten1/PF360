const express = require('express');
const router = express.Router();
const { getWeeklyStats } = require('../controllers/statistiquesController');
const { authMiddleware } = require('../middleware/auth');

// GET /api/statistiques/weekly - Récupérer les statistiques hebdomadaires
router.get('/weekly', authMiddleware, getWeeklyStats);

module.exports = router;