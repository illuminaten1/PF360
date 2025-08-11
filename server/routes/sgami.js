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

// Récupérer les statistiques des SGAMI
router.get('/stats', async (req, res) => {
  try {
    const totalSGAMI = await prisma.sgami.count();
    
    // Pour l'instant, nous n'avons pas de champ "active" dans le modèle SGAMI
    // donc nous comptons tous comme actifs
    const activeSGAMI = totalSGAMI;
    const inactiveSGAMI = 0;
    
    const stats = {
      totalSGAMI,
      activeSGAMI,
      inactiveSGAMI
    };
    
    res.json(stats);
  } catch (error) {
    console.error('Get SGAMI stats error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { nom } = req.body;
    
    if (!nom) {
      return res.status(400).json({ error: 'Le nom est requis' });
    }

    const existingSgami = await prisma.sgami.findUnique({
      where: { nom }
    });

    if (existingSgami) {
      return res.status(400).json({ error: 'Un SGAMI avec ce nom existe déjà' });
    }

    const sgami = await prisma.sgami.create({
      data: { nom }
    });

    res.status(201).json(sgami);
  } catch (error) {
    console.error('Create SGAMI error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nom } = req.body;
    
    if (!nom) {
      return res.status(400).json({ error: 'Le nom est requis' });
    }

    const existingSgami = await prisma.sgami.findFirst({
      where: { nom, NOT: { id } }
    });

    if (existingSgami) {
      return res.status(400).json({ error: 'Un SGAMI avec ce nom existe déjà' });
    }

    const sgami = await prisma.sgami.update({
      where: { id },
      data: { nom }
    });

    res.json(sgami);
  } catch (error) {
    console.error('Update SGAMI error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'SGAMI introuvable' });
    }
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Vérifier si le SGAMI a des dossiers associés
    const dossiersCount = await prisma.dossier.count({
      where: { sgamiId: id }
    });

    if (dossiersCount > 0) {
      return res.status(400).json({ 
        error: `Impossible de supprimer ce SGAMI car il est associé à ${dossiersCount} dossier${dossiersCount > 1 ? 's' : ''}` 
      });
    }

    await prisma.sgami.delete({
      where: { id }
    });

    res.json({ message: 'SGAMI supprimé avec succès' });
  } catch (error) {
    console.error('Delete SGAMI error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'SGAMI introuvable' });
    }
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;