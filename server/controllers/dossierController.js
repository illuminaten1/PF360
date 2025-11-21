const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

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
      demandeur,
      sgami,
      assigneA,
      badges
    } = req.query;

    const skip = (page - 1) * limit;
    const where = {};

    // Recherche globale
    if (search && search.trim()) {
      const searchTerm = search.trim();
      where.OR = [
        { numero: { contains: searchTerm } },
        { nomDossier: { contains: searchTerm } },
        {
          demandes: {
            some: {
              OR: [
                { nom: { contains: searchTerm } },
                { prenom: { contains: searchTerm } },
                { numeroDS: { contains: searchTerm } }
              ]
            }
          }
        }
      ];
    }

    // Filtres texte individuels
    if (numero) {
      where.numero = { contains: numero };
    }

    if (nomDossier) {
      where.nomDossier = { contains: nomDossier };
    }

    // Filtre par demandeur (recherche dans les demandes liées)
    if (demandeur) {
      where.demandes = {
        some: {
          OR: [
            { nom: { contains: demandeur } },
            { prenom: { contains: demandeur } },
            { numeroDS: { contains: demandeur } }
          ]
        }
      };
    }

    // Filtrage par SGAMI (peut être un tableau pour multi-select)
    if (sgami) {
      const sgamis = Array.isArray(sgami) ? sgami : [sgami];

      // Si "Non assigné" est dans le filtre
      const hasNonAssigne = sgamis.includes('Non assigné');
      const otherSgamis = sgamis.filter((s) => s !== 'Non assigné');

      if (hasNonAssigne && otherSgamis.length === 0) {
        // Seulement "Non assigné"
        where.sgamiId = null;
      } else if (otherSgamis.length > 0 && !hasNonAssigne) {
        // Seulement des SGAMI (pas "Non assigné")
        where.sgami = {
          nom: { in: otherSgamis }
        };
      } else if (hasNonAssigne && otherSgamis.length > 0) {
        // Mix de "Non assigné" et de SGAMI
        where.OR = [
          { sgamiId: null },
          {
            sgami: {
              nom: { in: otherSgamis }
            }
          }
        ];
      }
    }

    // Filtrage par assignation (peut être un tableau pour multi-select)
    if (assigneA) {
      const assigneAs = Array.isArray(assigneA) ? assigneA : [assigneA];

      // Si "Non assigné" est dans le filtre
      const hasNonAssigne = assigneAs.includes('Non assigné');
      const otherAssignations = assigneAs.filter((a) => a !== 'Non assigné');

      if (hasNonAssigne && otherAssignations.length === 0) {
        // Seulement "Non assigné"
        where.assigneAId = null;
      } else if (otherAssignations.length > 0 && !hasNonAssigne) {
        // Seulement des assignations (pas "Non assigné")
        where.assigneA = {
          OR: otherAssignations.map((assigneItem) => ({
            OR: [
              // Recherche sur la combinaison grade + prenom + nom
              {
                AND: [
                  { grade: { contains: assigneItem.split(' ')[0] || '' } },
                  { prenom: { contains: assigneItem.split(' ')[1] || '' } },
                  { nom: { contains: assigneItem.split(' ').slice(2).join(' ') || '' } }
                ]
              },
              // Recherche sur prenom + nom seulement (au cas où pas de grade)
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
        // Mix de "Non assigné" et d'assignations
        where.OR = [
          { assigneAId: null },
          {
            assigneA: {
              OR: otherAssignations.map((assigneItem) => ({
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

    // Filtrage par badges (via relation many-to-many)
    if (badges) {
      const badgeList = Array.isArray(badges) ? badges : [badges];
      where.badges = {
        some: {
          badge: {
            nom: { in: badgeList }
          }
        }
      };
    }

    // Build orderBy clause
    let orderBy = { createdAt: 'desc' }; // Default sort

    if (sortBy) {
      const validSortFields = {
        numero: 'numero',
        nomDossier: 'nomDossier',
        nombreDemandes: 'nombreDemandes',
        createdAt: 'createdAt'
      };

      if (validSortFields[sortBy]) {
        const direction = sortOrder === 'asc' ? 'asc' : 'desc';
        orderBy = { [validSortFields[sortBy]]: direction };
      }
    }

    // Exécuter les requêtes en parallèle
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

    // Ajouter les stats à chaque dossier
    const dossiersWithStats = dossiers.map((dossier) => ({
      ...dossier,
      bap: dossier.baps && dossier.baps.length > 0 ? dossier.baps[0].bap : null,
      stats: {
        totalConventionsHT: dossier.conventions.reduce((sum, conv) => sum + conv.montantHT, 0),
        totalPaiementsTTC: dossier.paiements.reduce((sum, paie) => sum + paie.montantTTC, 0),
        nombreDemandes: dossier.demandes.length,
        nombreDecisions: dossier.decisions.length
      }
    })).map(({ baps, ...dossier }) => dossier); // Retirer le tableau baps

    res.json({
      dossiers: dossiersWithStats,
      total,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get dossiers error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

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
      sgamis: sgamis.map((s) => ({ id: s.id, nom: s.nom })),
      badges: badges.map((b) => ({ id: b.id, nom: b.nom, couleur: b.couleur })),
      assigneA: assigneA.map((u) => ({
        id: u.id,
        fullName: `${u.grade || ''} ${u.prenom} ${u.nom}`.trim()
      }))
    });
  } catch (error) {
    console.error('Get facets error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

module.exports = {
  getAllDossiers,
  getFacets
};
