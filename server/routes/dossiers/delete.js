const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { logAction } = require('../../utils/logger');

const router = express.Router();
const prisma = new PrismaClient();

router.delete('/:id', async (req, res) => {
  try {
    const existingDossier = await prisma.dossier.findUnique({
      where: { id: req.params.id },
      include: {
        demandes: true,
        decisions: true,
        conventions: true,
        paiements: true,
        badges: true,
        baps: true,
        attendus: true
      }
    });

    if (!existingDossier) {
      return res.status(404).json({ error: 'Dossier non trouvé' });
    }

    if (existingDossier.demandes.length > 0) {
      return res.status(400).json({
        error: 'Impossible de supprimer un dossier contenant des demandes'
      });
    }

    if (existingDossier.decisions.length > 0) {
      return res.status(400).json({
        error: 'Impossible de supprimer un dossier contenant des décisions'
      });
    }

    if (existingDossier.conventions.length > 0) {
      return res.status(400).json({
        error: 'Impossible de supprimer un dossier contenant des conventions'
      });
    }

    if (existingDossier.paiements.length > 0) {
      return res.status(400).json({
        error: 'Impossible de supprimer un dossier contenant des paiements'
      });
    }

    // Supprimer les relations en premier
    await prisma.dossierBadge.deleteMany({
      where: { dossierId: req.params.id }
    });

    await prisma.dossierBAP.deleteMany({
      where: { dossierId: req.params.id }
    });

    await prisma.dossierAttendu.deleteMany({
      where: { dossierId: req.params.id }
    });

    // Maintenant supprimer le dossier
    await prisma.dossier.delete({
      where: { id: req.params.id }
    });

    await logAction(req.user.id, 'DELETE_DOSSIER', `Suppression du dossier ${existingDossier.numero}`, 'Dossier', req.params.id);

    res.json({ message: 'Dossier supprimé avec succès' });
  } catch (error) {
    console.error('Delete dossier error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;