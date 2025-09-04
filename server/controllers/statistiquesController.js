const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();


const getRecentWeeklyStats = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    // Obtenir la date actuelle et calculer les limites
    const now = new Date();
    const currentYear = now.getFullYear();
    
    // Fonction pour obtenir le numéro de semaine ISO et les dates de début/fin
    const getISOWeekWithDates = (date) => {
      const target = new Date(date);
      
      // Trouver le jeudi de cette semaine (ISO week date)
      const dayOfWeek = target.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const thursday = new Date(target);
      thursday.setDate(target.getDate() - dayOfWeek + (dayOfWeek === 0 ? -3 : 4));
      
      // L'année ISO est l'année du jeudi de cette semaine
      const isoYear = thursday.getFullYear();
      
      // Trouver le premier jeudi de l'année ISO
      const jan4 = new Date(isoYear, 0, 4); // 4 janvier est toujours dans la semaine 1
      const jan4DayOfWeek = jan4.getDay();
      const firstThursday = new Date(jan4);
      firstThursday.setDate(jan4.getDate() - jan4DayOfWeek + (jan4DayOfWeek === 0 ? -3 : 4));
      
      // Calculer le numéro de semaine
      const weekNum = Math.floor((thursday.getTime() - firstThursday.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;
      
      // Calculer les dates de début (lundi) et fin (dimanche) de la semaine
      const mondayOfWeek = new Date(target);
      mondayOfWeek.setDate(target.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1));
      
      const sundayOfWeek = new Date(mondayOfWeek);
      sundayOfWeek.setDate(mondayOfWeek.getDate() + 6);
      
      return {
        weekNum,
        startDate: mondayOfWeek,
        endDate: sundayOfWeek,
        isoYear
      };
    };

    // Créer une structure pour stocker toutes les semaines (année + semaine)
    const allWeeklyStats = new Map();
    
    // Calculer une plage large pour couvrir plusieurs années
    // On va récupérer les données sur une plage suffisamment large
    const startDate = new Date(currentYear - 2, 0, 1); // 2 ans en arrière
    const endDate = new Date(currentYear + 1, 0, 1); // jusqu'à l'année prochaine
    
    // 1. Récupérer toutes les demandes entrantes
    const demandesEntrantes = await prisma.demande.findMany({
      where: {
        dateReception: {
          gte: startDate,
          lt: endDate
        }
      },
      select: {
        id: true,
        dateReception: true
      },
      orderBy: {
        dateReception: 'asc'
      }
    });

    // Grouper par année-semaine
    demandesEntrantes.forEach(demande => {
      const weekInfo = getISOWeekWithDates(demande.dateReception);
      const weekKey = `${weekInfo.isoYear}-${weekInfo.weekNum.toString().padStart(2, '0')}`;
      
      if (!allWeeklyStats.has(weekKey)) {
        allWeeklyStats.set(weekKey, {
          year: weekInfo.isoYear,
          semaine: weekInfo.weekNum,
          weekKey,
          startDate: weekInfo.startDate,
          endDate: weekInfo.endDate,
          entrantes: 0,
          sortantes: 0,
          stock: 0
        });
      }
      allWeeklyStats.get(weekKey).entrantes++;
    });

    // 2. Récupérer toutes les décisions et leurs premières dates de signature
    const decisions = await prisma.decision.findMany({
      where: {
        dateSignature: {
          gte: startDate,
          lt: endDate
        },
        NOT: {
          dateSignature: null
        }
      },
      select: {
        id: true,
        dateSignature: true,
        demandes: {
          select: {
            demandeId: true
          }
        }
      }
    });

    // Grouper par demande et trouver la première décision signée pour chaque demande
    const premiersDecisionsByDemande = new Map();
    
    decisions.forEach(decision => {
      decision.demandes.forEach(dd => {
        const currentFirst = premiersDecisionsByDemande.get(dd.demandeId);
        if (!currentFirst || decision.dateSignature < currentFirst) {
          premiersDecisionsByDemande.set(dd.demandeId, decision.dateSignature);
        }
      });
    });

    // Grouper les sorties par année-semaine
    Array.from(premiersDecisionsByDemande.entries()).forEach(([, date]) => {
      const weekInfo = getISOWeekWithDates(date);
      const weekKey = `${weekInfo.isoYear}-${weekInfo.weekNum.toString().padStart(2, '0')}`;
      
      if (!allWeeklyStats.has(weekKey)) {
        allWeeklyStats.set(weekKey, {
          year: weekInfo.isoYear,
          semaine: weekInfo.weekNum,
          weekKey,
          startDate: weekInfo.startDate,
          endDate: weekInfo.endDate,
          entrantes: 0,
          sortantes: 0,
          stock: 0
        });
      }
      allWeeklyStats.get(weekKey).sortantes++;
    });

    // 3. Convertir en tableau trié par weekKey (chronologique)
    const allWeeksArray = Array.from(allWeeklyStats.values())
      .sort((a, b) => a.weekKey.localeCompare(b.weekKey));
    
    // 4. Calculer le stock cumulé
    let stockCumule = 0;
    allWeeksArray.forEach(week => {
      stockCumule += (week.entrantes - week.sortantes);
      week.stock = stockCumule;
    });

    // 5. Prendre les N dernières semaines et les inverser pour avoir les plus récentes en premier
    const recentWeeks = allWeeksArray.slice(-limit).reverse();

    res.json({
      weeks: recentWeeks,
      totalWeeks: allWeeksArray.length
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques récentes:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération des statistiques récentes' 
    });
  }
};

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
    
    // Nombre de demandes traitées (avec au moins une décision liée)
    const demandesTraitees = await prisma.demande.count({
      where: {
        dateReception: {
          gte: startOfYear,
          lt: endOfYear
        },
        decisions: {
          some: {}
        }
      }
    });
    
    // Nombre de demandes en instance (sans décision liée)
    const demandesEnInstance = await prisma.demande.count({
      where: {
        dateReception: {
          gte: startOfYear,
          lt: endOfYear
        },
        decisions: {
          none: {}
        }
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
        role: true
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
      
      // En cours (demandes reçues cette année sans décisions)
      const enCours = await prisma.demande.count({
        where: {
          assigneAId: user.id,
          dateReception: {
            gte: startOfYear,
            lt: endOfYear
          },
          decisions: {
            none: {}
          }
        }
      });
      
      // En cours propre (pareil mais sans BAP)
      const enCoursPropre = await prisma.demande.count({
        where: {
          assigneAId: user.id,
          dateReception: {
            gte: startOfYear,
            lt: endOfYear
          },
          decisions: {
            none: {}
          },
          baps: {
            none: {}
          }
        }
      });
      
      // En cours BAP (pareil mais avec un BAP)
      const enCoursBAP = await prisma.demande.count({
        where: {
          assigneAId: user.id,
          dateReception: {
            gte: startOfYear,
            lt: endOfYear
          },
          decisions: {
            none: {}
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
    
    res.json({
      generales: {
        demandesTotal,
        demandesTraitees,
        demandesEnInstance
      },
      utilisateurs: utilisateursStats
    });
    
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques administratives:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération des statistiques administratives' 
    });
  }
};

const getFluxMensuels = async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const previousYear = year - 1;
    
    // Données pour les flux mensuels
    const fluxMensuels = [];
    const mois = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    
    for (let month = 0; month < 12; month++) {
      const startOfMonth = new Date(year, month, 1);
      const endOfMonth = new Date(year, month + 1, 1);
      
      // Entrants de l'année courante (demandes reçues ce mois)
      const entrantsAnnee = await prisma.demande.count({
        where: {
          dateReception: {
            gte: startOfMonth,
            lt: endOfMonth
          }
        }
      });
      
      // Sortants de l'année courante (premières décisions signées ce mois pour des demandes de l'année)
      const sortantsAnnee = await prisma.decision.count({
        where: {
          dateSignature: {
            gte: startOfMonth,
            lt: endOfMonth,
            not: null
          },
          demandes: {
            some: {
              demande: {
                dateReception: {
                  gte: new Date(year, 0, 1),
                  lt: new Date(year + 1, 0, 1)
                }
              }
            }
          }
        }
      });
      
      // Entrants année précédente (même mois)
      const startOfPreviousMonth = new Date(previousYear, month, 1);
      const endOfPreviousMonth = new Date(previousYear, month + 1, 1);
      
      const entrantsAnneePrecedente = await prisma.demande.count({
        where: {
          dateReception: {
            gte: startOfPreviousMonth,
            lt: endOfPreviousMonth
          }
        }
      });
      
      fluxMensuels.push({
        mois: mois[month],
        entrantsAnnee,
        sortantsAnnee,
        entrantsAnneePrecedente
      });
    }
    
    // Calcul des moyennes
    const totalEntrantsAnnee = fluxMensuels.reduce((sum, m) => sum + m.entrantsAnnee, 0);
    const totalSortantsAnnee = fluxMensuels.reduce((sum, m) => sum + m.sortantsAnnee, 0);
    const totalEntrantsAnneePrecedente = fluxMensuels.reduce((sum, m) => sum + m.entrantsAnneePrecedente, 0);
    
    const moyennes = {
      mois: 'MOYENNE / MOIS',
      entrantsAnnee: Math.round(totalEntrantsAnnee / 12 * 100) / 100,
      sortantsAnnee: Math.round(totalSortantsAnnee / 12 * 100) / 100,
      entrantsAnneePrecedente: Math.round(totalEntrantsAnneePrecedente / 12 * 100) / 100
    };
    
    res.json({
      fluxMensuels,
      moyennes,
      annee: year,
      anneePrecedente: previousYear
    });
    
  } catch (error) {
    console.error('Erreur lors de la récupération des flux mensuels:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération des flux mensuels' 
    });
  }
};

