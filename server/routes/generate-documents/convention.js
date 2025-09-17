const express = require('express');
const carbone = require('carbone');
const fs = require('fs').promises;
const { PrismaClient } = require('@prisma/client');
const { logAction } = require('../../utils/logger');
const { convertirNombreEnLettres, getComplementFacturation, getVictimeMecLabel, getTemplatePath } = require('./utils');

const router = express.Router();
const prisma = new PrismaClient();

// GET /conventions - Lister les conventions disponibles
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

// POST /convention/:conventionId - Générer un document de convention
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