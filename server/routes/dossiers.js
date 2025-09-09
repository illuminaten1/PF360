const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');
const { authMiddleware } = require('../middleware/auth');
const { logAction } = require('../utils/logger');
const { syncDemandeBadgesFromDossier, syncDemandeBAPsFromDossier, syncDemandeAssignationFromDossier } = require('../controllers/demandeController');

const router = express.Router();
const prisma = new PrismaClient();

router.use(authMiddleware);

const createDossierSchema = z.object({
  nomDossier: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  sgamiId: z.string().optional().nullable(),
  assigneAId: z.string().min(1, "Le rédacteur est requis"),
  badges: z.array(z.string()).optional(),
  bapId: z.string().optional().nullable(),
  selectedDemandeIds: z.array(z.string()).optional() // Pour la création avec demandes sélectionnées
});

const updateDossierSchema = z.object({
  nomDossier: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  sgamiId: z.string().optional().nullable(),
  assigneAId: z.string().optional(),
  badges: z.array(z.string()).optional(),
  bapId: z.string().optional().nullable()
});

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
                },
                {
                  numeroDS: {
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

router.post('/', async (req, res) => {
  try {
    const validatedData = createDossierSchema.parse(req.body);
    const { nomDossier, notes, sgamiId, assigneAId, badges = [], bapId, selectedDemandeIds = [] } = validatedData;

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
      const newDossier = await tx.dossier.create({
        data: {
          numero: nextNumber,
          nomDossier,
          notes,
          sgamiId: sgamiId || null,
          assigneAId,
          creeParId: req.user.id,
          ...(badges.length > 0 && {
            badges: {
              create: badges.map(badgeId => ({
                badgeId
              }))
            }
          }),
          ...(bapId && bapId.trim() !== '' && {
            baps: {
              create: {
                bapId
              }
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
          baps: {
            include: {
              bap: true
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

      // Lier les demandes sélectionnées au nouveau dossier
      if (selectedDemandeIds.length > 0) {
        await tx.demande.updateMany({
          where: {
            id: { in: selectedDemandeIds }
          },
          data: {
            dossierId: newDossier.id
          }
        });
      }

      return newDossier;
    });

    // Sync badges, BAP and assignation to linked demandes if any were added
    if (badges.length > 0) {
      await syncDemandeBadgesFromDossier(dossier.id);
    }
    if (bapId && bapId.trim() !== '') {
      await syncDemandeBAPsFromDossier(dossier.id);
    }
    // Synchroniser l'assignation pour les demandes nouvellement liées
    if (selectedDemandeIds.length > 0) {
      await syncDemandeAssignationFromDossier(dossier.id);
    }

    // Transform baps array to single bap object
    const transformedDossier = {
      ...dossier,
      bap: dossier.baps && dossier.baps.length > 0 ? dossier.baps[0].bap : null
    };
    delete transformedDossier.baps;

    await logAction(req.user.id, 'CREATE_DOSSIER', `Création du dossier ${dossier.numero}`, 'Dossier', dossier.id);

    res.status(201).json(transformedDossier);
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
            grade: true,
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
            },
            baps: {
              include: {
                bap: true
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
                  include: {
                    grade: true
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
            sgami: {
              select: {
                id: true,
                nom: true,
                intituleFicheReglement: true
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
            pce: {
              select: {
                id: true,
                ordre: true,
                pceDetaille: true,
                pceNumerique: true,
                codeMarchandise: true
              }
            },
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

    // Transform baps array to single bap object
    const transformedDossier = {
      ...dossier,
      bap: dossier.baps && dossier.baps.length > 0 ? dossier.baps[0].bap : null
    };
    delete transformedDossier.baps;

    await logAction(req.user.id, 'VIEW_DOSSIER', `Consultation du dossier ${transformedDossier.numero}`, 'Dossier', transformedDossier.id);

    res.json(transformedDossier);
  } catch (error) {
    console.error('Get dossier error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const validatedData = updateDossierSchema.parse(req.body);
    const { nomDossier, notes, sgamiId, assigneAId, badges = [], bapId } = validatedData;

    const existingDossier = await prisma.dossier.findUnique({
      where: { id: req.params.id },
      include: { badges: true, baps: true }
    });

    if (!existingDossier) {
      return res.status(404).json({ error: 'Dossier non trouvé' });
    }

    await prisma.dossierBadge.deleteMany({
      where: { dossierId: req.params.id }
    });

    await prisma.dossierBAP.deleteMany({
      where: { dossierId: req.params.id }
    });

    // Construire l'objet de données en filtrant les valeurs undefined et chaînes vides
    const updateData = {
      modifieParId: req.user.id,
      badges: {
        create: badges.map(badgeId => ({
          badgeId
        }))
      },
      ...(bapId && bapId.trim() !== '' && {
        baps: {
          create: {
            bapId
          }
        }
      })
    };

    // Ajouter seulement les champs qui ont une valeur définie
    if (nomDossier !== undefined) {
      updateData.nomDossier = nomDossier;
    }
    if (notes !== undefined) {
      updateData.notes = notes;
    }
    if (sgamiId !== undefined) {
      updateData.sgamiId = sgamiId || null;
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
      bap: dossier.baps && dossier.baps.length > 0 ? dossier.baps[0].bap : null,
      stats: {
        totalConventionsHT: dossier.conventions.reduce((sum, conv) => sum + conv.montantHT, 0),
        totalPaiementsTTC: dossier.paiements.reduce((sum, paie) => sum + paie.montantTTC, 0),
        nombreDemandes: dossier.demandes.length,
        nombreDecisions: dossier.decisions.length
      }
    };
    delete dossierWithStats.baps;

    // Sync badges, BAP and assignation to all linked demandes after changes
    await syncDemandeBadgesFromDossier(req.params.id);
    await syncDemandeBAPsFromDossier(req.params.id);
    await syncDemandeAssignationFromDossier(req.params.id);

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
        baps: true,
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

    await prisma.dossierBAP.deleteMany({
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