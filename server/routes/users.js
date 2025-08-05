const express = require('express');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

router.get('/', adminMiddleware, (req, res) => {
  res.json({ message: 'Get all users - TODO' });
});

router.post('/', adminMiddleware, (req, res) => {
  res.json({ message: 'Create user - TODO' });
});

router.put('/:id', adminMiddleware, (req, res) => {
  res.json({ message: 'Update user - TODO' });
});

router.delete('/:id', adminMiddleware, (req, res) => {
  res.json({ message: 'Delete user - TODO' });
});

module.exports = router;