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

const getAnneesDisponibles = async (req, res) => {
  try {
    // Récupérer les années distinctes où il y a des demandes
    const anneesAvecDemandes = await prisma.demande.findMany({
      select: {
        dateReception: true
      },
      orderBy: {
        dateReception: 'desc'
      }
    });

    // Extraire les années uniques
    const anneesSet = new Set();
    anneesAvecDemandes.forEach(demande => {
      anneesSet.add(demande.dateReception.getFullYear());
    });

    // Convertir en tableau trié par ordre décroissant
    const annees = Array.from(anneesSet).sort((a, b) => b - a);

    res.json(annees);
  } catch (error) {
    console.error('Erreur lors de la récupération des années disponibles:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération des années disponibles' 
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

const getStatistiquesBudgetaires = async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    
    // Dates de début et fin d'année
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year + 1, 0, 1);

    // 1. Nombre de dossiers pour l'année sélectionnée
    const nombreDossiersAnnee = await prisma.dossier.count({
      where: {
        createdAt: {
          gte: startOfYear,
          lt: endOfYear
        }
      }
    });

    // 2. Nombre de dossiers toutes années
    const nombreDossiersToutesAnnees = await prisma.dossier.count();

    // 3. Conventions d'honoraires créées pour l'année sélectionnée
    const conventionsCreees = await prisma.convention.count({
      where: {
        type: 'CONVENTION',
        dateCreation: {
          gte: startOfYear,
          lt: endOfYear
        }
      }
    });

    // 4. Conventions d'honoraires signées pour l'année sélectionnée (par date de signature)
    const conventionsSignees = await prisma.convention.count({
      where: {
        type: 'CONVENTION',
        dateRetourSigne: {
          gte: startOfYear,
          lt: endOfYear
        }
      }
    });

    // 5. Avenants créés pour l'année sélectionnée
    const avenantsCreees = await prisma.convention.count({
      where: {
        type: 'AVENANT',
        dateCreation: {
          gte: startOfYear,
          lt: endOfYear
        }
      }
    });

    // 6. Avenants signés pour l'année sélectionnée (par date de signature)
    const avenantsSignees = await prisma.convention.count({
      where: {
        type: 'AVENANT',
        dateRetourSigne: {
          gte: startOfYear,
          lt: endOfYear
        }
      }
    });

    // 7. Récupérer le budget annuel pour calculer les pourcentages
    const budgetAnnuel = await prisma.budgetAnnuel.findUnique({
      where: {
        annee: year
      }
    });
    
    const budgetTotal = budgetAnnuel ? budgetAnnuel.budgetBase + budgetAnnuel.abondements : 0;

    // 8. Montant moyen gagé par convention (conventions créées l'année sélectionnée)
    const conventionsAvecMontant = await prisma.convention.findMany({
      where: {
        type: 'CONVENTION',
        dateCreation: {
          gte: startOfYear,
          lt: endOfYear
        }
      },
      select: {
        montantHT: true
      }
    });
    
    // Filtrer les conventions avec montantHT non nul
    const conventionsAvecMontantValide = conventionsAvecMontant.filter(conv => conv.montantHT !== null && conv.montantHT !== undefined);
    const montantMoyenConvention = conventionsAvecMontantValide.length > 0 
      ? conventionsAvecMontantValide.reduce((sum, conv) => sum + conv.montantHT, 0) / conventionsAvecMontantValide.length
      : 0;

    // 9. Montant moyen gagé par avenant (avenants créés l'année sélectionnée)
    const avenantsAvecMontant = await prisma.convention.findMany({
      where: {
        type: 'AVENANT',
        dateCreation: {
          gte: startOfYear,
          lt: endOfYear
        }
      },
      select: {
        montantHT: true
      }
    });
    
    // Filtrer les avenants avec montantHT non nul
    const avenantsAvecMontantValide = avenantsAvecMontant.filter(av => av.montantHT !== null && av.montantHT !== undefined);
    const montantMoyenAvenant = avenantsAvecMontantValide.length > 0 
      ? avenantsAvecMontantValide.reduce((sum, av) => sum + av.montantHT, 0) / avenantsAvecMontantValide.length
      : 0;

    // 10. Montant HT gagé (signés) - conventions et avenants signés par l'avocat l'année sélectionnée
    const conventionsEtAvenantsSignes = await prisma.convention.findMany({
      where: {
        dateRetourSigne: {
          gte: startOfYear,
          lt: endOfYear
        }
      },
      select: {
        montantHT: true
      }
    });
    
    // Filtrer et calculer le montant HT signé
    const montantHTSigne = conventionsEtAvenantsSignes
      .filter(conv => conv.montantHT !== null && conv.montantHT !== undefined)
      .reduce((sum, conv) => sum + conv.montantHT, 0);
    const pourcentageBudgetSigne = budgetTotal > 0 ? (montantHTSigne / budgetTotal) * 100 : 0;

    // 11. Montant HT gagé total - conventions et avenants créés l'année sélectionnée
    const conventionsEtAvenantsCreees = await prisma.convention.findMany({
      where: {
        dateCreation: {
          gte: startOfYear,
          lt: endOfYear
        }
      },
      select: {
        montantHT: true
      }
    });
    
    // Filtrer et calculer le montant HT total
    const montantHTTotal = conventionsEtAvenantsCreees
      .filter(conv => conv.montantHT !== null && conv.montantHT !== undefined)
      .reduce((sum, conv) => sum + conv.montantHT, 0);
    const pourcentageBudgetTotal = budgetTotal > 0 ? (montantHTTotal / budgetTotal) * 100 : 0;

    const statistiques = [
      {
        libelle: "Dossiers toutes années",
        nombre: nombreDossiersToutesAnnees
      },
      {
        libelle: `Dossiers ${year}`,
        nombre: nombreDossiersAnnee
      },
      {
        libelle: "Conventions créées",
        nombre: conventionsCreees
      },
      {
        libelle: "Convention signées (avocat)",
        nombre: conventionsSignees
      },
      {
        libelle: "Avenants créés",
        nombre: avenantsCreees
      },
      {
        libelle: "Avenants signés (avocat)",
        nombre: avenantsSignees
      },
      {
        libelle: "Montant moyen gagé par convention",
        nombre: Math.round(montantMoyenConvention),
        type: "currency"
      },
      {
        libelle: "Montant moyen gagé par avenant",
        nombre: Math.round(montantMoyenAvenant),
        type: "currency"
      },
      {
        libelle: "Montant HT gagé (signés)",
        nombre: Math.round(montantHTSigne),
        pourcentage: Math.round(pourcentageBudgetSigne * 100) / 100,
        type: "currency_with_percentage",
        showPrevisions: true,
        prevision10: Math.round(montantHTSigne * 1.1),
        prevision20: Math.round(montantHTSigne * 1.1 * 1.2),
        pourcentagePrevision10: budgetTotal > 0 ? Math.round((montantHTSigne * 1.1 / budgetTotal) * 100 * 100) / 100 : 0,
        pourcentagePrevision20: budgetTotal > 0 ? Math.round((montantHTSigne * 1.1 * 1.2 / budgetTotal) * 100 * 100) / 100 : 0
      },
      {
        libelle: "Montant HT gagé total",
        nombre: Math.round(montantHTTotal),
        pourcentage: Math.round(pourcentageBudgetTotal * 100) / 100,
        type: "currency_with_percentage",
        bold: true,
        showPrevisions: true,
        prevision10: Math.round(montantHTTotal * 1.1),
        prevision20: Math.round(montantHTTotal * 1.1 * 1.2),
        pourcentagePrevision10: budgetTotal > 0 ? Math.round((montantHTTotal * 1.1 / budgetTotal) * 100 * 100) / 100 : 0,
        pourcentagePrevision20: budgetTotal > 0 ? Math.round((montantHTTotal * 1.1 * 1.2 / budgetTotal) * 100 * 100) / 100 : 0
      }
    ];

    res.json({ statistiques, budgetTotal });

  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques budgétaires:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération des statistiques budgétaires',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const getEngagementServicePayeur = async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    
    // Dates de début et fin d'année
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year + 1, 0, 1);

    // Récupérer le budget annuel pour calculer les pourcentages
    const budgetAnnuel = await prisma.budgetAnnuel.findUnique({
      where: {
        annee: year
      }
    });
    
    const budgetTotal = budgetAnnuel ? budgetAnnuel.budgetBase + budgetAnnuel.abondements : 0;

    // Récupérer les engagements par SGAMI (conventions créées l'année sélectionnée)
    const engagementsSGAMI = await prisma.sgami.findMany({
      select: {
        id: true,
        nom: true,
        dossiers: {
          select: {
            conventions: {
              where: {
                dateCreation: {
                  gte: startOfYear,
                  lt: endOfYear
                }
              },
              select: {
                montantHT: true
              }
            }
          }
        }
      }
    });

    // Calculer les montants par SGAMI
    const engagements = engagementsSGAMI.map(sgami => {
      // Collecter tous les montants des conventions de tous les dossiers de ce SGAMI
      const montants = [];
      sgami.dossiers.forEach(dossier => {
        dossier.conventions.forEach(convention => {
          if (convention.montantHT !== null && convention.montantHT !== undefined) {
            montants.push(convention.montantHT);
          }
        });
      });

      const montantTotal = montants.reduce((sum, montant) => sum + montant, 0);
      const pourcentage = budgetTotal > 0 ? (montantTotal / budgetTotal) * 100 : 0;
      const prevision10 = montantTotal * 1.1;
      const prevision20 = montantTotal * 1.1 * 1.2;
      const pourcentagePrevision10 = budgetTotal > 0 ? (prevision10 / budgetTotal) * 100 : 0;
      const pourcentagePrevision20 = budgetTotal > 0 ? (prevision20 / budgetTotal) * 100 : 0;

      return {
        sgami: sgami.nom,
        montantTotal: Math.round(montantTotal),
        pourcentage: Math.round(pourcentage * 100) / 100,
        prevision10: Math.round(prevision10),
        prevision20: Math.round(prevision20),
        pourcentagePrevision10: Math.round(pourcentagePrevision10 * 100) / 100,
        pourcentagePrevision20: Math.round(pourcentagePrevision20 * 100) / 100
      };
    })
    .filter(engagement => engagement.montantTotal > 0) // Ne garder que les SGAMI avec des engagements
    .sort((a, b) => b.montantTotal - a.montantTotal); // Trier par montant décroissant


    res.json({ engagements, budgetTotal });

  } catch (error) {
    console.error('Erreur lors de la récupération des engagements par service payeur:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération des engagements par service payeur',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const getEngagementDepensesMensuelles = async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    
    // Dates de début et fin d'année
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year + 1, 0, 1);

    // Récupérer le budget annuel pour calculer les pourcentages
    const budgetAnnuel = await prisma.budgetAnnuel.findUnique({
      where: {
        annee: year
      }
    });
    
    const budgetTotal = budgetAnnuel ? budgetAnnuel.budgetBase + budgetAnnuel.abondements : 0;

    // Noms des mois
    const noms_mois = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];

    // Initialiser les données mensuelles
    const engagementsMensuels = [];
    let cumuleHT = 0;
    let cumuleTTC = 0;

    // Variables pour les totaux
    let totalMontantGageHT = 0;
    let totalCumuleHT = 0;
    let totalPrevision10 = 0;
    let totalPrevision20 = 0;
    let totalCumuleTTC = 0;

    for (let mois = 0; mois < 12; mois++) {
      const startOfMonth = new Date(year, mois, 1);
      const endOfMonth = new Date(year, mois + 1, 1);

      // Récupérer les conventions créées ce mois
      const conventionsMois = await prisma.convention.findMany({
        where: {
          dateCreation: {
            gte: startOfMonth,
            lt: endOfMonth
          }
        },
        select: {
          montantHT: true
        }
      });

      // Calculer le montant gagé HT pour ce mois
      const montantGageHT = conventionsMois
        .filter(conv => conv.montantHT !== null && conv.montantHT !== undefined)
        .reduce((sum, conv) => sum + conv.montantHT, 0);

      // Mettre à jour les cumuls
      cumuleHT += montantGageHT;
      
      // Calculer les prévisionnels
      const prevision10 = cumuleHT * 1.1;
      const prevision20 = cumuleHT * 1.1 * 1.2;
      cumuleTTC = prevision20;

      // Calculer les pourcentages
      const pourcentageMontantGage = budgetTotal > 0 ? (montantGageHT / budgetTotal) * 100 : 0;
      const pourcentageCumuleHT = budgetTotal > 0 ? (cumuleHT / budgetTotal) * 100 : 0;
      const pourcentagePrevision10 = budgetTotal > 0 ? (prevision10 / budgetTotal) * 100 : 0;
      const pourcentagePrevision20 = budgetTotal > 0 ? (prevision20 / budgetTotal) * 100 : 0;
      const pourcentageCumuleTTC = budgetTotal > 0 ? (cumuleTTC / budgetTotal) * 100 : 0;

      engagementsMensuels.push({
        mois: noms_mois[mois],
        montantGageHT: Math.round(montantGageHT),
        pourcentageMontantGage: Math.round(pourcentageMontantGage * 100) / 100,
        cumuleHT: Math.round(cumuleHT),
        pourcentageCumuleHT: Math.round(pourcentageCumuleHT * 100) / 100,
        prevision10: Math.round(prevision10),
        pourcentagePrevision10: Math.round(pourcentagePrevision10 * 100) / 100,
        prevision20: Math.round(prevision20),
        pourcentagePrevision20: Math.round(pourcentagePrevision20 * 100) / 100,
        cumuleTTC: Math.round(cumuleTTC),
        pourcentageCumuleTTC: Math.round(pourcentageCumuleTTC * 100) / 100
      });

      // Accumuler pour les totaux (on prend les valeurs du dernier mois pour les cumuls)
      totalMontantGageHT += montantGageHT;
      if (mois === 11) { // Dernier mois pour les cumuls
        totalCumuleHT = cumuleHT;
        totalPrevision10 = prevision10;
        totalPrevision20 = prevision20;
        totalCumuleTTC = cumuleTTC;
      }
    }

    // Calculer les pourcentages des totaux
    const pourcentageTotalMontantGage = budgetTotal > 0 ? (totalMontantGageHT / budgetTotal) * 100 : 0;
    const pourcentageTotalCumuleHT = budgetTotal > 0 ? (totalCumuleHT / budgetTotal) * 100 : 0;
    const pourcentageTotalPrevision10 = budgetTotal > 0 ? (totalPrevision10 / budgetTotal) * 100 : 0;
    const pourcentageTotalPrevision20 = budgetTotal > 0 ? (totalPrevision20 / budgetTotal) * 100 : 0;
    const pourcentageTotalCumuleTTC = budgetTotal > 0 ? (totalCumuleTTC / budgetTotal) * 100 : 0;

    // Ligne total
    const total = {
      mois: 'TOTAL',
      montantGageHT: Math.round(totalMontantGageHT),
      pourcentageMontantGage: Math.round(pourcentageTotalMontantGage * 100) / 100,
      cumuleHT: Math.round(totalCumuleHT),
      pourcentageCumuleHT: Math.round(pourcentageTotalCumuleHT * 100) / 100,
      prevision10: Math.round(totalPrevision10),
      pourcentagePrevision10: Math.round(pourcentageTotalPrevision10 * 100) / 100,
      prevision20: Math.round(totalPrevision20),
      pourcentagePrevision20: Math.round(pourcentageTotalPrevision20 * 100) / 100,
      cumuleTTC: Math.round(totalCumuleTTC),
      pourcentageCumuleTTC: Math.round(pourcentageTotalCumuleTTC * 100) / 100
    };

    res.json({ 
      engagementsMensuels, 
      total,
      budgetTotal,
      annee: year 
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des engagements de dépenses mensuelles:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération des engagements de dépenses mensuelles',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const getDepensesOrdonnees = async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    
    // Dates de début et fin d'année
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year + 1, 0, 1);
    
    // Récupérer le budget annuel pour calculer les pourcentages
    const budgetAnnuel = await prisma.budgetAnnuel.findUnique({
      where: {
        annee: year
      }
    });
    
    const budgetTotal = budgetAnnuel ? budgetAnnuel.budgetBase + budgetAnnuel.abondements : 0;

    // 1. Nombre de paiements émis pour l'année sélectionnée
    const nombrePaiementsEmis = await prisma.paiement.count({
      where: {
        createdAt: {
          gte: startOfYear,
          lt: endOfYear
        }
      }
    });

    // 2. Récupérer tous les paiements de l'année pour calculer les montants
    const paiementsDeLAnnee = await prisma.paiement.findMany({
      where: {
        createdAt: {
          gte: startOfYear,
          lt: endOfYear
        }
      },
      select: {
        montantHT: true,
        montantTTC: true
      }
    });

    // 3. Calculer les montants totaux
    const depenseTotaleHT = paiementsDeLAnnee
      .filter(p => p.montantHT !== null && p.montantHT !== undefined)
      .reduce((sum, p) => sum + p.montantHT, 0);
    
    const depenseTotaleTTC = paiementsDeLAnnee
      .filter(p => p.montantTTC !== null && p.montantTTC !== undefined)
      .reduce((sum, p) => sum + p.montantTTC, 0);

    // 4. Nombre de dossiers ayant au moins un paiement cette année
    const dossiersAvecPaiements = await prisma.dossier.count({
      where: {
        paiements: {
          some: {
            createdAt: {
              gte: startOfYear,
              lt: endOfYear
            }
          }
        }
      }
    });

    // 5. Calculer le montant moyen TTC par dossier ayant un paiement
    const montantMoyenTTCParDossier = dossiersAvecPaiements > 0 ? depenseTotaleTTC / dossiersAvecPaiements : 0;

    // 6. Calculer le montant moyen TTC par paiement
    const montantMoyenTTCParPaiement = nombrePaiementsEmis > 0 ? depenseTotaleTTC / nombrePaiementsEmis : 0;

    // Calcul des pourcentages par rapport au budget total
    const pourcentageDepenseHT = budgetTotal > 0 ? (depenseTotaleHT / budgetTotal) * 100 : 0;
    const pourcentageDepenseTTC = budgetTotal > 0 ? (depenseTotaleTTC / budgetTotal) * 100 : 0;

    const statistiques = [
      {
        libelle: "Nombre de paiements émis",
        nombre: nombrePaiementsEmis,
        type: "number"
      },
      {
        libelle: "Montant moyen TTC par paiement",
        nombre: Math.round(montantMoyenTTCParPaiement * 100) / 100,
        type: "currency"
      },
      {
        libelle: "Montant moyen TTC par dossier",
        nombre: Math.round(montantMoyenTTCParDossier * 100) / 100,
        type: "currency"
      },
      {
        libelle: "Dépense totale HT (indicatif)",
        nombre: Math.round(depenseTotaleHT * 100) / 100,
        pourcentage: Math.round(pourcentageDepenseHT * 100) / 100,
        type: "currency_with_percentage"
      },
      {
        libelle: "Dépense totale TTC",
        nombre: Math.round(depenseTotaleTTC * 100) / 100,
        pourcentage: Math.round(pourcentageDepenseTTC * 100) / 100,
        type: "currency_with_percentage",
        isTotal: true
      }
    ];

    res.json({ statistiques, budgetTotal });

  } catch (error) {
    console.error('Erreur lors de la récupération des dépenses ordonnées:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération des dépenses ordonnées',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const getDepensesOrdonneesParSgami = async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    
    // Dates de début et fin d'année
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year + 1, 0, 1);
    
    // Récupérer le budget annuel pour calculer les pourcentages
    const budgetAnnuel = await prisma.budgetAnnuel.findUnique({
      where: {
        annee: year
      }
    });
    
    const budgetTotal = budgetAnnuel ? budgetAnnuel.budgetBase + budgetAnnuel.abondements : 0;

    // Récupérer tous les paiements de l'année avec leur SGAMI
    const paiementsParSgami = await prisma.sgami.findMany({
      select: {
        id: true,
        nom: true,
        paiements: {
          where: {
            createdAt: {
              gte: startOfYear,
              lt: endOfYear
            }
          },
          select: {
            montantTTC: true
          }
        }
      }
    });

    // Calculer les statistiques par SGAMI
    const statistiques = paiementsParSgami
      .map(sgami => {
        const paiements = sgami.paiements || [];
        const nombrePaiements = paiements.length;
        const montantTotal = paiements
          .filter(p => p.montantTTC !== null && p.montantTTC !== undefined)
          .reduce((sum, p) => sum + p.montantTTC, 0);
        const pourcentage = budgetTotal > 0 ? (montantTotal / budgetTotal) * 100 : 0;
        const montantMoyen = nombrePaiements > 0 ? montantTotal / nombrePaiements : 0;

        return {
          libelle: sgami.nom,
          nombre: Math.round(montantTotal * 100) / 100,
          pourcentage: Math.round(pourcentage * 100) / 100,
          type: "currency_with_percentage",
          extraInfo: {
            nombrePaiements,
            montantMoyen: Math.round(montantMoyen * 100) / 100
          }
        };
      })
      .filter(stat => stat.nombre > 0) // Ne garder que les SGAMI avec des paiements
      .sort((a, b) => b.nombre - a.nombre); // Trier par montant décroissant

    // Ajouter les totaux
    const nombreTotalPaiements = statistiques.reduce((sum, stat) => sum + stat.extraInfo.nombrePaiements, 0);
    const montantTotalGeneral = statistiques.reduce((sum, stat) => sum + stat.nombre, 0);
    
    statistiques.push({
      libelle: "TOTAL",
      nombre: Math.round(montantTotalGeneral * 100) / 100,
      pourcentage: budgetTotal > 0 ? Math.round((montantTotalGeneral / budgetTotal) * 100 * 100) / 100 : 0,
      type: "currency_with_percentage",
      isTotal: true,
      extraInfo: {
        nombrePaiements: nombreTotalPaiements,
        montantMoyen: nombreTotalPaiements > 0 ? Math.round((montantTotalGeneral / nombreTotalPaiements) * 100) / 100 : 0
      }
    });

    res.json({ statistiques, budgetTotal });

  } catch (error) {
    console.error('Erreur lors de la récupération des dépenses ordonnées par SGAMI:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération des dépenses ordonnées par SGAMI',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const getDepensesOrdonneesParPce = async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    
    // Dates de début et fin d'année
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year + 1, 0, 1);
    
    // Récupérer le budget annuel pour calculer les pourcentages
    const budgetAnnuel = await prisma.budgetAnnuel.findUnique({
      where: {
        annee: year
      }
    });
    
    const budgetTotal = budgetAnnuel ? budgetAnnuel.budgetBase + budgetAnnuel.abondements : 0;

    // Récupérer tous les paiements de l'année avec leur PCE
    const paiementsParPce = await prisma.pce.findMany({
      select: {
        id: true,
        pceDetaille: true,
        pceNumerique: true,
        paiements: {
          where: {
            createdAt: {
              gte: startOfYear,
              lt: endOfYear
            }
          },
          select: {
            montantTTC: true
          }
        }
      },
      orderBy: {
        ordre: 'asc'
      }
    });

    // Aussi récupérer les paiements sans PCE
    const paiementsSansPce = await prisma.paiement.count({
      where: {
        createdAt: {
          gte: startOfYear,
          lt: endOfYear
        },
        pceId: null
      }
    });

    const montantSansPce = await prisma.paiement.aggregate({
      where: {
        createdAt: {
          gte: startOfYear,
          lt: endOfYear
        },
        pceId: null
      },
      _sum: {
        montantTTC: true
      }
    });

    // Calculer les statistiques par PCE
    const statistiques = paiementsParPce
      .map(pce => {
        const paiements = pce.paiements || [];
        const nombrePaiements = paiements.length;
        const montantTotal = paiements
          .filter(p => p.montantTTC !== null && p.montantTTC !== undefined)
          .reduce((sum, p) => sum + p.montantTTC, 0);
        const pourcentage = budgetTotal > 0 ? (montantTotal / budgetTotal) * 100 : 0;
        const montantMoyen = nombrePaiements > 0 ? montantTotal / nombrePaiements : 0;

        return {
          libelle: `${pce.pceNumerique} - ${pce.pceDetaille}`,
          nombre: Math.round(montantTotal * 100) / 100,
          pourcentage: Math.round(pourcentage * 100) / 100,
          type: "currency_with_percentage",
          extraInfo: {
            nombrePaiements,
            montantMoyen: Math.round(montantMoyen * 100) / 100
          }
        };
      })
      .filter(stat => stat.nombre > 0); // Ne garder que les PCE avec des paiements

    // Ajouter les paiements sans PCE s'il y en a
    if (paiementsSansPce > 0 && montantSansPce._sum.montantTTC > 0) {
      const montantSansPceTotal = montantSansPce._sum.montantTTC || 0;
      const pourcentageSansPce = budgetTotal > 0 ? (montantSansPceTotal / budgetTotal) * 100 : 0;
      const montantMoyenSansPce = paiementsSansPce > 0 ? montantSansPceTotal / paiementsSansPce : 0;

      statistiques.push({
        libelle: "Sans PCE assigné",
        nombre: Math.round(montantSansPceTotal * 100) / 100,
        pourcentage: Math.round(pourcentageSansPce * 100) / 100,
        type: "currency_with_percentage",
        extraInfo: {
          nombrePaiements: paiementsSansPce,
          montantMoyen: Math.round(montantMoyenSansPce * 100) / 100
        }
      });
    }

    // Trier par montant décroissant
    statistiques.sort((a, b) => b.nombre - a.nombre);

    // Ajouter les totaux
    const nombreTotalPaiements = statistiques.reduce((sum, stat) => sum + stat.extraInfo.nombrePaiements, 0);
    const montantTotalGeneral = statistiques.reduce((sum, stat) => sum + stat.nombre, 0);
    
    statistiques.push({
      libelle: "TOTAL",
      nombre: Math.round(montantTotalGeneral * 100) / 100,
      pourcentage: budgetTotal > 0 ? Math.round((montantTotalGeneral / budgetTotal) * 100 * 100) / 100 : 0,
      type: "currency_with_percentage",
      isTotal: true,
      extraInfo: {
        nombrePaiements: nombreTotalPaiements,
        montantMoyen: nombreTotalPaiements > 0 ? Math.round((montantTotalGeneral / nombreTotalPaiements) * 100) / 100 : 0
      }
    });

    res.json({ statistiques, budgetTotal });

  } catch (error) {
    console.error('Erreur lors de la récupération des dépenses ordonnées par PCE:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération des dépenses ordonnées par PCE',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const getDepensesOrdonneesParMois = async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    
    // Dates de début et fin d'année
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year + 1, 0, 1);
    
    // Récupérer le budget annuel pour calculer les pourcentages
    const budgetAnnuel = await prisma.budgetAnnuel.findUnique({
      where: {
        annee: year
      }
    });
    
    const budgetTotal = budgetAnnuel ? budgetAnnuel.budgetBase + budgetAnnuel.abondements : 0;

    // Grouper les données par mois
    const statsParMois = {};
    
    // Initialiser tous les mois de l'année avec des valeurs nulles
    for (let mois = 1; mois <= 12; mois++) {
      statsParMois[mois] = {
        mois: mois.toString().padStart(2, '0'),
        annee: year,
        montantHTPaiements: 0,
        montantTTCDossiers: 0
      };
    }

    // 1. Récupérer les paiements émis chaque mois (montant HT)
    const paiementsParMois = await prisma.paiement.findMany({
      where: {
        createdAt: {
          gte: startOfYear,
          lt: endOfYear
        }
      },
      select: {
        createdAt: true,
        montantHT: true
      }
    });

    // Grouper les paiements par mois d'émission
    paiementsParMois.forEach(paiement => {
      const mois = paiement.createdAt.getMonth() + 1; // getMonth() retourne 0-11
      if (statsParMois[mois]) {
        statsParMois[mois].montantHTPaiements += paiement.montantHT || 0;
      }
    });

    // 2. Récupérer les paiements créés chaque mois (montant TTC des dossiers créés ce mois-ci)
    const paiementsTTCParMois = await prisma.paiement.findMany({
      where: {
        dossier: {
          createdAt: {
            gte: startOfYear,
            lt: endOfYear
          }
        }
      },
      select: {
        montantTTC: true,
        dossier: {
          select: {
            createdAt: true
          }
        }
      }
    });

    // Grouper les paiements par mois de création du dossier
    paiementsTTCParMois.forEach(paiement => {
      const mois = paiement.dossier.createdAt.getMonth() + 1;
      if (statsParMois[mois]) {
        statsParMois[mois].montantTTCDossiers += paiement.montantTTC || 0;
      }
    });

    // Convertir en array et calculer les pourcentages et cumuls
    let statistiques = Object.values(statsParMois);
    
    // Calculer les cumuls
    let cumulHT = 0;
    let cumulTTC = 0;
    
    statistiques = statistiques.map(stat => {
      cumulHT += stat.montantHTPaiements;
      cumulTTC += stat.montantTTCDossiers;
      
      return {
        ...stat,
        cumulHT: cumulHT,
        cumulTTC: cumulTTC,
        pourcentageCumulHT: budgetTotal > 0 ? (cumulHT / budgetTotal) * 100 : 0,
        pourcentageCumulTTC: budgetTotal > 0 ? (cumulTTC / budgetTotal) * 100 : 0,
        pourcentageHT: budgetTotal > 0 ? (stat.montantHTPaiements / budgetTotal) * 100 : 0,
        pourcentageTTC: budgetTotal > 0 ? (stat.montantTTCDossiers / budgetTotal) * 100 : 0
      };
    });

    // Calculer les totaux
    const totalMontantHT = statistiques.reduce((sum, stat) => sum + stat.montantHTPaiements, 0);
    const totalMontantTTC = statistiques.reduce((sum, stat) => sum + stat.montantTTCDossiers, 0);
    
    // Ajouter la ligne de total
    statistiques.push({
      mois: 'Total',
      annee: year,
      montantHTPaiements: totalMontantHT,
      montantTTCDossiers: totalMontantTTC,
      cumulHT: totalMontantHT,
      cumulTTC: totalMontantTTC,
      pourcentageCumulHT: budgetTotal > 0 ? (totalMontantHT / budgetTotal) * 100 : 0,
      pourcentageCumulTTC: budgetTotal > 0 ? (totalMontantTTC / budgetTotal) * 100 : 0,
      pourcentageHT: budgetTotal > 0 ? (totalMontantHT / budgetTotal) * 100 : 0,
      pourcentageTTC: budgetTotal > 0 ? (totalMontantTTC / budgetTotal) * 100 : 0,
      isTotal: true,
      bold: true
    });

    res.json({
      statistiques,
      budgetTotal
    });
    
  } catch (error) {
    console.error('Erreur lors de la récupération des dépenses ordonnées par mois:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération des dépenses ordonnées par mois' 
    });
  }
};

module.exports = {
  getRecentWeeklyStats,
  getStatistiquesAdministratives,
  getStatistiquesBAP,
  getStatistiquesQualiteDemandeur,
  getStatistiquesTypeInfraction,
  getStatistiquesContexteMissionnel,
  getStatistiquesFormationAdministrative,
  getStatistiquesBranche,
  getStatistiquesStatutDemandeur,
  getStatistiquesBadges,
  getFluxMensuels,
  getFluxHebdomadaires,
  getAutoControle,
  getExtractionMensuelle,
  getAnneesDisponibles,
  getStatistiquesReponseBRPF,
  getStatistiquesBudgetaires,
  getEngagementServicePayeur,
  getEngagementDepensesMensuelles,
  getDepensesOrdonnees,
  getDepensesOrdonneesParSgami,
  getDepensesOrdonneesParPce,
  getDepensesOrdonneesParMois
};