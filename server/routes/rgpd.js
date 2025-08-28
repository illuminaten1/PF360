const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// Middleware combiné pour admin
const requireAdmin = [authMiddleware, adminMiddleware];
const { logAction } = require('../utils/logger');

const router = express.Router();
const prisma = new PrismaClient();

// Recherche de personnes (demandeurs et avocats)
router.get('/search', requireAdmin, async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.length < 2) {
      return res.json([]);
    }

    const searchTerm = q.toLowerCase();

    // Rechercher dans les demandeurs
    const demandeurs = await prisma.demande.findMany({
      where: {
        OR: [
          { nom: { contains: searchTerm, mode: 'insensitive' } },
          { prenom: { contains: searchTerm, mode: 'insensitive' } },
          { nigend: { contains: searchTerm, mode: 'insensitive' } },
          { numeroDS: { contains: searchTerm, mode: 'insensitive' } },
          { emailProfessionnel: { contains: searchTerm, mode: 'insensitive' } },
          { emailPersonnel: { contains: searchTerm, mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        nom: true,
        prenom: true,
        nigend: true,
        numeroDS: true,
        emailProfessionnel: true,
        emailPersonnel: true
      },
      take: 20
    });

    // Rechercher dans les avocats
    const avocats = await prisma.avocat.findMany({
      where: {
        AND: [
          { active: true },
          {
            OR: [
              { nom: { contains: searchTerm, mode: 'insensitive' } },
              { prenom: { contains: searchTerm, mode: 'insensitive' } },
              { email: { contains: searchTerm, mode: 'insensitive' } }
            ]
          }
        ]
      },
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true
      },
      take: 20
    });

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

    // Préparer la réponse selon le format
    if (format === 'json') {
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

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 
        `attachment; filename="export_rgpd_${personType}_${personId}_${Date.now()}.json"`);
      res.json(exportData);
    } else {
      // Pour le PDF, on utiliserait une bibliothèque comme puppeteer ou pdfkit
      // Pour l'instant, on retourne les données JSON avec un header PDF
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

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 
        `attachment; filename="export_rgpd_${personType}_${personId}_${Date.now()}.pdf"`);
      
      // TODO: Implémenter la génération PDF réelle
      // Pour l'instant, on retourne du JSON
      res.json(exportData);
    }

  } catch (error) {
    console.error('Erreur lors de l\'export RGPD:', error);
    res.status(500).json({ error: 'Erreur lors de l\'export des données' });
  }
});

module.exports = router;