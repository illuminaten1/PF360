const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');
const { logAction } = require('../utils/logger');

const prisma = new PrismaClient();

// Utility function to clean empty strings from data
const cleanEmptyStrings = (data) => {
  const cleaned = { ...data };
  Object.keys(cleaned).forEach(key => {
    if (cleaned[key] === '') {
      if (key === 'position') {
        delete cleaned[key];
      } else {
        cleaned[key] = null;
      }
    }
  });
  return cleaned;
};

const demandeSchema = z.object({
  numeroDS: z.string().min(1, 'Numéro DS requis'),
  type: z.enum(['VICTIME', 'MIS_EN_CAUSE'], { message: 'Type invalide' }),
  
  // Infos militaires
  nigend: z.string().optional(),
  grade: z.string().min(1, 'Grade requis'),
  statutDemandeur: z.string().min(1, 'Statut du demandeur requis'),
  branche: z.string().optional(),
  formationAdministrative: z.string().optional(),
  departement: z.string().optional(),
  nom: z.string().min(1, 'Nom requis'),
  prenom: z.string().min(1, 'Prénom requis'),
  adressePostaleLigne1: z.string().optional(),
  adressePostaleLigne2: z.string().optional(),
  telephoneProfessionnel: z.string().optional(),
  telephonePersonnel: z.string().optional(),
  emailProfessionnel: z.string().email('Email professionnel invalide').optional().or(z.literal('')),
  emailPersonnel: z.string().email('Email personnel invalide').optional().or(z.literal('')),
  unite: z.string().optional(),
  
  // Infos faits
  dateFaits: z.string().optional(),
  commune: z.string().optional(),
  codePostal: z.string().optional(),
  position: z.string().optional(),
  contexteMissionnel: z.string().optional(),
  qualificationInfraction: z.string().optional(),
  resume: z.string().optional(),
  blessures: z.string().optional(),
  partieCivile: z.boolean().default(false),
  montantPartieCivile: z.number().optional(),
  qualificationsPenales: z.string().optional(),
  dateAudience: z.string().optional(),
  
  // Soutiens
  soutienPsychologique: z.boolean().default(false),
  soutienSocial: z.boolean().default(false),
  soutienMedical: z.boolean().default(false),
  
  // Date de réception
  dateReception: z.string().optional(),
  
  // Association au dossier
  dossierId: z.string().optional(),
  
  // Affectation utilisateur
  assigneAId: z.string().optional()
});

