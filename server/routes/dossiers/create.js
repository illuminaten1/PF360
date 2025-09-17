const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');
const { logAction } = require('../../utils/logger');
const { syncDemandeBadgesFromDossier, syncDemandeBAPsFromDossier, syncDemandeAssignationFromDossier } = require('../../controllers/demandeController');

const router = express.Router();
const prisma = new PrismaClient();

const createDossierSchema = z.object({
  nomDossier: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  sgamiId: z.string().optional().nullable(),
  assigneAId: z.string().min(1, "Le rédacteur est requis"),
  badges: z.array(z.string()).optional(),
  bapId: z.string().optional().nullable(),
  selectedDemandeIds: z.array(z.string()).optional() // Pour la création avec demandes sélectionnées
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

module.exports = router;