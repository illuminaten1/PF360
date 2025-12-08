const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');
const { logAction } = require('../utils/logger');

const prisma = new PrismaClient();

const createPaiementSchema = z.object({
  facture: z.string().optional().nullable(),
  montantTTC: z.number().positive("Le montant TTC doit être positif"),
  emissionTitrePerception: z.enum(['OUI', 'NON'], { required_error: "L'émission titre de perception est requise" }),
  qualiteBeneficiaire: z.enum([
    'Avocat',
    'Commissaire de justice',
    'Militaire de la gendarmerie nationale',
    'Régisseur du tribunal judiciaire',
    'Médecin',
    'Victime'
  ], { required_error: "La qualité du bénéficiaire est requise" }),
  identiteBeneficiaire: z.string().min(1, "L'identité du bénéficiaire est requise"),
  dateServiceFait: z.string().optional().nullable(),
  conventionJointeFRI: z.enum(['OUI', 'NON'], { required_error: "Convention jointe FRI est requise" }),
  adresseBeneficiaire: z.string().optional().nullable(),
  siretOuRidet: z.string().optional().nullable(),
  titulaireCompteBancaire: z.string().optional().nullable(),
  codeEtablissement: z.string().optional().nullable(),
  codeGuichet: z.string().optional().nullable(),
  numeroCompte: z.string().optional().nullable(),
  cleRIB: z.string().optional().nullable(),
  ficheReglement: z.string().optional().nullable(),
  dossierId: z.string().min(1, "Le dossier est requis"),
  sgamiId: z.string().min(1, "Le SGAMI est requis"),
  avocatId: z.string().optional().nullable(),
  pceId: z.string().min(1, "Le PCE est requis"),
  decisions: z.array(z.string()).min(1, "Au moins une décision est requise")
});

const updatePaiementSchema = z.object({
  facture: z.string().optional().nullable(),
  montantTTC: z.number().positive().optional(),
  emissionTitrePerception: z.enum(['OUI', 'NON']).optional(),
  qualiteBeneficiaire: z.enum([
    'Avocat',
    'Commissaire de justice',
    'Militaire de la gendarmerie nationale',
    'Régisseur du tribunal judiciaire',
    'Médecin',
    'Victime'
  ]).optional(),
  identiteBeneficiaire: z.string().min(1).optional(),
  dateServiceFait: z.string().optional().nullable(),
  conventionJointeFRI: z.enum(['OUI', 'NON']).optional(),
  adresseBeneficiaire: z.string().optional().nullable(),
  siretOuRidet: z.string().optional().nullable(),
  titulaireCompteBancaire: z.string().optional().nullable(),
  codeEtablissement: z.string().optional().nullable(),
  codeGuichet: z.string().optional().nullable(),
  numeroCompte: z.string().optional().nullable(),
  cleRIB: z.string().optional().nullable(),
  ficheReglement: z.string().optional().nullable(),
  sgamiId: z.string().min(1).optional(),
  avocatId: z.string().optional().nullable(),
  pceId: z.string().min(1).optional(),
  decisions: z.array(z.string()).optional()
});

