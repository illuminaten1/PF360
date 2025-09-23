const express = require('express');
const { authMiddleware } = require('../../middleware/auth');

// Import des routes spécialisées
const fichePaiementRoutes = require('./fiche-paiement');
const avenantRoutes = require('./avenant');
const conventionRoutes = require('./convention');
const decisionRoutes = require('./decision');

const router = express.Router();

// Middleware d'authentification
router.use(authMiddleware);

// Utilisation des routes spécialisées
router.use('/', fichePaiementRoutes);
router.use('/', avenantRoutes);
router.use('/', conventionRoutes);
router.use('/', decisionRoutes);

module.exports = router;