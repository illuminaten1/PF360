const express = require('express');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

router.get('/', (req, res) => {
  res.json({ message: 'Get all paiements - TODO' });
});

router.post('/', (req, res) => {
  res.json({ message: 'Create paiement - TODO' });
});

router.get('/:id', (req, res) => {
  res.json({ message: 'Get paiement by id - TODO' });
});

router.put('/:id', (req, res) => {
  res.json({ message: 'Update paiement - TODO' });
});

router.delete('/:id', (req, res) => {
  res.json({ message: 'Delete paiement - TODO' });
});

module.exports = router;