// GET /paiements - Récupération paginée et filtrée des paiements
const getAllPaiements = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 25,
      search,
      qualiteBeneficiaire,
      emissionTitrePerception,
      conventionJointeFRI,
      dateServiceFaitDebut,
      dateServiceFaitFin,
      createdAtDebut,
      createdAtFin,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      // Filtres individuels
      numero,
      dossierNumero,
      sgamiNom,
      identiteBeneficiaire,
      facture,
      pceDetaille,
      creePar
    } = req.query;

    const skip = (page - 1) * limit;
    const where = {};

    // Recherche globale
    if (search) {
      const searchTerm = search.trim();
      where.OR = [
        { numero: { equals: parseInt(searchTerm) || -1 } },
        { facture: { contains: searchTerm, mode: 'insensitive' } },
        { identiteBeneficiaire: { contains: searchTerm, mode: 'insensitive' } },
        { qualiteBeneficiaire: { contains: searchTerm, mode: 'insensitive' } },
        { dossier: { numero: { contains: searchTerm, mode: 'insensitive' } } },
        { dossier: { nomDossier: { contains: searchTerm, mode: 'insensitive' } } },
        { sgami: { nom: { contains: searchTerm, mode: 'insensitive' } } },
        { avocat: { nom: { contains: searchTerm, mode: 'insensitive' } } },
        { avocat: { prenom: { contains: searchTerm, mode: 'insensitive' } } },
        { pce: { pceDetaille: { contains: searchTerm, mode: 'insensitive' } } },
        { creePar: { nom: { contains: searchTerm, mode: 'insensitive' } } },
        { creePar: { prenom: { contains: searchTerm, mode: 'insensitive' } } }
      ];
    }

    // Filtre par numéro de paiement
    if (numero) {
      where.numero = { equals: parseInt(numero) || -1 };
    }

    // Filtre par numéro de dossier
    if (dossierNumero) {
      where.dossier = { numero: { contains: dossierNumero, mode: 'insensitive' } };
    }

    // Filtre par SGAMI (multi-select)
    if (sgamiNom) {
      const sgamis = Array.isArray(sgamiNom) ? sgamiNom : [sgamiNom];
      where.sgami = {
        OR: sgamis.map(nom => ({
          nom: { contains: nom, mode: 'insensitive' }
        }))
      };
    }

    // Filtre par qualité bénéficiaire (multi-select)
    if (qualiteBeneficiaire) {
      const qualites = Array.isArray(qualiteBeneficiaire) ? qualiteBeneficiaire : [qualiteBeneficiaire];
      where.qualiteBeneficiaire = { in: qualites };
    }

    // Filtre par identité bénéficiaire
    if (identiteBeneficiaire) {
      where.identiteBeneficiaire = { contains: identiteBeneficiaire, mode: 'insensitive' };
    }

    // Filtre par facture
    if (facture) {
      where.facture = { contains: facture, mode: 'insensitive' };
    }

    // Filtre par émission titre (multi-select)
    if (emissionTitrePerception) {
      const emissions = Array.isArray(emissionTitrePerception) ? emissionTitrePerception : [emissionTitrePerception];
      where.emissionTitrePerception = { in: emissions };
    }

    // Filtre par convention jointe (multi-select)
    if (conventionJointeFRI) {
      const conventions = Array.isArray(conventionJointeFRI) ? conventionJointeFRI : [conventionJointeFRI];
      where.conventionJointeFRI = { in: conventions };
    }

    // Filtre par PCE
    if (pceDetaille) {
      where.pce = {
        pceDetaille: { contains: pceDetaille, mode: 'insensitive' }
      };
    }

    // Filtre par date de service fait
    if (dateServiceFaitDebut || dateServiceFaitFin) {
      where.dateServiceFait = {};
      if (dateServiceFaitDebut) {
        where.dateServiceFait.gte = new Date(dateServiceFaitDebut + 'T00:00:00.000Z');
      }
      if (dateServiceFaitFin) {
        where.dateServiceFait.lte = new Date(dateServiceFaitFin + 'T23:59:59.999Z');
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

    // Tri
    const orderBy = {};
    if (sortBy === 'dossier') {
      orderBy.dossier = { numero: sortOrder };
    } else if (sortBy === 'sgami') {
      orderBy.sgami = { nom: sortOrder };
    } else if (sortBy === 'pce') {
      orderBy.pce = { pceDetaille: sortOrder };
    } else if (sortBy === 'creePar') {
      orderBy.creePar = { nom: sortOrder };
    } else {
      orderBy[sortBy] = sortOrder;
    }

    // Requêtes en parallèle
    const [paiements, totalCount] = await Promise.all([
      prisma.paiement.findMany({
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
                  numero: true,
                  dateSignature: true
                }
              }
            }
          }
        }
      }),
      prisma.paiement.count({ where })
    ]);

    res.json({
      paiements,
      pagination: {
        total: totalCount,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(totalCount / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get paiements error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// GET /paiements/facets - Récupération des valeurs uniques pour les filtres
const getFacets = async (req, res) => {
  try {
    const [qualitesBeneficiaires, sgamis, pces, createurs] = await Promise.all([
      // Qualités bénéficiaires
      prisma.paiement.findMany({
        select: { qualiteBeneficiaire: true },
        distinct: ['qualiteBeneficiaire'],
        orderBy: { qualiteBeneficiaire: 'asc' }
      }),
      // SGAMIs
      prisma.sgami.findMany({
        select: {
          id: true,
          nom: true
        },
        orderBy: { nom: 'asc' }
      }),
      // PCEs
      prisma.pce.findMany({
        select: {
          id: true,
          pceDetaille: true,
          pceNumerique: true
        },
        orderBy: { ordre: 'asc' }
      }),
      // Créateurs
      prisma.user.findMany({
        where: {
          paiements: {
            some: {}
          }
        },
        select: {
          id: true,
          nom: true,
          prenom: true,
          grade: true
        },
        orderBy: { nom: 'asc' }
      })
    ]);

    res.json({
      qualitesBeneficiaires: qualitesBeneficiaires.map(q => q.qualiteBeneficiaire).filter(Boolean),
      emissionsTitre: ['OUI', 'NON'],
      conventionsJointes: ['OUI', 'NON'],
      sgamis: sgamis.map(s => ({
        id: s.id,
        nom: s.nom
      })),
      pces: pces.map(p => ({
        id: p.id,
        pceDetaille: p.pceDetaille,
        pceNumerique: p.pceNumerique
      })),
      createurs: createurs.map(c => ({
        id: c.id,
        fullName: `${c.grade ? c.grade + ' ' : ''}${c.prenom} ${c.nom}`.trim()
      }))
    });
  } catch (error) {
    console.error('Get facets error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// GET /paiements/stats - Récupération des statistiques globales
const getStats = async (req, res) => {
  try {
    const [
      totalPaiements,
      avocatCount,
      autresIntervenantCount,
      emissionTitreCount,
      conventionJointeCount,
      montantData
    ] = await Promise.all([
      prisma.paiement.count(),
      prisma.paiement.count({ where: { qualiteBeneficiaire: 'Avocat' } }),
      prisma.paiement.count({ where: { qualiteBeneficiaire: { not: 'Avocat' } } }),
      prisma.paiement.count({ where: { emissionTitrePerception: 'OUI' } }),
      prisma.paiement.count({ where: { conventionJointeFRI: 'OUI' } }),
      prisma.paiement.aggregate({
        _sum: {
          montantTTC: true
        }
      })
    ]);

    res.json({
      totalPaiements,
      avocatCount,
      autresIntervenantCount,
      emissionTitreCount,
      conventionJointeCount,
      totalMontantTTC: montantData._sum.montantTTC || 0
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// GET /paiements/:id - Récupération d'un paiement spécifique
const getPaiementById = async (req, res) => {
  try {
    const paiement = await prisma.paiement.findUnique({
      where: { id: req.params.id },
      include: {
        dossier: {
          select: {
            id: true,
            numero: true,
            nomDossier: true
          }
        },
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
                numero: true,
                dateSignature: true
              }
            }
          }
        }
      }
    });

    if (!paiement) {
      return res.status(404).json({ error: 'Paiement non trouvé' });
    }

    res.json(paiement);
  } catch (error) {
    console.error('Get paiement error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// POST /paiements - Création d'un paiement
const createPaiement = async (req, res) => {
  try {
    const validatedData = createPaiementSchema.parse(req.body);
    const {
      facture,
      montantTTC,
      emissionTitrePerception,
      qualiteBeneficiaire,
      identiteBeneficiaire,
      dateServiceFait,
      conventionJointeFRI,
      adresseBeneficiaire,
      siretOuRidet,
      titulaireCompteBancaire,
      codeEtablissement,
      codeGuichet,
      numeroCompte,
      cleRIB,
      ficheReglement,
      dossierId,
      sgamiId,
      avocatId,
      pceId,
      decisions = []
    } = validatedData;

    // Vérifications d'existence
    const dossierExistant = await prisma.dossier.findUnique({
      where: { id: dossierId }
    });

    if (!dossierExistant) {
      return res.status(404).json({ error: 'Dossier non trouvé' });
    }

    const sgamiExistant = await prisma.sgami.findUnique({
      where: { id: sgamiId }
    });

    if (!sgamiExistant) {
      return res.status(404).json({ error: 'SGAMI non trouvé' });
    }

    if (avocatId) {
      const avocatExistant = await prisma.avocat.findUnique({
        where: { id: avocatId, active: true }
      });

      if (!avocatExistant) {
        return res.status(404).json({ error: 'Avocat non trouvé ou inactif' });
      }
    }

    const pceExistant = await prisma.pce.findUnique({
      where: { id: pceId }
    });

    if (!pceExistant) {
      return res.status(404).json({ error: 'PCE non trouvé' });
    }

    const paiement = await prisma.$transaction(async (tx) => {
      const lastPaiement = await tx.paiement.findFirst({
        select: { numero: true },
        orderBy: { numero: 'desc' }
      });

      const nextNumber = (lastPaiement?.numero || 0) + 1;

      return await tx.paiement.create({
        data: {
          numero: nextNumber,
          facture,
          montantTTC,
          emissionTitrePerception,
          qualiteBeneficiaire,
          identiteBeneficiaire,
          dateServiceFait: dateServiceFait ? new Date(dateServiceFait) : null,
          conventionJointeFRI,
          adresseBeneficiaire,
          siretOuRidet,
          titulaireCompteBancaire,
          codeEtablissement,
          codeGuichet,
          numeroCompte,
          cleRIB,
          ficheReglement,
          dossierId,
          sgamiId,
          avocatId,
          pceId,
          creeParId: req.user.id,
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
            select: { id: true, numero: true, nomDossier: true }
          },
          sgami: {
            select: { id: true, nom: true, intituleFicheReglement: true }
          },
          avocat: {
            select: { id: true, nom: true, prenom: true, region: true }
          },
          pce: {
            select: { id: true, ordre: true, pceDetaille: true, pceNumerique: true, codeMarchandise: true }
          },
          creePar: {
            select: { id: true, nom: true, prenom: true, grade: true }
          },
          decisions: {
            include: {
              decision: {
                select: {
                  id: true,
                  type: true,
                  numero: true,
                  dateSignature: true
                }
              }
            }
          }
        }
      });
    });

    await logAction(
      req.user.id,
      'CREATE_PAIEMENT',
      `Création du paiement ${paiement.numero}`,
      'Paiement',
      paiement.id
    );

    res.status(201).json(paiement);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Create paiement error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// PUT /paiements/:id - Modification d'un paiement
const updatePaiement = async (req, res) => {
  try {
    const validatedData = updatePaiementSchema.parse(req.body);
    const {
      facture,
      montantTTC,
      emissionTitrePerception,
      qualiteBeneficiaire,
      identiteBeneficiaire,
      dateServiceFait,
      conventionJointeFRI,
      adresseBeneficiaire,
      siretOuRidet,
      titulaireCompteBancaire,
      codeEtablissement,
      codeGuichet,
      numeroCompte,
      cleRIB,
      ficheReglement,
      sgamiId,
      avocatId,
      pceId,
      decisions = []
    } = validatedData;

    const existingPaiement = await prisma.paiement.findUnique({
      where: { id: req.params.id },
      include: { decisions: true }
    });

    if (!existingPaiement) {
      return res.status(404).json({ error: 'Paiement non trouvé' });
    }

    // Vérifications d'existence
    if (sgamiId) {
      const sgamiExistant = await prisma.sgami.findUnique({
        where: { id: sgamiId }
      });

      if (!sgamiExistant) {
        return res.status(404).json({ error: 'SGAMI non trouvé' });
      }
    }

    if (avocatId) {
      const avocatExistant = await prisma.avocat.findUnique({
        where: { id: avocatId, active: true }
      });

      if (!avocatExistant) {
        return res.status(404).json({ error: 'Avocat non trouvé ou inactif' });
      }
    }

    if (pceId) {
      const pceExistant = await prisma.pce.findUnique({
        where: { id: pceId }
      });

      if (!pceExistant) {
        return res.status(404).json({ error: 'PCE non trouvé' });
      }
    }

    // Supprimer les anciennes relations
    await prisma.paiementDecision.deleteMany({
      where: { paiementId: req.params.id }
    });

    const updateData = {};

    if (facture !== undefined) updateData.facture = facture;
    if (montantTTC !== undefined) updateData.montantTTC = montantTTC;
    if (emissionTitrePerception !== undefined) updateData.emissionTitrePerception = emissionTitrePerception;
    if (qualiteBeneficiaire !== undefined) updateData.qualiteBeneficiaire = qualiteBeneficiaire;
    if (identiteBeneficiaire !== undefined) updateData.identiteBeneficiaire = identiteBeneficiaire;
    if (dateServiceFait !== undefined) {
      updateData.dateServiceFait = dateServiceFait ? new Date(dateServiceFait) : null;
    }
    if (conventionJointeFRI !== undefined) updateData.conventionJointeFRI = conventionJointeFRI;
    if (adresseBeneficiaire !== undefined) updateData.adresseBeneficiaire = adresseBeneficiaire;
    if (siretOuRidet !== undefined) updateData.siretOuRidet = siretOuRidet;
    if (titulaireCompteBancaire !== undefined) updateData.titulaireCompteBancaire = titulaireCompteBancaire;
    if (codeEtablissement !== undefined) updateData.codeEtablissement = codeEtablissement;
    if (codeGuichet !== undefined) updateData.codeGuichet = codeGuichet;
    if (numeroCompte !== undefined) updateData.numeroCompte = numeroCompte;
    if (cleRIB !== undefined) updateData.cleRIB = cleRIB;
    if (ficheReglement !== undefined) updateData.ficheReglement = ficheReglement;
    if (sgamiId !== undefined) updateData.sgamiId = sgamiId;
    if (avocatId !== undefined) updateData.avocatId = avocatId;
    if (pceId !== undefined) updateData.pceId = pceId;

    if (decisions && decisions.length > 0) {
      updateData.decisions = {
        create: decisions.map(decisionId => ({
          decisionId
        }))
      };
    }

    const paiement = await prisma.paiement.update({
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
                numero: true,
                dateSignature: true
              }
            }
          }
        }
      }
    });

    await logAction(
      req.user.id,
      'UPDATE_PAIEMENT',
      `Modification du paiement ${paiement.numero}`,
      'Paiement',
      paiement.id
    );

    res.json(paiement);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Update paiement error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// DELETE /paiements/:id - Suppression d'un paiement
const deletePaiement = async (req, res) => {
  try {
    const existingPaiement = await prisma.paiement.findUnique({
      where: { id: req.params.id },
      include: { decisions: true }
    });

    if (!existingPaiement) {
      return res.status(404).json({ error: 'Paiement non trouvé' });
    }

    await prisma.paiementDecision.deleteMany({
      where: { paiementId: req.params.id }
    });

    await prisma.paiement.delete({
      where: { id: req.params.id }
    });

    await logAction(
      req.user.id,
      'DELETE_PAIEMENT',
      `Suppression du paiement ${existingPaiement.numero}`,
      'Paiement',
      req.params.id
    );

    res.json({ message: 'Paiement supprimé avec succès' });
  } catch (error) {
    console.error('Delete paiement error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

module.exports = {
  getAllPaiements,
  getFacets,
  getStats,
  getPaiementById,
  createPaiement,
  updatePaiement,
  deletePaiement
};
