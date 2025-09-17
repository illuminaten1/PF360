const express = require('express');
const carbone = require('carbone');
const fs = require('fs').promises;
const { PrismaClient } = require('@prisma/client');
const { logAction } = require('../../utils/logger');
const { convertirNombreEnLettres, getComplementFacturation, getVictimeMecLabel, getTemplatePath } = require('./utils');

const router = express.Router();
const prisma = new PrismaClient();

// GET /avenants - Lister les avenants disponibles
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

// POST /avenant/:avenantId - Générer un document d'avenant
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