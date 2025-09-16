const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');
const { authMiddleware } = require('../middleware/auth');
const { logAction } = require('../utils/logger');

const router = express.Router();
const prisma = new PrismaClient();

router.use(authMiddleware);

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

router.get('/', async (req, res) => {
  try {
    const { dossierId } = req.query;
    
    const whereClause = dossierId ? { dossierId } : {};
    
    const conventions = await prisma.convention.findMany({
      where: whereClause,
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
      },
      orderBy: {
        numero: 'desc'
      }
    });

    res.json(conventions);
  } catch (error) {
    console.error('Get conventions error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/', async (req, res) => {
  try {
    console.log('=== DEBUG: Convention creation request ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
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
});

router.get('/:id', async (req, res) => {
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
});

router.put('/:id', async (req, res) => {
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
});

router.delete('/:id', async (req, res) => {
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
});

module.exports = router;