const getFluxHebdomadaires = async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const previousYear = year - 1;
    
    // Fonction pour obtenir le numéro de semaine ISO et les dates de début/fin
    const getISOWeekWithDates = (date) => {
      const target = new Date(date);
      
      // Trouver le jeudi de cette semaine (ISO week date)
      const dayOfWeek = target.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const thursday = new Date(target);
      thursday.setDate(target.getDate() - dayOfWeek + (dayOfWeek === 0 ? -3 : 4));
      
      // L'année ISO est l'année du jeudi de cette semaine
      const isoYear = thursday.getFullYear();
      
      // Trouver le premier jeudi de l'année ISO
      const jan4 = new Date(isoYear, 0, 4); // 4 janvier est toujours dans la semaine 1
      const jan4DayOfWeek = jan4.getDay();
      const firstThursday = new Date(jan4);
      firstThursday.setDate(jan4.getDate() - jan4DayOfWeek + (jan4DayOfWeek === 0 ? -3 : 4));
      
      // Calculer le numéro de semaine
      const weekNum = Math.floor((thursday.getTime() - firstThursday.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;
      
      // Calculer les dates de début (lundi) et fin (dimanche) de la semaine
      const mondayOfWeek = new Date(target);
      mondayOfWeek.setDate(target.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1));
      
      const sundayOfWeek = new Date(mondayOfWeek);
      sundayOfWeek.setDate(mondayOfWeek.getDate() + 6);
      
      return {
        weekNum,
        startDate: mondayOfWeek,
        endDate: sundayOfWeek,
        isoYear
      };
    };

    // Créer une structure pour stocker toutes les semaines de l'année
    const weeklyStats = new Map();
    
    // Générer toutes les semaines ISO de l'année demandée
    // Commencer par le 1er janvier et aller jusqu'au 31 décembre
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);
    
    // Mais aussi inclure les semaines qui débordent sur l'année précédente/suivante
    const extendedStartDate = new Date(year - 1, 11, 20); // 20 décembre année précédente
    const extendedEndDate = new Date(year + 1, 0, 10); // 10 janvier année suivante
    
    // 1. Récupérer toutes les demandes entrantes dans la période étendue
    const demandesEntrantes = await prisma.demande.findMany({
      where: {
        dateReception: {
          gte: extendedStartDate,
          lt: extendedEndDate
        }
      },
      select: {
        id: true,
        dateReception: true
      }
    });

    // Traiter les entrantes
    demandesEntrantes.forEach(demande => {
      const weekInfo = getISOWeekWithDates(demande.dateReception);
      const weekKey = `${weekInfo.isoYear}-${weekInfo.weekNum.toString().padStart(2, '0')}`;
      
      // Ne garder que les semaines qui concernent l'année demandée
      if (weekInfo.isoYear === year || 
          (weekInfo.startDate.getFullYear() <= year && weekInfo.endDate.getFullYear() >= year)) {
        if (!weeklyStats.has(weekKey)) {
          weeklyStats.set(weekKey, {
            numeroSemaine: weekInfo.weekNum,
            dateDebut: weekInfo.startDate.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
            dateFin: weekInfo.endDate.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
            entrantsAnnee: 0,
            sortantsAnnee: 0,
            entrantsAnneePrecedente: 0,
            isoYear: weekInfo.isoYear,
            weekKey
          });
        }
        weeklyStats.get(weekKey).entrantsAnnee++;
      }
    });

    // 2. Récupérer les décisions pour les sortants de l'année courante
    const decisions = await prisma.decision.findMany({
      where: {
        dateSignature: {
          gte: extendedStartDate,
          lt: extendedEndDate,
          not: null
        },
        demandes: {
          some: {
            demande: {
              dateReception: {
                gte: startDate,
                lt: new Date(year + 1, 0, 1)
              }
            }
          }
        }
      },
      select: {
        id: true,
        dateSignature: true,
        demandes: {
          select: {
            demandeId: true
          }
        }
      }
    });

    // Grouper par demande et trouver la première décision signée pour chaque demande
    const premiersDecisionsByDemande = new Map();
    
    decisions.forEach(decision => {
      decision.demandes.forEach(dd => {
        const currentFirst = premiersDecisionsByDemande.get(dd.demandeId);
        if (!currentFirst || decision.dateSignature < currentFirst) {
          premiersDecisionsByDemande.set(dd.demandeId, decision.dateSignature);
        }
      });
    });

    // Traiter les sortantes
    Array.from(premiersDecisionsByDemande.entries()).forEach(([, date]) => {
      const weekInfo = getISOWeekWithDates(date);
      const weekKey = `${weekInfo.isoYear}-${weekInfo.weekNum.toString().padStart(2, '0')}`;
      
      // Ne garder que les semaines qui concernent l'année demandée
      if (weekInfo.isoYear === year || 
          (weekInfo.startDate.getFullYear() <= year && weekInfo.endDate.getFullYear() >= year)) {
        if (!weeklyStats.has(weekKey)) {
          weeklyStats.set(weekKey, {
            numeroSemaine: weekInfo.weekNum,
            dateDebut: weekInfo.startDate.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
            dateFin: weekInfo.endDate.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
            entrantsAnnee: 0,
            sortantsAnnee: 0,
            entrantsAnneePrecedente: 0,
            isoYear: weekInfo.isoYear,
            weekKey
          });
        }
        weeklyStats.get(weekKey).sortantsAnnee++;
      }
    });

    // 3. Récupérer les entrants de l'année précédente pour les mêmes semaines
    const demandesAnneePrecedente = await prisma.demande.findMany({
      where: {
        dateReception: {
          gte: new Date(previousYear - 1, 11, 20),
          lt: new Date(previousYear + 1, 0, 10)
        }
      },
      select: {
        id: true,
        dateReception: true
      }
    });

    // Traiter les entrants année précédente
    demandesAnneePrecedente.forEach(demande => {
      const weekInfo = getISOWeekWithDates(demande.dateReception);
      const weekKey = `${weekInfo.isoYear}-${weekInfo.weekNum.toString().padStart(2, '0')}`;
      
      // Pour l'année précédente, on cherche les semaines équivalentes
      if (weekInfo.isoYear === previousYear) {
        const currentYearKey = `${year}-${weekInfo.weekNum.toString().padStart(2, '0')}`;
        if (weeklyStats.has(currentYearKey)) {
          weeklyStats.get(currentYearKey).entrantsAnneePrecedente++;
        }
      }
    });

    // 4. Convertir en tableau et trier par numéro de semaine
    const fluxHebdomadaires = Array.from(weeklyStats.values())
      .sort((a, b) => a.numeroSemaine - b.numeroSemaine);

    res.json({
      fluxHebdomadaires,
      annee: year,
      anneePrecedente: previousYear
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des flux hebdomadaires:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération des flux hebdomadaires' 
    });
  }
};

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
    
    // Formater les résultats et trier par nombre de demandes décroissant
    const statistiques = statsBAP.map(bap => ({
      nomBAP: bap.nomBAP,
      nombreDemandes: bap._count.demandes
    })).sort((a, b) => b.nombreDemandes - a.nombreDemandes);
    
    res.json(statistiques);
    
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques BAP:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération des statistiques BAP' 
    });
  }
};

module.exports = {
  getRecentWeeklyStats,
  getStatistiquesAdministratives,
  getStatistiquesBAP,
  getFluxMensuels,
  getFluxHebdomadaires
};