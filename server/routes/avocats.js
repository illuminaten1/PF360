const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const avocats = await prisma.avocat.findMany({
      orderBy: {
        nom: 'asc'
      }
    });
    res.json(avocats);
  } catch (error) {
    console.error('Get avocats error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/', (req, res) => {
  res.json({ message: 'Create avocat - TODO' });
});

router.get('/:id', (req, res) => {
  res.json({ message: 'Get avocat by id - TODO' });
});

router.put('/:id', (req, res) => {
  res.json({ message: 'Update avocat - TODO' });
});

router.delete('/:id', (req, res) => {
  res.json({ message: 'Delete avocat - TODO' });
});

module.exports = router;