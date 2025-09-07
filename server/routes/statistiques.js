const express = require('express');
const router = express.Router();
const { getRecentWeeklyStats, getStatistiquesAdministratives, getStatistiquesBAP, getStatistiquesQualiteDemandeur, getStatistiquesTypeInfraction, getStatistiquesContexteMissionnel, getStatistiquesFormationAdministrative, getStatistiquesBranche, getStatistiquesStatutDemandeur, getStatistiquesBadges, getFluxMensuels, getFluxHebdomadaires, getAutoControle, getExtractionMensuelle, getAnneesDisponibles, getStatistiquesReponseBRPF, getStatistiquesBudgetaires, getEngagementServicePayeur, getEngagementDepensesMensuelles } = require('../controllers/statistiquesController');
const { authMiddleware } = require('../middleware/auth');

// GET /api/statistiques/recent - Récupérer les dernières statistiques hebdomadaires
router.get('/recent', authMiddleware, getRecentWeeklyStats);

// GET /api/statistiques/administratives - Récupérer les statistiques administratives par année
router.get('/administratives', authMiddleware, getStatistiquesAdministratives);

// GET /api/statistiques/bap - Récupérer les statistiques BAP par année
router.get('/bap', authMiddleware, getStatistiquesBAP);

// GET /api/statistiques/qualite-demandeur - Récupérer les statistiques qualité demandeur par année
router.get('/qualite-demandeur', authMiddleware, getStatistiquesQualiteDemandeur);

// GET /api/statistiques/type-infraction - Récupérer les statistiques type infraction par année
router.get('/type-infraction', authMiddleware, getStatistiquesTypeInfraction);

// GET /api/statistiques/contexte-missionnel - Récupérer les statistiques contexte missionnel par année
router.get('/contexte-missionnel', authMiddleware, getStatistiquesContexteMissionnel);

// GET /api/statistiques/formation-administrative - Récupérer les statistiques formation administrative par année
router.get('/formation-administrative', authMiddleware, getStatistiquesFormationAdministrative);

// GET /api/statistiques/branche - Récupérer les statistiques branche par année
router.get('/branche', authMiddleware, getStatistiquesBranche);

// GET /api/statistiques/statut-demandeur - Récupérer les statistiques statut demandeur par année
router.get('/statut-demandeur', authMiddleware, getStatistiquesStatutDemandeur);

// GET /api/statistiques/badges - Récupérer les statistiques badges par année
router.get('/badges', authMiddleware, getStatistiquesBadges);

// GET /api/statistiques/flux-mensuels - Récupérer les flux mensuels par année
router.get('/flux-mensuels', authMiddleware, getFluxMensuels);

// GET /api/statistiques/flux-hebdomadaires - Récupérer les flux hebdomadaires par année
router.get('/flux-hebdomadaires', authMiddleware, getFluxHebdomadaires);

// GET /api/statistiques/auto-controle - Récupérer les statistiques d'auto-contrôle par année
router.get('/auto-controle', authMiddleware, getAutoControle);

// GET /api/statistiques/extraction-mensuelle - Récupérer l'extraction mensuelle pour BAA/SP par année
router.get('/extraction-mensuelle', authMiddleware, getExtractionMensuelle);

// GET /api/statistiques/annees-disponibles - Récupérer les années ayant des données
router.get('/annees-disponibles', authMiddleware, getAnneesDisponibles);

// GET /api/statistiques/reponse-brpf - Récupérer les statistiques de réponse BRPF par année
router.get('/reponse-brpf', authMiddleware, getStatistiquesReponseBRPF);

// GET /api/statistiques/budgetaires - Récupérer les statistiques budgétaires par année
router.get('/budgetaires', authMiddleware, getStatistiquesBudgetaires);

// GET /api/statistiques/engagement-service-payeur - Récupérer les engagements par service payeur par année
router.get('/engagement-service-payeur', authMiddleware, getEngagementServicePayeur);

// GET /api/statistiques/engagement-depenses-mensuelles - Récupérer les engagements de dépenses mensuelles par année
router.get('/engagement-depenses-mensuelles', authMiddleware, getEngagementDepensesMensuelles);

module.exports = router;