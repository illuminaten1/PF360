const express = require('express');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

router.get('/', (req, res) => {
  res.json({ message: 'Get all demandes - TODO' });
});

router.post('/', (req, res) => {
  res.json({ message: 'Create demande - TODO' });
});

router.get('/:id', (req, res) => {
  res.json({ message: 'Get demande by id - TODO' });
});

router.put('/:id', (req, res) => {
  res.json({ message: 'Update demande - TODO' });
});

router.delete('/:id', (req, res) => {
  res.json({ message: 'Delete demande - TODO' });
});

module.exports = router;