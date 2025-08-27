const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/auth');
const { logAction } = require('../utils/logger');

const router = express.Router();
const prisma = new PrismaClient();

router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const { dossierId, sgamiId } = req.query;
    
    const where = {};
    if (dossierId) {
      where.dossierId = dossierId;
    }
    if (sgamiId) {
      where.sgamiId = sgamiId;
    }

    const paiements = await prisma.paiement.findMany({
      where,
      include: {
        dossier: {
          select: { id: true, numero: true, nomDossier: true }
        },
        sgami: {
          select: { id: true, nom: true, intituleFicheReglement: true }
        },
        avocat: {
          select: { id: true, nom: true, prenom: true, region: true }
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
      emissionTitrePerception,
      qualiteBeneficiaire,
      identiteBeneficiaire,
      dateServiceFait,
      conventionJointeFRI,
      adresseBeneficiaire,
      siretOuRidet,
      titulaireCompteBancaire,
      codeEtablissement,
      codeGuichet,
      numeroCompte,
      cleRIB,
      ficheReglement,
      dossierId,
      sgamiId,
      avocatId,
      pceId
    } = req.body;

    if (!montantTTC || !dossierId || !sgamiId || !emissionTitrePerception || !qualiteBeneficiaire || !identiteBeneficiaire || !conventionJointeFRI) {
      return res.status(400).json({ 
        error: 'Les champs montantTTC, dossierId, sgamiId, emissionTitrePerception, qualiteBeneficiaire, identiteBeneficiaire et conventionJointeFRI sont obligatoires' 
      });
    }

    if (!['OUI', 'NON'].includes(emissionTitrePerception)) {
      return res.status(400).json({ 
        error: 'emissionTitrePerception doit être OUI ou NON' 
      });
    }

    if (!['OUI', 'NON'].includes(conventionJointeFRI)) {
      return res.status(400).json({ 
        error: 'conventionJointeFRI doit être OUI ou NON' 
      });
    }

    const qualitesValides = ['Avocat', 'Commissaire de justice', 'Militaire de la gendarmerie nationale', 'Régisseur du tribunal judiciaire', 'Médecin', 'Victime'];
    if (!qualitesValides.includes(qualiteBeneficiaire)) {
      return res.status(400).json({ 
        error: 'qualiteBeneficiaire doit être une des valeurs autorisées' 
      });
    }

    // Vérifier que le dossier existe
    const dossierExistant = await prisma.dossier.findUnique({
      where: { id: dossierId }
    });

    if (!dossierExistant) {
      return res.status(404).json({ error: 'Dossier non trouvé' });
    }

    // Vérifier que le SGAMI existe
    const sgamiExistant = await prisma.sgami.findUnique({
      where: { id: sgamiId }
    });

    if (!sgamiExistant) {
      return res.status(404).json({ error: 'SGAMI non trouvé' });
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
        emissionTitrePerception,
        qualiteBeneficiaire,
        identiteBeneficiaire,
        dateServiceFait: dateServiceFait ? new Date(dateServiceFait) : null,
        conventionJointeFRI,
        adresseBeneficiaire,
        siretOuRidet,
        titulaireCompteBancaire,
        codeEtablissement,
        codeGuichet,
        numeroCompte,
        cleRIB,
        ficheReglement,
        dossierId,
        sgamiId,
        avocatId,
        pceId,
        creeParId: req.user.id
      },
      include: {
        dossier: {
          select: { id: true, numero: true, nomDossier: true }
        },
        sgami: {
          select: { id: true, nom: true, intituleFicheReglement: true }
        },
        avocat: {
          select: { id: true, nom: true, prenom: true, region: true }
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
          select: { id: true, numero: true, nomDossier: true }
        },
        sgami: {
          select: { id: true, nom: true, intituleFicheReglement: true }
        },
        avocat: {
          select: { id: true, nom: true, prenom: true, region: true }
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
      emissionTitrePerception,
      qualiteBeneficiaire,
      identiteBeneficiaire,
      dateServiceFait,
      conventionJointeFRI,
      adresseBeneficiaire,
      siretOuRidet,
      titulaireCompteBancaire,
      codeEtablissement,
      codeGuichet,
      numeroCompte,
      cleRIB,
      ficheReglement,
      sgamiId,
      avocatId,
      pceId
    } = req.body;

    const paiementExistant = await prisma.paiement.findUnique({
      where: { id }
    });

    if (!paiementExistant) {
      return res.status(404).json({ error: 'Paiement non trouvé' });
    }

    if (!montantTTC || !sgamiId || !emissionTitrePerception || !qualiteBeneficiaire || !identiteBeneficiaire || !conventionJointeFRI) {
      return res.status(400).json({ 
        error: 'Les champs montantTTC, sgamiId, emissionTitrePerception, qualiteBeneficiaire, identiteBeneficiaire et conventionJointeFRI sont obligatoires' 
      });
    }

    if (!['OUI', 'NON'].includes(emissionTitrePerception)) {
      return res.status(400).json({ 
        error: 'emissionTitrePerception doit être OUI ou NON' 
      });
    }

    if (!['OUI', 'NON'].includes(conventionJointeFRI)) {
      return res.status(400).json({ 
        error: 'conventionJointeFRI doit être OUI ou NON' 
      });
    }

    const qualitesValides = ['Avocat', 'Commissaire de justice', 'Militaire de la gendarmerie nationale', 'Régisseur du tribunal judiciaire', 'Médecin', 'Victime'];
    if (!qualitesValides.includes(qualiteBeneficiaire)) {
      return res.status(400).json({ 
        error: 'qualiteBeneficiaire doit être une des valeurs autorisées' 
      });
    }

    // Vérifier que le SGAMI existe
    const sgamiExistant = await prisma.sgami.findUnique({
      where: { id: sgamiId }
    });

    if (!sgamiExistant) {
      return res.status(404).json({ error: 'SGAMI non trouvé' });
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

    // Si un PCE est spécifié, vérifier qu'il existe
    if (pceId) {
      const pceExistant = await prisma.pce.findUnique({
        where: { id: pceId }
      });

      if (!pceExistant) {
        return res.status(404).json({ error: 'PCE non trouvé' });
      }
    }

    const paiement = await prisma.paiement.update({
      where: { id },
      data: {
        facture,
        montantHT,
        montantTTC,
        emissionTitrePerception,
        qualiteBeneficiaire,
        identiteBeneficiaire,
        dateServiceFait: dateServiceFait ? new Date(dateServiceFait) : null,
        conventionJointeFRI,
        adresseBeneficiaire,
        siretOuRidet,
        titulaireCompteBancaire,
        codeEtablissement,
        codeGuichet,
        numeroCompte,
        cleRIB,
        ficheReglement,
        sgamiId,
        avocatId,
        pceId
      },
      include: {
        dossier: {
          select: { id: true, numero: true, nomDossier: true }
        },
        sgami: {
          select: { id: true, nom: true, intituleFicheReglement: true }
        },
        avocat: {
          select: { id: true, nom: true, prenom: true, region: true }
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