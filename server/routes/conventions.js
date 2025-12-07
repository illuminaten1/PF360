const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const {
  getAllConventions,
  getFacets,
  getStats,
  getConventionById,
  createConvention,
  updateConvention,
  deleteConvention
} = require('../controllers/conventionController');

const router = express.Router();

router.use(authMiddleware);

router.get('/facets', getFacets);
router.get('/stats', getStats);
router.get('/', getAllConventions);
router.post('/', createConvention);
router.get('/:id', getConventionById);
router.put('/:id', updateConvention);
router.delete('/:id', deleteConvention);

module.exports = router;