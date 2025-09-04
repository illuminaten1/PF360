const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { logAction } = require('../utils/logger');

const router = express.Router();
const prisma = new PrismaClient();

router.use(authMiddleware);

// Récupérer tous les BAP
router.get('/', adminMiddleware, async (req, res) => {
  try {
    const baps = await prisma.bAP.findMany({
      include: {
        _count: {
          select: {
            dossiers: true,
            demandes: true
          }
        }
      },
      orderBy: {
        nomBAP: 'asc'
      }
    });

    // Transformer les données pour inclure le nombre total d'utilisations
    const bapsWithUsage = baps.map(bap => ({
      ...bap,
      totalUsage: bap._count.dossiers + bap._count.demandes,
      dossiersCount: bap._count.dossiers,
      demandesCount: bap._count.demandes
    }));
    
    
    res.json({ baps: bapsWithUsage });
  } catch (error) {
    console.error('Get BAP error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Récupérer les statistiques des BAP
router.get('/stats', adminMiddleware, async (req, res) => {
  try {
    const totalBAP = await prisma.bAP.count();
    
    // Pour les BAP utilisés, on compte ceux qui sont liés à des dossiers ou des demandes
    const usedBAPCount = await prisma.bAP.count({
      where: {
        OR: [
          { dossiers: { some: {} } },
          { demandes: { some: {} } }
        ]
      }
    });
    
    const stats = {
      totalBAP,
      usedBAP: usedBAPCount,
      unusedBAP: totalBAP - usedBAPCount
    };

    
    res.json(stats);
  } catch (error) {
    console.error('Get BAP stats error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Créer un BAP
router.post('/', adminMiddleware, async (req, res) => {
  try {
    const { nomBAP, mail1, mail2, mail3, mail4 } = req.body;
    
    if (!nomBAP) {
      return res.status(400).json({ message: 'Le nom du BAP est requis' });
    }

    // Vérifier si un BAP avec ce nom existe déjà
    const existingBAP = await prisma.bAP.findFirst({
      where: { nomBAP: nomBAP.trim() }
    });

    if (existingBAP) {
      return res.status(400).json({ message: 'Un BAP avec ce nom existe déjà' });
    }

    const bap = await prisma.bAP.create({
      data: {
        nomBAP: nomBAP.trim(),
        mail1: mail1?.trim() || null,
        mail2: mail2?.trim() || null,
        mail3: mail3?.trim() || null,
        mail4: mail4?.trim() || null
      }
    });

    await logAction(req.user.id, 'CREATE_BAP', 'BAP', bap.id, `Créé le BAP "${bap.nomBAP}"`);
    
    res.status(201).json(bap);
  } catch (error) {
    console.error('Create BAP error:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Mettre à jour un BAP
router.put('/:id', adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { nomBAP, mail1, mail2, mail3, mail4 } = req.body;
    
    if (!nomBAP) {
      return res.status(400).json({ message: 'Le nom du BAP est requis' });
    }

    // Vérifier si le BAP existe
    const existingBAP = await prisma.bAP.findUnique({
      where: { id }
    });

    if (!existingBAP) {
      return res.status(404).json({ message: 'BAP non trouvé' });
    }

    // Vérifier si un autre BAP avec ce nom existe déjà
    const duplicateBAP = await prisma.bAP.findFirst({
      where: { 
        nomBAP: nomBAP.trim(),
        NOT: { id }
      }
    });

    if (duplicateBAP) {
      return res.status(400).json({ message: 'Un BAP avec ce nom existe déjà' });
    }

    const bap = await prisma.bAP.update({
      where: { id },
      data: {
        nomBAP: nomBAP.trim(),
        mail1: mail1?.trim() || null,
        mail2: mail2?.trim() || null,
        mail3: mail3?.trim() || null,
        mail4: mail4?.trim() || null
      }
    });

    await logAction(req.user.id, 'UPDATE_BAP', 'BAP', bap.id, `Modifié le BAP "${bap.nomBAP}"`);
    
    res.json(bap);
  } catch (error) {
    console.error('Update BAP error:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Supprimer un BAP
router.delete('/:id', adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier si le BAP existe
    const existingBAP = await prisma.bAP.findUnique({
      where: { id },
      include: {
        dossiers: true,
        demandes: true
      }
    });

    if (!existingBAP) {
      return res.status(404).json({ message: 'BAP non trouvé' });
    }

    // Vérifier si le BAP est utilisé
    if (existingBAP.dossiers.length > 0 || existingBAP.demandes.length > 0) {
      return res.status(400).json({ 
        message: 'Impossible de supprimer ce BAP car il est utilisé dans des dossiers ou des demandes' 
      });
    }

    await prisma.bAP.delete({
      where: { id }
    });

    await logAction(req.user.id, 'DELETE_BAP', 'BAP', id, `Supprimé le BAP "${existingBAP.nomBAP}"`);
    
    res.json({ message: 'BAP supprimé avec succès' });
  } catch (error) {
    console.error('Delete BAP error:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;