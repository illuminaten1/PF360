const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');
const { logAction } = require('../utils/logger');

const prisma = new PrismaClient();

const demandeSchema = z.object({
  numeroDS: z.string().min(1, 'Numéro DS requis'),
  type: z.enum(['VICTIME', 'MIS_EN_CAUSE'], { message: 'Type invalide' }),
  
  // Infos militaires
  nigend: z.string().optional(),
  grade: z.string().optional(),
  nom: z.string().min(1, 'Nom requis'),
  prenom: z.string().min(1, 'Prénom requis'),
  adresse1: z.string().optional(),
  adresse2: z.string().optional(),
  telephone1: z.string().optional(),
  telephone2: z.string().optional(),
  unite: z.string().optional(),
  
  // Infos faits
  dateFaits: z.string().optional().transform(val => val ? new Date(val) : undefined),
  commune: z.string().optional(),
  codePostal: z.string().optional(),
  position: z.enum(['EN_SERVICE', 'HORS_SERVICE']).optional(),
  resume: z.string().optional(),
  blessures: z.string().optional(),
  partieCivile: z.boolean().default(false),
  montantPartieCivile: z.number().optional(),
  qualificationsPenales: z.string().optional(),
  dateAudience: z.string().optional().transform(val => val ? new Date(val) : undefined),
  
  // Soutiens
  soutienPsychologique: z.boolean().default(false),
  soutienSocial: z.boolean().default(false),
  soutienMedical: z.boolean().default(false),
  
  // Association au dossier
  dossierId: z.string().optional()
});

