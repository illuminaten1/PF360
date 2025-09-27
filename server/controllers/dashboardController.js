const db = require('../config/database');

const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.id;

    // Récupérer le nombre de dossiers de l'utilisateur
    const [dossiersResult] = await db.query(`
      SELECT COUNT(*) as total
      FROM dossiers
      WHERE createdBy = ? OR responsable_id = ?
    `, [userId, userId]);

    // Récupérer le nombre de demandes de l'utilisateur
    const [demandesResult] = await db.query(`
      SELECT COUNT(*) as total
      FROM demandes
      WHERE createdBy = ? OR responsable_id = ?
    `, [userId, userId]);

    // Récupérer le nombre de demandes en revue (sans décision depuis plus de 2 mois)
    const [revueResult] = await db.query(`
      SELECT COUNT(*) as total
      FROM demandes d
      WHERE (d.createdBy = ? OR d.responsable_id = ?)
        AND d.statut != 'cloture'
        AND (
          d.date_decision IS NULL
          OR d.date_decision < DATE_SUB(NOW(), INTERVAL 2 MONTH)
        )
    `, [userId, userId]);

    const stats = {
      totalDossiers: dossiersResult[0]?.total || 0,
      totalDemandes: demandesResult[0]?.total || 0,
      demandesSans2Mois: revueResult[0]?.total || 0
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