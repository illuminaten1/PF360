const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/auth');
const { logAction } = require('../utils/logger');

const router = express.Router();
const prisma = new PrismaClient();

router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const sgami = await prisma.sgami.findMany({
      include: {
        _count: {
          select: {
            dossiers: true
          }
        }
      },
      orderBy: {
        nom: 'asc'
      }
    });

    // Transformer les données pour inclure le nombre de dossiers
    const sgamiWithUsage = sgami.map(item => ({
      ...item,
      dossiersCount: item._count.dossiers
    }));

    await logAction(req.user.id, 'LIST_SGAMI', `Consultation des SGAMI (${sgamiWithUsage.length} résultats)`);

    res.json(sgamiWithUsage);
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
    const { nom, formatCourtNommage, texteConvention, intituleFicheReglement } = req.body;
    
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
      data: { 
        nom,
        formatCourtNommage: formatCourtNommage || null,
        texteConvention: texteConvention || null,
        intituleFicheReglement: intituleFicheReglement || null
      }
    });

    await logAction(req.user.id, 'CREATE_SGAMI', `Création SGAMI ${sgami.nom}`, 'SGAMI', sgami.id);

    res.status(201).json(sgami);
  } catch (error) {
    console.error('Create SGAMI error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nom, formatCourtNommage, texteConvention, intituleFicheReglement } = req.body;
    
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
      data: { 
        nom,
        formatCourtNommage: formatCourtNommage || null,
        texteConvention: texteConvention || null,
        intituleFicheReglement: intituleFicheReglement || null
      }
    });

    await logAction(req.user.id, 'UPDATE_SGAMI', `Modification SGAMI ${sgami.nom}`, 'SGAMI', sgami.id);

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

    const sgami = await prisma.sgami.findUnique({ where: { id } });
    
    await prisma.sgami.delete({
      where: { id }
    });

    await logAction(req.user.id, 'DELETE_SGAMI', `Suppression SGAMI ${sgami?.nom}`, 'SGAMI', id);

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