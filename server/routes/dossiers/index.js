const express = require('express');
const { authMiddleware } = require('../../middleware/auth');

// Import des routes spécialisées
const listRoutes = require('./list');
const createRoutes = require('./create');
const getRoutes = require('./get');
const updateRoutes = require('./update');
const deleteRoutes = require('./delete');

const router = express.Router();

// Middleware d'authentification
router.use(authMiddleware);

// Utilisation des routes spécialisées
router.use('/', listRoutes);
router.use('/', createRoutes);
router.use('/', getRoutes);
router.use('/', updateRoutes);
router.use('/', deleteRoutes);

module.exports = router;