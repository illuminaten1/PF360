const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const {
  getAllDemandes,
  getDemandeById,
  createDemande,
  updateDemande,
  deleteDemande,
  getUsers,
  getStats
} = require('../controllers/demandeController');

const router = express.Router();

router.use(authMiddleware);

router.get('/stats', getStats);
router.get('/users', getUsers);
router.get('/', getAllDemandes);
router.post('/', createDemande);
router.get('/:id', getDemandeById);
router.put('/:id', updateDemande);
router.delete('/:id', deleteDemande);

module.exports = router;