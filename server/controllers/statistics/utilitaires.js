const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

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

module.exports = {
  getAnneesDisponibles
};