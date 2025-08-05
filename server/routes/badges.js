const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const badges = await prisma.badge.findMany({
      orderBy: {
        nom: 'asc'
      }
    });
    res.json(badges);
  } catch (error) {
    console.error('Get badges error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/', (req, res) => {
  res.json({ message: 'Create badge - TODO' });
});

router.put('/:id', (req, res) => {
  res.json({ message: 'Update badge - TODO' });
});

router.delete('/:id', (req, res) => {
  res.json({ message: 'Delete badge - TODO' });
});

module.exports = router;