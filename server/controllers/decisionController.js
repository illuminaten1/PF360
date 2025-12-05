const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');
const { logAction } = require('../utils/logger');

const prisma = new PrismaClient();

const createDecisionSchema = z.object({
  type: z.enum(['AJ', 'AJE', 'PJ', 'REJET'], {
    required_error: "Le type de décision est requis"
  }),
  motifRejet: z.string().optional(),
  numero: z.string().regex(/^\d+$/, "Le numéro de décision doit être un nombre entier").min(1, "Le numéro de décision est requis"),
  visaId: z.string().min(1, "Le visa est requis"),
  avis_hierarchiques: z.boolean().default(false),
  typeVictMec: z.enum(['VICTIME', 'MIS_EN_CAUSE']).optional(),
  considerant: z.string().optional(),
  dateSignature: z.string().datetime().optional(),
  dateEnvoi: z.string().datetime().optional(),
  dossierId: z.string().min(1, "Le dossier est requis"),
  demandeIds: z.array(z.string()).min(1, "Au moins une demande doit être sélectionnée")
})
.refine((data) => {
  if (data.type === 'REJET') {
    return data.motifRejet && data.motifRejet.trim() !== ''
  }
  return true
}, {
  message: "Le motif de rejet est requis pour un rejet",
  path: ['motifRejet']
});

const updateDecisionSchema = z.object({
  type: z.enum(['AJ', 'AJE', 'PJ', 'REJET']).optional(),
  motifRejet: z.string().optional().nullable(),
  numero: z.string().regex(/^\d+$/, "Le numéro de décision doit être un nombre entier").min(1, "Le numéro de décision est requis").optional(),
  visaId: z.string().min(1, "Le visa est requis").optional(),
  avis_hierarchiques: z.boolean().optional(),
  typeVictMec: z.enum(['VICTIME', 'MIS_EN_CAUSE']).optional(),
  considerant: z.string().optional(),
  dateSignature: z.string().datetime().optional().nullable(),
  dateEnvoi: z.string().datetime().optional().nullable(),
  demandeIds: z.array(z.string()).optional()
})
.refine((data) => {
  if (data.type === 'REJET') {
    return data.motifRejet && data.motifRejet.trim() !== ''
  }
  return true
}, {
  message: "Le motif de rejet est requis pour un rejet",
  path: ['motifRejet']
});

