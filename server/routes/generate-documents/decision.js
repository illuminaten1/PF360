const express = require('express');
const carbone = require('carbone');
const fs = require('fs').promises;
const { PrismaClient } = require('@prisma/client');
const { logAction } = require('../../utils/logger');
const { convertirNombreEnLettres, getVictimeMecLabel, getTemplatePath } = require('./utils');

const router = express.Router();
const prisma = new PrismaClient();

// GET /decisions - Lister les décisions disponibles
router.get('/decisions', async (req, res) => {
  try {
    const decisions = await prisma.decision.findMany({
      include: {
        dossier: true,
        visa: true,
        creePar: {
          select: {
            nom: true,
            prenom: true,
            grade: true
          }
        },
        demandes: {
          include: {
            demande: {
              include: {
                grade: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const decisionsFormatted = decisions.map(d => ({
      id: d.id,
      numero: d.numero,
      type: d.type,
      dateSignature: d.dateSignature,
      dossierNumero: d.dossier.numero,
      nombreDemandes: d.demandes.length,
      createdAt: d.createdAt
    }));

    res.json(decisionsFormatted);
  } catch (error) {
    console.error('Liste decisions error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /decision/:decisionId - Générer un document de décision
router.post('/decision/:decisionId', async (req, res) => {
  try {
    const { decisionId } = req.params;

    // Récupérer la décision avec toutes ses relations
    const decision = await prisma.decision.findUnique({
      where: { id: decisionId },
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
        visa: true,
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
        conventions: {
          include: {
            convention: {
              include: {
                avocat: true
              }
            }
          }
        },
        paiements: {
          include: {
            paiement: true
          }
        }
      }
    });

    if (!decision) {
      return res.status(404).json({ error: 'Décision non trouvée' });
    }

    // Formater les données pour Carbone selon le schéma Prisma
    const data = {
      decision: {
        numero: decision.numero,
        type: decision.type,
        typeLabel: getTypeDecisionLabel(decision.type),
        motifRejet: decision.motifRejet,
        dateSignature: decision.dateSignature ? new Date(decision.dateSignature).toLocaleDateString('fr-FR') : null,
        dateEnvoi: decision.dateEnvoi ? new Date(decision.dateEnvoi).toLocaleDateString('fr-FR') : null,
        avisHierarchiques: decision.avis_hierarchiques ? 'Vu les avis hiérarchiques ;\n' : '',
        typeVictMec: getVictimeMecLabel(decision.typeVictMec),
        considerant: decision.considerant
      },
      utilisateur: {
        grade: decision.creePar.grade,
        nom: decision.creePar.nom,
        prenom: decision.creePar.prenom,
        gradeAbrege: decision.creePar.grade, // Vous pourrez adapter selon votre logique de grade abrégé
        mail: decision.creePar.mail,
        telephone: decision.creePar.telephone
      },
      visa: {
        typeVisa: decision.visa.typeVisa,
        texteVisa: decision.visa.texteVisa
      },
      dossier: {
        numero: decision.dossier.numero,
        nomDossier: decision.dossier.nomDossier,
        notes: decision.dossier.notes
      },
      sgami: decision.dossier.sgami ? {
        nom: decision.dossier.sgami.nom,
        formatCourtNommage: decision.dossier.sgami.formatCourtNommage,
        texteConvention: decision.dossier.sgami.texteConvention,
        intituleFicheReglement: decision.dossier.sgami.intituleFicheReglement
      } : null,
      demandes: decision.demandes.map(dd => {
        const demande = dd.demande;
        return {
          numeroDS: demande.numeroDS,
          type: getVictimeMecLabel(demande.type),
          nom: demande.nom,
          prenom: demande.prenom,
          grade: demande.grade ? {
            gradeComplet: demande.grade.gradeComplet,
            gradeAbrege: demande.grade.gradeAbrege
          } : null,
          nigend: demande.nigend,
          statutDemandeur: demande.statutDemandeur,
          branche: demande.branche,
          formationAdministrative: demande.formationAdministrative,
          departement: demande.departement,
          adressePostaleLigne1: demande.adressePostaleLigne1,
          adressePostaleLigne2: demande.adressePostaleLigne2,
          telephoneProfessionnel: demande.telephoneProfessionnel,
          telephonePersonnel: demande.telephonePersonnel,
          emailProfessionnel: demande.emailProfessionnel,
          emailPersonnel: demande.emailPersonnel,
          unite: demande.unite,
          dateFaits: demande.dateFaits ? new Date(demande.dateFaits).toLocaleDateString('fr-FR') : null,
          commune: demande.commune,
          codePostal: demande.codePostal,
          position: demande.position,
          contexteMissionnel: demande.contexteMissionnel,
          qualificationInfraction: demande.qualificationInfraction,
          resume: demande.resume,
          blessures: demande.blessures,
          partieCivile: demande.partieCivile,
          montantPartieCivile: demande.montantPartieCivile,
          qualificationsPenales: demande.qualificationsPenales,
          dateAudience: demande.dateAudience ? new Date(demande.dateAudience).toLocaleDateString('fr-FR') : null,
          soutienPsychologique: demande.soutienPsychologique,
          soutienSocial: demande.soutienSocial,
          soutienMedical: demande.soutienMedical,
          commentaireDecision: demande.commentaireDecision,
          commentaireConvention: demande.commentaireConvention,
          commentaireSignature: demande.commentaireSignature,
          dateReception: new Date(demande.dateReception).toLocaleDateString('fr-FR')
        };
      }),
      // Variables formatées utiles pour les templates
      // {d.demandeursListe} - Chaîne formatée pour les demandeurs
      demandeursListe: decision.demandes.map(dd =>
        `${dd.demande.grade?.gradeAbrege || ''} ${dd.demande.prenom} ${dd.demande.nom}`.trim()
      ).join(', '),
      // {d.demandeursListeDetaille:convCRLF} - Chaîne formatée détaillée pour les demandeurs avec infos complètes
      demandeursListeDetaille: decision.demandes.map(dd => {
        const demande = dd.demande;
        let result = `${demande.grade?.gradeAbrege || ''} ${demande.prenom} ${demande.nom}`.trim();

        // Ajouter les informations complémentaires
        const infos = [];
        if (demande.nigend) infos.push(`NIGEND: ${demande.nigend}`);
        if (demande.statutDemandeur) infos.push(`Statut: ${demande.statutDemandeur}`);
        if (demande.branche) infos.push(`Branche: ${demande.branche}`);
        if (demande.formationAdministrative) infos.push(`Formation: ${demande.formationAdministrative}`);
        if (demande.unite) infos.push(`Unité: ${demande.unite}`);

        const contacts = [];
        if (demande.emailProfessionnel) contacts.push(demande.emailProfessionnel);
        if (demande.emailPersonnel) contacts.push(demande.emailPersonnel);
        if (demande.telephoneProfessionnel) contacts.push(demande.telephoneProfessionnel);
        if (demande.telephonePersonnel) contacts.push(demande.telephonePersonnel);

        if (infos.length > 0) {
          result += '\n' + infos.join('\n');
        }
        if (contacts.length > 0) {
          result += '\nContacts: ' + contacts.join(', ');
        }

        return result;
      }).join('\n\n'),
      // {d.faitsListe} - Résumé des faits pour chaque demande
      faitsListe: decision.demandes.map(dd => {
        const demande = dd.demande;
        let faitText = '';

        if (demande.dateFaits || demande.commune) {
          faitText += `Faits du ${demande.dateFaits ? new Date(demande.dateFaits).toLocaleDateString('fr-FR') : '[date non précisée]'}`;
          if (demande.commune) {
            faitText += ` à ${demande.commune}`;
            if (demande.codePostal) faitText += ` (${demande.codePostal})`;
          }
          faitText += '\n';
        }

        if (demande.position) {
          faitText += `Position: ${demande.position}\n`;
        }
        if (demande.contexteMissionnel) {
          faitText += `Contexte: ${demande.contexteMissionnel}\n`;
        }
        if (demande.qualificationInfraction) {
          faitText += `Qualification: ${demande.qualificationInfraction}\n`;
        }
        if (demande.resume) {
          faitText += `Résumé: ${demande.resume}\n`;
        }
        if (demande.blessures) {
          faitText += `Blessures: ${demande.blessures}\n`;
        }

        return faitText.trim();
      }).filter(f => f).join('\n\n'),
      conventions: decision.conventions.map(cd => ({
        numero: cd.convention.numero,
        type: cd.convention.type,
        victimeOuMisEnCause: getVictimeMecLabel(cd.convention.victimeOuMisEnCause),
        instance: cd.convention.instance,
        montantHT: cd.convention.montantHT,
        montantHTEnLettres: cd.convention.montantHT ?
          convertirNombreEnLettres(Math.floor(cd.convention.montantHT)) + ' euros' : null,
        avocat: cd.convention.avocat ? {
          nom: cd.convention.avocat.nom,
          prenom: cd.convention.avocat.prenom,
          nomComplet: `${cd.convention.avocat.prenom} ${cd.convention.avocat.nom}`
        } : null
      })),
      // {d.conventionsListe} - Liste des conventions liées à cette décision
      conventionsListe: decision.conventions.map(cd =>
        `Convention n°${cd.convention.numero} (${getVictimeMecLabel(cd.convention.victimeOuMisEnCause)}) - ${cd.convention.avocat?.prenom} ${cd.convention.avocat?.nom}`
      ).join(', '),
      paiements: decision.paiements.map(pd => ({
        numero: pd.paiement.numero,
        facture: pd.paiement.facture,
        montantHT: pd.paiement.montantHT,
        montantTTC: pd.paiement.montantTTC,
        qualiteBeneficiaire: pd.paiement.qualiteBeneficiaire,
        identiteBeneficiaire: pd.paiement.identiteBeneficiaire
      })),
      // Données générées
      dateGeneration: new Date().toLocaleDateString('fr-FR'),
      // Helpers pour conditions dans le template
      isTypeAJ: decision.type === 'AJ',
      isTypeAJE: decision.type === 'AJE',
      isTypePJ: decision.type === 'PJ',
      isTypeRejet: decision.type === 'REJET',
      hasAvisHierarchiques: decision.avis_hierarchiques,
      hasConsiderant: !!decision.considerant
    };

    let templatePath;
    try {
      templatePath = await getTemplatePath('decision');
      // Vérifier que le fichier existe
      await fs.access(templatePath);
    } catch (error) {
      console.error('Erreur d\'accès au template:', error);
      return res.status(404).json({
        error: 'Template de décision non trouvé. Veuillez uploader un template via la page Templates de l\'admin.'
      });
    }

    console.log('Génération document de décision pour:', data.decision.numero);

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
          'GENERATE_DECISION',
          `Génération document de décision n°${data.decision.numero} (${data.decision.type}) pour dossier ${data.dossier.numero}`,
          'Decision',
          decisionId
        );

        // Nom du fichier généré en ODT
        const fileName = `decision-${data.decision.numero || 'sans-numero'}-${Date.now()}.odt`;

        // Envoyer le fichier en réponse
        res.setHeader('Content-Type', 'application/vnd.oasis.opendocument.text');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.send(result);

      } catch (logError) {
        console.error('Erreur lors du log:', logError);
        // Envoyer quand même le fichier même si le log échoue
        const fileName = `decision-${data.decision.numero || 'sans-numero'}-${Date.now()}.odt`;
        res.setHeader('Content-Type', 'application/vnd.oasis.opendocument.text');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.send(result);
      }
    });

  } catch (error) {
    console.error('Generate decision error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Fonction utilitaire pour obtenir le libellé du type de décision
const getTypeDecisionLabel = (type) => {
  switch (type) {
    case 'AJ':
      return 'Assistance judiciaire';
    case 'AJE':
      return 'Assistance judiciaire élargie';
    case 'PJ':
      return 'Protection juridique';
    case 'REJET':
      return 'Rejet';
    default:
      return type || '';
  }
};

module.exports = router;