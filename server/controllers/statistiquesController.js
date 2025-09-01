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
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
      const week1 = new Date(d.getFullYear(), 0, 4);
      const weekNum = 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
      
      // Calculer les dates de début et fin de la semaine
      const mondayOfWeek = new Date(d);
      mondayOfWeek.setDate(mondayOfWeek.getDate() - (mondayOfWeek.getDay() + 6) % 7);
      
      const sundayOfWeek = new Date(mondayOfWeek);
      sundayOfWeek.setDate(sundayOfWeek.getDate() + 6);
      
      return {
        weekNum,
        startDate: mondayOfWeek,
        endDate: sundayOfWeek
      };
    };

    // 1. Récupérer les demandes entrantes par semaine
    const demandesEntrantesRaw = await prisma.demande.findMany({
      where: {
        dateReception: {
          gte: new Date(`${year}-01-01`),
          lt: new Date(`${year + 1}-01-01`)
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
      
      // Debug: Log pour comprendre les calculs
      if (year === 2025 && weekNum <= 2) {
        console.log(`Debug: Demande ${demande.id}, Date: ${demande.dateReception}, Semaine ISO: ${weekNum}`);
      }
      
      if (weekNum >= 1 && weekNum <= 53) {
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
          gte: new Date(`${year}-01-01`),
          lt: new Date(`${year + 1}-01-01`)
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
      
      if (weekNum >= 1 && weekNum <= 53) {
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