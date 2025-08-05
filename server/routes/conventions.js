const express = require('express');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

router.get('/', (req, res) => {
  res.json({ message: 'Get all conventions - TODO' });
});

router.post('/', (req, res) => {
  res.json({ message: 'Create convention - TODO' });
});

router.get('/:id', (req, res) => {
  res.json({ message: 'Get convention by id - TODO' });
});

router.put('/:id', (req, res) => {
  res.json({ message: 'Update convention - TODO' });
});

router.delete('/:id', (req, res) => {
  res.json({ message: 'Delete convention - TODO' });
});

module.exports = router;