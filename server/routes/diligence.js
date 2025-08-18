const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const diligences = await prisma.diligence.findMany({
      include: {
        creePar: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            grade: true
          }
        },
        modifiePar: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            grade: true
          }
        }
      },
      orderBy: {
        nom: 'asc'
      }
    });

    res.json(diligences);
  } catch (error) {
    console.error('Get diligences error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Récupérer les statistiques des diligences
router.get('/stats', async (req, res) => {
  try {
    const totalDiligences = await prisma.diligence.count();
    
    const activeDiligences = await prisma.diligence.count({
      where: {
        active: true
      }
    });
    
    const inactiveDiligences = totalDiligences - activeDiligences;
    
    const forfaitaires = await prisma.diligence.count({
      where: {
        typeTarification: 'FORFAITAIRE'
      }
    });
    
    const demiJournee = await prisma.diligence.count({
      where: {
        typeTarification: 'DEMI_JOURNEE'
      }
    });
    
    const stats = {
      totalDiligences,
      activeDiligences,
      inactiveDiligences,
      forfaitaires,
      demiJournee
    };
    
    res.json(stats);
  } catch (error) {
    console.error('Get diligences stats error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Créer une nouvelle diligence
router.post('/', async (req, res) => {
  try {
    const { nom, details, typeTarification } = req.body;
    
    if (!nom || !details || !typeTarification) {
      return res.status(400).json({ error: 'Nom, détails et type de tarification sont requis' });
    }

    if (!['FORFAITAIRE', 'DEMI_JOURNEE'].includes(typeTarification)) {
      return res.status(400).json({ error: 'Type de tarification invalide' });
    }

    const diligence = await prisma.diligence.create({
      data: {
        nom,
        details,
        typeTarification,
        active: true,
        creeParId: req.user.id
      },
      include: {
        creePar: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            grade: true
          }
        }
      }
    });

    res.status(201).json(diligence);
  } catch (error) {
    console.error('Create diligence error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Mettre à jour une diligence
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nom, details, typeTarification, active } = req.body;

    if (typeTarification && !['FORFAITAIRE', 'DEMI_JOURNEE'].includes(typeTarification)) {
      return res.status(400).json({ error: 'Type de tarification invalide' });
    }

    const diligence = await prisma.diligence.update({
      where: { id },
      data: {
        ...(nom && { nom }),
        ...(details && { details }),
        ...(typeTarification && { typeTarification }),
        ...(typeof active === 'boolean' && { active }),
        modifieParId: req.user.id
      },
      include: {
        creePar: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            grade: true
          }
        },
        modifiePar: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            grade: true
          }
        }
      }
    });

    res.json(diligence);
  } catch (error) {
    console.error('Update diligence error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Diligence non trouvée' });
    }
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Supprimer une diligence
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.diligence.delete({
      where: { id }
    });

    res.status(204).send();
  } catch (error) {
    console.error('Delete diligence error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Diligence non trouvée' });
    }
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;