const getAllDemandes = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, type, dateDebut, dateFin, assigneAId, dossierId, sortBy, sortOrder } = req.query;
    const skip = (page - 1) * limit;

    const where = {};
    
    if (search) {
      where.OR = [
        { numeroDS: { contains: search } },
        { nom: { contains: search } },
        { prenom: { contains: search } },
        { nigend: { contains: search } },
        { commune: { contains: search } },
        { unite: { contains: search } }
      ];
    }
    
    if (type) where.type = type;
    
    // Filtrage par date de réception
    if (dateDebut || dateFin) {
      where.dateReception = {};
      if (dateDebut) {
        where.dateReception.gte = new Date(dateDebut + 'T00:00:00.000Z');
      }
      if (dateFin) {
        where.dateReception.lte = new Date(dateFin + 'T23:59:59.999Z');
      }
    }
    
    // Filtrage par assignation
    if (assigneAId !== undefined) {
      if (assigneAId === 'null') {
        where.assigneAId = null;
      } else if (assigneAId) {
        where.assigneAId = assigneAId;
      }
    }
    
    // Filtrage par dossier
    if (dossierId !== undefined) {
      if (dossierId === 'null') {
        where.dossierId = null; // Demandes non liées à un dossier
      } else if (dossierId) {
        where.dossierId = dossierId;
      }
    }

    // Build orderBy clause
    let orderBy = { dateReception: 'desc' }; // Default sort
    
    if (sortBy) {
      const validSortFields = {
        'numeroDS': 'numeroDS',
        'dateReception': 'dateReception',
        'dateAudience': 'dateAudience',
        'dateFaits': 'dateFaits',
        'nom': 'nom',
        'prenom': 'prenom',
        'unite': 'unite',
        'commune': 'commune'
      };
      
      if (validSortFields[sortBy]) {
        const direction = sortOrder === 'asc' ? 'asc' : 'desc';
        orderBy = { [validSortFields[sortBy]]: direction };
      }
    }

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
        orderBy,
        skip: parseInt(skip),
        take: parseInt(limit)
      }),
      prisma.demande.count({ where })
    ]);

    await logAction(req.user.id, 'LIST_DEMANDES', `Consultation des demandes (${demandes.length} résultats)`);

    res.json({
      demandes,
      total,
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
                prenom: true,
                grade: true
              }
            }
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

    // Clean empty strings and convert dates
    const dataToCreate = cleanEmptyStrings(validatedData);
    
    // Validate position if provided
    if (dataToCreate.position && !['EN_SERVICE', 'HORS_SERVICE'].includes(dataToCreate.position)) {
      return res.status(400).json({ error: 'Position invalide' });
    }
    
    // Convert date strings to Date objects
    if (dataToCreate.dateFaits) {
      dataToCreate.dateFaits = new Date(dataToCreate.dateFaits);
    }
    if (dataToCreate.dateAudience) {
      dataToCreate.dateAudience = new Date(dataToCreate.dateAudience);
    }
    if (dataToCreate.dateReception) {
      dataToCreate.dateReception = new Date(dataToCreate.dateReception);
    }
    
    // Pour la création, on ignore complètement le dossierId - les demandes sont créées sans dossier
    delete dataToCreate.dossierId;
    
    // Valider l'utilisateur assigné si fourni
    if (dataToCreate.assigneAId) {
      const userExists = await prisma.user.findUnique({
        where: { id: dataToCreate.assigneAId }
      });
      if (!userExists) {
        return res.status(400).json({ error: 'L\'utilisateur sélectionné n\'existe pas' });
      }
    }

    const demande = await prisma.demande.create({
      data: {
        ...dataToCreate,
        creeParId: req.user.id
      },
      include: {
        dossier: {
          select: {
            id: true,
            numero: true,
            sgami: { select: { nom: true } }
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

    // Clean empty strings and convert dates
    const dataToUpdate = cleanEmptyStrings(validatedData);
    
    // Validate position if provided
    if (dataToUpdate.position && !['EN_SERVICE', 'HORS_SERVICE'].includes(dataToUpdate.position)) {
      return res.status(400).json({ error: 'Position invalide' });
    }
    
    // Convert date strings to Date objects
    if (dataToUpdate.dateFaits) {
      dataToUpdate.dateFaits = new Date(dataToUpdate.dateFaits);
    }
    if (dataToUpdate.dateAudience) {
      dataToUpdate.dateAudience = new Date(dataToUpdate.dateAudience);
    }
    if (dataToUpdate.dateReception) {
      dataToUpdate.dateReception = new Date(dataToUpdate.dateReception);
    }
    
    // Handle dossier association
    if (!dataToUpdate.dossierId) {
      dataToUpdate.dossierId = null; // For updates, we use null to disconnect
    } else {
      // Vérifier que le dossier existe
      const dossierExists = await prisma.dossier.findUnique({
        where: { id: dataToUpdate.dossierId }
      });
      if (!dossierExists) {
        return res.status(400).json({ error: 'Le dossier sélectionné n\'existe pas' });
      }
    }
    
    // Handle user assignment
    if (dataToUpdate.assigneAId === '') {
      dataToUpdate.assigneAId = null; // Disconnect user
    } else if (dataToUpdate.assigneAId) {
      // Vérifier que l'utilisateur existe
      const userExists = await prisma.user.findUnique({
        where: { id: dataToUpdate.assigneAId }
      });
      if (!userExists) {
        return res.status(400).json({ error: 'L\'utilisateur sélectionné n\'existe pas' });
      }
    }

    const demande = await prisma.demande.update({
      where: { id: req.params.id },
      data: {
        ...dataToUpdate,
        modifieParId: req.user.id
      },
      include: {
        dossier: {
          select: {
            id: true,
            numero: true,
            sgami: { select: { nom: true } }
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

const getUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        nom: true,
        prenom: true,
        grade: true
      },
      orderBy: [
        { nom: 'asc' },
        { prenom: 'asc' }
      ]
    });

    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const getStats = async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(currentYear, 0, 1);
    const endOfYear = new Date(currentYear + 1, 0, 1);
    
    const [
      totalDemandes,
      demandesToday,
      demandesVictimes,
      demandesMisEnCause,
      demandesNonAffecteesAnnee,
      demandesSansDecision,
      demandesNonAffecteesToday
    ] = await Promise.all([
      prisma.demande.count({
        where: {
          dateReception: {
            gte: startOfYear,
            lt: endOfYear
          }
        }
      }),
      prisma.demande.count({
        where: {
          dateReception: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      }),
      prisma.demande.count({ 
        where: { 
          type: 'VICTIME',
          dateReception: {
            gte: startOfYear,
            lt: endOfYear
          }
        } 
      }),
      prisma.demande.count({ 
        where: { 
          type: 'MIS_EN_CAUSE',
          dateReception: {
            gte: startOfYear,
            lt: endOfYear
          }
        } 
      }),
      prisma.demande.count({ 
        where: { 
          assigneAId: null, // Demandes non affectées de l'année
          dateReception: {
            gte: startOfYear,
            lt: endOfYear
          }
        } 
      }),
      prisma.demande.count({
        where: {
          dateReception: {
            gte: startOfYear,
            lt: endOfYear
          },
          decisions: {
            none: {}
          }
        }
      }),
      prisma.demande.count({ 
        where: { 
          assigneAId: null, // Demandes non affectées d'aujourd'hui
          dateReception: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        } 
      })
    ]);

    res.json({
      totalDemandes,
      demandesToday,
      demandesVictimes,
      demandesMisEnCause,
      demandesNonAffecteesAnnee,
      demandesSansDecision,
      demandesNonAffecteesToday
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
  getUsers,
  getStats
};