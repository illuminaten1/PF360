const express = require('express');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

router.get('/', (req, res) => {
  res.json({ message: 'Get all decisions - TODO' });
});

router.post('/', (req, res) => {
  res.json({ message: 'Create decision - TODO' });
});

router.get('/:id', (req, res) => {
  res.json({ message: 'Get decision by id - TODO' });
});

router.put('/:id', (req, res) => {
  res.json({ message: 'Update decision - TODO' });
});

router.delete('/:id', (req, res) => {
  res.json({ message: 'Delete decision - TODO' });
});

module.exports = router;