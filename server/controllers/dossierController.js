const { PrismaClient } = require('@prisma/client');
const { logAction } = require('../utils/logger');

const prisma = new PrismaClient();

// Get all dossiers with server-side pagination, sorting, and filtering
const getAllDossiers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 25,
      search,
      sortBy,
      sortOrder,
      // Filtres individuels
      numero,
      nomDossier,
      sgami,
      assigneA,
      badges
    } = req.query;

    const skip = (page - 1) * limit;
    const where = {};

    // Global search
    if (search) {
      const searchTerm = search.trim();
      where.OR = [
        { numero: { contains: searchTerm, mode: 'insensitive' } },
        { nomDossier: { contains: searchTerm, mode: 'insensitive' } },
        {
          demandes: {
            some: {
              OR: [
                { nom: { contains: searchTerm, mode: 'insensitive' } },
                { prenom: { contains: searchTerm, mode: 'insensitive' } },
                { numeroDS: { contains: searchTerm, mode: 'insensitive' } }
              ]
            }
          }
        }
      ];
    }

    // Filtre texte individuel - numero
    if (numero) {
      where.numero = { contains: numero, mode: 'insensitive' };
    }

    // Filtre texte individuel - nomDossier
    if (nomDossier) {
      where.nomDossier = { contains: nomDossier, mode: 'insensitive' };
    }

    // Filtrage par SGAMI (multi-select)
    if (sgami) {
      const sgamis = Array.isArray(sgami) ? sgami : [sgami];
      const hasNonAssigne = sgamis.includes('Non assigné');
      const otherSgamis = sgamis.filter(s => s !== 'Non assigné');

      if (hasNonAssigne && otherSgamis.length === 0) {
        where.sgamiId = null;
      } else if (otherSgamis.length > 0 && !hasNonAssigne) {
        where.sgami = {
          nom: { in: otherSgamis }
        };
      } else if (hasNonAssigne && otherSgamis.length > 0) {
        where.OR = [
          { sgamiId: null },
          { sgami: { nom: { in: otherSgamis } } }
        ];
      }
    }

    // Filtrage par assigneA (multi-select)
    if (assigneA) {
      const assigneAs = Array.isArray(assigneA) ? assigneA : [assigneA];
      const hasNonAssigne = assigneAs.includes('Non assigné');
      const otherAssignations = assigneAs.filter(a => a !== 'Non assigné');

      if (hasNonAssigne && otherAssignations.length === 0) {
        where.assigneAId = null;
      } else if (otherAssignations.length > 0 && !hasNonAssigne) {
        where.assigneA = {
          OR: otherAssignations.map(assigneItem => ({
            OR: [
              {
                AND: [
                  { grade: { contains: assigneItem.split(' ')[0] || '' } },
                  { prenom: { contains: assigneItem.split(' ')[1] || '' } },
                  { nom: { contains: assigneItem.split(' ').slice(2).join(' ') || '' } }
                ]
              },
              {
                AND: [
                  { prenom: { contains: assigneItem.split(' ')[0] || '' } },
                  { nom: { contains: assigneItem.split(' ').slice(1).join(' ') || '' } }
                ]
              }
            ]
          }))
        };
      } else if (hasNonAssigne && otherAssignations.length > 0) {
        where.OR = [
          { assigneAId: null },
          {
            assigneA: {
              OR: otherAssignations.map(assigneItem => ({
                OR: [
                  {
                    AND: [
                      { grade: { contains: assigneItem.split(' ')[0] || '' } },
                      { prenom: { contains: assigneItem.split(' ')[1] || '' } },
                      { nom: { contains: assigneItem.split(' ').slice(2).join(' ') || '' } }
                    ]
                  },
                  {
                    AND: [
                      { prenom: { contains: assigneItem.split(' ')[0] || '' } },
                      { nom: { contains: assigneItem.split(' ').slice(1).join(' ') || '' } }
                    ]
                  }
                ]
              }))
            }
          }
        ];
      }
    }

    // Filtrage par badges (multi-select)
    if (badges) {
      const badgesList = Array.isArray(badges) ? badges : [badges];
      where.badges = {
        some: {
          badge: {
            nom: { in: badgesList }
          }
        }
      };
    }

    // Build orderBy clause
    let orderBy = { createdAt: 'desc' }; // Default sort

    if (sortBy) {
      const validSortFields = {
        'numero': 'numero',
        'nomDossier': 'nomDossier',
        'createdAt': 'createdAt',
        'nombreDemandes': null // Special handling needed
      };

      if (validSortFields[sortBy] !== undefined) {
        if (sortBy === 'nombreDemandes') {
          // For nombreDemandes, we'll need to sort after fetching
          orderBy = { createdAt: 'desc' }; // Fallback to default
        } else {
          const direction = sortOrder === 'asc' ? 'asc' : 'desc';
          orderBy = { [validSortFields[sortBy]]: direction };
        }
      }
    }

    const [dossiers, total] = await Promise.all([
      prisma.dossier.findMany({
        where,
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
        orderBy,
        skip: parseInt(skip),
        take: parseInt(limit)
      }),
      prisma.dossier.count({ where })
    ]);

    const dossiersWithStats = dossiers.map(dossier => ({
      ...dossier,
      bap: dossier.baps && dossier.baps.length > 0 ? dossier.baps[0].bap : null,
      stats: {
        totalConventionsHT: dossier.conventions.reduce((sum, conv) => sum + conv.montantHT, 0),
        totalPaiementsTTC: dossier.paiements.reduce((sum, paie) => sum + paie.montantTTC, 0),
        nombreDemandes: dossier.demandes.length,
        nombreDecisions: dossier.decisions.length
      }
    })).map(({ baps, ...dossier }) => dossier);

    res.json({
      dossiers: dossiersWithStats,
      total,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get dossiers error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Get facets for filters
const getFacets = async (req, res) => {
  try {
    const [sgamis, badges, assigneA] = await Promise.all([
      prisma.sgami.findMany({
        select: { id: true, nom: true },
        orderBy: { nom: 'asc' }
      }),
      prisma.badge.findMany({
        select: { id: true, nom: true, couleur: true },
        orderBy: { nom: 'asc' }
      }),
      prisma.user.findMany({
        where: {
          active: { not: false },
          dossiersAssignes: { some: {} }
        },
        select: { id: true, nom: true, prenom: true, grade: true },
        orderBy: [{ nom: 'asc' }, { prenom: 'asc' }]
      })
    ]);

    res.json({
      sgamis: sgamis.map(s => ({ id: s.id, nom: s.nom })),
      badges: badges.map(b => ({ id: b.id, nom: b.nom, couleur: b.couleur })),
      assigneA: assigneA.map(u => ({
        id: u.id,
        fullName: `${u.grade || ''} ${u.prenom} ${u.nom}`.trim()
      }))
    });
  } catch (error) {
    console.error('Get facets error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Get lightweight stats
const getStats = async (req, res) => {
  try {
    const dossiers = await prisma.dossier.findMany({
      select: {
        id: true,
        decisions: {
          select: {
            id: true
          }
        },
        assigneA: {
          select: {
            id: true
          }
        },
        conventions: {
          select: {
            montantHT: true
          }
        }
      }
    });

    const dossiersWithStats = dossiers.map(dossier => ({
      ...dossier,
      stats: {
        totalConventionsHT: dossier.conventions.reduce((sum, conv) => sum + conv.montantHT, 0)
      }
    }));

    res.json(dossiersWithStats);
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

module.exports = {
  getAllDossiers,
  getFacets,
  getStats
};
