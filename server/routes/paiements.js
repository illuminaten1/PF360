const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const {
  getAllPaiements,
  getFacets,
  getStats,
  getPaiementById,
  createPaiement,
  updatePaiement,
  deletePaiement
} = require('../controllers/paiementController');

const router = express.Router();

router.use(authMiddleware);

// Routes pour server-side rendering
router.get('/facets', getFacets);
router.get('/stats', getStats);

// Route principale avec pagination et filtres
router.get('/', getAllPaiements);

// Routes CRUD
router.post('/', createPaiement);
router.get('/:id', getPaiementById);
router.put('/:id', updatePaiement);
router.delete('/:id', deletePaiement);

module.exports = router;