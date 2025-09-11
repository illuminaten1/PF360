const carbone = require('carbone');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Fonction pour formater les montants
const formatMontant = (montant) => {
  if (!montant) return '0,00';
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(montant);
};

// Fonction pour formater les dates
const formatDate = (date) => {
  if (!date) return '';
  return new Intl.DateTimeFormat('fr-FR').format(new Date(date));
};

// Fonction pour obtenir le chemin du template
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
  
  return path.join(__dirname, '../templates/default', `${templateType}_template.docx`);
};

// Générateur de documents pour paiements
const generatePaiementDocument = async (paiementId) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Récupération des données avec toutes les relations nécessaires
      const paiement = await prisma.paiement.findUnique({
        where: { id: paiementId },
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
          sgami: true,
          avocat: true,
          pce: true,
          creePar: {
            select: { 
              id: true, 
              nom: true, 
              prenom: true, 
              grade: true,
              mail: true
            }
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
        throw new Error(`Paiement non trouvé pour l'ID: ${paiementId}`);
      }
      
      if (!paiement.numero) {
        throw new Error(`Paiement sans numéro trouvé pour l'ID: ${paiementId}`);
      }

      // Récupération de la première demande pour les informations du demandeur
      const premiereDemande = paiement.dossier?.demandes?.[0];

      // Structure de données simplifiée selon tes recommandations
      const templateData = {
        // Données paiement principales
        paiement: {
          numero: paiement.numero,
          montantHT: formatMontant(paiement.montantHT),
          montantTTC: formatMontant(paiement.montantTTC),
          dateServiceFait: formatDate(paiement.dateServiceFait),
          facture: paiement.facture || 'N/A',
          conventionJointeFRI: paiement.conventionJointeFRI || 'NON',
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

        // Données demandeur (première demande du dossier)
        demandeur: premiereDemande ? {
          grade: premiereDemande.grade?.gradeAbrege || 'N/A',
          prenom: premiereDemande.prenom,
          nom: premiereDemande.nom.toUpperCase()
        } : {
          grade: 'N/A',
          prenom: '',
          nom: ''
        },

        // Données SGAMI  
        sgami: {
          nom: paiement.sgami.nom,
          intituleFicheReglement: paiement.sgami.intituleFicheReglement || paiement.sgami.nom
        },

        // Données PCE
        pce: paiement.pce ? {
          pceNumerique: paiement.pce.pceNumerique || 'N/A',
          codeMarchandise: paiement.pce.codeMarchandise || 'N/A',
          pceDetaille: paiement.pce.pceDetaille || ''
        } : {
          pceNumerique: 'N/A',
          codeMarchandise: 'N/A',
          pceDetaille: ''
        },

        // Données utilisateur créateur
        utilisateur: {
          gradeAbrege: paiement.creePar.grade || '',
          prenom: paiement.creePar.prenom,
          nom: paiement.creePar.nom,
          mail: paiement.creePar.mail || ''
        },

        // Données avocat (si applicable)
        avocat: paiement.avocat ? {
          nom: paiement.avocat.nom,
          prenom: paiement.avocat.prenom
        } : null,

        // Structure pour itérations Carbone
        d: {
          demandes: paiement.dossier?.demandes?.map(demande => ({
            grade: demande.grade?.gradeAbrege || demande.grade?.gradeComplet || '',
            prenom: demande.prenom || '',
            nom: demande.nom || ''
          })) || [],
          decisions: paiement.decisions?.map(pd => ({
            numero: pd.decision.numero || '',
            dateSignature: formatDate(pd.decision.dateSignature)
          })) || []
        },

        // Date du document
        dateDocument: formatDate(new Date())
      };

      // Debug : affichage de la structure de données
      console.log('=== CARBONE TEMPLATE DATA ===');
      console.log(JSON.stringify(templateData, null, 2));
      
      // Obtenir le chemin du template
      const templatePath = await getTemplatePath('reglement');
      console.log('Template path:', templatePath);
      
      // Vérifier que le template existe
      const fs = require('fs').promises;
      try {
        await fs.access(templatePath);
      } catch (error) {
        throw new Error(`Template non trouvé : ${templatePath}. Erreur: ${error.message}`);
      }

      // Options Carbone pour DOCX  
      const options = {
        convertTo: null // Garder DOCX pour éviter les problèmes LibreOffice
      };

      // Génération avec Carbone
      carbone.render(templatePath, templateData, options, (err, result) => {
        if (err) {
          console.error('Erreur génération Carbone:', err);
          reject(err);
          return;
        }

        const filename = options.convertTo === 'pdf' 
          ? `fiche_reglement_${paiement.numero}_FRI.pdf`
          : `fiche_reglement_${paiement.numero}_FRI.docx`;

        resolve({
          buffer: result,
          filename,
          contentType: options.convertTo === 'pdf' 
            ? 'application/pdf'
            : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        });
      });

    } catch (error) {
      reject(error);
    }
  });
};

module.exports = {
  generatePaiementDocument,
  formatMontant,
  formatDate
};