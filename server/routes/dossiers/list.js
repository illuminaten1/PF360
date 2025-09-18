const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { logAction } = require('../../utils/logger');

const router = express.Router();
const prisma = new PrismaClient();

router.get('/', async (req, res) => {
  try {
    const { search, limit } = req.query;
    const limitInt = limit ? parseInt(limit) : undefined;

    // Construire les conditions de recherche
    const whereClause = {};
    if (search && search.trim()) {
      const searchTerm = search.trim();
      whereClause.OR = [
        {
          numero: {
            contains: searchTerm
          }
        },
        {
          nomDossier: {
            contains: searchTerm
          }
        },
        {
          demandes: {
            some: {
              OR: [
                {
                  nom: {
                    contains: searchTerm
                  }
                },
                {
                  prenom: {
                    contains: searchTerm
                  }
                }
              ]
            }
          }
        }
      ];
    }

    const dossiers = await prisma.dossier.findMany({
      where: whereClause,
      ...(limitInt && { take: limitInt }),
      include: {
        demandes: {
          include: {
            grade: true
          }
        },
        sgami: true,
        badges: {
          include: {
            badge: true
          }
        },
        baps: {
          include: {
            bap: true
          }
        },
        assigneA: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            grade: true
          }
        },
        creePar: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            grade: true
          }
        },
        modifiePar: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            grade: true
          }
        },
        decisions: {
          select: {
            id: true,
            type: true,
            dateSignature: true,
            dateEnvoi: true
          }
        },
        conventions: {
          include: {
            avocat: {
              select: {
                id: true,
                nom: true,
                prenom: true,
                region: true,
                email: true
              }
            },
            creePar: {
              select: {
                nom: true,
                prenom: true,
                grade: true
              }
            },
            modifiePar: {
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
            },
            diligences: {
              include: {
                diligence: {
                  select: {
                    id: true,
                    nom: true,
                    details: true
                  }
                }
              }
            }
          }
        },
        paiements: {
          select: {
            id: true,
            montantTTC: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const dossiersWithStats = dossiers.map(dossier => ({
      ...dossier,
      bap: dossier.baps && dossier.baps.length > 0 ? dossier.baps[0].bap : null,
      stats: {
        totalConventionsHT: dossier.conventions.reduce((sum, conv) => sum + conv.montantHT, 0),
        totalPaiementsTTC: dossier.paiements.reduce((sum, paie) => sum + paie.montantTTC, 0),
        nombreDemandes: dossier.demandes.length,
        nombreDecisions: dossier.decisions.length
      }
    })).map(({ baps, ...dossier }) => dossier); // Remove baps array

    res.json(dossiersWithStats);
  } catch (error) {
    console.error('Get dossiers error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;