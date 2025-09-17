const { PrismaClient } = require('@prisma/client');
const { getISOWeekWithDates, getWeekKey, getYearRange } = require('../../utils/statistics/dateUtils');
const { sumByProperty, calculateTotalsWithExtraInfo } = require('../../utils/statistics/calculUtils');

const prisma = new PrismaClient();

const getStatistiquesBAP = async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();

    // Dates de début et fin d'année
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year + 1, 0, 1);

    // Récupérer tous les BAP avec le nombre de demandes associées pour l'année
    const statsBAP = await prisma.bAP.findMany({
      select: {
        id: true,
        nomBAP: true,
        _count: {
          select: {
            demandes: {
              where: {
                demande: {
                  dateReception: {
                    gte: startOfYear,
                    lt: endOfYear
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        nomBAP: 'asc'
      }
    });

    // Formater les résultats, filtrer ceux avec au moins une demande et trier par nombre de demandes décroissant
    const statistiques = statsBAP
      .filter(bap => bap._count.demandes > 0)
      .map(bap => ({
        nomBAP: bap.nomBAP,
        nombreDemandes: bap._count.demandes
      }))
      .sort((a, b) => b.nombreDemandes - a.nombreDemandes);

    res.json(statistiques);

  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques BAP:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération des statistiques BAP'
    });
  }
};

const getAutoControle = async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();

    // Dates de début et fin d'année
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year + 1, 0, 1);
    const now = new Date();

    // 1. PJ en attente de convention (demandes de l'année sélectionnée visées par une décision PJ mais pas par une convention)
    const demandesAvecPJ = await prisma.demande.findMany({
      where: {
        dateReception: {
          gte: startOfYear,
          lt: endOfYear
        },
        decisions: {
          some: {
            decision: {
              type: 'PJ',
              dateSignature: {
                not: null
              }
            }
          }
        }
      },
      select: {
        id: true
      }
    });

    const demandesAvecConvention = await prisma.demande.findMany({
      where: {
        dateReception: {
          gte: startOfYear,
          lt: endOfYear
        },
        conventions: {
          some: {}
        }
      },
      select: {
        id: true
      }
    });

    const demandeIdsAvecPJ = new Set(demandesAvecPJ.map(d => d.id));
    const demandeIdsAvecConvention = new Set(demandesAvecConvention.map(d => d.id));

    const pjEnAttenteConvention = [...demandeIdsAvecPJ].filter(id => !demandeIdsAvecConvention.has(id)).length;

    // 2. Ancienneté moyenne des demandes non traitées (en jours)
    // Une demande est considérée comme non traitée si elle n'a aucune décision signée
    const demandesNonTraitees = await prisma.demande.findMany({
      where: {
        dateReception: {
          gte: startOfYear,
          lt: endOfYear
        },
        decisions: {
          none: {
            decision: {
              dateSignature: {
                not: null
              }
            }
          }
        }
      },
      select: {
        dateReception: true
      }
    });

    let ancienneteMoyenneNonTraites = 0;
    if (demandesNonTraitees.length > 0) {
      const totalJours = demandesNonTraitees.reduce((sum, demande) => {
        const diffTime = now.getTime() - demande.dateReception.getTime();
        const diffJours = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        return sum + diffJours;
      }, 0);
      ancienneteMoyenneNonTraites = totalJours / demandesNonTraitees.length;
    }

    // 3. Ancienneté moyenne des demandes BAP non traitées (demandes assignées à un BAP)
    // Une demande BAP est considérée comme non traitée si elle n'a aucune décision signée
    const demandesNonTraiteesBAP = await prisma.demande.findMany({
      where: {
        dateReception: {
          gte: startOfYear,
          lt: endOfYear
        },
        decisions: {
          none: {
            decision: {
              dateSignature: {
                not: null
              }
            }
          }
        },
        baps: {
          some: {}
        }
      },
      select: {
        dateReception: true
      }
    });

    let ancienneteMoyenneBAP = 0;
    if (demandesNonTraiteesBAP.length > 0) {
      const totalJours = demandesNonTraiteesBAP.reduce((sum, demande) => {
        const diffTime = now.getTime() - demande.dateReception.getTime();
        const diffJours = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        return sum + diffJours;
      }, 0);
      ancienneteMoyenneBAP = totalJours / demandesNonTraiteesBAP.length;
    }

    // 4. Ancienneté moyenne des demandes BRPF non traitées (demandes non assignées à un BAP)
    // Une demande BRPF est considérée comme non traitée si elle n'a aucune décision signée
    const demandesNonTraiteesBRPF = await prisma.demande.findMany({
      where: {
        dateReception: {
          gte: startOfYear,
          lt: endOfYear
        },
        decisions: {
          none: {
            decision: {
              dateSignature: {
                not: null
              }
            }
          }
        },
        baps: {
          none: {}
        }
      },
      select: {
        dateReception: true
      }
    });

    let ancienneteMoyenneBRPF = 0;
    if (demandesNonTraiteesBRPF.length > 0) {
      const totalJours = demandesNonTraiteesBRPF.reduce((sum, demande) => {
        const diffTime = now.getTime() - demande.dateReception.getTime();
        const diffJours = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        return sum + diffJours;
      }, 0);
      ancienneteMoyenneBRPF = totalJours / demandesNonTraiteesBRPF.length;
    }

    // 5. Délai de traitement moyen pour toutes les demandes traitées (en jours)
    // Nous devons récupérer la première décision signée pour chaque demande (y compris les REJET)
    const demandesAvecPremiereDecision = await prisma.demande.findMany({
      where: {
        dateReception: {
          gte: startOfYear,
          lt: endOfYear
        },
        decisions: {
          some: {
            decision: {
              dateSignature: {
                not: null
              }
            }
          }
        }
      },
      select: {
        id: true,
        dateReception: true,
        decisions: {
          where: {
            decision: {
              dateSignature: {
                not: null
              }
            }
          },
          select: {
            decision: {
              select: {
                dateSignature: true
              }
            }
          },
          orderBy: {
            decision: {
              dateSignature: 'asc'
            }
          }
        }
      }
    });

    let delaiTraitementMoyen = 0;
    let nombreDemandesAvecDelaiValide = 0;

    if (demandesAvecPremiereDecision.length > 0) {
      const totalJours = demandesAvecPremiereDecision.reduce((sum, demande) => {
        if (demande.decisions.length > 0 && demande.decisions[0].decision.dateSignature) {
          const diffTime = demande.decisions[0].decision.dateSignature.getTime() - demande.dateReception.getTime();
          const diffJours = Math.floor(diffTime / (1000 * 60 * 60 * 24));

          // Ne prendre en compte que les délais positifs (décision après réception)
          if (diffJours >= 0) {
            nombreDemandesAvecDelaiValide++;
            return sum + diffJours;
          }
        }
        return sum;
      }, 0);

      if (nombreDemandesAvecDelaiValide > 0) {
        delaiTraitementMoyen = totalJours / nombreDemandesAvecDelaiValide;
      }
    }

    // 6. Délai de traitement moyen pour les demandes BAP (demandes assignées à un BAP avec décision signée)
    const demandesAvecPremiereDecisionBAP = await prisma.demande.findMany({
      where: {
        dateReception: {
          gte: startOfYear,
          lt: endOfYear
        },
        decisions: {
          some: {
            decision: {
              dateSignature: {
                not: null
              }
            }
          }
        },
        baps: {
          some: {}
        }
      },
      select: {
        id: true,
        dateReception: true,
        decisions: {
          where: {
            decision: {
              dateSignature: {
                not: null
              }
            }
          },
          select: {
            decision: {
              select: {
                dateSignature: true
              }
            }
          },
          orderBy: {
            decision: {
              dateSignature: 'asc'
            }
          }
        }
      }
    });

    let delaiTraitementBAP = 0;
    let nombreDemandesBAP = 0;

    if (demandesAvecPremiereDecisionBAP.length > 0) {
      const totalJours = demandesAvecPremiereDecisionBAP.reduce((sum, demande) => {
        if (demande.decisions.length > 0 && demande.decisions[0].decision.dateSignature) {
          const diffTime = demande.decisions[0].decision.dateSignature.getTime() - demande.dateReception.getTime();
          const diffJours = Math.floor(diffTime / (1000 * 60 * 60 * 24));

          // Ne prendre en compte que les délais positifs
          if (diffJours >= 0) {
            nombreDemandesBAP++;
            return sum + diffJours;
          }
        }
        return sum;
      }, 0);

      if (nombreDemandesBAP > 0) {
        delaiTraitementBAP = totalJours / nombreDemandesBAP;
      }
    }

    // 7. Délai de traitement moyen pour les demandes BRPF (demandes non assignées à un BAP avec décision signée)
    const demandesAvecPremiereDecisionBRPF = await prisma.demande.findMany({
      where: {
        dateReception: {
          gte: startOfYear,
          lt: endOfYear
        },
        decisions: {
          some: {
            decision: {
              dateSignature: {
                not: null
              }
            }
          }
        },
        baps: {
          none: {}
        }
      },
      select: {
        id: true,
        dateReception: true,
        decisions: {
          where: {
            decision: {
              dateSignature: {
                not: null
              }
            }
          },
          select: {
            decision: {
              select: {
                dateSignature: true
              }
            }
          },
          orderBy: {
            decision: {
              dateSignature: 'asc'
            }
          }
        }
      }
    });

    let delaiTraitementBRPF = 0;
    let nombreDemandesBRPF = 0;

    if (demandesAvecPremiereDecisionBRPF.length > 0) {
      const totalJours = demandesAvecPremiereDecisionBRPF.reduce((sum, demande) => {
        if (demande.decisions.length > 0 && demande.decisions[0].decision.dateSignature) {
          const diffTime = demande.decisions[0].decision.dateSignature.getTime() - demande.dateReception.getTime();
          const diffJours = Math.floor(diffTime / (1000 * 60 * 60 * 24));

          // Ne prendre en compte que les délais positifs
          if (diffJours >= 0) {
            nombreDemandesBRPF++;
            return sum + diffJours;
          }
        }
        return sum;
      }, 0);

      if (nombreDemandesBRPF > 0) {
        delaiTraitementBRPF = totalJours / nombreDemandesBRPF;
      }
    }

    res.json({
      pjEnAttenteConvention,
      ancienneteMoyenneNonTraites: Math.round(ancienneteMoyenneNonTraites * 100) / 100,
      ancienneteMoyenneBAP: Math.round(ancienneteMoyenneBAP * 100) / 100,
      ancienneteMoyenneBRP: Math.round(ancienneteMoyenneBRPF * 100) / 100,
      delaiTraitementMoyen: Math.round(delaiTraitementMoyen * 100) / 100,
      delaiTraitementBAP: Math.round(delaiTraitementBAP * 100) / 100,
      delaiTraitementBRP: Math.round(delaiTraitementBRPF * 100) / 100
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques auto-contrôle:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération des statistiques auto-contrôle'
    });
  }
};

