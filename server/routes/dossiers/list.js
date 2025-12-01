const express = require('express');
const { getAllDossiers, getFacets, getStats } = require('../../controllers/dossierController');

const router = express.Router();

router.get('/facets', getFacets);
router.get('/stats', getStats);
router.get('/', getAllDossiers);

module.exports = router;