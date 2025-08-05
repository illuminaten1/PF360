const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

router.use(authMiddleware);

router.get('/', adminMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;

    const logs = await prisma.log.findMany({
      include: {
        user: {
          select: {
            nom: true,
            prenom: true,
            identifiant: true
          }
        }
      },
      orderBy: {
        timestamp: 'desc'
      },
      skip: parseInt(skip),
      take: parseInt(limit)
    });

    const total = await prisma.log.count();

    res.json({
      logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get logs error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;