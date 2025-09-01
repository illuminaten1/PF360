const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const getAvailableYears = async (req, res) => {
  try {
    // Récupérer les années distinctes où il y a des demandes
    const demandesYears = await prisma.demande.findMany({
      select: {
        dateReception: true
      },
      distinct: ['dateReception']
    });

    // Récupérer les années distinctes où il y a des décisions
    const decisionsYears = await prisma.decision.findMany({
      select: {
        createdAt: true
      },
      distinct: ['createdAt']
    });

    // Extraire les années et les combiner
    const allYears = new Set();
    
    demandesYears.forEach(demande => {
      if (demande.dateReception) {
        allYears.add(demande.dateReception.getFullYear());
      }
    });

    decisionsYears.forEach(decision => {
      if (decision.createdAt) {
        allYears.add(decision.createdAt.getFullYear());
      }
    });

    // Convertir en tableau trié par ordre décroissant
    const years = Array.from(allYears).sort((a, b) => b - a);

    res.json(years);

  } catch (error) {
    console.error('Erreur lors de la récupération des années disponibles:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération des années disponibles' 
    });
  }
};

const getWeeklyStats = async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    
    // Créer un objet pour stocker les stats par semaine (plus flexible que tableau fixe)
    const weeklyStats = new Map();

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
        isoYear // Ajouter l'année ISO pour le debug
      };
    };

    // 1. Récupérer les demandes entrantes par semaine
    // Pour les semaines ISO, on doit inclure les derniers jours de l'année précédente
    // qui peuvent appartenir à la première semaine ISO de l'année demandée
    // et exclure les premiers jours de l'année suivante qui appartiennent à l'année demandée
    
    // Calculer la plage de dates pour inclure toutes les dates possibles des semaines ISO de l'année
    const startOfYearISO = new Date(`${year}-01-01`);
    const endOfYearISO = new Date(`${year}-12-31`);
    
    // Étendre la plage pour inclure jusqu'à 6 jours avant le 1er janvier (pour couvrir la semaine 1)
    const extendedStart = new Date(startOfYearISO);
    extendedStart.setDate(extendedStart.getDate() - 6);
    
    // Étendre la plage pour inclure jusqu'à 6 jours après le 31 décembre (pour couvrir la semaine 52/53)
    const extendedEnd = new Date(endOfYearISO);
    extendedEnd.setDate(extendedEnd.getDate() + 6);
    
    const demandesEntrantesRaw = await prisma.demande.findMany({
      where: {
        dateReception: {
          gte: extendedStart,
          lt: extendedEnd
        }
      },
      select: {
        id: true,
        dateReception: true
      }
    });

    // Grouper par semaine
    demandesEntrantesRaw.forEach(demande => {
      const weekInfo = getISOWeekWithDates(demande.dateReception);
      const weekNum = weekInfo.weekNum;
      
      // Vérifier si la semaine appartient à l'année ISO demandée
      const weekBelongsToYear = weekInfo.isoYear === year;
      
      // Debug: Log pour comprendre les calculs
      if (year === 2025 && weekNum <= 2) {
        console.log(`Debug: Demande ${demande.id}, Date: ${demande.dateReception}, Semaine ISO: ${weekNum}, Année ISO: ${weekInfo.isoYear}, Appartient à ${year}: ${weekBelongsToYear}`);
      }
      
      if (weekNum >= 1 && weekNum <= 53 && weekBelongsToYear) {
        if (!weeklyStats.has(weekNum)) {
          weeklyStats.set(weekNum, {
            semaine: weekNum,
            startDate: weekInfo.startDate,
            endDate: weekInfo.endDate,
            entrantes: 0,
            sortantes: 0,
            stock: 0
          });
        }
        weeklyStats.get(weekNum).entrantes++;
      }
    });

    // 2. Récupérer les demandes sortantes (première décision signée uniquement)
    const decisionsInYear = await prisma.decision.findMany({
      where: {
        dateSignature: {
          gte: extendedStart,
          lt: extendedEnd
        },
        // Seules les décisions signées comptent comme "sortantes"
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
    
    decisionsInYear.forEach(decision => {
      decision.demandes.forEach(dd => {
        const currentFirst = premiersDecisionsByDemande.get(dd.demandeId);
        if (!currentFirst || decision.dateSignature < currentFirst) {
          premiersDecisionsByDemande.set(dd.demandeId, decision.dateSignature);
        }
      });
    });

    const demandesSortantesRaw = Array.from(premiersDecisionsByDemande.entries()).map(([demandeId, date]) => ({
      demandeId,
      premiere_decision_date: date
    }));

    // Grouper les sorties par semaine
    demandesSortantesRaw.forEach(item => {
      const weekInfo = getISOWeekWithDates(item.premiere_decision_date);
      const weekNum = weekInfo.weekNum;
      
      // Vérifier si la semaine appartient à l'année ISO demandée
      const weekBelongsToYear = weekInfo.isoYear === year;
      
      if (weekNum >= 1 && weekNum <= 53 && weekBelongsToYear) {
        if (!weeklyStats.has(weekNum)) {
          weeklyStats.set(weekNum, {
            semaine: weekNum,
            startDate: weekInfo.startDate,
            endDate: weekInfo.endDate,
            entrantes: 0,
            sortantes: 0,
            stock: 0
          });
        }
        weeklyStats.get(weekNum).sortantes++;
      }
    });

    // 3. Convertir en tableau trié et calculer le stock cumulé
    const weeksArray = Array.from(weeklyStats.values()).sort((a, b) => a.semaine - b.semaine);
    
    let stockCumule = 0;
    weeksArray.forEach(week => {
      stockCumule += (week.entrantes - week.sortantes);
      week.stock = stockCumule;
    });

    res.json({
      year,
      weeks: weeksArray
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques hebdomadaires:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération des statistiques hebdomadaires' 
    });
  }
};

module.exports = {
  getWeeklyStats,
  getAvailableYears
};