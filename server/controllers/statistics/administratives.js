const { PrismaClient } = require('@prisma/client');
const { getISOWeekWithDates, getWeekKey, getYearRange } = require('../../utils/statistics/dateUtils');
const { sumByProperty, calculateTotalsWithExtraInfo } = require('../../utils/statistics/calculUtils');

const prisma = new PrismaClient();

const getStatistiquesAdministratives = async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();

    // Dates de début et fin d'année
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year + 1, 0, 1);

    // 1. Statistiques générales
    // Nombre de demandes reçues depuis le début de l'année
    const demandesTotal = await prisma.demande.count({
      where: {
        dateReception: {
          gte: startOfYear,
          lt: endOfYear
        }
      }
    });

    // Nombre de demandes traitées (avec au moins une décision signée)
    const demandesTraitees = await prisma.demande.count({
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
      }
    });

    // Nombre de demandes en instance (sans décision signée et assignées à un utilisateur)
    const demandesEnInstance = await prisma.demande.count({
      where: {
        dateReception: {
          gte: startOfYear,
          lt: endOfYear
        },
        assigneAId: {
          not: null
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
      }
    });

    // Nombre de demandes non affectées (sans assigneAId)
    const demandesNonAffectees = await prisma.demande.count({
      where: {
        dateReception: {
          gte: startOfYear,
          lt: endOfYear
        },
        assigneAId: null
      }
    });

    // 2. Récupérer tous les utilisateurs avec leurs statistiques
    const users = await prisma.user.findMany({
      where: {
        active: true,
        role: {
          in: ['ADMIN', 'GREFFIER', 'REDACTEUR']
        }
      },
      select: {
        id: true,
        nom: true,
        prenom: true,
        role: true,
        grade: true
      },
      orderBy: [
        { role: 'asc' },
        { nom: 'asc' }
      ]
    });

    // 3. Calculer les statistiques pour chaque utilisateur
    const utilisateursStats = await Promise.all(users.map(async (user) => {
      // Nombre de demandes attribuées
      const demandesAttribuees = await prisma.demande.count({
        where: {
          assigneAId: user.id,
          dateReception: {
            gte: startOfYear,
            lt: endOfYear
          }
        }
      });

      // Ne retourner que les utilisateurs ayant au moins une demande attribuée
      if (demandesAttribuees === 0) {
        return null;
      }

      // Nombre de demandes propres (sans BAP lié)
      const demandesPropres = await prisma.demande.count({
        where: {
          assigneAId: user.id,
          dateReception: {
            gte: startOfYear,
            lt: endOfYear
          },
          baps: {
            none: {}
          }
        }
      });

      // Nombre de demandes BAP (avec BAP lié)
      const demandesBAP = await prisma.demande.count({
        where: {
          assigneAId: user.id,
          dateReception: {
            gte: startOfYear,
            lt: endOfYear
          },
          baps: {
            some: {}
          }
        }
      });

      // Statistiques des décisions par type pour les demandes assignées à cet utilisateur
      // Compte le nombre de liens DecisionDemande, pas le nombre de décisions
      // Une décision liée à 2 demandes compte comme 2
      const decisionsWithDemandes = await prisma.decisionDemande.findMany({
        where: {
          demande: {
            assigneAId: user.id
          },
          decision: {
            dateSignature: {
              gte: startOfYear,
              lt: endOfYear,
              not: null
            }
          }
        },
        include: {
          decision: {
            select: {
              type: true
            }
          }
        }
      });

      // Compter par type de décision
      const decisionTypeCounts = {
        PJ: 0,
        AJE: 0,
        AJ: 0,
        REJET: 0
      };

      decisionsWithDemandes.forEach(dd => {
        const type = dd.decision.type;
        if (decisionTypeCounts.hasOwnProperty(type)) {
          decisionTypeCounts[type]++;
        }
      });

      // Les décisions sont déjà comptées correctement dans decisionTypeCounts
      const decisionsRepartition = decisionTypeCounts;

      // Passage AJE vers PJ (demandes avec une décision AJE signée cette année ET une décision PJ signée cette année)
      const passageAJEversPJ = await prisma.demande.count({
        where: {
          assigneAId: user.id,
          decisions: {
            some: {
              decision: {
                type: 'AJE',
                dateSignature: {
                  gte: startOfYear,
                  lt: endOfYear,
                  not: null
                }
              }
            }
          },
          AND: {
            decisions: {
              some: {
                decision: {
                  type: 'PJ',
                  dateSignature: {
                    gte: startOfYear,
                    lt: endOfYear,
                    not: null
                  }
                }
              }
            }
          }
        }
      });

      // En cours (demandes reçues cette année sans décisions signées)
      const enCours = await prisma.demande.count({
        where: {
          assigneAId: user.id,
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
        }
      });

      // En cours propre (pareil mais sans BAP et sans décisions signées)
      const enCoursPropre = await prisma.demande.count({
        where: {
          assigneAId: user.id,
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
        }
      });

      // En cours BAP (pareil mais avec un BAP et sans décisions signées)
      const enCoursBAP = await prisma.demande.count({
        where: {
          assigneAId: user.id,
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
        }
      });

      return {
        id: user.id,
        nom: user.nom,
        prenom: user.prenom,
        role: user.role,
        grade: user.grade,
        demandesAttribuees,
        demandesPropres,
        demandesBAP,
        decisionsRepartition,
        passageAJEversPJ,
        enCours,
        enCoursPropre,
        enCoursBAP
      };
    }));

    // Filtrer les utilisateurs null (ceux sans demandes attribuées)
    const utilisateursFiltres = utilisateursStats.filter(user => user !== null);

    res.json({
      generales: {
        demandesTotal,
        demandesTraitees,
        demandesEnInstance,
        demandesNonAffectees
      },
      utilisateurs: utilisateursFiltres
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques administratives:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération des statistiques administratives'
    });
  }
};

