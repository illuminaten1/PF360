const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/auth');
const { logAction } = require('../utils/logger');
const carbone = require('carbone');
const path = require('path');
const dayjs = require('dayjs');

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
      pceId,
      decisions = []
    } = req.body;

    if (!montantTTC || !dossierId || !sgamiId || !emissionTitrePerception || !qualiteBeneficiaire || !identiteBeneficiaire || !conventionJointeFRI) {
      return res.status(400).json({ 
        error: 'Les champs montantTTC, dossierId, sgamiId, emissionTitrePerception, qualiteBeneficiaire, identiteBeneficiaire et conventionJointeFRI sont obligatoires' 
      });
    }

    if (!decisions || !Array.isArray(decisions) || decisions.length === 0) {
      return res.status(400).json({ 
        error: 'Au moins une décision doit être associée au paiement' 
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

    const paiement = await prisma.$transaction(async (tx) => {
      // Trouver le dernier numéro utilisé
      const allPaiements = await tx.paiement.findMany({
        select: { numero: true }
      });
      
      const maxNumber = allPaiements.length > 0 
        ? Math.max(...allPaiements.map(p => p.numero))
        : 0;

      // Calculer le prochain numéro séquentiel
      const nextNumber = maxNumber + 1;

      return await tx.paiement.create({
        data: {
          numero: nextNumber,
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
          creeParId: req.user.id,
          decisions: {
            create: decisions.map(decisionId => ({
              decisionId
            }))
          }
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
          },
          decisions: {
            include: {
              decision: {
                select: {
                  id: true,
                  type: true,
                  numero: true,
                  dateSignature: true
                }
              }
            }
          }
        }
      });
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
        },
        decisions: {
          include: {
            decision: {
              select: {
                id: true,
                type: true,
                numero: true,
                dateSignature: true
              }
            }
          }
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
      pceId,
      decisions = []
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

    if (!decisions || !Array.isArray(decisions) || decisions.length === 0) {
      return res.status(400).json({ 
        error: 'Au moins une décision doit être associée au paiement' 
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

    const paiement = await prisma.$transaction(async (tx) => {
      // Supprimer les anciennes relations avec les décisions
      await tx.paiementDecision.deleteMany({
        where: { paiementId: id }
      });

      // Mettre à jour le paiement avec les nouvelles relations
      return await tx.paiement.update({
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
          pceId,
          decisions: {
            create: decisions.map(decisionId => ({
              decisionId
            }))
          }
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
          },
          decisions: {
            include: {
              decision: {
                select: {
                  id: true,
                  type: true,
                  numero: true,
                  dateSignature: true
                }
              }
            }
          }
        }
      });
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

// Route pour générer le document de paiement
router.get('/:id/generate-document', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Récupérer les données complètes du paiement avec toutes les relations
    const paiement = await prisma.paiement.findUnique({
      where: { id },
      include: {
        dossier: {
          include: {
            demandes: {
              include: {
                grade: {
                  select: { gradeComplet: true, gradeAbrege: true }
                }
              }
            }
          }
        },
        sgami: {
          select: { id: true, nom: true, intituleFicheReglement: true }
        },
        avocat: {
          select: { id: true, nom: true, prenom: true, region: true }
        },
        pce: {
          select: { 
            id: true, 
            ordre: true, 
            pceDetaille: true, 
            pceNumerique: true, 
            codeMarchandise: true 
          }
        },
        creePar: {
          select: { id: true, nom: true, prenom: true, grade: true }
        },
        decisions: {
          include: {
            decision: {
              select: {
                id: true,
                type: true,
                numero: true,
                dateSignature: true
              }
            }
          }
        }
      }
    });

    if (!paiement) {
      return res.status(404).json({ error: 'Paiement non trouvé' });
    }

    // Préparer les données pour le template - structure Carbone correcte
    const templateData = {
      paiement: {
        numero: paiement.numero,
        montantHT: paiement.montantHT || 0,
        montantTTC: paiement.montantTTC || 0,
        dateServiceFait: paiement.dateServiceFait ? dayjs(paiement.dateServiceFait).format('DD/MM/YYYY') : '',
        conventionJointeFRI: paiement.conventionJointeFRI || 'NON',
        facture: paiement.facture || 'Facture',
        qualiteBeneficiaire: paiement.qualiteBeneficiaire || '',
        identiteBeneficiaire: paiement.identiteBeneficiaire || '',
        siretOuRidet: paiement.siretOuRidet || '',
        adresseBeneficiaire: paiement.adresseBeneficiaire || '',
        titulaireCompteBancaire: paiement.titulaireCompteBancaire || '',
        codeEtablissement: paiement.codeEtablissement || '',
        codeGuichet: paiement.codeGuichet || '',
        numeroCompte: paiement.numeroCompte || '',
        cleRIB: paiement.cleRIB || '',
        emissionTitrePerception: paiement.emissionTitrePerception || 'NON'
      },
      pce: paiement.pce ? {
        pceNumerique: paiement.pce.pceNumerique || '',
        codeMarchandise: paiement.pce.codeMarchandise || '',
        pceDetaille: paiement.pce.pceDetaille || ''
      } : {
        pceNumerique: '',
        codeMarchandise: '',
        pceDetaille: ''
      },
      d: {
        demandes: (paiement.dossier && paiement.dossier.demandes) ? paiement.dossier.demandes.map(demande => ({
          grade: demande.grade?.gradeAbrege || demande.grade?.gradeComplet || '',
          prenom: demande.prenom || '',
          nom: demande.nom || ''
        })) : [],
        decisions: paiement.decisions ? paiement.decisions.map(pd => ({
          numero: pd.decision.numero || '',
          dateSignature: pd.decision.dateSignature ? dayjs(pd.decision.dateSignature).format('DD/MM/YYYY') : ''
        })) : []
      }
    };

    // Debug: afficher les données envoyées à Carbone
    console.log('=== DEBUG CARBONE DATA ===');
    console.log('templateData:', JSON.stringify(templateData, null, 2));
    
    // Vérifier s'il y a des valeurs null/undefined qui pourraient poser problème
    const checkForNulls = (obj, path = '') => {
      for (const [key, value] of Object.entries(obj)) {
        const currentPath = path ? `${path}.${key}` : key;
        if (value === null || value === undefined) {
          console.log(`⚠️  Valeur null/undefined trouvée: ${currentPath} = ${value}`);
        } else if (typeof value === 'object' && !Array.isArray(value)) {
          checkForNulls(value, currentPath);
        }
      }
    };
    checkForNulls(templateData);
    console.log('==========================');

    // Utiliser le système de templates existant
    const getTemplatePath = async (templateType) => {
      const activeVersion = await prisma.templateVersion.findFirst({
        where: { 
          templateType,
          isActive: true 
        }
      });
      
      if (activeVersion) {
        return path.join(__dirname, '../uploads/templates', templateType, activeVersion.filename);
      }
      
      // Fallback vers le template par défaut
      return path.join(__dirname, '../templates/default/reglement_template.odt');
    };

    // Obtenir le chemin du template de règlement
    const finalTemplatePath = await getTemplatePath('reglement');

    // Debug: afficher le chemin du template utilisé
    console.log('Chemin template utilisé:', finalTemplatePath);

    // TEST: Créer un template minimal en mémoire pour vérifier Carbone
    const testTemplateData = {
      numero: templateData.paiement.numero,
      montant: templateData.paiement.montantTTC
    };
    
    // Test simple avec un template en string (juste pour debug)
    console.log('=== TEST CARBONE SIMPLE ===');
    console.log('Test data:', testTemplateData);
    
    // Continuer avec le vrai template
    // Générer le document avec Carbone
    carbone.render(finalTemplatePath, templateData, (err, result) => {
      if (err) {
        console.error('Erreur génération Carbone:', err);
        return res.status(500).json({ error: 'Erreur lors de la génération du document' });
      }

      // Définir les en-têtes pour le téléchargement
      const filename = `fiche_reglement_${paiement.numero}_FRI.odt`;
      res.set({
        'Content-Type': 'application/vnd.oasis.opendocument.text',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': result.length
      });

      // Log de l'action
      logAction(req.user.id, 'GENERATE_DOCUMENT_PAIEMENT', `Génération document paiement ${paiement.numero}`, 'Paiement', paiement.id);

      // Envoyer le document généré
      res.send(result);
    });

  } catch (error) {
    console.error('Generate document error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;