const getAllDemandes = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, type, position, partieCivile } = req.query;
    const skip = (page - 1) * limit;

    const where = {};
    
    if (search) {
      where.OR = [
        { numeroDS: { contains: search, mode: 'insensitive' } },
        { nom: { contains: search, mode: 'insensitive' } },
        { prenom: { contains: search, mode: 'insensitive' } },
        { nigend: { contains: search, mode: 'insensitive' } },
        { commune: { contains: search, mode: 'insensitive' } },
        { unite: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    if (type) where.type = type;
    if (position) where.position = position;
    if (partieCivile !== undefined) where.partieCivile = partieCivile === 'true';

    const [demandes, total] = await Promise.all([
      prisma.demande.findMany({
        where,
        include: {
          dossier: {
            select: {
              id: true,
              numero: true,
              sgami: { select: { nom: true } }
            }
          },
          decisions: {
            include: {
              decision: {
                select: {
                  id: true,
                  type: true,
                  date: true
                }
              }
            }
          },
          conventions: {
            include: {
              convention: {
                select: {
                  id: true,
                  montantHT: true,
                  date: true,
                  avocat: {
                    select: {
                      nom: true,
                      prenom: true
                    }
                  }
                }
              }
            }
          }
        },
        orderBy: { dateReception: 'desc' },
        skip: parseInt(skip),
        take: parseInt(limit)
      }),
      prisma.demande.count({ where })
    ]);

    await logAction(req.user.id, 'LIST_DEMANDES', `Consultation des demandes (${demandes.length} résultats)`);

    res.json({
      demandes,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get demandes error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const getDemandeById = async (req, res) => {
  try {
    const demande = await prisma.demande.findUnique({
      where: { id: req.params.id },
      include: {
        dossier: {
          include: {
            sgami: true,
            assigneA: {
              select: {
                nom: true,
                prenom: true
              }
            }
          }
        },
        decisions: {
          include: {
            decision: {
              include: {
                creePar: {
                  select: {
                    nom: true,
                    prenom: true
                  }
                }
              }
            }
          }
        },
        conventions: {
          include: {
            convention: {
              include: {
                avocat: true,
                creePar: {
                  select: {
                    nom: true,
                    prenom: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!demande) {
      return res.status(404).json({ error: 'Demande non trouvée' });
    }

    await logAction(req.user.id, 'VIEW_DEMANDE', `Consultation demande ${demande.numeroDS}`, 'Demande', demande.id);

    res.json(demande);
  } catch (error) {
    console.error('Get demande error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const createDemande = async (req, res) => {
  try {
    const validatedData = demandeSchema.parse(req.body);
    
    // Vérifier l'unicité du numéro DS
    const existingDemande = await prisma.demande.findUnique({
      where: { numeroDS: validatedData.numeroDS }
    });

    if (existingDemande) {
      return res.status(400).json({ error: 'Ce numéro DS existe déjà' });
    }

    const demande = await prisma.demande.create({
      data: validatedData,
      include: {
        dossier: {
          select: {
            id: true,
            numero: true,
            sgami: { select: { nom: true } }
          }
        }
      }
    });

    await logAction(req.user.id, 'CREATE_DEMANDE', `Création demande ${demande.numeroDS}`, 'Demande', demande.id);

    res.status(201).json(demande);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Create demande error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const updateDemande = async (req, res) => {
  try {
    const validatedData = demandeSchema.partial().parse(req.body);
    
    // Vérifier que la demande existe
    const existingDemande = await prisma.demande.findUnique({
      where: { id: req.params.id }
    });

    if (!existingDemande) {
      return res.status(404).json({ error: 'Demande non trouvée' });
    }

    // Vérifier l'unicité du numéro DS si modifié
    if (validatedData.numeroDS && validatedData.numeroDS !== existingDemande.numeroDS) {
      const duplicateDemande = await prisma.demande.findUnique({
        where: { numeroDS: validatedData.numeroDS }
      });

      if (duplicateDemande) {
        return res.status(400).json({ error: 'Ce numéro DS existe déjà' });
      }
    }

    const demande = await prisma.demande.update({
      where: { id: req.params.id },
      data: validatedData,
      include: {
        dossier: {
          select: {
            id: true,
            numero: true,
            sgami: { select: { nom: true } }
          }
        }
      }
    });

    await logAction(req.user.id, 'UPDATE_DEMANDE', `Modification demande ${demande.numeroDS}`, 'Demande', demande.id);

    res.json(demande);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Update demande error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const deleteDemande = async (req, res) => {
  try {
    const demande = await prisma.demande.findUnique({
      where: { id: req.params.id },
      select: { numeroDS: true }
    });

    if (!demande) {
      return res.status(404).json({ error: 'Demande non trouvée' });
    }

    await prisma.demande.delete({
      where: { id: req.params.id }
    });

    await logAction(req.user.id, 'DELETE_DEMANDE', `Suppression demande ${demande.numeroDS}`, 'Demande', req.params.id);

    res.json({ message: 'Demande supprimée avec succès' });
  } catch (error) {
    console.error('Delete demande error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const getStats = async (req, res) => {
  try {
    const [
      totalDemandes,
      demandesToday,
      demandesVictimes,
      demandesMisEnCause,
      demandesAvecPartieCivile,
      demandesSans2Mois
    ] = await Promise.all([
      prisma.demande.count(),
      prisma.demande.count({
        where: {
          dateReception: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      }),
      prisma.demande.count({ where: { type: 'VICTIME' } }),
      prisma.demande.count({ where: { type: 'MIS_EN_CAUSE' } }),
      prisma.demande.count({ where: { partieCivile: true } }),
      prisma.demande.count({
        where: {
          dateReception: {
            lte: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) // 60 jours
          },
          decisions: {
            none: {}
          }
        }
      })
    ]);

    res.json({
      totalDemandes,
      demandesToday,
      demandesVictimes,
      demandesMisEnCause,
      demandesAvecPartieCivile,
      demandesSans2Mois
    });
  } catch (error) {
    console.error('Get demandes stats error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

module.exports = {
  getAllDemandes,
  getDemandeById,
  createDemande,
  updateDemande,
  deleteDemande,
  getStats
};