const express = require('express');
const carbone = require('carbone');
const path = require('path');
const fs = require('fs').promises;
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/auth');
const { logAction } = require('../utils/logger');

const router = express.Router();
const prisma = new PrismaClient();

// Fonction pour convertir un nombre en lettres (français)
const convertirNombreEnLettres = (nombre) => {
  if (nombre === 0) return 'zéro';

  const unites = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf'];
  const dizaines = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante', 'quatre-vingt', 'quatre-vingt'];
  const teens = ['dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];

  const convertirCentaines = (n) => {
    if (n === 0) return '';

    let result = '';
    const centaine = Math.floor(n / 100);
    const reste = n % 100;

    if (centaine > 0) {
      if (centaine === 1) {
        result += 'cent';
      } else {
        result += unites[centaine] + ' cent';
      }
      if (centaine > 1 && reste === 0) result += 's';
    }

    if (reste > 0) {
      if (centaine > 0) result += ' ';

      if (reste < 10) {
        result += unites[reste];
      } else if (reste < 20) {
        result += teens[reste - 10];
      } else {
        const diz = Math.floor(reste / 10);
        const unit = reste % 10;

        if (diz === 7 || diz === 9) {
          if (diz === 7) {
            result += 'soixante';
            if (unit === 0) {
              result += '-dix';
            } else {
              result += '-' + teens[unit];
            }
          } else { // diz === 9
            result += 'quatre-vingt';
            if (unit === 0) {
              result += '-dix';
            } else {
              result += '-' + teens[unit];
            }
          }
        } else {
          result += dizaines[diz];
          if (diz === 8 && unit === 0) {
            result += 's';
          }
          if (unit > 0) {
            if (unit === 1 && (diz === 2 || diz === 3 || diz === 4 || diz === 5 || diz === 6)) {
              result += ' et un';
            } else {
              result += '-' + unites[unit];
            }
          }
        }
      }
    }

    return result;
  };

  if (nombre < 1000) {
    return convertirCentaines(nombre);
  } else if (nombre < 1000000) {
    const milliers = Math.floor(nombre / 1000);
    const reste = nombre % 1000;
    let result = '';

    if (milliers === 1) {
      result = 'mille';
    } else {
      result = convertirCentaines(milliers) + ' mille';
    }

    if (reste > 0) {
      result += ' ' + convertirCentaines(reste);
    }

    return result;
  } else if (nombre < 1000000000) {
    const millions = Math.floor(nombre / 1000000);
    const reste = nombre % 1000000;
    let result = '';

    if (millions === 1) {
      result = 'un million';
    } else {
      result = convertirCentaines(millions) + ' millions';
    }

    if (reste > 0) {
      if (reste < 1000) {
        result += ' ' + convertirCentaines(reste);
      } else {
        const milliers = Math.floor(reste / 1000);
        const centaines = reste % 1000;
        if (milliers === 1) {
          result += ' mille';
        } else {
          result += ' ' + convertirCentaines(milliers) + ' mille';
        }
        if (centaines > 0) {
          result += ' ' + convertirCentaines(centaines);
        }
      }
    }

    return result;
  }

  return nombre.toString(); // Fallback pour les très grands nombres
};

// Fonction pour obtenir le complément de facturation
const getComplementFacturation = (typeFacturation) => {
  if (!typeFacturation || typeFacturation === 'FORFAITAIRE') {
    return ''; // Pas de texte supplémentaire pour le forfaitaire
  }

  switch (typeFacturation) {
    case 'DEMI_JOURNEE':
      return ' par demi-journée d\'assistance';
    case 'ASSISES':
      return ', montant forfaitaire maximal représentant 1 000 euros [mille euros] hors taxes par militaire pour la préparation du dossier devant la cour d\'assises et 500 euros [cinq cents euros] hors taxes par demi-journée de présence devant la cour d\'assises, quel que soit le nombre de militaires concernés';
    default:
      return '';
  }
}

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

    // Fonction pour formater victimeOuMisEnCause
    const getVictimeMecLabel = (type) => {
      switch (type) {
        case 'VICTIME':
          return 'victime'
        case 'MIS_EN_CAUSE':
          return 'mis en cause'
        default:
          return type?.toLowerCase() || ''
      }
    }

    // Formater les données pour Carbone selon le schéma Prisma
    const data = {
      avenant: {
        numero: avenant.numero,
        type: avenant.type,
        victimeOuMisEnCause: getVictimeMecLabel(avenant.victimeOuMisEnCause),
        instance: avenant.instance,
        montantHT: avenant.montantHT,
        montantHTGagePrecedemment: avenant.montantHTGagePrecedemment,
        montantHTTotal: avenant.montantHT + (avenant.montantHTGagePrecedemment || 0),
        montantHTEnLettres: convertirNombreEnLettres(Math.floor(avenant.montantHT)) + ' euros',
        complementFacturation: getComplementFacturation(avenant.typeFacturation),
        montantHTGagePrecedemmentEnLettres: avenant.montantHTGagePrecedemment ? convertirNombreEnLettres(Math.floor(avenant.montantHTGagePrecedemment)) + ' euros' : null,
        montantHTTotalEnLettres: convertirNombreEnLettres(Math.floor(avenant.montantHT + (avenant.montantHTGagePrecedemment || 0))) + ' euros',
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
        region: avenant.avocat.region,
        adressePostale: avenant.avocat.adressePostale,
        telephonePublic1: avenant.avocat.telephonePublic1,
        telephonePublic2: avenant.avocat.telephonePublic2,
        telephonePrive: avenant.avocat.telephonePrive,
        siretOuRidet: avenant.avocat.siretOuRidet,
        villesIntervention: avenant.avocat.villesIntervention,
        specialisation: avenant.avocat.specialisation,
        notes: avenant.avocat.notes,
        titulaireDuCompteBancaire: avenant.avocat.titulaireDuCompteBancaire,
        codeEtablissement: avenant.avocat.codeEtablissement,
        codeGuichet: avenant.avocat.codeGuichet,
        numeroDeCompte: avenant.avocat.numeroDeCompte,
        cle: avenant.avocat.cle
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
      diligence: avenant.diligences.length > 0 ? {
        libelle: avenant.diligences[0].diligence.nom,
        description: avenant.diligences[0].diligence.details
      } : null,
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

// GET /api/generate-documents/conventions - Lister les conventions disponibles
router.get('/conventions', async (req, res) => {
  try {
    const conventions = await prisma.convention.findMany({
      where: {
        type: 'CONVENTION'
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

    const conventionsFormatted = conventions.map(c => ({
      id: c.id,
      numero: c.numero,
      instance: c.instance,
      montantHT: c.montantHT,
      dossierNumero: c.dossier.numero,
      avocatNom: `${c.avocat.prenom} ${c.avocat.nom}`,
      createdAt: c.createdAt
    }));

    res.json(conventionsFormatted);
  } catch (error) {
    console.error('Liste conventions error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/generate-documents/convention/:conventionId - Générer un document de convention
router.post('/convention/:conventionId', async (req, res) => {
  try {
    const { conventionId } = req.params;

    // Récupérer la convention avec toutes ses relations
    const convention = await prisma.convention.findUnique({
      where: { id: conventionId },
      include: {
        dossier: {
          include: {
            demandes: {
              include: {
                grade: true
              }
            },
            sgami: true
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

    if (!convention) {
      return res.status(404).json({ error: 'Convention non trouvée' });
    }

    if (convention.type !== 'CONVENTION') {
      return res.status(400).json({ error: 'Ce document n\'est pas une convention' });
    }

    // Fonction pour formater victimeOuMisEnCause
    const getVictimeMecLabel = (type) => {
      switch (type) {
        case 'VICTIME':
          return 'victime'
        case 'MIS_EN_CAUSE':
          return 'mis en cause'
        default:
          return type?.toLowerCase() || ''
      }
    }

    // Formater les données pour Carbone selon le schéma Prisma
    const data = {
      convention: {
        numero: convention.numero,
        type: convention.type,
        victimeOuMisEnCause: getVictimeMecLabel(convention.victimeOuMisEnCause),
        instance: convention.instance,
        montantHT: convention.montantHT,
        montantHTEnLettres: convertirNombreEnLettres(Math.floor(convention.montantHT)) + ' euros',
        complementFacturation: getComplementFacturation(convention.typeFacturation),
        dateCreation: new Date(convention.dateCreation).toLocaleDateString('fr-FR'),
        dateRetourSigne: convention.dateRetourSigne ? new Date(convention.dateRetourSigne).toLocaleDateString('fr-FR') : null
      },
      utilisateur: {
        grade: convention.creePar.grade,
        nom: convention.creePar.nom,
        prenom: convention.creePar.prenom,
        gradeAbrege: convention.creePar.grade, // Vous pourrez adapter selon votre logique de grade abrégé
        mail: convention.creePar.mail,
        telephone: convention.creePar.telephone
      },
      avocat: {
        nom: convention.avocat.nom,
        prenom: convention.avocat.prenom,
        email: convention.avocat.email,
        region: convention.avocat.region,
        adressePostale: convention.avocat.adressePostale,
        telephonePublic1: convention.avocat.telephonePublic1,
        telephonePublic2: convention.avocat.telephonePublic2,
        telephonePrive: convention.avocat.telephonePrive,
        siretOuRidet: convention.avocat.siretOuRidet,
        villesIntervention: convention.avocat.villesIntervention,
        specialisation: convention.avocat.specialisation,
        notes: convention.avocat.notes,
        titulaireDuCompteBancaire: convention.avocat.titulaireDuCompteBancaire,
        codeEtablissement: convention.avocat.codeEtablissement,
        codeGuichet: convention.avocat.codeGuichet,
        numeroDeCompte: convention.avocat.numeroDeCompte,
        cle: convention.avocat.cle
      },
      dossier: {
        numero: convention.dossier.numero,
        nomDossier: convention.dossier.nomDossier,
        notes: convention.dossier.notes
      },
      sgami: convention.dossier.sgami ? {
        nom: convention.dossier.sgami.nom,
        formatCourtNommage: convention.dossier.sgami.formatCourtNommage,
        texteConvention: convention.dossier.sgami.texteConvention,
        intituleFicheReglement: convention.dossier.sgami.intituleFicheReglement
      } : null,
      demandes: convention.demandes.map(cd => ({
        nom: cd.demande.nom,
        prenom: cd.demande.prenom,
        grade: cd.demande.grade ? {
          gradeComplet: cd.demande.grade.gradeComplet,
          gradeAbrege: cd.demande.grade.gradeAbrege
        } : null
      })),
      // Variables demandées par l'utilisateur
      // {d.demandeursListe} - Chaîne formatée pour les demandeurs
      demandeursListe: convention.demandes.map(cd =>
        `${cd.demande.grade?.gradeAbrege || ''} ${cd.demande.prenom} ${cd.demande.nom}`.trim()
      ).join(', '),
      // {d.demandeursListeDetaille:convCRLF} - Chaîne formatée détaillée pour les demandeurs avec emails et téléphones
      demandeursListeDetaille: convention.demandes.map(cd => {
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
      diligence: convention.diligences.length > 0 ? {
        libelle: convention.diligences[0].diligence.nom,
        description: convention.diligences[0].diligence.details
      } : null,
      decisions: convention.decisions.map(cd => ({
        numero: cd.decision.numero,
        dateSignature: cd.decision.dateSignature ? new Date(cd.decision.dateSignature).toLocaleDateString('fr-FR') : null,
        type: cd.decision.type
      })),
      // {d.decisionsListe} - Chaîne formatée pour les décisions : n° 2348 du 17/08/2025 ou n° 3435, 78435 et 38209 du 13/05/2025, 24/05/2025 et 26/05/2025
      decisionsListe: (() => {
        const decisions = convention.decisions.map(cd => ({
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

    // Utiliser le système de templates existant pour récupérer le template de convention
    const TEMPLATES_DIR = path.join(__dirname, '../uploads/templates');
    const DEFAULT_TEMPLATES_DIR = path.join(__dirname, '../templates/default');
    const TEMPLATE_TYPES = {
      convention: 'convention_template.odt'
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
      templatePath = await getTemplatePath('convention');
      // Vérifier que le fichier existe
      await fs.access(templatePath);
    } catch (error) {
      console.error('Erreur d\'accès au template:', error);
      return res.status(404).json({
        error: 'Template de convention non trouvé. Veuillez uploader un template via la page Templates de l\'admin.'
      });
    }

    console.log('Génération document de convention pour:', data.convention.numero);

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
          'GENERATE_CONVENTION',
          `Génération document de convention n°${data.convention.numero} pour dossier ${data.dossier.numero}`,
          'Convention',
          conventionId
        );

        // Nom du fichier généré en ODT
        const fileName = `convention-${data.convention.numero}-${Date.now()}.odt`;

        // Envoyer le fichier en réponse
        res.setHeader('Content-Type', 'application/vnd.oasis.opendocument.text');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.send(result);

      } catch (logError) {
        console.error('Erreur lors du log:', logError);
        // Envoyer quand même le fichier même si le log échoue
        const fileName = `convention-${data.convention.numero}-${Date.now()}.odt`;
        res.setHeader('Content-Type', 'application/vnd.oasis.opendocument.text');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.send(result);
      }
    });

  } catch (error) {
    console.error('Generate convention error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;