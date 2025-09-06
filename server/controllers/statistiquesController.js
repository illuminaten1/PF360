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
    const demandesNonTraitees = await prisma.demande.findMany({
      where: {
        dateReception: {
          gte: startOfYear,
          lt: endOfYear
        },
        decisions: {
          none: {}
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
    const demandesNonTraiteesBAP = await prisma.demande.findMany({
      where: {
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
    const demandesNonTraiteesBRPF = await prisma.demande.findMany({
      where: {
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
  getStatistiquesReponseBRPF
};