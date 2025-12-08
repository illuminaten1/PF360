const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');
const { logAction } = require('../utils/logger');

const prisma = new PrismaClient();

const createConventionSchema = z.object({
  type: z.enum(['CONVENTION', 'AVENANT'], { required_error: "Le type est requis" }),
  victimeOuMisEnCause: z.enum(['VICTIME', 'MIS_EN_CAUSE'], { required_error: "Le type de partie est requis" }),
  instance: z.string().min(1, "L'instance est requise"),
  montantHT: z.number().positive("Le montant HT doit être positif"),
  montantHTGagePrecedemment: z.number().positive().optional(),
  typeFacturation: z.enum(['FORFAITAIRE', 'DEMI_JOURNEE', 'ASSISES']).optional(),
  dateRetourSigne: z.string().optional(),
  dossierId: z.string().min(1, "Le dossier est requis"),
  avocatId: z.string().min(1, "L'avocat est requis"),
  demandes: z.array(z.string()).optional(),
  diligences: z.array(z.string()).optional(),
  decisions: z.array(z.string()).optional()
});

const updateConventionSchema = z.object({
  type: z.enum(['CONVENTION', 'AVENANT']).optional(),
  victimeOuMisEnCause: z.enum(['VICTIME', 'MIS_EN_CAUSE']).optional(),
  instance: z.string().min(1).optional(),
  montantHT: z.number().positive().optional(),
  montantHTGagePrecedemment: z.number().positive().optional(),
  typeFacturation: z.enum(['FORFAITAIRE', 'DEMI_JOURNEE', 'ASSISES']).optional(),
  dateRetourSigne: z.string().optional().nullable(),
  dossierId: z.string().min(1).optional(),
  avocatId: z.string().min(1).optional(),
  demandes: z.array(z.string()).optional(),
  diligences: z.array(z.string()).optional(),
  decisions: z.array(z.string()).optional()
});

