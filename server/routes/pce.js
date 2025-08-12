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
        { ordre: 'asc' }
      ]
    });

    res.json(pce);
  } catch (error) {
    console.error('Get PCE error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Récupérer les PCE pour les sélecteurs (format simplifié)
router.get('/options', async (req, res) => {
  try {
    const pce = await prisma.pce.findMany({
      select: {
        id: true,
        ordre: true,
        pceDetaille: true,
        pceNumerique: true,
        codeMarchandise: true
      },
      orderBy: [
        { ordre: 'asc' }
      ]
    });

    res.json(pce);
  } catch (error) {
    console.error('Get PCE options error:', error);
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

// Route pour réorganiser les ordres des PCE (DOIT être avant la route /:id)
router.put('/reorder', async (req, res) => {
  try {
    const { pceList } = req.body;
    
    if (!Array.isArray(pceList)) {
      return res.status(400).json({ error: 'La liste des PCE doit être un tableau' });
    }

    // Utiliser une transaction pour mettre à jour tous les ordres
    await prisma.$transaction(async (tx) => {
      // Étape 1: Assigner des ordres temporaires uniques pour éviter les conflits
      for (let i = 0; i < pceList.length; i++) {
        const pce = pceList[i];
        const tempOrder = 10000 + i; // Ordre temporaire unique
        await tx.pce.update({
          where: { id: pce.id },
          data: { ordre: tempOrder }
        });
      }
      
      // Étape 2: Assigner les ordres finaux
      for (const pce of pceList) {
        await tx.pce.update({
          where: { id: pce.id },
          data: { ordre: pce.ordre }
        });
      }
    });

    res.json({ message: 'Ordres mis à jour avec succès' });
  } catch (error) {
    console.error('Reorder PCE error:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la réorganisation' });
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

    // Trouver le prochain ordre disponible
    const maxPce = await prisma.pce.findFirst({
      orderBy: { ordre: 'desc' }
    });
    const nextOrdre = (maxPce?.ordre || 0) + 1;

    const pce = await prisma.pce.create({
      data: { 
        ordre: nextOrdre,
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