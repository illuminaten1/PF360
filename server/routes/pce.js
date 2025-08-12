const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const pce = await prisma.pce.findMany({
      orderBy: [
        { pceDetaille: 'asc' }
      ]
    });

    res.json(pce);
  } catch (error) {
    console.error('Get PCE error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Récupérer les statistiques des PCE
router.get('/stats', async (req, res) => {
  try {
    const totalPCE = await prisma.pce.count();
    
    const stats = {
      totalPCE
    };
    
    res.json(stats);
  } catch (error) {
    console.error('Get PCE stats error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { pceDetaille, pceNumerique, codeMarchandise } = req.body;
    
    if (!pceDetaille || !pceNumerique || !codeMarchandise) {
      return res.status(400).json({ error: 'Tous les champs sont requis' });
    }

    const existingPce = await prisma.pce.findUnique({
      where: { pceDetaille }
    });

    if (existingPce) {
      return res.status(400).json({ error: 'Un PCE avec cette description existe déjà' });
    }

    const pce = await prisma.pce.create({
      data: { 
        pceDetaille,
        pceNumerique,
        codeMarchandise
      }
    });

    res.status(201).json(pce);
  } catch (error) {
    console.error('Create PCE error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { pceDetaille, pceNumerique, codeMarchandise } = req.body;
    
    if (!pceDetaille || !pceNumerique || !codeMarchandise) {
      return res.status(400).json({ error: 'Tous les champs sont requis' });
    }

    const existingPce = await prisma.pce.findFirst({
      where: { pceDetaille, NOT: { id } }
    });

    if (existingPce) {
      return res.status(400).json({ error: 'Un PCE avec cette description existe déjà' });
    }

    const pce = await prisma.pce.update({
      where: { id },
      data: { 
        pceDetaille,
        pceNumerique,
        codeMarchandise
      }
    });

    res.json(pce);
  } catch (error) {
    console.error('Update PCE error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'PCE introuvable' });
    }
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.pce.delete({
      where: { id }
    });

    res.json({ message: 'PCE supprimé avec succès' });
  } catch (error) {
    console.error('Delete PCE error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'PCE introuvable' });
    }
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;