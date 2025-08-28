const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const PDFDocument = require('pdfkit');

// Middleware combiné pour admin
const requireAdmin = [authMiddleware, adminMiddleware];
const { logAction } = require('../utils/logger');

const router = express.Router();
const prisma = new PrismaClient();

// Fonction pour générer le contenu PDF
const generatePDFContent = (doc, exportData) => {
  const { personData, exportDate, exportedBy, personType, metadata } = exportData;
  
  // Header du document
  doc.fontSize(20).font('Helvetica-Bold').text('EXPORT DONNÉES PERSONNELLES - RGPD', { align: 'center' });
  doc.moveDown();
  
  // Informations de l'export
  doc.fontSize(12).font('Helvetica');
  doc.text(`Date d'export: ${new Date(exportDate).toLocaleDateString('fr-FR')}`, { align: 'right' });
  doc.text(`Exporté par: ${exportedBy}`, { align: 'right' });
  doc.text(`Type de personne: ${personType === 'demandeur' ? 'Demandeur' : 'Avocat'}`, { align: 'right' });
  doc.moveDown(2);

  // Conformité RGPD
  if (metadata.rgpdCompliant) {
    doc.fillColor('green').fontSize(10).text('✓ Export conforme RGPD Article 15', { align: 'center' });
    doc.fillColor('black');
    if (metadata.dataAnonymized) {
      doc.text('✓ Données tierces anonymisées', { align: 'center' });
    }
    doc.moveDown(2);
  }

  // Informations de la personne
  doc.fontSize(16).font('Helvetica-Bold').text('INFORMATIONS PERSONNELLES', { underline: true });
  doc.moveDown();
  
  doc.fontSize(12).font('Helvetica');
  if (personData.nom && personData.prenom) {
    doc.text(`Nom: ${personData.nom}`);
    doc.text(`Prénom: ${personData.prenom}`);
  }
  
  if (personData.type) {
    doc.text(`Type de demande: ${personData.type === 'VICTIME' ? 'Victime' : 'Mis en cause'}`);
  }
  
  if (personData.nigend) {
    doc.text(`NIGEND: ${personData.nigend}`);
  }
  
  if (personData.numeroDS) {
    doc.text(`Numéro DS: ${personData.numeroDS}`);
  }
  
  if (personData.emailProfessionnel) {
    doc.text(`Email professionnel: ${personData.emailProfessionnel}`);
  }
  
  if (personData.emailPersonnel) {
    doc.text(`Email personnel: ${personData.emailPersonnel}`);
  }
  
  if (personData.email) {
    doc.text(`Email: ${personData.email}`);
  }
  
  // Pour les avocats seulement
  if (personType === 'avocat') {
    if (personData.telephonePublic1) {
      doc.text(`Téléphone public 1: ${personData.telephonePublic1}`);
    }
    
    if (personData.telephonePublic2) {
      doc.text(`Téléphone public 2: ${personData.telephonePublic2}`);
    }
    
    if (personData.telephonePrive) {
      doc.text(`Téléphone privé: ${personData.telephonePrive}`);
    }
  }
  
  if (personData.telephoneProfessionnel) {
    doc.text(`Téléphone professionnel: ${personData.telephoneProfessionnel}`);
  }
  
  if (personData.telephonePersonnel) {
    doc.text(`Téléphone personnel: ${personData.telephonePersonnel}`);
  }
  
  if (personData.adressePostaleLigne1) {
    doc.text(`Adresse: ${personData.adressePostaleLigne1}`);
    if (personData.adressePostaleLigne2) {
      doc.text(`         ${personData.adressePostaleLigne2}`);
    }
    if (personData.codePostal) {
      doc.text(`Code postal: ${personData.codePostal}`);
    }
  }
  
  doc.moveDown(2);

  // Informations complémentaires selon le type
  if (personType === 'demandeur') {
    if (personData.grade) {
      doc.fontSize(14).font('Helvetica-Bold').text('INFORMATIONS MILITAIRES', { underline: true });
      doc.moveDown();
      doc.fontSize(12).font('Helvetica');
      
      if (personData.grade.gradeComplet) {
        doc.text(`Grade: ${personData.grade.gradeComplet} (${personData.grade.gradeAbrege})`);
      }
      
      if (personData.statutDemandeur) {
        doc.text(`Statut: ${personData.statutDemandeur}`);
      }
      
      if (personData.branche) {
        doc.text(`Branche: ${personData.branche}`);
      }
      
      if (personData.unite) {
        doc.text(`Unité: ${personData.unite}`);
      }
      
      if (personData.formationAdministrative) {
        doc.text(`Formation administrative: ${personData.formationAdministrative}`);
      }
      
      if (personData.departement) {
        doc.text(`Département d'affectation: ${personData.departement}`);
      }
      
      doc.moveDown(2);
    }
    
    // Informations sur les faits
    if (personData.dateFaits || personData.commune || personData.contexteMissionnel) {
      doc.fontSize(14).font('Helvetica-Bold').text('INFORMATIONS SUR LES FAITS', { underline: true });
      doc.moveDown();
      doc.fontSize(12).font('Helvetica');
      
      if (personData.dateFaits) {
        doc.text(`Date des faits: ${new Date(personData.dateFaits).toLocaleDateString('fr-FR')}`);
      }
      
      if (personData.commune) {
        doc.text(`Commune: ${personData.commune}`);
      }
      
      if (personData.position) {
        doc.text(`Position: ${personData.position === 'EN_SERVICE' ? 'En service' : 'Hors service'}`);
      }
      
      if (personData.contexteMissionnel) {
        doc.text(`Contexte missionnel: ${personData.contexteMissionnel}`);
      }
      
      if (personData.qualificationInfraction) {
        doc.text(`Qualification: ${personData.qualificationInfraction}`);
      }
      
      if (personData.resume) {
        doc.text(`Résumé: ${personData.resume}`);
      }
      
      if (personData.qualificationsPenales) {
        doc.text(`Qualification pénale: ${personData.qualificationsPenales}`);
      }
      
      if (personData.dateAudience) {
        doc.text(`Date d'audience: ${new Date(personData.dateAudience).toLocaleDateString('fr-FR')}`);
      }
      
      if (personData.blessures) {
        doc.text(`Blessures: ${personData.blessures}`);
      }
      
      if (personData.partieCivile) {
        doc.text(`Partie civile: Oui`);
        if (personData.montantPartieCivile) {
          doc.text(`Montant partie civile: ${personData.montantPartieCivile}€`);
        }
      }
      
      doc.moveDown(2);
    }
    
    // Section soutiens
    if (personData.soutienPsychologique || personData.soutienSocial || personData.soutienMedical) {
      doc.fontSize(14).font('Helvetica-Bold').text('SOUTIENS DEMANDÉS', { underline: true });
      doc.moveDown();
      doc.fontSize(12).font('Helvetica');
      
      if (personData.soutienPsychologique) {
        doc.text('✓ Soutien psychologique');
      }
      
      if (personData.soutienSocial) {
        doc.text('✓ Soutien social');
      }
      
      if (personData.soutienMedical) {
        doc.text('✓ Soutien médical');
      }
      
      doc.moveDown(2);
    }
    
    // Section commentaires (si présents)
    if (personData.commentaireDecision || personData.commentaireConvention) {
      doc.fontSize(14).font('Helvetica-Bold').text('COMMENTAIRES DE SUIVI', { underline: true });
      doc.moveDown();
      doc.fontSize(12).font('Helvetica');
      
      if (personData.commentaireDecision) {
        doc.text(`Commentaire décision: ${personData.commentaireDecision}`);
      }
      
      if (personData.commentaireConvention) {
        doc.text(`Commentaire convention: ${personData.commentaireConvention}`);
      }
      
      doc.moveDown(2);
    }
    
    // Section dates administratives
    doc.fontSize(14).font('Helvetica-Bold').text('INFORMATIONS ADMINISTRATIVES', { underline: true });
    doc.moveDown();
    doc.fontSize(12).font('Helvetica');
    
    if (personData.dateReception) {
      doc.text(`Date de réception de la demande: ${new Date(personData.dateReception).toLocaleDateString('fr-FR')}`);
    }
    
    if (personData.createdAt) {
      doc.text(`Date de création en base: ${new Date(personData.createdAt).toLocaleDateString('fr-FR')}`);
    }
    
    if (personData.updatedAt && personData.updatedAt !== personData.createdAt) {
      doc.text(`Dernière modification: ${new Date(personData.updatedAt).toLocaleDateString('fr-FR')}`);
    }
    
    doc.moveDown(2);
    
  } else if (personType === 'avocat') {
    // Informations professionnelles de l'avocat
    doc.fontSize(14).font('Helvetica-Bold').text('INFORMATIONS PROFESSIONNELLES', { underline: true });
    doc.moveDown();
    doc.fontSize(12).font('Helvetica');
    
    if (personData.region) {
      doc.text(`Région: ${personData.region}`);
    }
    
    if (personData.adressePostale) {
      doc.text(`Adresse postale: ${personData.adressePostale}`);
    }
    
    if (personData.specialisation) {
      doc.text(`Spécialisation: ${personData.specialisation}`);
    }
    
    if (personData.siretOuRidet) {
      doc.text(`SIRET/RIDET: ${personData.siretOuRidet}`);
    }
    
    if (personData.notes) {
      doc.text(`Notes: ${personData.notes}`);
    }
    
    if (personData.villesIntervention) {
      try {
        const villes = JSON.parse(personData.villesIntervention);
        if (Array.isArray(villes) && villes.length > 0) {
          doc.text(`Villes d'intervention: ${villes.join(', ')}`);
        }
      } catch (e) {
        // Si ce n'est pas du JSON valide, afficher tel quel
        doc.text(`Villes d'intervention: ${personData.villesIntervention}`);
      }
    }
    
    // Section données bancaires (sensibles mais nécessaires pour RGPD)
    if (personData.titulaireDuCompteBancaire || personData.codeEtablissement || personData.codeGuichet || 
        personData.numeroDeCompte || personData.cle) {
      doc.moveDown(1);
      doc.fontSize(14).font('Helvetica-Bold').text('INFORMATIONS BANCAIRES', { underline: true });
      doc.moveDown();
      doc.fontSize(10).font('Helvetica');
      doc.text('⚠️  Données sensibles - Confidentialité absolue requise', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).font('Helvetica');
      
      if (personData.titulaireDuCompteBancaire) {
        doc.text(`Titulaire du compte: ${personData.titulaireDuCompteBancaire}`);
      }
      
      if (personData.codeEtablissement) {
        doc.text(`Code établissement: ${personData.codeEtablissement}`);
      }
      
      if (personData.codeGuichet) {
        doc.text(`Code guichet: ${personData.codeGuichet}`);
      }
      
      if (personData.numeroDeCompte) {
        doc.text(`Numéro de compte: ${personData.numeroDeCompte}`);
      }
      
      if (personData.cle) {
        doc.text(`Clé RIB: ${personData.cle}`);
      }
    }
    
    doc.moveDown(2);
  }

  // Données relationnelles (si incluses)
  if (personData.dossier || personData.conventions || personData.paiements) {
    doc.fontSize(14).font('Helvetica-Bold').text('DONNÉES ASSOCIÉES', { underline: true });
    doc.moveDown();
    doc.fontSize(10).font('Helvetica');
    
    doc.text('Note: Les données d\'autres personnes ont été anonymisées conformément au RGPD.', { 
      align: 'justify',
      width: 500
    });
    doc.moveDown();
    
    // Résumé statistique plutôt que détails complets
    if (personData.conventions && personData.conventions.length > 0) {
      doc.text(`Nombre de conventions associées: ${personData.conventions.length}`);
    }
    
    if (personData.paiements && personData.paiements.length > 0) {
      doc.text(`Nombre de paiements associés: ${personData.paiements.length}`);
    }
    
    doc.moveDown(2);
  }

  // Footer avec informations légales
  doc.fontSize(8).font('Helvetica');
  doc.text('___', { align: 'center' });
  doc.moveDown();
  doc.text(`Document généré le ${new Date(exportDate).toLocaleDateString('fr-FR')} à ${new Date(exportDate).toLocaleTimeString('fr-FR')}`, { align: 'center' });
  doc.text('Conformément à l\'Article 15 du RGPD - Droit d\'accès de la personne concernée', { align: 'center' });
  doc.text('Les données d\'autres personnes ont été anonymisées pour respecter leur vie privée', { align: 'center' });
};

