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
      // {d.demandeursListeOrdreGrade} - Liste des demandeurs triés par ordre décroissant de grade
      demandeursListeOrdreGrade: (() => {
        const demandesAvecGrade = decision.demandes.filter(dd => dd.demande.grade);
        const demandesSansGrade = decision.demandes.filter(dd => !dd.demande.grade);

        // Trier par ordre croissant du champ ordre (plus l'ordre est petit, plus le grade est élevé)
        const demandesTriees = demandesAvecGrade.sort((a, b) => {
          return (a.demande.grade.ordre || 999) - (b.demande.grade.ordre || 999);
        });

        // Combiner les demandes triées avec celles sans grade
        const toutesDemandesTriees = [...demandesTriees, ...demandesSansGrade];

        // Formater la liste selon le format demandé
        const listeFormatee = toutesDemandesTriees.map(dd => {
          const grade = dd.demande.grade?.gradeComplet || '';
          const prenom = dd.demande.prenom || '';
          const nom = dd.demande.nom || '';
          return `${grade} ${prenom} ${nom}`.trim();
        });

        // Joindre avec des virgules et "et" pour le dernier élément
        if (listeFormatee.length === 0) return '';
        if (listeFormatee.length === 1) return listeFormatee[0];
        if (listeFormatee.length === 2) return `${listeFormatee[0]} et ${listeFormatee[1]}`;

        const dernierElement = listeFormatee.pop();
        return `${listeFormatee.join(', ')} et ${dernierElement}`;
      })(),
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
      hasConsiderant: !!decision.considerant,
      // Variable dates.demandes pour générer automatiquement la phrase
      dates: {
        demandes: formatDatesDemandes(decision.demandes)
      },
      // Phrase automatique de décision selon le type et le nombre de demandes
      phraseDecision: genererPhraseDecision(decision.type, decision.demandes)
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

// Fonction pour formater la date au format français avec nombres ordinaux
const formatDateFrancaise = (date) => {
  const options = {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  };
  const dateStr = new Date(date).toLocaleDateString('fr-FR', options);

  // Remplacer le premier jour du mois par "1er"
  return dateStr.replace(/^1 /, '1er ');
};

// Fonction pour générer la phrase de décision selon le type et le nombre de demandes
const genererPhraseDecision = (typeDecision, demandes) => {
  if (!demandes || demandes.length === 0) {
    return '';
  }

  const nombreDemandes = demandes.length;
  let phraseBase = '';
  let verbe = '';

  // Déterminer le verbe et l'accord selon le type de décision
  if (['AJ', 'AJE', 'PJ'].includes(typeDecision)) {
    verbe = nombreDemandes === 1 ? 'est agréée' : 'sont agréées';
  } else if (typeDecision === 'REJET') {
    verbe = nombreDemandes === 1 ? 'est rejetée' : 'sont rejetées';
  } else {
    return '';
  }

  // Trier les demandes par ordre décroissant de grade (comme dans demandeursListeOrdreGrade)
  const demandesAvecGrade = demandes.filter(dd => dd.demande.grade);
  const demandesSansGrade = demandes.filter(dd => !dd.demande.grade);

  // Trier par ordre croissant du champ ordre (plus l'ordre est petit, plus le grade est élevé)
  const demandesTriees = demandesAvecGrade.sort((a, b) => {
    return (a.demande.grade.ordre || 999) - (b.demande.grade.ordre || 999);
  });

  // Combiner les demandes triées avec celles sans grade
  const toutesDemandesTriees = [...demandesTriees, ...demandesSansGrade];

  // Construire la liste des demandeurs avec grade, prénom et nom
  const demandeursList = toutesDemandesTriees.map(dd => {
    const demande = dd.demande;
    const grade = demande.grade?.gradeComplet || '';
    const prenom = demande.prenom || '';
    const nom = demande.nom || '';
    return `${grade} ${prenom} ${nom}`.trim();
  });

  // Construire la phrase selon le nombre de demandes
  if (nombreDemandes === 1) {
    phraseBase = `La demande de protection fonctionnelle de ${demandeursList[0]} ${verbe}.`;
  } else {
    // Pour plusieurs demandes, utiliser la liste formatée avec "et" pour le dernier
    let listeFormatee;
    if (nombreDemandes === 2) {
      listeFormatee = `${demandeursList[0]} et ${demandeursList[1]}`;
    } else {
      const dernierDemandeur = demandeursList.pop();
      listeFormatee = `${demandeursList.join(', ')} et ${dernierDemandeur}`;
    }
    phraseBase = `Les demandes de protection fonctionnelle de ${listeFormatee} ${verbe}.`;
  }

  return phraseBase;
};

