const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');
const { authMiddleware } = require('../middleware/auth');
const { logAction } = require('../utils/logger');
const { syncDemandeBadgesFromDossier } = require('../controllers/demandeController');

const router = express.Router();
const prisma = new PrismaClient();

router.use(authMiddleware);

const createDossierSchema = z.object({
  nomDossier: z.string().optional(),
  notes: z.string().optional(),
  sgamiId: z.string().min(1, "Le SGAMI est requis"),
  assigneAId: z.string().min(1, "Le rédacteur est requis"),
  badges: z.array(z.string()).optional()
});

const updateDossierSchema = z.object({
  nomDossier: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
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
    const { nomDossier, notes, sgamiId, assigneAId, badges = [] } = validatedData;

    const dossier = await prisma.$transaction(async (tx) => {
      // Trouver le dernier numéro utilisé (tri numérique)
      const allDossiers = await tx.dossier.findMany({
        select: { numero: true }
      });
      
      const maxNumber = allDossiers.length > 0 
        ? Math.max(...allDossiers.map(d => parseInt(d.numero)))
        : 0;

      // Calculer le prochain numéro séquentiel
      const nextNumber = (maxNumber + 1).toString();

      // Créer le dossier avec le nouveau numéro
      return await tx.dossier.create({
        data: {
          numero: nextNumber,
          nomDossier,
          notes,
          sgamiId,
          assigneAId,
          creeParId: req.user.id,
          ...(badges.length > 0 && {
            badges: {
              create: badges.map(badgeId => ({
                badgeId
              }))
            }
          })
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
    });

    // Sync badges to linked demandes if any badges were added
    if (badges.length > 0) {
      await syncDemandeBadgesFromDossier(dossier.id);
    }

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
            },
            badges: {
              include: {
                badge: true
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
        },
        conventions: {
          include: {
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

router.put('/:id', async (req, res) => {
  try {
    const validatedData = updateDossierSchema.parse(req.body);
    const { nomDossier, notes, sgamiId, assigneAId, badges = [] } = validatedData;

    const existingDossier = await prisma.dossier.findUnique({
      where: { id: req.params.id },
      include: { badges: true }
    });

    if (!existingDossier) {
      return res.status(404).json({ error: 'Dossier non trouvé' });
    }

    await prisma.dossierBadge.deleteMany({
      where: { dossierId: req.params.id }
    });

    // Construire l'objet de données en filtrant les valeurs undefined et chaînes vides
    const updateData = {
      modifieParId: req.user.id,
      badges: {
        create: badges.map(badgeId => ({
          badgeId
        }))
      }
    };

    // Ajouter seulement les champs qui ont une valeur définie
    if (nomDossier !== undefined) {
      updateData.nomDossier = nomDossier;
    }
    if (notes !== undefined) {
      updateData.notes = notes;
    }
    if (sgamiId !== undefined && sgamiId !== '') {
      updateData.sgamiId = sgamiId;
    }
    if (assigneAId !== undefined && assigneAId !== '') {
      updateData.assigneAId = assigneAId;
    }

    const dossier = await prisma.dossier.update({
      where: { id: req.params.id },
      data: updateData,
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
        },
        paiements: {
          select: {
            id: true,
            montantTTC: true
          }
        }
      }
    });

    const dossierWithStats = {
      ...dossier,
      stats: {
        totalConventionsHT: dossier.conventions.reduce((sum, conv) => sum + conv.montantHT, 0),
        totalPaiementsTTC: dossier.paiements.reduce((sum, paie) => sum + paie.montantTTC, 0),
        nombreDemandes: dossier.demandes.length,
        nombreDecisions: dossier.decisions.length
      }
    };

    // Sync badges to all linked demandes after badge changes
    await syncDemandeBadgesFromDossier(req.params.id);

    await logAction(req.user.id, 'UPDATE_DOSSIER', `Modification du dossier ${dossier.numero}`, 'Dossier', dossier.id);

    res.json(dossierWithStats);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Update dossier error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const existingDossier = await prisma.dossier.findUnique({
      where: { id: req.params.id },
      include: {
        demandes: true,
        decisions: true,
        conventions: true,
        paiements: true,
        badges: true,
        attendus: true
      }
    });

    if (!existingDossier) {
      return res.status(404).json({ error: 'Dossier non trouvé' });
    }

    if (existingDossier.demandes.length > 0) {
      return res.status(400).json({ 
        error: 'Impossible de supprimer un dossier contenant des demandes' 
      });
    }

    if (existingDossier.decisions.length > 0) {
      return res.status(400).json({ 
        error: 'Impossible de supprimer un dossier contenant des décisions' 
      });
    }

    if (existingDossier.conventions.length > 0) {
      return res.status(400).json({ 
        error: 'Impossible de supprimer un dossier contenant des conventions' 
      });
    }

    if (existingDossier.paiements.length > 0) {
      return res.status(400).json({ 
        error: 'Impossible de supprimer un dossier contenant des paiements' 
      });
    }

    // Supprimer les relations en premier
    await prisma.dossierBadge.deleteMany({
      where: { dossierId: req.params.id }
    });

    await prisma.dossierAttendu.deleteMany({
      where: { dossierId: req.params.id }
    });

    // Maintenant supprimer le dossier
    await prisma.dossier.delete({
      where: { id: req.params.id }
    });

    await logAction(req.user.id, 'DELETE_DOSSIER', `Suppression du dossier ${existingDossier.numero}`, 'Dossier', req.params.id);

    res.json({ message: 'Dossier supprimé avec succès' });
  } catch (error) {
    console.error('Delete dossier error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;