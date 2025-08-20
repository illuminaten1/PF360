const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/auth');
const { logAction } = require('../utils/logger');

const router = express.Router();
const prisma = new PrismaClient();

router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const { dossierId } = req.query;
    
    const where = {};
    if (dossierId) {
      where.dossierId = dossierId;
    }

    const paiements = await prisma.paiement.findMany({
      where,
      include: {
        dossier: {
          select: { id: true, numero: true }
        },
        convention: {
          select: { id: true, montantHT: true, dateCreation: true }
        },
        avocat: {
          select: { id: true, nom: true, prenom: true }
        },
        pce: {
          select: { id: true, ordre: true, pceDetaille: true, pceNumerique: true, codeMarchandise: true }
        },
        creePar: {
          select: { id: true, nom: true, prenom: true, grade: true }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    await logAction(req.user.id, 'LIST_PAIEMENTS', `Consultation des paiements (${paiements.length} résultats)`);

    res.json(paiements);
  } catch (error) {
    console.error('Get paiements error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/', async (req, res) => {
  try {
    const {
      facture,
      montantHT,
      montantTTC,
      nature,
      ficheReglement,
      dossierId,
      conventionId,
      avocatId,
      pceId
    } = req.body;

    if (!montantHT || !montantTTC || !nature || !dossierId) {
      return res.status(400).json({ 
        error: 'Les champs montantHT, montantTTC, nature et dossierId sont obligatoires' 
      });
    }

    if (!['AVOCAT', 'AUTRES_INTERVENANTS'].includes(nature)) {
      return res.status(400).json({ 
        error: 'La nature doit être AVOCAT ou AUTRES_INTERVENANTS' 
      });
    }

    // Vérifier que le dossier existe
    const dossierExistant = await prisma.dossier.findUnique({
      where: { id: dossierId }
    });

    if (!dossierExistant) {
      return res.status(404).json({ error: 'Dossier non trouvé' });
    }

    // Si un avocat est spécifié, vérifier qu'il existe et est actif
    if (avocatId) {
      const avocatExistant = await prisma.avocat.findUnique({
        where: { id: avocatId, active: true }
      });

      if (!avocatExistant) {
        return res.status(404).json({ error: 'Avocat non trouvé ou inactif' });
      }
    }

    // Si une convention est spécifiée, vérifier qu'elle existe
    if (conventionId) {
      const conventionExistante = await prisma.convention.findUnique({
        where: { id: conventionId }
      });

      if (!conventionExistante) {
        return res.status(404).json({ error: 'Convention non trouvée' });
      }
    }

    // Si un PCE est spécifié, vérifier qu'il existe
    if (pceId) {
      const pceExistant = await prisma.pce.findUnique({
        where: { id: pceId }
      });

      if (!pceExistant) {
        return res.status(404).json({ error: 'PCE non trouvé' });
      }
    }

    const paiement = await prisma.paiement.create({
      data: {
        facture,
        montantHT,
        montantTTC,
        nature,
        ficheReglement,
        dossierId,
        conventionId,
        avocatId,
        pceId,
        creeParId: req.user.id
      },
      include: {
        dossier: {
          select: { id: true, numero: true }
        },
        convention: {
          select: { id: true, montantHT: true, dateCreation: true }
        },
        avocat: {
          select: { id: true, nom: true, prenom: true }
        },
        pce: {
          select: { id: true, ordre: true, pceDetaille: true, pceNumerique: true, codeMarchandise: true }
        },
        creePar: {
          select: { id: true, nom: true, prenom: true, grade: true }
        }
      }
    });

    await logAction(req.user.id, 'CREATE_PAIEMENT', `Création paiement ${paiement.facture || 'sans facture'}`, 'Paiement', paiement.id);

    res.status(201).json(paiement);
  } catch (error) {
    console.error('Create paiement error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const paiement = await prisma.paiement.findUnique({
      where: { id },
      include: {
        dossier: {
          select: { id: true, numero: true }
        },
        convention: {
          select: { id: true, montantHT: true, dateCreation: true }
        },
        avocat: {
          select: { id: true, nom: true, prenom: true }
        },
        pce: {
          select: { id: true, ordre: true, pceDetaille: true, pceNumerique: true, codeMarchandise: true }
        },
        creePar: {
          select: { id: true, nom: true, prenom: true, grade: true }
        }
      }
    });

    if (!paiement) {
      return res.status(404).json({ error: 'Paiement non trouvé' });
    }

    await logAction(req.user.id, 'VIEW_PAIEMENT', `Consultation paiement ${paiement.facture || 'sans facture'}`, 'Paiement', paiement.id);

    res.json(paiement);
  } catch (error) {
    console.error('Get paiement by id error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      facture,
      montantHT,
      montantTTC,
      nature,
      ficheReglement,
      conventionId,
      avocatId,
      pceId
    } = req.body;

    const paiementExistant = await prisma.paiement.findUnique({
      where: { id }
    });

    if (!paiementExistant) {
      return res.status(404).json({ error: 'Paiement non trouvé' });
    }

    if (!montantHT || !montantTTC || !nature) {
      return res.status(400).json({ 
        error: 'Les champs montantHT, montantTTC et nature sont obligatoires' 
      });
    }

    if (!['AVOCAT', 'AUTRES_INTERVENANTS'].includes(nature)) {
      return res.status(400).json({ 
        error: 'La nature doit être AVOCAT ou AUTRES_INTERVENANTS' 
      });
    }

    // Si un avocat est spécifié, vérifier qu'il existe et est actif
    if (avocatId) {
      const avocatExistant = await prisma.avocat.findUnique({
        where: { id: avocatId, active: true }
      });

      if (!avocatExistant) {
        return res.status(404).json({ error: 'Avocat non trouvé ou inactif' });
      }
    }

    // Si une convention est spécifiée, vérifier qu'elle existe
    if (conventionId) {
      const conventionExistante = await prisma.convention.findUnique({
        where: { id: conventionId }
      });

      if (!conventionExistante) {
        return res.status(404).json({ error: 'Convention non trouvée' });
      }
    }

    const paiement = await prisma.paiement.update({
      where: { id },
      data: {
        facture,
        montantHT,
        montantTTC,
        nature,
        ficheReglement,
        conventionId,
        avocatId,
        pceId
      },
      include: {
        dossier: {
          select: { id: true, numero: true }
        },
        convention: {
          select: { id: true, montantHT: true, dateCreation: true }
        },
        avocat: {
          select: { id: true, nom: true, prenom: true }
        },
        pce: {
          select: { id: true, ordre: true, pceDetaille: true, pceNumerique: true, codeMarchandise: true }
        },
        creePar: {
          select: { id: true, nom: true, prenom: true, grade: true }
        }
      }
    });

    await logAction(req.user.id, 'UPDATE_PAIEMENT', `Modification paiement ${paiement.facture || 'sans facture'}`, 'Paiement', paiement.id);

    res.json(paiement);
  } catch (error) {
    console.error('Update paiement error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const paiementExistant = await prisma.paiement.findUnique({
      where: { id }
    });

    if (!paiementExistant) {
      return res.status(404).json({ error: 'Paiement non trouvé' });
    }

    await prisma.paiement.delete({
      where: { id }
    });

    await logAction(req.user.id, 'DELETE_PAIEMENT', `Suppression paiement ${paiementExistant.facture || 'sans facture'}`, 'Paiement', id);

    res.json({ message: 'Paiement supprimé avec succès' });
  } catch (error) {
    console.error('Delete paiement error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;