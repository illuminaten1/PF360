const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const getWeeklyStats = async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    
    // Créer un tableau pour les 52 semaines avec des valeurs par défaut
    const weeklyStats = Array.from({ length: 52 }, (_, i) => ({
      semaine: i + 1,
      entrantes: 0,
      sortantes: 0,
      stock: 0
    }));

    // Fonction pour obtenir le numéro de semaine ISO
    const getISOWeek = (date) => {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
      const week1 = new Date(d.getFullYear(), 0, 4);
      return 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
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
      const weekNum = getISOWeek(demande.dateReception);
      if (weekNum >= 1 && weekNum <= 52) {
        weeklyStats[weekNum - 1].entrantes++;
      }
    });

    // 2. Récupérer les demandes sortantes (première décision uniquement)
    const decisionsInYear = await prisma.decision.findMany({
      where: {
        createdAt: {
          gte: new Date(`${year}-01-01`),
          lt: new Date(`${year + 1}-01-01`)
        }
      },
      select: {
        id: true,
        createdAt: true,
        demandes: {
          select: {
            demandeId: true
          }
        }
      }
    });

    // Grouper par demande et trouver la première décision pour chaque demande
    const premiersDecisionsByDemande = new Map();
    
    decisionsInYear.forEach(decision => {
      decision.demandes.forEach(dd => {
        const currentFirst = premiersDecisionsByDemande.get(dd.demandeId);
        if (!currentFirst || decision.createdAt < currentFirst) {
          premiersDecisionsByDemande.set(dd.demandeId, decision.createdAt);
        }
      });
    });

    const demandesSortantesRaw = Array.from(premiersDecisionsByDemande.entries()).map(([demandeId, date]) => ({
      demandeId,
      premiere_decision_date: date
    }));

    // Grouper les sorties par semaine
    demandesSortantesRaw.forEach(item => {
      const weekNum = getISOWeek(item.premiere_decision_date);
      if (weekNum >= 1 && weekNum <= 52) {
        weeklyStats[weekNum - 1].sortantes++;
      }
    });

    // 3. Calculer le stock cumulé pour chaque semaine
    let stockCumule = 0;
    weeklyStats.forEach(week => {
      stockCumule += (week.entrantes - week.sortantes);
      week.stock = stockCumule;
    });

    res.json({
      year,
      weeks: weeklyStats
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques hebdomadaires:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération des statistiques hebdomadaires' 
    });
  }
};

module.exports = {
  getWeeklyStats
};