// Recherche de personnes (demandeurs et avocats)
router.get('/search', requireAdmin, async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.length < 2) {
      return res.json([]);
    }

    const searchTerm = q.toLowerCase();

    // Recherche optimisée pour SQLite avec LIKE pour simuler l'insensitive
    const demandeurs = await prisma.$queryRaw`
      SELECT id, nom, prenom, nigend, numeroDS, emailProfessionnel, emailPersonnel
      FROM demandes 
      WHERE LOWER(nom) LIKE ${'%' + searchTerm + '%'}
         OR LOWER(prenom) LIKE ${'%' + searchTerm + '%'}
         OR LOWER(nigend) LIKE ${'%' + searchTerm + '%'}
         OR LOWER(numeroDS) LIKE ${'%' + searchTerm + '%'}
         OR LOWER(emailProfessionnel) LIKE ${'%' + searchTerm + '%'}
         OR LOWER(emailPersonnel) LIKE ${'%' + searchTerm + '%'}
      LIMIT 20
    `;

    // Recherche optimisée pour les avocats aussi
    const avocats = await prisma.$queryRaw`
      SELECT id, nom, prenom, email
      FROM avocats 
      WHERE active = 1 AND (
        LOWER(nom) LIKE ${'%' + searchTerm + '%'}
        OR LOWER(prenom) LIKE ${'%' + searchTerm + '%'}
        OR LOWER(email) LIKE ${'%' + searchTerm + '%'}
      )
      LIMIT 20
    `;

    // Formater les résultats
    const results = [
      ...demandeurs.map(d => ({
        id: d.id,
        type: 'demandeur',
        nom: d.nom,
        prenom: d.prenom,
        email: d.emailProfessionnel || d.emailPersonnel,
        nigend: d.nigend,
        numeroDS: d.numeroDS
      })),
      ...avocats.map(a => ({
        id: a.id,
        type: 'avocat',
        nom: a.nom,
        prenom: a.prenom,
        email: a.email
      }))
    ];

    res.json(results);
  } catch (error) {
    console.error('Erreur lors de la recherche RGPD:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Fonction pour anonymiser les données d'autres personnes
const anonymizePersonalData = (data, targetPersonId, targetPersonType) => {
  // Cette fonction remplace les données personnelles d'autres personnes
  // par des identifiants anonymes
  if (!data) return data;
  
  // Clone profond pour éviter la mutation
  const anonymizedData = JSON.parse(JSON.stringify(data));
  
  // Compteur pour les personnes anonymisées
  let personCounter = 1;
  const anonymizedPersons = new Map();
  
  const anonymizePerson = (person, idField, excludeId = null) => {
    if (!person || person[idField] === excludeId) return person;
    
    if (!anonymizedPersons.has(person[idField])) {
      anonymizedPersons.set(person[idField], `Personne ${personCounter++}`);
    }
    
    return {
      ...person,
      nom: anonymizedPersons.get(person[idField]),
      prenom: '',
      email: '*****@*****.***',
      emailProfessionnel: '*****@*****.***',
      emailPersonnel: '*****@*****.***',
      telephoneProfessionnel: '**.**.**.**.**',
      telephonePersonnel: '**.**.**.**.**',
      telephonePublic1: '**.**.**.**.**',
      telephonePublic2: '**.**.**.**.**',
      telephonePrive: '**.**.**.**.**',
      adressePostale: 'Adresse anonymisée',
      adressePostaleLigne1: 'Adresse anonymisée',
      adressePostaleLigne2: 'Adresse anonymisée'
    };
  };
  
  // Anonymiser selon le type de données
  if (Array.isArray(anonymizedData)) {
    return anonymizedData.map(item => anonymizePersonalData(item, targetPersonId, targetPersonType));
  }
  
  if (typeof anonymizedData === 'object') {
    // Anonymiser les utilisateurs (creePar, modifiePar, assigneA)
    if (anonymizedData.creePar) {
      anonymizedData.creePar = anonymizePerson(anonymizedData.creePar, 'id', 
        targetPersonType === 'user' ? targetPersonId : null);
    }
    if (anonymizedData.modifiePar) {
      anonymizedData.modifiePar = anonymizePerson(anonymizedData.modifiePar, 'id',
        targetPersonType === 'user' ? targetPersonId : null);
    }
    if (anonymizedData.assigneA) {
      anonymizedData.assigneA = anonymizePerson(anonymizedData.assigneA, 'id',
        targetPersonType === 'user' ? targetPersonId : null);
    }
    
    // Anonymiser les avocats
    if (anonymizedData.avocat) {
      anonymizedData.avocat = anonymizePerson(anonymizedData.avocat, 'id',
        targetPersonType === 'avocat' ? targetPersonId : null);
    }
    
    // Anonymiser les demandeurs dans les relations
    if (anonymizedData.demandes && Array.isArray(anonymizedData.demandes)) {
      anonymizedData.demandes = anonymizedData.demandes.map(demande => {
        if (demande.id !== targetPersonId || targetPersonType !== 'demandeur') {
          return anonymizePerson(demande, 'id', 
            targetPersonType === 'demandeur' ? targetPersonId : null);
        }
        return demande;
      });
    }
    
    // Parcourir récursivement les autres propriétés
    Object.keys(anonymizedData).forEach(key => {
      if (typeof anonymizedData[key] === 'object' && anonymizedData[key] !== null) {
        anonymizedData[key] = anonymizePersonalData(anonymizedData[key], targetPersonId, targetPersonType);
      }
    });
  }
  
  return anonymizedData;
};

// Export des données personnelles
router.post('/export', requireAdmin, async (req, res) => {
  try {
    const { personId, personType, format = 'pdf', includeRelatedData = true } = req.body;
    
    if (!personId || !personType) {
      return res.status(400).json({ error: 'personId et personType sont requis' });
    }

    let personData = null;
    let relatedData = {};

    // Récupérer les données selon le type de personne
    if (personType === 'demandeur') {
      personData = await prisma.demande.findUnique({
        where: { id: personId },
        include: {
          grade: true,
          dossier: includeRelatedData ? {
            include: {
              decisions: {
                include: {
                  creePar: true,
                  modifiePar: true,
                  visa: true,
                  demandes: {
                    include: {
                      demande: true
                    }
                  }
                }
              },
              conventions: {
                include: {
                  avocat: true,
                  creePar: true,
                  modifiePar: true,
                  demandes: {
                    include: {
                      demande: true
                    }
                  }
                }
              },
              paiements: {
                include: {
                  avocat: true,
                  creePar: true,
                  sgami: true,
                  pce: true
                }
              }
            }
          } : false,
          assigneA: true,
          creePar: true,
          modifiePar: true,
          decisions: includeRelatedData ? {
            include: {
              decision: {
                include: {
                  creePar: true,
                  modifiePar: true,
                  visa: true
                }
              }
            }
          } : false,
          conventions: includeRelatedData ? {
            include: {
              convention: {
                include: {
                  avocat: true,
                  creePar: true,
                  modifiePar: true
                }
              }
            }
          } : false
        }
      });
    } else if (personType === 'avocat') {
      personData = await prisma.avocat.findUnique({
        where: { id: personId },
        include: {
          creePar: true,
          modifiePar: true,
          conventions: includeRelatedData ? {
            include: {
              dossier: {
                include: {
                  demandes: true
                }
              },
              creePar: true,
              modifiePar: true,
              demandes: {
                include: {
                  demande: true
                }
              }
            }
          } : false,
          paiements: includeRelatedData ? {
            include: {
              dossier: {
                include: {
                  demandes: true
                }
              },
              creePar: true,
              sgami: true,
              pce: true
            }
          } : false
        }
      });
    }

    if (!personData) {
      return res.status(404).json({ error: 'Personne non trouvée' });
    }

    // Anonymiser les données d'autres personnes
    const anonymizedData = anonymizePersonalData(personData, personId, personType);

    // Logger l'export pour traçabilité
    await logAction(
      req.user.id,
      'RGPD_EXPORT',
      `Export des données ${personType} ${personData.prenom} ${personData.nom} - Format: ${format}`,
      personType.toUpperCase(),
      personId
    );

    // Préparer les données d'export
    const exportData = {
      exportDate: new Date().toISOString(),
      exportedBy: `${req.user.prenom} ${req.user.nom}`,
      personType,
      personData: anonymizedData,
      metadata: {
        rgpdCompliant: true,
        dataAnonymized: true,
        exportReason: 'Demande d\'accès Article 15 RGPD'
      }
    };

    const timestamp = Date.now();
    const filename = `export_rgpd_${personType}_${personData.prenom}_${personData.nom}_${timestamp}`;

    if (format === 'json') {
      // Export JSON
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.json"`);
      res.json(exportData);
    } else {
      // Export PDF avec PDFKit
      const doc = new PDFDocument({ margin: 50 });
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.pdf"`);
      
      // Pipe le PDF directement vers la response
      doc.pipe(res);
      
      // Génération du contenu PDF
      generatePDFContent(doc, exportData);
      
      // Finaliser le PDF
      doc.end();
    }

  } catch (error) {
    console.error('Erreur lors de l\'export RGPD:', error);
    res.status(500).json({ error: 'Erreur lors de l\'export des données' });
  }
});

module.exports = router;