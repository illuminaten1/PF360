const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const {
  getAllDecisions,
  getFacets,
  getStats,
  getDecisionById,
  createDecision,
  updateDecision,
  deleteDecision
} = require('../controllers/decisionController');

const router = express.Router();

router.use(authMiddleware);

router.get('/facets', getFacets);
router.get('/stats', getStats);
router.get('/', getAllDecisions);
router.post('/', createDecision);
router.get('/:id', getDecisionById);
router.put('/:id', updateDecision);
router.delete('/:id', deleteDecision);

module.exports = router;