const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const visas = await prisma.visa.findMany({
      orderBy: [
        { typeVisa: 'asc' }
      ]
    });

    res.json(visas);
  } catch (error) {
    console.error('Get Visa error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Récupérer les visas pour les sélecteurs (format simplifié)
router.get('/options', async (req, res) => {
  try {
    const visas = await prisma.visa.findMany({
      where: {
        active: true
      },
      select: {
        id: true,
        typeVisa: true,
        texteVisa: true
      },
      orderBy: [
        { typeVisa: 'asc' }
      ]
    });

    res.json(visas);
  } catch (error) {
    console.error('Get Visa options error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Récupérer les statistiques des visas
router.get('/stats', async (req, res) => {
  try {
    const totalVisas = await prisma.visa.count();
    const visasActifs = await prisma.visa.count({
      where: { active: true }
    });
    
    const stats = {
      totalVisas,
      visasActifs
    };
    
    res.json(stats);
  } catch (error) {
    console.error('Get Visa stats error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Récupérer l'utilisation d'un visa (nombre de décisions qui l'utilisent)
router.get('/:id/usage', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Pour l'instant, simulons le comptage d'utilisation
    // Dans le futur, il faudrait ajouter une relation avec les décisions
    const usage = 0;
    
    res.json({ usage });
  } catch (error) {
    console.error('Get Visa usage error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { typeVisa, texteVisa, active = true } = req.body;
    
    if (!typeVisa || !texteVisa) {
      return res.status(400).json({ error: 'Le type et le texte du visa sont requis' });
    }

    const existingVisa = await prisma.visa.findUnique({
      where: { typeVisa }
    });

    if (existingVisa) {
      return res.status(400).json({ error: 'Un visa avec ce type existe déjà' });
    }

    const visa = await prisma.visa.create({
      data: { 
        typeVisa,
        texteVisa,
        active
      }
    });

    res.status(201).json(visa);
  } catch (error) {
    console.error('Create Visa error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { typeVisa, texteVisa, active } = req.body;
    
    if (!typeVisa || !texteVisa) {
      return res.status(400).json({ error: 'Le type et le texte du visa sont requis' });
    }

    const existingVisa = await prisma.visa.findFirst({
      where: { typeVisa, NOT: { id } }
    });

    if (existingVisa) {
      return res.status(400).json({ error: 'Un visa avec ce type existe déjà' });
    }

    const visa = await prisma.visa.update({
      where: { id },
      data: { 
        typeVisa,
        texteVisa,
        active: active !== undefined ? active : true
      }
    });

    res.json(visa);
  } catch (error) {
    console.error('Update Visa error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Visa introuvable' });
    }
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier si le visa est utilisé dans des décisions
    // Note: Il faudrait avoir une relation entre les visas et les décisions
    // Pour l'instant, on peut simuler cette vérification ou l'implémenter plus tard
    
    // Option 1: Suppression logique (recommandée)
    const visa = await prisma.visa.update({
      where: { id },
      data: { active: false }
    });

    res.json({ message: 'Visa désactivé avec succès' });
    
    // Option 2: Suppression physique (décommentez si vous préférez)
    /*
    await prisma.visa.delete({
      where: { id }
    });
    res.json({ message: 'Visa supprimé avec succès' });
    */
  } catch (error) {
    console.error('Delete Visa error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Visa introuvable' });
    }
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;