// Fonction pour formater les dates des demandes en phrase complète
const formatDatesDemandes = (demandes) => {
  if (!demandes || demandes.length === 0) {
    return '';
  }

  // Extraire toutes les dates uniques de réception
  const datesReception = [...new Set(
    demandes.map(dd => new Date(dd.demande.dateReception).toDateString())
  )].sort((a, b) => new Date(a) - new Date(b));

  const nombreDemandes = demandes.length;
  const nombreDatesUniques = datesReception.length;

  let phraseBase = '';
  let partieDate = '';

  // Déterminer le début de la phrase selon le nombre de demandes
  if (nombreDemandes === 1) {
    phraseBase = 'Vu la demande de protection fonctionnelle reçue ';
  } else {
    phraseBase = 'Vu les demandes de protection fonctionnelle reçues ';
  }

  // Formater la partie date selon le nombre de dates uniques
  if (nombreDatesUniques === 1) {
    // Une seule date pour toutes les demandes
    partieDate = `le ${formatDateFrancaise(new Date(datesReception[0]))}`;
  } else if (nombreDatesUniques === 2) {
    // Deux dates différentes
    const date1 = formatDateFrancaise(new Date(datesReception[0]));
    const date2 = formatDateFrancaise(new Date(datesReception[1]));

    // Vérifier si les deux dates sont dans le même mois/année
    const d1 = new Date(datesReception[0]);
    const d2 = new Date(datesReception[1]);

    if (d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear()) {
      // Même mois et année : "le 12 et 14 mai 2025"
      const jour1 = d1.getDate() === 1 ? '1er' : d1.getDate().toString();
      const jour2 = d2.getDate() === 1 ? '1er' : d2.getDate().toString();
      const moisAnnee = new Date(datesReception[1]).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
      partieDate = `le ${jour1} et ${jour2} ${moisAnnee}`;
    } else {
      // Mois/années différents : "le 12 mai et 1er avril 2025" ou "le 30 décembre 2025 et le 2 janvier 2026"
      if (d1.getFullYear() === d2.getFullYear()) {
        // Même année : "le 12 mai et 1er avril 2025"
        const date1Court = new Date(datesReception[0]).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
        const date1CourtFormatted = date1Court.replace(/^1 /, '1er ');
        const date2Complet = formatDateFrancaise(new Date(datesReception[1]));
        partieDate = `le ${date1CourtFormatted} et ${date2Complet}`;
      } else {
        // Années différentes : "le 30 décembre 2025 et le 2 janvier 2026"
        const date1Complet = formatDateFrancaise(new Date(datesReception[0]));
        const date2Complet = formatDateFrancaise(new Date(datesReception[1]));
        partieDate = `le ${date1Complet} et le ${date2Complet}`;
      }
    }
  } else {
    // Trois dates ou plus : optimiser selon les années et mois
    const dates = datesReception.map(dateStr => new Date(dateStr));
    const anneesUniques = [...new Set(dates.map(d => d.getFullYear()))];

    if (anneesUniques.length === 1) {
      // Toutes les dates sont de la même année
      const moisUniques = [...new Set(dates.map(d => d.getMonth()))];

      if (moisUniques.length === 1) {
        // Toutes les dates sont du même mois et de la même année
        const premiereMoisAnnee = dates[0].toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
        const jours = dates.map(date => {
          return date.getDate() === 1 ? '1er' : date.getDate().toString();
        });

        const derniereDate = jours.pop();
        partieDate = `le ${jours.join(', ')} et ${derniereDate} ${premiereMoisAnnee}`;
      } else {
        // Même année mais mois différents - grouper par mois
        const annee = dates[0].getFullYear();

        // Grouper les dates par mois
        const dateParMois = {};
        dates.forEach(date => {
          const mois = date.getMonth();
          const nomMois = date.toLocaleDateString('fr-FR', { month: 'long' });
          if (!dateParMois[mois]) {
            dateParMois[mois] = { nomMois, jours: [] };
          }
          const jour = date.getDate() === 1 ? '1er' : date.getDate().toString();
          dateParMois[mois].jours.push(jour);
        });

        // Construire la phrase en regroupant par mois
        const moisOrdonnes = Object.keys(dateParMois).sort((a, b) => parseInt(a) - parseInt(b));
        const partiesMois = moisOrdonnes.map(mois => {
          const { nomMois, jours } = dateParMois[mois];
          if (jours.length === 1) {
            return `${jours[0]} ${nomMois}`;
          } else {
            const derniereDate = jours.pop();
            return `${jours.join(', ')} et ${derniereDate} ${nomMois}`;
          }
        });

        const derniereMoisPhrase = partiesMois.pop();
        if (partiesMois.length > 0) {
          partieDate = `le ${partiesMois.join(', ')} et ${derniereMoisPhrase} ${annee}`;
        } else {
          partieDate = `le ${derniereMoisPhrase} ${annee}`;
        }
      }
    } else {
      // Années différentes : grouper par année puis par mois
      const dateParAnnee = {};
      dates.forEach(date => {
        const annee = date.getFullYear();
        if (!dateParAnnee[annee]) {
          dateParAnnee[annee] = {};
        }

        const mois = date.getMonth();
        const nomMois = date.toLocaleDateString('fr-FR', { month: 'long' });
        if (!dateParAnnee[annee][mois]) {
          dateParAnnee[annee][mois] = { nomMois, jours: [] };
        }

        const jour = date.getDate() === 1 ? '1er' : date.getDate().toString();
        dateParAnnee[annee][mois].jours.push(jour);
      });

      // Construire la phrase en regroupant par année puis par mois
      const anneesOrdonnees = Object.keys(dateParAnnee).sort((a, b) => parseInt(a) - parseInt(b));
      const partiesAnnees = anneesOrdonnees.map(annee => {
        const moisDeLAnnee = dateParAnnee[annee];
        const moisOrdonnes = Object.keys(moisDeLAnnee).sort((a, b) => parseInt(a) - parseInt(b));

        if (moisOrdonnes.length === 1) {
          // Un seul mois dans cette année
          const mois = moisOrdonnes[0];
          const { nomMois, jours } = moisDeLAnnee[mois];
          if (jours.length === 1) {
            return `${jours[0]} ${nomMois} ${annee}`;
          } else {
            const derniereDate = jours.slice(-1)[0];
            const autresJours = jours.slice(0, -1);
            return `${autresJours.join(', ')} et ${derniereDate} ${nomMois} ${annee}`;
          }
        } else {
          // Plusieurs mois dans cette année
          const partiesMois = moisOrdonnes.map(mois => {
            const { nomMois, jours } = moisDeLAnnee[mois];
            if (jours.length === 1) {
              return `${jours[0]} ${nomMois}`;
            } else {
              const derniereDate = jours.slice(-1)[0];
              const autresJours = jours.slice(0, -1);
              return `${autresJours.join(', ')} et ${derniereDate} ${nomMois}`;
            }
          });

          const derniereMoisPhrase = partiesMois.pop();
          if (partiesMois.length > 0) {
            return `${partiesMois.join(', ')} et ${derniereMoisPhrase} ${annee}`;
          } else {
            return `${derniereMoisPhrase} ${annee}`;
          }
        }
      });

      const derniereAnneePhrase = partiesAnnees.pop();
      if (partiesAnnees.length > 0) {
        partieDate = `le ${partiesAnnees.join(', ')} et ${derniereAnneePhrase}`;
      } else {
        partieDate = `le ${derniereAnneePhrase}`;
      }
    }
  }

  return phraseBase + partieDate;
};

module.exports = router;