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
      // Chaîne formatée pour les demandeurs
      demandeursListe: paiement.dossier.demandes.map(demande =>
        `${demande.grade?.gradeAbrege || ''} ${demande.prenom} ${demande.nom}`.trim()
      ).join(', '),
      decisions: paiement.decisions.map(pd => ({
        numero: pd.decision.numero,
        dateSignature: pd.decision.dateSignature ? new Date(pd.decision.dateSignature).toLocaleDateString('fr-FR') : null,
        type: pd.decision.type
      })),
      // Chaîne formatée pour les décisions : n° 2348 du 17/08/2025 ou n° 3435, 78435 et 38209 du 13/05/2025, 24/05/2025 et 26/05/2025
      decisionsListe: (() => {
        const decisions = paiement.decisions.map(pd => ({
          numero: pd.decision.numero,
          dateSignature: pd.decision.dateSignature ? new Date(pd.decision.dateSignature).toLocaleDateString('fr-FR') : null
        }));
        
        if (decisions.length === 0) return '';
        
        // Grouper par date pour optimiser l'affichage
        const numerosList = decisions.map(d => d.numero).join(', ');
        const datesList = decisions.map(d => d.dateSignature).filter(d => d).join(', ');
        
        let result = `n° ${numerosList}`;
        if (datesList) {
          result += ` du ${datesList}`;
        }
        
        return result;
      })(),
      // Données générées
      dateGeneration: new Date().toLocaleDateString('fr-FR')
    };

    // Utiliser le système de templates existant pour récupérer le template de règlement
    const TEMPLATES_DIR = path.join(__dirname, '../uploads/templates');
    const DEFAULT_TEMPLATES_DIR = path.join(__dirname, '../templates/default');
    const TEMPLATE_TYPES = {
      reglement: 'reglement_template.odt'
    };
    
    // Fonction pour obtenir le chemin du template (améliorée avec vérification d'existence)
    const getTemplatePath = async (templateType) => {
      const activeVersion = await prisma.templateVersion.findFirst({
        where: { 
          templateType,
          isActive: true 
        }
      });
      
      if (activeVersion) {
        const uploadedTemplatePath = path.join(TEMPLATES_DIR, templateType, activeVersion.filename);
        try {
          // Vérifier que le fichier uploadé existe réellement
          await fs.access(uploadedTemplatePath);
          return uploadedTemplatePath;
        } catch (error) {
          console.warn(`Template uploadé non trouvé: ${uploadedTemplatePath}, fallback vers template par défaut`);
          // Désactiver cette version en base car le fichier n'existe plus
          await prisma.templateVersion.update({
            where: { id: activeVersion.id },
            data: { isActive: false }
          });
        }
      }
      
      return path.join(DEFAULT_TEMPLATES_DIR, TEMPLATE_TYPES[templateType]);
    };
    
    let templatePath;
    try {
      templatePath = await getTemplatePath('reglement');
      // Vérifier que le fichier existe
      await fs.access(templatePath);
    } catch (error) {
      console.error('Erreur d\'accès au template:', error);
      return res.status(404).json({ 
        error: 'Template de règlement non trouvé. Veuillez uploader un template via la page Templates de l\'admin.' 
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
        
        // Nom du fichier généré en ODT
        const fileName = `fiche-paiement-${data.paiement.numero}-${Date.now()}.odt`;
        
        // Envoyer le fichier en réponse
        res.setHeader('Content-Type', 'application/vnd.oasis.opendocument.text');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.send(result);
        
      } catch (logError) {
        console.error('Erreur lors du log:', logError);
        // Envoyer quand même le fichier même si le log échoue
        const fileName = `fiche-paiement-${data.paiement.numero}-${Date.now()}.odt`;
        res.setHeader('Content-Type', 'application/vnd.oasis.opendocument.text');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.send(result);
      }
    });
    
  } catch (error) {
    console.error('Generate fiche paiement error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/generate-documents/avenants - Lister les avenants disponibles
router.get('/avenants', async (req, res) => {
  try {
    const avenants = await prisma.convention.findMany({
      where: {
        type: 'AVENANT'
      },
      include: {
        dossier: true,
        avocat: true,
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

    const avenantsFormatted = avenants.map(a => ({
      id: a.id,
      numero: a.numero,
      instance: a.instance,
      montantHT: a.montantHT,
      dossierNumero: a.dossier.numero,
      avocatNom: `${a.avocat.prenom} ${a.avocat.nom}`,
      createdAt: a.createdAt
    }));

    res.json(avenantsFormatted);
  } catch (error) {
    console.error('Liste avenants error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/generate-documents/avenant/:avenantId - Générer un document d'avenant
router.post('/avenant/:avenantId', async (req, res) => {
  try {
    const { avenantId } = req.params;

    // Récupérer l'avenant avec toutes ses relations
    const avenant = await prisma.convention.findUnique({
      where: { id: avenantId },
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
        avocat: true,
        creePar: true,
        demandes: {
          include: {
            demande: {
              include: {
                grade: true
              }
            }
          }
        },
        diligences: {
          include: {
            diligence: true
          }
        },
        decisions: {
          include: {
            decision: true
          }
        }
      }
    });

    if (!avenant) {
      return res.status(404).json({ error: 'Avenant non trouvé' });
    }

    if (avenant.type !== 'AVENANT') {
      return res.status(400).json({ error: 'Ce document n\'est pas un avenant' });
    }

    // Formater les données pour Carbone selon le schéma Prisma
    const data = {
      avenant: {
        numero: avenant.numero,
        type: avenant.type,
        victimeOuMisEnCause: avenant.victimeOuMisEnCause,
        instance: avenant.instance,
        montantHT: avenant.montantHT,
        montantHTGagePrecedemment: avenant.montantHTGagePrecedemment,
        dateCreation: new Date(avenant.dateCreation).toLocaleDateString('fr-FR'),
        dateRetourSigne: avenant.dateRetourSigne ? new Date(avenant.dateRetourSigne).toLocaleDateString('fr-FR') : null
      },
      utilisateur: {
        grade: avenant.creePar.grade,
        nom: avenant.creePar.nom,
        prenom: avenant.creePar.prenom,
        gradeAbrege: avenant.creePar.grade, // Vous pourrez adapter selon votre logique de grade abrégé
        mail: avenant.creePar.mail,
        telephone: avenant.creePar.telephone
      },
      avocat: {
        nom: avenant.avocat.nom,
        prenom: avenant.avocat.prenom,
        email: avenant.avocat.email,
        telephone: avenant.avocat.telephone,
        adresse: avenant.avocat.adresse,
        codePostal: avenant.avocat.codePostal,
        ville: avenant.avocat.ville,
        barreau: avenant.avocat.barreau,
        toque: avenant.avocat.toque
      },
      dossier: {
        numero: avenant.dossier.numero,
        nomDossier: avenant.dossier.nomDossier,
        notes: avenant.dossier.notes
      },
      demandes: avenant.demandes.map(cd => ({
        nom: cd.demande.nom,
        prenom: cd.demande.prenom,
        grade: cd.demande.grade ? {
          gradeComplet: cd.demande.grade.gradeComplet,
          gradeAbrege: cd.demande.grade.gradeAbrege
        } : null
      })),
      // Chaîne formatée pour les demandeurs
      demandeursListe: avenant.demandes.map(cd =>
        `${cd.demande.grade?.gradeAbrege || ''} ${cd.demande.prenom} ${cd.demande.nom}`.trim()
      ).join(', '),
      // Chaîne formatée détaillée pour les demandeurs avec emails et téléphones
      demandeursListeDetaille: avenant.demandes.map(cd => {
        let result = `${cd.demande.grade?.gradeAbrege || ''} ${cd.demande.prenom} ${cd.demande.nom}`.trim();
        const contacts = [];
        if (cd.demande.emailProfessionnel) contacts.push(cd.demande.emailProfessionnel);
        if (cd.demande.emailPersonnel) contacts.push(cd.demande.emailPersonnel);
        if (cd.demande.telephoneProfessionnel) contacts.push(cd.demande.telephoneProfessionnel);
        if (cd.demande.telephonePersonnel) contacts.push(cd.demande.telephonePersonnel);
        if (contacts.length > 0) {
          result += '\n' + contacts.join('\n');
        }
        return result;
      }).join('\n\n'),
      diligences: avenant.diligences.map(cd => ({
        libelle: cd.diligence.libelle,
        description: cd.diligence.description
      })),
      decisions: avenant.decisions.map(cd => ({
        numero: cd.decision.numero,
        dateSignature: cd.decision.dateSignature ? new Date(cd.decision.dateSignature).toLocaleDateString('fr-FR') : null,
        type: cd.decision.type
      })),
      // Chaîne formatée pour les décisions : n° 2348 du 17/08/2025 ou n° 3435, 78435 et 38209 du 13/05/2025, 24/05/2025 et 26/05/2025
      decisionsListe: (() => {
        const decisions = avenant.decisions.map(cd => ({
          numero: cd.decision.numero,
          dateSignature: cd.decision.dateSignature ? new Date(cd.decision.dateSignature).toLocaleDateString('fr-FR') : null
        }));

        if (decisions.length === 0) return '';

        // Grouper par date pour optimiser l'affichage
        const numerosList = decisions.map(d => d.numero).join(', ');
        const datesList = decisions.map(d => d.dateSignature).filter(d => d).join(', ');

        let result = `n° ${numerosList}`;
        if (datesList) {
          result += ` du ${datesList}`;
        }

        return result;
      })(),
      // Données générées
      dateGeneration: new Date().toLocaleDateString('fr-FR')
    };

    // Utiliser le système de templates existant pour récupérer le template d'avenant
    const TEMPLATES_DIR = path.join(__dirname, '../uploads/templates');
    const DEFAULT_TEMPLATES_DIR = path.join(__dirname, '../templates/default');
    const TEMPLATE_TYPES = {
      avenant: 'avenant_template.odt'
    };

    // Fonction pour obtenir le chemin du template (améliorée avec vérification d'existence)
    const getTemplatePath = async (templateType) => {
      const activeVersion = await prisma.templateVersion.findFirst({
        where: {
          templateType,
          isActive: true
        }
      });

      if (activeVersion) {
        const uploadedTemplatePath = path.join(TEMPLATES_DIR, templateType, activeVersion.filename);
        try {
          // Vérifier que le fichier uploadé existe réellement
          await fs.access(uploadedTemplatePath);
          return uploadedTemplatePath;
        } catch (error) {
          console.warn(`Template uploadé non trouvé: ${uploadedTemplatePath}, fallback vers template par défaut`);
          // Désactiver cette version en base car le fichier n'existe plus
          await prisma.templateVersion.update({
            where: { id: activeVersion.id },
            data: { isActive: false }
          });
        }
      }

      return path.join(DEFAULT_TEMPLATES_DIR, TEMPLATE_TYPES[templateType]);
    };

    let templatePath;
    try {
      templatePath = await getTemplatePath('avenant');
      // Vérifier que le fichier existe
      await fs.access(templatePath);
    } catch (error) {
      console.error('Erreur d\'accès au template:', error);
      return res.status(404).json({
        error: 'Template d\'avenant non trouvé. Veuillez uploader un template via la page Templates de l\'admin.'
      });
    }

    console.log('Génération document d\'avenant pour:', data.avenant.numero);

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
          'GENERATE_AVENANT',
          `Génération document d'avenant n°${data.avenant.numero} pour dossier ${data.dossier.numero}`,
          'Convention',
          avenantId
        );

        // Nom du fichier généré en ODT
        const fileName = `avenant-${data.avenant.numero}-${Date.now()}.odt`;

        // Envoyer le fichier en réponse
        res.setHeader('Content-Type', 'application/vnd.oasis.opendocument.text');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.send(result);

      } catch (logError) {
        console.error('Erreur lors du log:', logError);
        // Envoyer quand même le fichier même si le log échoue
        const fileName = `avenant-${data.avenant.numero}-${Date.now()}.odt`;
        res.setHeader('Content-Type', 'application/vnd.oasis.opendocument.text');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.send(result);
      }
    });

  } catch (error) {
    console.error('Generate avenant error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;