// GET /decisions - Récupération paginée et filtrée des décisions
const getAllDecisions = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 25,
      search,
      type,
      typeVictMec,
      avis_hierarchiques,
      dateSignatureDebut,
      dateSignatureFin,
      dateEnvoiDebut,
      dateEnvoiFin,
      createdAtDebut,
      createdAtFin,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      // Filtres individuels
      numero,
      dossierNumero,
      creePar,
      modifiePar
    } = req.query;

    const skip = (page - 1) * limit;
    const where = {};

    // Recherche globale
    if (search) {
      const searchTerm = search.trim();
      where.OR = [
        { numero: { contains: searchTerm, mode: 'insensitive' } },
        { dossier: { numero: { contains: searchTerm, mode: 'insensitive' } } },
        { dossier: { nomDossier: { contains: searchTerm, mode: 'insensitive' } } },
        { creePar: { nom: { contains: searchTerm, mode: 'insensitive' } } },
        { creePar: { prenom: { contains: searchTerm, mode: 'insensitive' } } },
        { modifiePar: { nom: { contains: searchTerm, mode: 'insensitive' } } },
        { modifiePar: { prenom: { contains: searchTerm, mode: 'insensitive' } } }
      ];
    }

    // Filtre par numéro de décision
    if (numero) {
      where.numero = { contains: numero, mode: 'insensitive' };
    }

    // Filtre par numéro de dossier
    if (dossierNumero) {
      where.dossier = { numero: { contains: dossierNumero, mode: 'insensitive' } };
    }

    // Filtre par type de décision (multi-select)
    if (type) {
      const types = Array.isArray(type) ? type : [type];
      where.type = { in: types };
    }

    // Filtre par type victime/MEC (multi-select)
    if (typeVictMec) {
      const types = Array.isArray(typeVictMec) ? typeVictMec : [typeVictMec];
      where.typeVictMec = { in: types };
    }

    // Filtre par avis hiérarchiques
    if (avis_hierarchiques !== undefined) {
      if (avis_hierarchiques === 'true' || avis_hierarchiques === true) {
        where.avis_hierarchiques = true;
      } else if (avis_hierarchiques === 'false' || avis_hierarchiques === false) {
        where.avis_hierarchiques = false;
      }
    }

    // Filtre par date de signature
    if (dateSignatureDebut || dateSignatureFin) {
      where.dateSignature = {};
      if (dateSignatureDebut) {
        where.dateSignature.gte = new Date(dateSignatureDebut + 'T00:00:00.000Z');
      }
      if (dateSignatureFin) {
        where.dateSignature.lte = new Date(dateSignatureFin + 'T23:59:59.999Z');
      }
    }

    // Filtre par date d'envoi
    if (dateEnvoiDebut || dateEnvoiFin) {
      where.dateEnvoi = {};
      if (dateEnvoiDebut) {
        where.dateEnvoi.gte = new Date(dateEnvoiDebut + 'T00:00:00.000Z');
      }
      if (dateEnvoiFin) {
        where.dateEnvoi.lte = new Date(dateEnvoiFin + 'T23:59:59.999Z');
      }
    }

    // Filtre par date de création
    if (createdAtDebut || createdAtFin) {
      where.createdAt = {};
      if (createdAtDebut) {
        where.createdAt.gte = new Date(createdAtDebut + 'T00:00:00.000Z');
      }
      if (createdAtFin) {
        where.createdAt.lte = new Date(createdAtFin + 'T23:59:59.999Z');
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
    } else if (sortBy === 'creePar') {
      orderBy.creePar = { nom: sortOrder };
    } else if (sortBy === 'modifiePar') {
      orderBy.modifiePar = { nom: sortOrder };
    } else {
      orderBy[sortBy] = sortOrder;
    }

    // Requêtes en parallèle
    const [decisions, totalCount] = await Promise.all([
      prisma.decision.findMany({
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
          visa: {
            select: {
              id: true,
              typeVisa: true,
              texteVisa: true
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
                  nom: true,
                  prenom: true,
                  numeroDS: true
                }
              }
            }
          }
        }
      }),
      prisma.decision.count({ where })
    ]);

    res.json({
      decisions,
      pagination: {
        total: totalCount,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('Get decisions error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// GET /decisions/facets - Récupération des valeurs pour les filtres
const getFacets = async (req, res) => {
  try {
    const [types, typeVictMecs, createurs, modificateurs] = await Promise.all([
      // Types de décision
      prisma.decision.findMany({
        distinct: ['type'],
        select: { type: true }
      }),
      // Types victime/MEC
      prisma.decision.findMany({
        distinct: ['typeVictMec'],
        where: { typeVictMec: { not: null } },
        select: { typeVictMec: true }
      }),
      // Créateurs
      prisma.decision.findMany({
        distinct: ['creeParId'],
        select: {
          creePar: {
            select: {
              id: true,
              nom: true,
              prenom: true,
              grade: true
            }
          }
        }
      }),
      // Modificateurs
      prisma.decision.findMany({
        distinct: ['modifieParId'],
        where: { modifieParId: { not: null } },
        select: {
          modifiePar: {
            select: {
              id: true,
              nom: true,
              prenom: true,
              grade: true
            }
          }
        }
      })
    ]);

    res.json({
      types: types.map(t => t.type).filter(Boolean),
      typeVictMecs: typeVictMecs.map(t => t.typeVictMec).filter(Boolean),
      createurs: createurs
        .map(c => c.creePar)
        .filter(Boolean)
        .map(u => ({
          id: u.id,
          fullName: `${u.grade || ''} ${u.prenom} ${u.nom}`.trim()
        })),
      modificateurs: modificateurs
        .map(m => m.modifiePar)
        .filter(Boolean)
        .map(u => ({
          id: u.id,
          fullName: `${u.grade || ''} ${u.prenom} ${u.nom}`.trim()
        }))
    });
  } catch (error) {
    console.error('Get facets error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// GET /decisions/:id - Récupération d'une décision spécifique
const getDecisionById = async (req, res) => {
  try {
    const decision = await prisma.decision.findUnique({
      where: { id: req.params.id },
      include: {
        dossier: {
          select: {
            id: true,
            numero: true,
            nomDossier: true
          }
        },
        visa: {
          select: {
            id: true,
            typeVisa: true,
            texteVisa: true
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
                nom: true,
                prenom: true,
                numeroDS: true
              }
            }
          }
        }
      }
    });

    if (!decision) {
      return res.status(404).json({ error: 'Décision non trouvée' });
    }

    res.json(decision);
  } catch (error) {
    console.error('Get decision error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// POST /decisions - Création d'une décision
const createDecision = async (req, res) => {
  try {
    const validatedData = createDecisionSchema.parse(req.body);
    const { type, motifRejet, numero, visaId, avis_hierarchiques, typeVictMec, considerant, dateSignature, dateEnvoi, dossierId, demandeIds } = validatedData;

    const decision = await prisma.$transaction(async (tx) => {
      // Créer la décision
      const newDecision = await tx.decision.create({
        data: {
          type,
          motifRejet: type === 'REJET' ? motifRejet : null,
          numero,
          visaId,
          avis_hierarchiques,
          typeVictMec,
          considerant,
          dateSignature: dateSignature ? new Date(dateSignature) : null,
          dateEnvoi: dateEnvoi ? new Date(dateEnvoi) : null,
          dossierId,
          creeParId: req.user.id
        }
      });

      // Lier les demandes à la décision
      await tx.decisionDemande.createMany({
        data: demandeIds.map(demandeId => ({
          decisionId: newDecision.id,
          demandeId
        }))
      });

      return newDecision;
    });

    // Récupérer la décision complète
    const fullDecision = await prisma.decision.findUnique({
      where: { id: decision.id },
      include: {
        dossier: {
          select: {
            numero: true,
            nomDossier: true
          }
        },
        visa: {
          select: {
            id: true,
            typeVisa: true,
            texteVisa: true
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
                nom: true,
                prenom: true,
                numeroDS: true
              }
            }
          }
        }
      }
    });

    await logAction(req.user.id, 'CREATE_DECISION', `Création d'une décision ${type} pour le dossier ${fullDecision.dossier.numero}`, 'Decision', decision.id);

    res.status(201).json(fullDecision);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Create decision error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// PUT /decisions/:id - Mise à jour d'une décision
const updateDecision = async (req, res) => {
  try {
    const validatedData = updateDecisionSchema.parse(req.body);
    const { type, motifRejet, numero, visaId, avis_hierarchiques, typeVictMec, considerant, dateSignature, dateEnvoi, demandeIds } = validatedData;

    const existingDecision = await prisma.decision.findUnique({
      where: { id: req.params.id }
    });

    if (!existingDecision) {
      return res.status(404).json({ error: 'Décision non trouvée' });
    }

    const decision = await prisma.$transaction(async (tx) => {
      // Construire l'objet de mise à jour
      const updateData = {
        modifieParId: req.user.id
      };

      if (type !== undefined) {
        updateData.type = type;
        updateData.motifRejet = type === 'REJET' ? (motifRejet || null) : null;
      } else if (motifRejet !== undefined) {
        if (existingDecision.type === 'REJET') {
          updateData.motifRejet = motifRejet;
        }
      }
      if (numero !== undefined) updateData.numero = numero;
      if (visaId !== undefined) updateData.visaId = visaId;
      if (avis_hierarchiques !== undefined) updateData.avis_hierarchiques = avis_hierarchiques;
      if (typeVictMec !== undefined) updateData.typeVictMec = typeVictMec;
      if (considerant !== undefined) updateData.considerant = considerant;
      if (dateSignature !== undefined) {
        updateData.dateSignature = dateSignature ? new Date(dateSignature) : null;
      }
      if (dateEnvoi !== undefined) {
        updateData.dateEnvoi = dateEnvoi ? new Date(dateEnvoi) : null;
      }

      // Mettre à jour la décision
      const updatedDecision = await tx.decision.update({
        where: { id: req.params.id },
        data: updateData
      });

      // Mettre à jour les demandes liées si fourni
      if (demandeIds !== undefined) {
        await tx.decisionDemande.deleteMany({
          where: { decisionId: req.params.id }
        });

        if (demandeIds.length > 0) {
          await tx.decisionDemande.createMany({
            data: demandeIds.map(demandeId => ({
              decisionId: req.params.id,
              demandeId
            }))
          });
        }
      }

      return updatedDecision;
    });

    // Récupérer la décision complète
    const fullDecision = await prisma.decision.findUnique({
      where: { id: decision.id },
      include: {
        dossier: {
          select: {
            numero: true,
            nomDossier: true
          }
        },
        visa: {
          select: {
            id: true,
            typeVisa: true,
            texteVisa: true
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
                nom: true,
                prenom: true,
                numeroDS: true
              }
            }
          }
        }
      }
    });

    await logAction(req.user.id, 'UPDATE_DECISION', `Modification de la décision ${fullDecision.type} pour le dossier ${fullDecision.dossier.numero}`, 'Decision', decision.id);

    res.json(fullDecision);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Update decision error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// DELETE /decisions/:id - Suppression d'une décision
const deleteDecision = async (req, res) => {
  try {
    const existingDecision = await prisma.decision.findUnique({
      where: { id: req.params.id },
      include: {
        dossier: {
          select: {
            numero: true
          }
        }
      }
    });

    if (!existingDecision) {
      return res.status(404).json({ error: 'Décision non trouvée' });
    }

    await prisma.$transaction(async (tx) => {
      await tx.decisionDemande.deleteMany({
        where: { decisionId: req.params.id }
      });

      await tx.decision.delete({
        where: { id: req.params.id }
      });
    });

    await logAction(req.user.id, 'DELETE_DECISION', `Suppression de la décision ${existingDecision.type} du dossier ${existingDecision.dossier.numero}`, 'Decision', req.params.id);

    res.json({ message: 'Décision supprimée avec succès' });
  } catch (error) {
    console.error('Delete decision error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

module.exports = {
  getAllDecisions,
  getFacets,
  getDecisionById,
  createDecision,
  updateDecision,
  deleteDecision
};
