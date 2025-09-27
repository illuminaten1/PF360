const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.id;

    // Récupérer le nombre de dossiers assignés à l'utilisateur
    const totalDossiers = await prisma.dossier.count({
      where: {
        assigneAId: userId
      }
    });

    // Récupérer le nombre de demandes assignées à l'utilisateur
    const totalDemandes = await prisma.demande.count({
      where: {
        assigneAId: userId
      }
    });

    // Pour l'instant, données mockées pour Ma revue
    const demandesSans2Mois = 3;

    const stats = {
      totalDossiers,
      totalDemandes,
      demandesSans2Mois
    };

    res.json(stats);
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques du dashboard:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
};

module.exports = {
  getDashboardStats
};