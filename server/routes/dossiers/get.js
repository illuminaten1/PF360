const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { logAction } = require('../../utils/logger');

const router = express.Router();
const prisma = new PrismaClient();

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
                region: true,
                email: true
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
                prenom: true,
                grade: true
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

module.exports = router;