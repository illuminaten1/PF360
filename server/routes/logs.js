const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { exec } = require('child_process');
const path = require('path');

const router = express.Router();
const prisma = new PrismaClient();

router.use(authMiddleware);

router.get('/', adminMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;

    const logs = await prisma.log.findMany({
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
      skip: parseInt(skip),
      take: parseInt(limit)
    });

    const total = await prisma.log.count();

    res.json({
      logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get logs error:', error);
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