const getStatistiquesQualiteDemandeur = async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();

    // Dates de début et fin d'année
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year + 1, 0, 1);

    // Compter les demandes par type (VICTIME / MIS_EN_CAUSE)
    const statsVictime = await prisma.demande.count({
      where: {
        dateReception: {
          gte: startOfYear,
          lt: endOfYear
        },
        type: 'VICTIME'
      }
    });

    const statsMisEnCause = await prisma.demande.count({
      where: {
        dateReception: {
          gte: startOfYear,
          lt: endOfYear
        },
        type: 'MIS_EN_CAUSE'
      }
    });

    const total = statsVictime + statsMisEnCause;

    // Calculer les pourcentages
    const pourcentageVictime = total > 0 ? (statsVictime / total) * 100 : 0;
    const pourcentageMisEnCause = total > 0 ? (statsMisEnCause / total) * 100 : 0;

    const statistiques = [
      {
        qualite: 'VICTIME',
        nombreDemandes: statsVictime,
        pourcentage: pourcentageVictime
      },
      {
        qualite: 'MIS_EN_CAUSE',
        nombreDemandes: statsMisEnCause,
        pourcentage: pourcentageMisEnCause
      }
    ];

    res.json(statistiques);

  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques qualité demandeur:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération des statistiques qualité demandeur'
    });
  }
};

const getStatistiquesTypeInfraction = async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();

    // Dates de début et fin d'année
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year + 1, 0, 1);

    // Récupérer toutes les demandes avec leurs qualifications d'infraction
    const demandes = await prisma.demande.findMany({
      where: {
        dateReception: {
          gte: startOfYear,
          lt: endOfYear
        }
      },
      select: {
        qualificationInfraction: true
      }
    });

    // Compter les occurrences de chaque qualification
    const compteurs = {};
    let total = 0;

    demandes.forEach(demande => {
      const qualification = demande.qualificationInfraction || 'Non renseigné';
      compteurs[qualification] = (compteurs[qualification] || 0) + 1;
      total++;
    });

    // Convertir en tableau avec pourcentages et trier par nombre de demandes décroissant
    const statistiques = Object.entries(compteurs)
      .map(([qualification, nombre]) => ({
        qualificationInfraction: qualification,
        nombreDemandes: nombre,
        pourcentage: total > 0 ? (nombre / total) * 100 : 0
      }))
      .sort((a, b) => b.nombreDemandes - a.nombreDemandes);

    res.json(statistiques);

  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques type infraction:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération des statistiques type infraction'
    });
  }
};

const getStatistiquesContexteMissionnel = async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();

    // Dates de début et fin d'année
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year + 1, 0, 1);

    // Récupérer toutes les demandes avec leur contexte missionnel
    const demandes = await prisma.demande.findMany({
      where: {
        dateReception: {
          gte: startOfYear,
          lt: endOfYear
        }
      },
      select: {
        contexteMissionnel: true
      }
    });

    // Compter les occurrences de chaque contexte
    const compteurs = {};
    let total = 0;

    demandes.forEach(demande => {
      const contexte = demande.contexteMissionnel || 'Non renseigné';
      compteurs[contexte] = (compteurs[contexte] || 0) + 1;
      total++;
    });

    // Convertir en tableau avec pourcentages et trier par nombre de demandes décroissant
    const statistiques = Object.entries(compteurs)
      .map(([contexte, nombre]) => ({
        contexteMissionnel: contexte,
        nombreDemandes: nombre,
        pourcentage: total > 0 ? (nombre / total) * 100 : 0
      }))
      .sort((a, b) => b.nombreDemandes - a.nombreDemandes);

    res.json(statistiques);

  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques contexte missionnel:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération des statistiques contexte missionnel'
    });
  }
};

