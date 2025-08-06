const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');
const { authMiddleware } = require('../middleware/auth');
const { logAction } = require('../utils/logger');

const router = express.Router();
const prisma = new PrismaClient();

router.use(authMiddleware);

const createDossierSchema = z.object({
  notes: z.string().optional(),
  sgamiId: z.string().optional(),
  assigneAId: z.string().optional(),
  badges: z.array(z.string()).optional()
});

router.get('/', async (req, res) => {
  try {
    const dossiers = await prisma.dossier.findMany({
      include: {
        demandes: {
          select: {
            id: true,
            numeroDS: true,
            type: true,
            nom: true,
            prenom: true,
            dateReception: true
          }
        },
        sgami: true,
        badges: {
          include: {
            badge: true
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
        decisions: {
          select: {
            id: true,
            type: true,
            date: true
          }
        },
        conventions: {
          select: {
            id: true,
            montantHT: true,
            date: true
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
        dateReceptionGlobale: 'desc'
      }
    });

    const dossiersWithStats = dossiers.map(dossier => ({
      ...dossier,
      stats: {
        totalConventionsHT: dossier.conventions.reduce((sum, conv) => sum + conv.montantHT, 0),
        totalPaiementsTTC: dossier.paiements.reduce((sum, paie) => sum + paie.montantTTC, 0),
        nombreDemandes: dossier.demandes.length,
        nombreDecisions: dossier.decisions.length
      }
    }));

    res.json(dossiersWithStats);
  } catch (error) {
    console.error('Get dossiers error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/', async (req, res) => {
  try {
    const validatedData = createDossierSchema.parse(req.body);
    const { notes, sgamiId, assigneAId, badges = [] } = validatedData;

    const dossier = await prisma.dossier.create({
      data: {
        notes,
        sgamiId,
        assigneAId,
        badges: {
          create: badges.map(badgeId => ({
            badgeId
          }))
        }
      },
      include: {
        sgami: true,
        badges: {
          include: {
            badge: true
          }
        },
        assigneA: {
          select: {
            id: true,
            nom: true,
            prenom: true
          }
        }
      }
    });

    await logAction(req.user.id, 'CREATE_DOSSIER', `Création du dossier ${dossier.numero}`, 'Dossier', dossier.id);

    res.status(201).json(dossier);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Create dossier error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const dossier = await prisma.dossier.findUnique({
      where: { id: req.params.id },
      include: {
        demandes: {
          include: {
            decisions: {
              include: {
                decision: true
              }
            },
            conventions: {
              include: {
                convention: true
              }
            }
          }
        },
        sgami: true,
        badges: {
          include: {
            badge: true
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
        decisions: {
          include: {
            creePar: {
              select: {
                nom: true,
                prenom: true
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
        },
        conventions: {
          include: {
            avocat: true,
            creePar: {
              select: {
                nom: true,
                prenom: true
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
        },
        paiements: {
          include: {
            convention: true,
            creePar: {
              select: {
                nom: true,
                prenom: true
              }
            }
          }
        },
        attendus: true
      }
    });

    if (!dossier) {
      return res.status(404).json({ error: 'Dossier non trouvé' });
    }

    res.json(dossier);
  } catch (error) {
    console.error('Get dossier error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.put('/:id', (req, res) => {
  res.json({ message: 'Update dossier - TODO' });
});

router.delete('/:id', (req, res) => {
  res.json({ message: 'Delete dossier - TODO' });
});

module.exports = router;