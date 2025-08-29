const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/auth');
const { logAction } = require('../utils/logger');

const router = express.Router();
const prisma = new PrismaClient();

router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const visas = await prisma.visa.findMany({
      where: {
        typeVisa: {
          in: ['CIVIL', 'MILITAIRE']
        }
      },
      orderBy: [
        { typeVisa: 'asc' }
      ]
    });

    await logAction(req.user.id, 'LIST_VISAS', `Consultation des visas (${visas.length} résultats)`);

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
        active: true,
        typeVisa: {
          in: ['CIVIL', 'MILITAIRE']
        }
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
    const totalVisas = await prisma.visa.count({
      where: {
        typeVisa: {
          in: ['CIVIL', 'MILITAIRE']
        }
      }
    });
    const visasActifs = await prisma.visa.count({
      where: { 
        active: true,
        typeVisa: {
          in: ['CIVIL', 'MILITAIRE']
        }
      }
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
router.get('/:id/usage', async (_req, res) => {
  try {
    // Pour l'instant, simulons le comptage d'utilisation
    // Dans le futur, il faudrait ajouter une relation avec les décisions
    const usage = 0;
    
    res.json({ usage });
  } catch (error) {
    console.error('Get Visa usage error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});


router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { texteVisa, active } = req.body;
    
    if (!texteVisa) {
      return res.status(400).json({ error: 'Le texte du visa est requis' });
    }

    // Vérifier que le visa existe et est l'un des deux visas autorisés
    const currentVisa = await prisma.visa.findUnique({
      where: { id }
    });

    if (!currentVisa) {
      return res.status(404).json({ error: 'Visa introuvable' });
    }

    if (!['CIVIL', 'MILITAIRE'].includes(currentVisa.typeVisa)) {
      return res.status(403).json({ error: 'Ce visa ne peut pas être modifié' });
    }

    const visa = await prisma.visa.update({
      where: { id },
      data: { 
        texteVisa,
        active: active !== undefined ? active : true
      }
    });

    await logAction(req.user.id, 'UPDATE_VISA', `Modification visa ${visa.typeVisa}`, 'Visa', visa.id);

    res.json(visa);
  } catch (error) {
    console.error('Update Visa error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Visa introuvable' });
    }
    res.status(500).json({ error: 'Erreur serveur' });
  }
});


module.exports = router;