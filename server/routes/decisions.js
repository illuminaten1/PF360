const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');
const { authMiddleware } = require('../middleware/auth');
const { logAction } = require('../utils/logger');

const router = express.Router();
const prisma = new PrismaClient();

router.use(authMiddleware);

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

router.get('/', async (_req, res) => {
  try {
    const decisions = await prisma.decision.findMany({
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
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(decisions);
  } catch (error) {
    console.error('Get decisions error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/', async (req, res) => {
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
});

router.get('/:id', async (req, res) => {
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
});

router.put('/:id', async (req, res) => {
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
        // Si le type change vers REJET, garder le motifRejet s'il est fourni
        // Si le type change vers autre chose que REJET, vider le motifRejet
        updateData.motifRejet = type === 'REJET' ? (motifRejet || null) : null;
      } else if (motifRejet !== undefined) {
        // Si seul le motifRejet change, le mettre à jour seulement si le type actuel est REJET
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
        // Supprimer les anciennes liaisons
        await tx.decisionDemande.deleteMany({
          where: { decisionId: req.params.id }
        });

        // Créer les nouvelles liaisons
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
});

router.delete('/:id', async (req, res) => {
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
      // Supprimer les liaisons avec les demandes
      await tx.decisionDemande.deleteMany({
        where: { decisionId: req.params.id }
      });

      // Supprimer la décision
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
});

module.exports = router;