const getExtractionMensuelle = async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();

    // Dates de début et fin d'année
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year + 1, 0, 1);

    // Récupérer toutes les demandes de type VICTIME pour l'année avec les champs nécessaires
    const demandes = await prisma.demande.findMany({
      where: {
        type: 'VICTIME',
        dateReception: {
          gte: startOfYear,
          lt: endOfYear
        }
      },
      select: {
        dateReception: true,
        statutDemandeur: true,
        qualificationInfraction: true
      }
    });

    // Initialiser le tableau des données par mois
    const donneesParMois = [];
    const noms_mois = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];

    // Variables pour calculer les cumuls
    let cumulDdeVictime = 0;
    let cumulVictimeReservistes = 0;
    let cumulViolences = 0;
    let cumulViolencesReservistes = 0;

    // Variables pour les moyennes
    let totalDdesPfVictime = 0;
    let totalReservistes = 0;
    let totalViolences = 0;
    let totalViolencesReservistes = 0;
    let moisAvecDonnees = 0;

    for (let mois = 0; mois < 12; mois++) {
      const debutMois = new Date(year, mois, 1);
      const finMois = new Date(year, mois + 1, 1);

      // Filtrer les demandes pour ce mois
      const demandesMois = demandes.filter(demande =>
        demande.dateReception >= debutMois && demande.dateReception < finMois
      );

      // Compter les demandes victimes toutes infractions
      const ddesDePfVictimeToutes = demandesMois.length;

      // Compter les réservistes parmi les victimes
      const reservistesVictimes = demandesMois.filter(demande =>
        demande.statutDemandeur === 'Réserviste'
      ).length;

      // Compter les demandes pour violences (hors rébellion)
      const ddesPourViolences = demandesMois.filter(demande =>
        demande.qualificationInfraction &&
        demande.qualificationInfraction.includes('VIOLENCES hors rébellion')
      ).length;

      // Compter les violences sur réservistes
      const violencesReservistes = demandesMois.filter(demande =>
        demande.statutDemandeur === 'Réserviste' &&
        demande.qualificationInfraction &&
        demande.qualificationInfraction.includes('VIOLENCES hors rébellion')
      ).length;

      // Mettre à jour les cumuls
      cumulDdeVictime += ddesDePfVictimeToutes;
      cumulVictimeReservistes += reservistesVictimes;
      cumulViolences += ddesPourViolences;
      cumulViolencesReservistes += violencesReservistes;

      // Accumuler pour les moyennes si il y a des données
      if (demandesMois.length > 0 || mois < new Date().getMonth()) {
        totalDdesPfVictime += ddesDePfVictimeToutes;
        totalReservistes += reservistesVictimes;
        totalViolences += ddesPourViolences;
        totalViolencesReservistes += violencesReservistes;
        moisAvecDonnees++;
      }

      donneesParMois.push({
        mois: noms_mois[mois],
        ddesDePfVictimeUniquementToutesInfractions: ddesDePfVictimeToutes,
        dontReservistes: reservistesVictimes,
        cumulDdeVictime: cumulDdeVictime,
        dontCumulVictimeReservistes: cumulVictimeReservistes,
        ddesDePfPourViolences: ddesPourViolences,
        dontDdesDePfPourViolencesSurReservistes: violencesReservistes,
        cumulViolences: cumulViolences,
        dontCumulViolencesReservistes: cumulViolencesReservistes
      });
    }

    // Calculer les moyennes
    const moyenneParMois = {
      ddesDePfVictimeUniquementToutesInfractions: moisAvecDonnees > 0 ? totalDdesPfVictime / moisAvecDonnees : 0,
      dontReservistes: moisAvecDonnees > 0 ? totalReservistes / moisAvecDonnees : 0,
      ddesDePfPourViolences: moisAvecDonnees > 0 ? totalViolences / moisAvecDonnees : 0,
      dontDdesDePfPourViolencesSurReservistes: moisAvecDonnees > 0 ? totalViolencesReservistes / moisAvecDonnees : 0
    };

    res.json({
      donneesParMois,
      moyenneParMois,
      annee: year
    });

  } catch (error) {
    console.error('Erreur lors de la récupération de l\'extraction mensuelle:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération de l\'extraction mensuelle'
    });
  }
};

