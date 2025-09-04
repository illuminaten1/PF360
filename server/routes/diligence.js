const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/auth');
const { logAction } = require('../utils/logger');

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
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Récupérer les statistiques des diligences
router.get('/stats', async (req, res) => {
  try {
    const totalDiligences = await prisma.diligence.count();
    
    const stats = {
      totalDiligences
    };
    
    res.json(stats);
  } catch (error) {
    console.error('Get diligences stats error:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Créer une nouvelle diligence
router.post('/', async (req, res) => {
  try {
    const { nom, details } = req.body;
    
    if (!nom || !details) {
      return res.status(400).json({ message: 'Nom et détails sont requis' });
    }

    const diligence = await prisma.diligence.create({
      data: {
        nom,
        details,
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

    await logAction(req.user.id, 'CREATE_DILIGENCE', `Création diligence ${diligence.nom}`, 'Diligence', diligence.id);

    res.status(201).json(diligence);
  } catch (error) {
    console.error('Create diligence error:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Mettre à jour une diligence
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nom, details, active } = req.body;

    const diligence = await prisma.diligence.update({
      where: { id },
      data: {
        ...(nom && { nom }),
        ...(details && { details }),
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

    await logAction(req.user.id, 'UPDATE_DILIGENCE', `Modification diligence ${diligence.nom}`, 'Diligence', diligence.id);

    res.json(diligence);
  } catch (error) {
    console.error('Update diligence error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Diligence non trouvée' });
    }
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Supprimer une diligence
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const diligence = await prisma.diligence.findUnique({ where: { id } });
    
    await prisma.diligence.delete({
      where: { id }
    });

    await logAction(req.user.id, 'DELETE_DILIGENCE', `Suppression diligence ${diligence?.nom}`, 'Diligence', id);

    res.status(204).send();
  } catch (error) {
    console.error('Delete diligence error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Diligence non trouvée' });
    }
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;