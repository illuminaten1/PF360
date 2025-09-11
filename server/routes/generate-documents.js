const express = require('express');
const carbone = require('carbone');
const path = require('path');
const fs = require('fs').promises;
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/auth');
const { logAction } = require('../utils/logger');

const router = express.Router();
const prisma = new PrismaClient();

// Middleware d'authentification
router.use(authMiddleware);

// GET /api/generate-documents/paiements - Lister les paiements disponibles
router.get('/paiements', async (req, res) => {
  try {
    const paiements = await prisma.paiement.findMany({
      include: {
        dossier: true,
        sgami: true,
        pce: true,
        creePar: {
          select: {
            nom: true,
            prenom: true,
            grade: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const paiementsFormatted = paiements.map(p => ({
      id: p.id,
      numero: p.numero,
      identiteBeneficiaire: p.identiteBeneficiaire,
      montantTTC: p.montantTTC,
      dossierNumero: p.dossier.numero,
      sgami: p.sgami.nom,
      createdAt: p.createdAt
    }));

    res.json(paiementsFormatted);
  } catch (error) {
    console.error('Liste paiements error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/generate-documents/fiche-paiement/:paiementId - Générer une fiche de paiement
router.post('/fiche-paiement/:paiementId', async (req, res) => {
  try {
    const { paiementId } = req.params;
    
    // Récupérer le paiement avec toutes ses relations
    const paiement = await prisma.paiement.findUnique({
      where: { id: paiementId },
      include: {
        dossier: {
          include: {
            demandes: {
              include: {
                grade: true
              }
            }
          }
        },
        sgami: true,
        pce: true,
        creePar: true,
        decisions: {
          include: {
            decision: true
          }
        }
      }
    });

    if (!paiement) {
      return res.status(404).json({ error: 'Paiement non trouvé' });
    }

    // Formater les données pour Carbone selon le schéma Prisma
    const data = {
      paiement: {
        numero: paiement.numero,
        facture: paiement.facture,
        montantHT: paiement.montantHT,
        montantTTC: paiement.montantTTC,
        emissionTitrePerception: paiement.emissionTitrePerception,
        qualiteBeneficiaire: paiement.qualiteBeneficiaire,
        identiteBeneficiaire: paiement.identiteBeneficiaire,
        dateServiceFait: paiement.dateServiceFait ? new Date(paiement.dateServiceFait).toLocaleDateString('fr-FR') : null,
        conventionJointeFRI: paiement.conventionJointeFRI,
        adresseBeneficiaire: paiement.adresseBeneficiaire,
        siretOuRidet: paiement.siretOuRidet,
        titulaireCompteBancaire: paiement.titulaireCompteBancaire,
        codeEtablissement: paiement.codeEtablissement,
        codeGuichet: paiement.codeGuichet,
        numeroCompte: paiement.numeroCompte,
        cleRIB: paiement.cleRIB
      },
      utilisateur: {
        grade: paiement.creePar.grade,
        nom: paiement.creePar.nom,
        prenom: paiement.creePar.prenom,
        gradeAbrege: paiement.creePar.grade, // Vous pourrez adapter selon votre logique de grade abrégé
        mail: paiement.creePar.mail,
        telephone: paiement.creePar.telephone
      },
      sgami: {
        nom: paiement.sgami.nom,
        formatCourtNommage: paiement.sgami.formatCourtNommage,
        intituleFicheReglement: paiement.sgami.intituleFicheReglement
      },
      pce: paiement.pce ? {
        pceDetaille: paiement.pce.pceDetaille,
        pceNumerique: paiement.pce.pceNumerique,
        codeMarchandise: paiement.pce.codeMarchandise
      } : null,
      dossier: {
        numero: paiement.dossier.numero,
        nomDossier: paiement.dossier.nomDossier,
        notes: paiement.dossier.notes
      },
      demandes: paiement.dossier.demandes.map(demande => ({
        nom: demande.nom,
        prenom: demande.prenom,
        grade: demande.grade ? {
          gradeComplet: demande.grade.gradeComplet,
          gradeAbrege: demande.grade.gradeAbrege
        } : null
      })),
      decisions: paiement.decisions.map(pd => ({
        numero: pd.decision.numero,
        dateSignature: pd.decision.dateSignature ? new Date(pd.decision.dateSignature).toLocaleDateString('fr-FR') : null,
        type: pd.decision.type
      })),
      // Données générées
      dateGeneration: new Date().toLocaleDateString('fr-FR')
    };

    // Chemin du template
    const templatePath = path.join(__dirname, '../templates/fiche-paiement-template.docx');
    
    // Vérifier que le template existe
    try {
      await fs.access(templatePath);
    } catch {
      return res.status(404).json({ 
        error: 'Template de fiche de paiement non trouvé. Veuillez placer le fichier "fiche-paiement-template.docx" dans le dossier templates/' 
      });
    }
    
    console.log('Génération fiche de paiement pour:', data.paiement.identiteBeneficiaire);
    
    // Générer le document avec Carbone
    carbone.render(templatePath, data, async (err, result) => {
      if (err) {
        console.error('Erreur Carbone:', err);
        return res.status(500).json({ 
          error: 'Erreur lors de la génération du document' 
        });
      }
      
      try {
        // Log de l'action
        await logAction(
          req.user.id, 
          'GENERATE_FICHE_PAIEMENT', 
          `Génération fiche de paiement n°${data.paiement.numero} pour ${data.paiement.identiteBeneficiaire}`, 
          'Paiement', 
          paiementId
        );
        
        // Nom du fichier généré
        const fileName = `fiche-paiement-${data.paiement.numero}-${Date.now()}.docx`;
        
        // Envoyer le fichier en réponse
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.send(result);
        
      } catch (logError) {
        console.error('Erreur lors du log:', logError);
        // Envoyer quand même le fichier même si le log échoue
        const fileName = `fiche-paiement-${data.paiement.numero}-${Date.now()}.docx`;
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.send(result);
      }
    });
    
  } catch (error) {
    console.error('Generate fiche paiement error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;