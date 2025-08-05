const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const sgami = await prisma.sgami.findMany({
      orderBy: {
        nom: 'asc'
      }
    });
    res.json(sgami);
  } catch (error) {
    console.error('Get SGAMI error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/', (req, res) => {
  res.json({ message: 'Create SGAMI - TODO' });
});

router.put('/:id', (req, res) => {
  res.json({ message: 'Update SGAMI - TODO' });
});

router.delete('/:id', (req, res) => {
  res.json({ message: 'Delete SGAMI - TODO' });
});

module.exports = router;