const express = require('express');
const { getAllDossiers, getFacets } = require('../../controllers/dossierController');

const router = express.Router();

router.get('/facets', getFacets);
router.get('/', getAllDossiers);

module.exports = router;