const getStatistiquesReponseBRPF = async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();

    // Dates de début et fin d'année
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year + 1, 0, 1);

    // 1. Récupérer toutes les décisions signées de l'année (peu importe l'année de réception de la demande)
    const decisions = await prisma.decision.findMany({
      where: {
        dateSignature: {
          gte: startOfYear,
          lt: endOfYear,
          not: null
        }
      },
      select: {
        id: true,
        type: true,
        motifRejet: true,
        demandes: {
          select: {
            demandeId: true
          }
        }
      }
    });

    // 2. Compter par type de décision (en comptant les liens DecisionDemande)
    let countAJ = 0;
    let countAJE = 0;
    let countPJ = 0;
    let countREJET = 0;

    // Compter les motifs de rejet
    const motifsRejet = {
      'Atteinte involontaire autre qu\'accident': 0,
      'Accident de la circulation': 0,
      'Faute personnelle détachable du service': 0,
      'Fait étranger à la qualité de gendarme': 0,
      'Absence d\'infraction': 0
    };

    decisions.forEach(decision => {
      const nombreLiens = decision.demandes.length;

      switch (decision.type) {
        case 'AJ':
          countAJ += nombreLiens;
          break;
        case 'AJE':
          countAJE += nombreLiens;
          break;
        case 'PJ':
          countPJ += nombreLiens;
          break;
        case 'REJET':
          countREJET += nombreLiens;
          if (decision.motifRejet && motifsRejet.hasOwnProperty(decision.motifRejet)) {
            motifsRejet[decision.motifRejet] += nombreLiens;
          }
          break;
      }
    });

    // 3. Calculer l'agrément (AJ + AJE + PJ - sans réparation directe ni désistement)
    const agrement = countAJ + countAJE + countPJ;

    // 4. Calculer le nombre total de décisions (pour les pourcentages)
    const totalDecisions = agrement + countREJET;

    // 5. Formater les résultats
    const statistiques = [
      {
        libelle: 'AGRÉMENT',
        nombre: agrement,
        pourcentage: totalDecisions > 0 ? (agrement / totalDecisions) * 100 : 0,
        type: 'agrement'
      },
      {
        libelle: 'AJ',
        nombre: countAJ,
        pourcentage: totalDecisions > 0 ? (countAJ / totalDecisions) * 100 : 0,
        type: 'decision'
      },
      {
        libelle: 'AJE',
        nombre: countAJE,
        pourcentage: totalDecisions > 0 ? (countAJE / totalDecisions) * 100 : 0,
        type: 'decision'
      },
      {
        libelle: 'PJ',
        nombre: countPJ,
        pourcentage: totalDecisions > 0 ? (countPJ / totalDecisions) * 100 : 0,
        type: 'decision'
      },
      {
        libelle: 'REJET',
        nombre: countREJET,
        pourcentage: totalDecisions > 0 ? (countREJET / totalDecisions) * 100 : 0,
        type: 'rejet_global'
      }
    ];

    // Ajouter les motifs de rejet
    Object.entries(motifsRejet).forEach(([motif, nombre]) => {
      if (nombre > 0) {
        statistiques.push({
          libelle: motif,
          nombre: nombre,
          pourcentage: countREJET > 0 ? (nombre / countREJET) * 100 : 0,
          type: 'motif_rejet'
        });
      }
    });

    res.json({
      statistiques,
      totaux: {
        totalDecisions,
        agrement,
        rejet: countREJET
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques Réponse BRPF:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération des statistiques Réponse BRPF'
    });
  }
};

module.exports = {
  getStatistiquesBAP,
  getAutoControle,
  getExtractionMensuelle,
  getStatistiquesReponseBRPF
};