const getStatistiquesFormationAdministrative = async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();

    // Dates de début et fin d'année
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year + 1, 0, 1);

    // Récupérer toutes les demandes avec leur formation administrative
    const demandes = await prisma.demande.findMany({
      where: {
        dateReception: {
          gte: startOfYear,
          lt: endOfYear
        }
      },
      select: {
        formationAdministrative: true
      }
    });

    // Compter les occurrences de chaque formation
    const compteurs = {};
    let total = 0;

    demandes.forEach(demande => {
      const formation = demande.formationAdministrative || 'Non renseigné';
      compteurs[formation] = (compteurs[formation] || 0) + 1;
      total++;
    });

    // Convertir en tableau avec pourcentages et trier par nombre de demandes décroissant
    const statistiques = Object.entries(compteurs)
      .map(([formation, nombre]) => ({
        formationAdministrative: formation,
        nombreDemandes: nombre,
        pourcentage: total > 0 ? (nombre / total) * 100 : 0
      }))
      .sort((a, b) => b.nombreDemandes - a.nombreDemandes);

    res.json(statistiques);

  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques formation administrative:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération des statistiques formation administrative'
    });
  }
};

const getStatistiquesBranche = async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();

    // Dates de début et fin d'année
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year + 1, 0, 1);

    // Récupérer toutes les demandes avec leur branche
    const demandes = await prisma.demande.findMany({
      where: {
        dateReception: {
          gte: startOfYear,
          lt: endOfYear
        }
      },
      select: {
        branche: true
      }
    });

    // Compter les occurrences de chaque branche
    const compteurs = {};
    let total = 0;

    demandes.forEach(demande => {
      const branche = demande.branche || 'Non renseigné';
      compteurs[branche] = (compteurs[branche] || 0) + 1;
      total++;
    });

    // Convertir en tableau avec pourcentages et trier par nombre de demandes décroissant
    const statistiques = Object.entries(compteurs)
      .map(([branche, nombre]) => ({
        branche: branche,
        nombreDemandes: nombre,
        pourcentage: total > 0 ? (nombre / total) * 100 : 0
      }))
      .sort((a, b) => b.nombreDemandes - a.nombreDemandes);

    res.json(statistiques);

  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques branche:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération des statistiques branche'
    });
  }
};

const getStatistiquesStatutDemandeur = async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();

    // Dates de début et fin d'année
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year + 1, 0, 1);

    // Récupérer toutes les demandes avec leur statutDemandeur
    const demandes = await prisma.demande.findMany({
      where: {
        dateReception: {
          gte: startOfYear,
          lt: endOfYear
        }
      },
      select: {
        statutDemandeur: true
      }
    });

    // Compter les occurrences de chaque statut demandeur
    const statutCounts = {};
    const totalDemandes = demandes.length;

    demandes.forEach(demande => {
      const statut = demande.statutDemandeur || 'Non renseigné';
      statutCounts[statut] = (statutCounts[statut] || 0) + 1;
    });

    // Convertir en format attendu avec pourcentages
    const statistiques = Object.entries(statutCounts).map(([statutDemandeur, nombreDemandes]) => ({
      statutDemandeur,
      nombreDemandes,
      pourcentage: totalDemandes > 0 ? (nombreDemandes / totalDemandes) * 100 : 0
    }));

    // Trier par nombre de demandes décroissant
    statistiques.sort((a, b) => b.nombreDemandes - a.nombreDemandes);

    res.json(statistiques);
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques statut demandeur:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération des statistiques statut demandeur'
    });
  }
};

const getStatistiquesBadges = async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();

    // Dates de début et fin d'année
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year + 1, 0, 1);

    // Récupérer le nombre total de demandes pour l'année (pour calculer les pourcentages)
    const totalDemandes = await prisma.demande.count({
      where: {
        dateReception: {
          gte: startOfYear,
          lt: endOfYear
        }
      }
    });

    // Récupérer tous les badges avec leurs statistiques
    const statsBadges = await prisma.badge.findMany({
      select: {
        id: true,
        nom: true,
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
        nom: 'asc'
      }
    });

    // Formater les résultats, filtrer ceux avec au moins une demande et trier par nombre de demandes décroissant
    const statistiques = statsBadges
      .filter(badge => badge._count.demandes > 0)
      .map(badge => ({
        badge: badge.nom,
        nombreDemandes: badge._count.demandes,
        pourcentage: totalDemandes > 0 ? (badge._count.demandes / totalDemandes) * 100 : 0
      }))
      .sort((a, b) => b.nombreDemandes - a.nombreDemandes);

    res.json(statistiques);

  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques des badges:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération des statistiques des badges'
    });
  }
};

module.exports = {
  getStatistiquesAdministratives,
  getStatistiquesQualiteDemandeur,
  getStatistiquesTypeInfraction,
  getStatistiquesContexteMissionnel,
  getStatistiquesFormationAdministrative,
  getStatistiquesBranche,
  getStatistiquesStatutDemandeur,
  getStatistiquesBadges
};