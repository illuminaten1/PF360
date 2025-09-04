const express = require('express');
const router = express.Router();
const { getRecentWeeklyStats, getStatistiquesAdministratives, getStatistiquesBAP, getFluxMensuels, getFluxHebdomadaires, getAutoControle, getAnneesDisponibles } = require('../controllers/statistiquesController');
const { authMiddleware } = require('../middleware/auth');

// GET /api/statistiques/recent - Récupérer les dernières statistiques hebdomadaires
router.get('/recent', authMiddleware, getRecentWeeklyStats);

// GET /api/statistiques/administratives - Récupérer les statistiques administratives par année
router.get('/administratives', authMiddleware, getStatistiquesAdministratives);

// GET /api/statistiques/bap - Récupérer les statistiques BAP par année
router.get('/bap', authMiddleware, getStatistiquesBAP);

// GET /api/statistiques/flux-mensuels - Récupérer les flux mensuels par année
router.get('/flux-mensuels', authMiddleware, getFluxMensuels);

// GET /api/statistiques/flux-hebdomadaires - Récupérer les flux hebdomadaires par année
router.get('/flux-hebdomadaires', authMiddleware, getFluxHebdomadaires);

// GET /api/statistiques/auto-controle - Récupérer les statistiques d'auto-contrôle par année
router.get('/auto-controle', authMiddleware, getAutoControle);

// GET /api/statistiques/annees-disponibles - Récupérer les années ayant des données
router.get('/annees-disponibles', authMiddleware, getAnneesDisponibles);

module.exports = router;