const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { exec } = require('child_process');
const path = require('path');
const ExcelJS = require('exceljs');

const router = express.Router();
const prisma = new PrismaClient();

router.use(authMiddleware);

router.get('/', adminMiddleware, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 100,
      search,
      userId,
      action,
      entite,
      dateFrom,
      dateTo
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Construction des filtres dynamiques
    const where = {};

    // Recherche globale dans action et detail
    if (search) {
      where.OR = [
        { action: { contains: search, mode: 'insensitive' } },
        { detail: { contains: search, mode: 'insensitive' } },
        { entite: { contains: search, mode: 'insensitive' } },
        {
          user: {
            OR: [
              { nom: { contains: search, mode: 'insensitive' } },
              { prenom: { contains: search, mode: 'insensitive' } },
              { identifiant: { contains: search, mode: 'insensitive' } }
            ]
          }
        }
      ];
    }

    // Filtres spécifiques
    if (userId) where.userId = parseInt(userId);
    if (action) where.action = action;
    if (entite) where.entite = entite;

    // Filtres de dates
    if (dateFrom || dateTo) {
      where.timestamp = {};
      if (dateFrom) {
        // Début de journée (00:00:00)
        const startOfDay = new Date(dateFrom);
        startOfDay.setHours(0, 0, 0, 0);
        where.timestamp.gte = startOfDay;
      }
      if (dateTo) {
        // Fin de journée (23:59:59.999)
        const endOfDay = new Date(dateTo);
        endOfDay.setHours(23, 59, 59, 999);
        where.timestamp.lte = endOfDay;
      }
    }

    const [logs, total] = await Promise.all([
      prisma.log.findMany({
        where,
        include: {
          user: {
            select: {
              nom: true,
              prenom: true,
              identifiant: true
            }
          }
        },
        orderBy: {
          timestamp: 'desc'
        },
        skip,
        take: parseInt(limit)
      }),
      prisma.log.count({ where })
    ]);

    res.json({
      logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      },
      filters: {
        search,
        userId,
        action,
        entite,
        dateFrom,
        dateTo
      }
    });
  } catch (error) {
    console.error('Get logs error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Endpoint pour exporter les logs
router.get('/export', adminMiddleware, async (req, res) => {
  try {
    const {
      format = 'excel',
      search,
      userId,
      action,
      entite,
      dateFrom,
      dateTo,
      limit = 10000 // Limite pour éviter les exports trop volumineux
    } = req.query;

    // Construction des mêmes filtres que pour la liste
    const where = {};

    if (search) {
      where.OR = [
        { action: { contains: search, mode: 'insensitive' } },
        { detail: { contains: search, mode: 'insensitive' } },
        { entite: { contains: search, mode: 'insensitive' } },
        {
          user: {
            OR: [
              { nom: { contains: search, mode: 'insensitive' } },
              { prenom: { contains: search, mode: 'insensitive' } },
              { identifiant: { contains: search, mode: 'insensitive' } }
            ]
          }
        }
      ];
    }

    if (userId) where.userId = parseInt(userId);
    if (action) where.action = action;
    if (entite) where.entite = entite;

    if (dateFrom || dateTo) {
      where.timestamp = {};
      if (dateFrom) {
        // Début de journée (00:00:00)
        const startOfDay = new Date(dateFrom);
        startOfDay.setHours(0, 0, 0, 0);
        where.timestamp.gte = startOfDay;
      }
      if (dateTo) {
        // Fin de journée (23:59:59.999)
        const endOfDay = new Date(dateTo);
        endOfDay.setHours(23, 59, 59, 999);
        where.timestamp.lte = endOfDay;
      }
    }

    const logs = await prisma.log.findMany({
      where,
      include: {
        user: {
          select: {
            nom: true,
            prenom: true,
            identifiant: true
          }
        }
      },
      orderBy: {
        timestamp: 'desc'
      },
      take: parseInt(limit)
    });

    if (format === 'csv') {
      // Export CSV
      const csvHeaders = 'Date;Utilisateur;Identifiant;Action;Entité;ID Entité;Détail\n';
      const csvRows = logs.map(log => {
        const date = new Date(log.timestamp).toLocaleString('fr-FR');
        const user = `${log.user.prenom} ${log.user.nom}`;
        const identifiant = log.user.identifiant;
        const action = log.action || '';
        const entite = log.entite || '';
        const entiteId = log.entiteId || '';
        const detail = (log.detail || '').replace(/"/g, '""').replace(/\n/g, ' ');

        return `"${date}";"${user}";"${identifiant}";"${action}";"${entite}";"${entiteId}";"${detail}"`;
      }).join('\n');

      const csvContent = csvHeaders + csvRows;

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="logs_${new Date().toISOString().split('T')[0]}.csv"`);
      res.send('\ufeff' + csvContent); // BOM pour Excel
    } else {
      // Export Excel
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Logs');

      // Headers
      worksheet.columns = [
        { header: 'Date', key: 'date', width: 20 },
        { header: 'Utilisateur', key: 'user', width: 25 },
        { header: 'Identifiant', key: 'identifiant', width: 15 },
        { header: 'Action', key: 'action', width: 15 },
        { header: 'Entité', key: 'entite', width: 15 },
        { header: 'ID Entité', key: 'entiteId', width: 10 },
        { header: 'Détail', key: 'detail', width: 50 }
      ];

      // Style des headers
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE6E6FA' }
      };

      // Données
      logs.forEach(log => {
        worksheet.addRow({
          date: new Date(log.timestamp).toLocaleString('fr-FR'),
          user: `${log.user.prenom} ${log.user.nom}`,
          identifiant: log.user.identifiant,
          action: log.action,
          entite: log.entite,
          entiteId: log.entiteId,
          detail: log.detail
        });
      });

      // Auto-ajustement des colonnes (sauf détail qui est déjà fixée)
      worksheet.columns.forEach((column, index) => {
        if (index !== 6) { // Pas la colonne détail
          let maxLength = 0;
          column.eachCell({ includeEmpty: true }, (cell) => {
            const length = cell.value ? cell.value.toString().length : 10;
            if (length > maxLength) maxLength = length;
          });
          column.width = Math.min(maxLength + 2, 50);
        }
      });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="logs_${new Date().toISOString().split('T')[0]}.xlsx"`);

      await workbook.xlsx.write(res);
      res.end();
    }

  } catch (error) {
    console.error('Export logs error:', error);
    res.status(500).json({ error: 'Erreur lors de l\'export' });
  }
});

// Endpoint pour récupérer les valeurs distinctes pour les filtres
router.get('/distinct-values', adminMiddleware, async (req, res) => {
  try {
    const [actions, entites] = await Promise.all([
      prisma.log.findMany({
        select: { action: true },
        distinct: ['action'],
        where: { action: { not: null } },
        orderBy: { action: 'asc' }
      }),
      prisma.log.findMany({
        select: { entite: true },
        distinct: ['entite'],
        where: { entite: { not: null } },
        orderBy: { entite: 'asc' }
      })
    ]);

    res.json({
      actions: actions.map(log => log.action).filter(Boolean),
      entites: entites.map(log => log.entite).filter(Boolean)
    });
  } catch (error) {
    console.error('Get distinct values error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Endpoint pour supprimer toutes les demandes
router.post('/delete-all-demandes', adminMiddleware, async (req, res) => {
  try {
    const scriptPath = path.join(__dirname, '../scripts/delete-all-demandes.js');
    
    exec(`node "${scriptPath}"`, { cwd: path.join(__dirname, '..') }, (error, stdout, stderr) => {
      if (error) {
        console.error('Erreur lors de l\'exécution du script delete-all-demandes:', error);
        return res.status(500).json({ 
          success: false, 
          error: 'Erreur lors de la suppression des demandes',
          details: error.message 
        });
      }
      
      if (stderr) {
        console.error('stderr:', stderr);
      }
      
      console.log('Sortie du script delete-all-demandes:', stdout);
      
      res.json({ 
        success: true, 
        message: 'Toutes les demandes ont été supprimées avec succès',
        output: stdout 
      });
    });
  } catch (error) {
    console.error('Erreur delete-all-demandes:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur serveur' 
    });
  }
});

// Endpoint pour générer des demandes de test
router.post('/generate-test-demandes', adminMiddleware, async (req, res) => {
  try {
    const scriptPath = path.join(__dirname, '../scripts/generate-test-demandes.js');
    
    exec(`node "${scriptPath}"`, { cwd: path.join(__dirname, '..') }, (error, stdout, stderr) => {
      if (error) {
        console.error('Erreur lors de l\'exécution du script generate-test-demandes:', error);
        return res.status(500).json({ 
          success: false, 
          error: 'Erreur lors de la génération des demandes de test',
          details: error.message 
        });
      }
      
      if (stderr) {
        console.error('stderr:', stderr);
      }
      
      console.log('Sortie du script generate-test-demandes:', stdout);
      
      res.json({ 
        success: true, 
        message: 'Les demandes de test ont été générées avec succès',
        output: stdout 
      });
    });
  } catch (error) {
    console.error('Erreur generate-test-demandes:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur serveur' 
    });
  }
});

module.exports = router;