// GET /conventions - Récupération paginée et filtrée des conventions
const getAllConventions = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 25,
      search,
      type,
      victimeOuMisEnCause,
      instance,
      dateRetourSigneDebut,
      dateRetourSigneFin,
      createdAtDebut,
      createdAtFin,
      sortBy = 'numero',
      sortOrder = 'desc',
      // Filtres individuels
      numero,
      dossierNumero,
      avocatNom,
      creePar,
      modifiePar
    } = req.query;

    const skip = (page - 1) * limit;
    const where = {};

    // Recherche globale
    if (search) {
      const searchTerm = search.trim();
      where.OR = [
        { numero: { equals: parseInt(searchTerm) || -1 } },
        { instance: { contains: searchTerm, mode: 'insensitive' } },
        { dossier: { numero: { contains: searchTerm, mode: 'insensitive' } } },
        { dossier: { nomDossier: { contains: searchTerm, mode: 'insensitive' } } },
        { avocat: { nom: { contains: searchTerm, mode: 'insensitive' } } },
        { avocat: { prenom: { contains: searchTerm, mode: 'insensitive' } } },
        { creePar: { nom: { contains: searchTerm, mode: 'insensitive' } } },
        { creePar: { prenom: { contains: searchTerm, mode: 'insensitive' } } }
      ];
    }

    // Filtre par numéro de convention
    if (numero) {
      where.numero = { equals: parseInt(numero) || -1 };
    }

    // Filtre par numéro de dossier
    if (dossierNumero) {
      where.dossier = { numero: { contains: dossierNumero, mode: 'insensitive' } };
    }

    // Filtre par type (multi-select)
    if (type) {
      const types = Array.isArray(type) ? type : [type];
      where.type = { in: types };
    }

    // Filtre par victime/MEC (multi-select)
    if (victimeOuMisEnCause) {
      const types = Array.isArray(victimeOuMisEnCause) ? victimeOuMisEnCause : [victimeOuMisEnCause];
      where.victimeOuMisEnCause = { in: types };
    }

    // Filtre par instance
    if (instance) {
      where.instance = { contains: instance, mode: 'insensitive' };
    }

    // Filtre par avocat
    if (avocatNom) {
      where.avocat = {
        OR: [
          { nom: { contains: avocatNom, mode: 'insensitive' } },
          { prenom: { contains: avocatNom, mode: 'insensitive' } }
        ]
      };
    }

    // Filtre par date de retour signée
    if (dateRetourSigneDebut || dateRetourSigneFin) {
      where.dateRetourSigne = {};
      if (dateRetourSigneDebut) {
        where.dateRetourSigne.gte = new Date(dateRetourSigneDebut + 'T00:00:00.000Z');
      }
      if (dateRetourSigneFin) {
        where.dateRetourSigne.lte = new Date(dateRetourSigneFin + 'T23:59:59.999Z');
      }
    }

    // Filtre par date de création
    if (createdAtDebut || createdAtFin) {
      where.dateCreation = {};
      if (createdAtDebut) {
        where.dateCreation.gte = new Date(createdAtDebut + 'T00:00:00.000Z');
      }
      if (createdAtFin) {
        where.dateCreation.lte = new Date(createdAtFin + 'T23:59:59.999Z');
      }
    }

    // Filtre par créateur (multi-select)
    if (creePar) {
      const createurs = Array.isArray(creePar) ? creePar : [creePar];
      where.creePar = {
        OR: createurs.map(creator => {
          const parts = creator.split(' ');
          if (parts.length >= 2) {
            return {
              AND: [
                { prenom: { contains: parts[0], mode: 'insensitive' } },
                { nom: { contains: parts.slice(1).join(' '), mode: 'insensitive' } }
              ]
            };
          }
          return {
            OR: [
              { nom: { contains: creator, mode: 'insensitive' } },
              { prenom: { contains: creator, mode: 'insensitive' } }
            ]
          };
        })
      };
    }

    // Filtre par modificateur (multi-select)
    if (modifiePar) {
      const modificateurs = Array.isArray(modifiePar) ? modifiePar : [modifiePar];

      const hasNonModifie = modificateurs.includes('Non modifié');
      const otherModificateurs = modificateurs.filter(m => m !== 'Non modifié');

      if (hasNonModifie && otherModificateurs.length === 0) {
        where.modifieParId = null;
      } else if (otherModificateurs.length > 0 && !hasNonModifie) {
        where.modifiePar = {
          OR: otherModificateurs.map(modifier => {
            const parts = modifier.split(' ');
            if (parts.length >= 2) {
              return {
                AND: [
                  { prenom: { contains: parts[0], mode: 'insensitive' } },
                  { nom: { contains: parts.slice(1).join(' '), mode: 'insensitive' } }
                ]
              };
            }
            return {
              OR: [
                { nom: { contains: modifier, mode: 'insensitive' } },
                { prenom: { contains: modifier, mode: 'insensitive' } }
              ]
            };
          })
        };
      } else if (hasNonModifie && otherModificateurs.length > 0) {
        where.OR = [
          { modifieParId: null },
          {
            modifiePar: {
              OR: otherModificateurs.map(modifier => {
                const parts = modifier.split(' ');
                if (parts.length >= 2) {
                  return {
                    AND: [
                      { prenom: { contains: parts[0], mode: 'insensitive' } },
                      { nom: { contains: parts.slice(1).join(' '), mode: 'insensitive' } }
                    ]
                  };
                }
                return {
                  OR: [
                    { nom: { contains: modifier, mode: 'insensitive' } },
                    { prenom: { contains: modifier, mode: 'insensitive' } }
                  ]
                };
              })
            }
          }
        ];
      }
    }

    // Tri
    const orderBy = {};
    if (sortBy === 'dossier') {
      orderBy.dossier = { numero: sortOrder };
    } else if (sortBy === 'avocat') {
      orderBy.avocat = { nom: sortOrder };
    } else if (sortBy === 'creePar') {
      orderBy.creePar = { nom: sortOrder };
    } else if (sortBy === 'modifiePar') {
      orderBy.modifiePar = { nom: sortOrder };
    } else {
      orderBy[sortBy] = sortOrder;
    }

    // Requêtes en parallèle
    const [conventions, totalCount] = await Promise.all([
      prisma.convention.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy,
        include: {
          dossier: {
            select: {
              id: true,
              numero: true,
              nomDossier: true
            }
          },
          avocat: {
            select: {
              id: true,
              nom: true,
              prenom: true,
              region: true
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
                select: {
                  id: true,
                  numeroDS: true,
                  nom: true,
                  prenom: true,
                  type: true
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
      }),
      prisma.convention.count({ where })
    ]);

    res.json({
      conventions,
      pagination: {
        total: totalCount,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(totalCount / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get conventions error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// GET /conventions/facets - Récupération des valeurs uniques pour les filtres
const getFacets = async (req, res) => {
  try {
    const [types, victimeMecs, instances, avocats, createurs, modificateurs] = await Promise.all([
      // Types
      prisma.convention.findMany({
        select: { type: true },
        distinct: ['type']
      }),
      // Victime/MEC
      prisma.convention.findMany({
        select: { victimeOuMisEnCause: true },
        distinct: ['victimeOuMisEnCause']
      }),
      // Instances
      prisma.convention.findMany({
        select: { instance: true },
        distinct: ['instance'],
        orderBy: { instance: 'asc' }
      }),
      // Avocats
      prisma.avocat.findMany({
        select: {
          id: true,
          nom: true,
          prenom: true
        },
        orderBy: { nom: 'asc' }
      }),
      // Créateurs
      prisma.user.findMany({
        where: {
          conventions: {
            some: {}
          }
        },
        select: {
          id: true,
          nom: true,
          prenom: true,
          grade: true
        },
        orderBy: { nom: 'asc' }
      }),
      // Modificateurs
      prisma.user.findMany({
        where: {
          conventionsModifiees: {
            some: {}
          }
        },
        select: {
          id: true,
          nom: true,
          prenom: true,
          grade: true
        },
        orderBy: { nom: 'asc' }
      })
    ]);

    res.json({
      types: types.map(t => t.type),
      victimeMecs: victimeMecs.map(v => v.victimeOuMisEnCause),
      instances: instances.map(i => i.instance).filter(Boolean),
      avocats: avocats.map(a => ({
        id: a.id,
        fullName: `${a.prenom || ''} ${a.nom}`.trim()
      })),
      createurs: createurs.map(c => ({
        id: c.id,
        fullName: `${c.grade ? c.grade + ' ' : ''}${c.prenom} ${c.nom}`.trim()
      })),
      modificateurs: modificateurs.map(m => ({
        id: m.id,
        fullName: `${m.grade ? m.grade + ' ' : ''}${m.prenom} ${m.nom}`.trim()
      }))
    });
  } catch (error) {
    console.error('Get facets error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// GET /conventions/stats - Récupération des statistiques globales
const getStats = async (req, res) => {
  try {
    const [
      totalConventions,
      conventionCount,
      avenantCount,
      victimeCount,
      misEnCauseCount,
      montantData,
      signeesCount
    ] = await Promise.all([
      prisma.convention.count(),
      prisma.convention.count({ where: { type: 'CONVENTION' } }),
      prisma.convention.count({ where: { type: 'AVENANT' } }),
      prisma.convention.count({ where: { victimeOuMisEnCause: 'VICTIME' } }),
      prisma.convention.count({ where: { victimeOuMisEnCause: 'MIS_EN_CAUSE' } }),
      prisma.convention.aggregate({
        _sum: {
          montantHT: true
        }
      }),
      prisma.convention.count({ where: { dateRetourSigne: { not: null } } })
    ]);

    res.json({
      totalConventions,
      conventionCount,
      avenantCount,
      victimeCount,
      misEnCauseCount,
      totalMontantHT: montantData._sum.montantHT || 0,
      signeesCount
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// GET /conventions/:id - Récupération d'une convention spécifique
const getConventionById = async (req, res) => {
  try {
    const convention = await prisma.convention.findUnique({
      where: { id: req.params.id },
      include: {
        dossier: {
          select: {
            numero: true,
            nomDossier: true,
            notes: true
          }
        },
        avocat: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            region: true,
            adressePostale: true,
            telephonePublic1: true,
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
              select: {
                id: true,
                numeroDS: true,
                nom: true,
                prenom: true,
                type: true,
                grade: true,
                branche: true
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
        },
        decisions: {
          include: {
            decision: {
              select: {
                id: true,
                type: true,
                numero: true
              }
            }
          }
        }
      }
    });

    if (!convention) {
      return res.status(404).json({ error: 'Convention non trouvée' });
    }

    res.json(convention);
  } catch (error) {
    console.error('Get convention error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// POST /conventions - Création d'une convention
const createConvention = async (req, res) => {
  try {
    const validatedData = createConventionSchema.parse(req.body);
    const {
      type,
      victimeOuMisEnCause,
      instance,
      montantHT,
      montantHTGagePrecedemment,
      typeFacturation,
      dateRetourSigne,
      dossierId,
      avocatId,
      demandes = [],
      diligences = [],
      decisions = []
    } = validatedData;

    if (type === 'AVENANT' && !montantHTGagePrecedemment) {
      return res.status(400).json({
        error: 'Le montant HT gagé précédemment est requis pour un avenant'
      });
    }

    const convention = await prisma.$transaction(async (tx) => {
      const lastConvention = await tx.convention.findFirst({
        select: { numero: true },
        orderBy: { numero: 'desc' }
      });

      const nextNumber = (lastConvention?.numero || 0) + 1;

      return await tx.convention.create({
        data: {
          numero: nextNumber,
          type,
          victimeOuMisEnCause,
          instance,
          montantHT,
          montantHTGagePrecedemment,
          typeFacturation,
          dateRetourSigne: dateRetourSigne ? new Date(dateRetourSigne) : null,
          dossierId,
          avocatId,
          creeParId: req.user.id,
          ...(demandes.length > 0 && {
            demandes: {
              create: demandes.map(demandeId => ({
                demandeId
              }))
            }
          }),
          ...(diligences.length > 0 && {
            diligences: {
              create: diligences.map(diligenceId => ({
                diligenceId
              }))
            }
          }),
          ...(decisions.length > 0 && {
            decisions: {
              create: decisions.map(decisionId => ({
                decisionId
              }))
            }
          })
        },
        include: {
          dossier: {
            select: {
              numero: true,
              nomDossier: true
            }
          },
          avocat: {
            select: {
              id: true,
              nom: true,
              prenom: true,
              region: true
            }
          },
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
                select: {
                  id: true,
                  numeroDS: true,
                  nom: true,
                  prenom: true,
                  type: true
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
      });
    });

    await logAction(
      req.user.id,
      'CREATE_CONVENTION',
      `Création de la convention ${convention.numero} (${type})`,
      'Convention',
      convention.id
    );

    res.status(201).json(convention);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.log('=== DEBUG: Zod validation error ===');
      console.log('Errors:', JSON.stringify(error.errors, null, 2));
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Create convention error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// PUT /conventions/:id - Modification d'une convention
const updateConvention = async (req, res) => {
  try {
    const validatedData = updateConventionSchema.parse(req.body);
    const {
      type,
      victimeOuMisEnCause,
      instance,
      montantHT,
      montantHTGagePrecedemment,
      typeFacturation,
      dateRetourSigne,
      dossierId,
      avocatId,
      demandes = [],
      diligences = [],
      decisions = []
    } = validatedData;

    const existingConvention = await prisma.convention.findUnique({
      where: { id: req.params.id },
      include: { demandes: true, diligences: true, decisions: true }
    });

    if (!existingConvention) {
      return res.status(404).json({ error: 'Convention non trouvée' });
    }

    if (type === 'AVENANT' && montantHTGagePrecedemment === undefined && !existingConvention.montantHTGagePrecedemment) {
      return res.status(400).json({
        error: 'Le montant HT gagé précédemment est requis pour un avenant'
      });
    }

    await prisma.conventionDemande.deleteMany({
      where: { conventionId: req.params.id }
    });

    await prisma.conventionDiligence.deleteMany({
      where: { conventionId: req.params.id }
    });

    await prisma.conventionDecision.deleteMany({
      where: { conventionId: req.params.id }
    });

    const updateData = {
      modifieParId: req.user.id,
      demandes: {
        create: demandes.map(demandeId => ({
          demandeId
        }))
      },
      diligences: {
        create: diligences.map(diligenceId => ({
          diligenceId
        }))
      },
      decisions: {
        create: decisions.map(decisionId => ({
          decisionId
        }))
      }
    };

    if (type !== undefined) updateData.type = type;
    if (victimeOuMisEnCause !== undefined) updateData.victimeOuMisEnCause = victimeOuMisEnCause;
    if (instance !== undefined) updateData.instance = instance;
    if (montantHT !== undefined) updateData.montantHT = montantHT;
    if (montantHTGagePrecedemment !== undefined) updateData.montantHTGagePrecedemment = montantHTGagePrecedemment;
    if (typeFacturation !== undefined) updateData.typeFacturation = typeFacturation;
    if (dateRetourSigne !== undefined) {
      updateData.dateRetourSigne = dateRetourSigne ? new Date(dateRetourSigne) : null;
    }
    if (dossierId !== undefined) updateData.dossierId = dossierId;
    if (avocatId !== undefined) updateData.avocatId = avocatId;

    const convention = await prisma.convention.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        dossier: {
          select: {
            id: true,
            numero: true,
            nomDossier: true
          }
        },
        avocat: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            region: true
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
              select: {
                id: true,
                numeroDS: true,
                nom: true,
                prenom: true,
                type: true
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
        },
        decisions: {
          include: {
            decision: {
              select: {
                id: true,
                type: true,
                numero: true
              }
            }
          }
        }
      }
    });

    await logAction(
      req.user.id,
      'UPDATE_CONVENTION',
      `Modification de la convention ${convention.numero}`,
      'Convention',
      convention.id
    );

    res.json(convention);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Update convention error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// DELETE /conventions/:id - Suppression d'une convention
const deleteConvention = async (req, res) => {
  try {
    const existingConvention = await prisma.convention.findUnique({
      where: { id: req.params.id },
      include: {
        demandes: true,
        diligences: true,
        decisions: true
      }
    });

    if (!existingConvention) {
      return res.status(404).json({ error: 'Convention non trouvée' });
    }

    await prisma.conventionDemande.deleteMany({
      where: { conventionId: req.params.id }
    });

    await prisma.conventionDiligence.deleteMany({
      where: { conventionId: req.params.id }
    });

    await prisma.conventionDecision.deleteMany({
      where: { conventionId: req.params.id }
    });

    await prisma.convention.delete({
      where: { id: req.params.id }
    });

    await logAction(
      req.user.id,
      'DELETE_CONVENTION',
      `Suppression de la convention ${existingConvention.numero}`,
      'Convention',
      req.params.id
    );

    res.json({ message: 'Convention supprimée avec succès' });
  } catch (error) {
    console.error('Delete convention error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

module.exports = {
  getAllConventions,
  getFacets,
  getStats,
  getConventionById,
  createConvention,
  updateConvention,
  deleteConvention
};
