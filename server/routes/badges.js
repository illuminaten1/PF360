const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { logAction } = require('../utils/logger');

const router = express.Router();
const prisma = new PrismaClient();

router.use(authMiddleware);


// Récupérer tous les badges
router.get('/', async (req, res) => {
  try {
    const badges = await prisma.badge.findMany({
      include: {
        _count: {
          select: {
            dossiers: true,
            demandes: true
          }
        }
      },
      orderBy: {
        nom: 'asc'
      }
    });

    // Transformer les données pour inclure le nombre total d'utilisations
    const badgesWithUsage = badges.map(badge => ({
      ...badge,
      totalUsage: badge._count.dossiers + badge._count.demandes,
      dossiersCount: badge._count.dossiers,
      demandesCount: badge._count.demandes
    }));
    
    
    res.json({ badges: badgesWithUsage });
  } catch (error) {
    console.error('Get badges error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Récupérer les statistiques des badges
router.get('/stats', adminMiddleware, async (req, res) => {
  try {
    const totalBadges = await prisma.badge.count();
    
    // Pour les badges utilisés, on compte ceux qui sont liés à des dossiers ou des demandes
    const usedBadgesCount = await prisma.badge.count({
      where: {
        OR: [
          { dossiers: { some: {} } },
          { demandes: { some: {} } }
        ]
      }
    });
    
    const stats = {
      totalBadges,
      usedBadges: usedBadgesCount,
      unusedBadges: totalBadges - usedBadgesCount
    };

    
    res.json(stats);
  } catch (error) {
    console.error('Get badges stats error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Créer un badge
router.post('/', adminMiddleware, async (req, res) => {
  try {
    const { nom, couleur } = req.body;
    
    if (!nom || !couleur) {
      return res.status(400).json({ message: 'Le nom et la couleur sont requis' });
    }

    // Vérifier si un badge avec ce nom existe déjà
    const existingBadge = await prisma.badge.findFirst({
      where: { nom: nom.trim() }
    });

    if (existingBadge) {
      return res.status(400).json({ message: 'Un badge avec ce nom existe déjà' });
    }

    const badge = await prisma.badge.create({
      data: {
        nom: nom.trim(),
        couleur: couleur.trim()
      }
    });

    await logAction(req.user.id, 'CREATE_BADGE', 'BADGE', badge.id, `Créé le badge "${badge.nom}"`);
    
    res.status(201).json(badge);
  } catch (error) {
    console.error('Create badge error:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Mettre à jour un badge
router.put('/:id', adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { nom, couleur } = req.body;
    
    if (!nom || !couleur) {
      return res.status(400).json({ message: 'Le nom et la couleur sont requis' });
    }

    // Vérifier si le badge existe
    const existingBadge = await prisma.badge.findUnique({
      where: { id }
    });

    if (!existingBadge) {
      return res.status(404).json({ message: 'Badge non trouvé' });
    }

    // Vérifier si un autre badge avec ce nom existe déjà
    const duplicateBadge = await prisma.badge.findFirst({
      where: { 
        nom: nom.trim(),
        NOT: { id }
      }
    });

    if (duplicateBadge) {
      return res.status(400).json({ message: 'Un badge avec ce nom existe déjà' });
    }

    const badge = await prisma.badge.update({
      where: { id },
      data: {
        nom: nom.trim(),
        couleur: couleur.trim()
      }
    });

    await logAction(req.user.id, 'UPDATE_BADGE', 'BADGE', badge.id, `Modifié le badge "${badge.nom}"`);
    
    res.json(badge);
  } catch (error) {
    console.error('Update badge error:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Supprimer un badge
router.delete('/:id', adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier si le badge existe
    const existingBadge = await prisma.badge.findUnique({
      where: { id },
      include: {
        dossiers: true,
        demandes: true
      }
    });

    if (!existingBadge) {
      return res.status(404).json({ message: 'Badge non trouvé' });
    }

    // Vérifier si le badge est utilisé
    if (existingBadge.dossiers.length > 0 || existingBadge.demandes.length > 0) {
      return res.status(400).json({ 
        message: 'Impossible de supprimer ce badge car il est utilisé dans des dossiers ou des demandes' 
      });
    }

    await prisma.badge.delete({
      where: { id }
    });

    await logAction(req.user.id, 'DELETE_BADGE', 'BADGE', id, `Supprimé le badge "${existingBadge.nom}"`);
    
    res.json({ message: 'Badge supprimé avec succès' });
  } catch (error) {
    console.error('Delete badge error:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;