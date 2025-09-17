const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');
const { logAction } = require('../../utils/logger');
const { syncDemandeBadgesFromDossier, syncDemandeBAPsFromDossier, syncDemandeAssignationFromDossier } = require('../../controllers/demandeController');

const router = express.Router();
const prisma = new PrismaClient();

const updateDossierSchema = z.object({
  nomDossier: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  sgamiId: z.string().optional().nullable(),
  assigneAId: z.string().optional(),
  badges: z.array(z.string()).optional(),
  bapId: z.string().optional().nullable()
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

module.exports = router;