const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/auth');
const { logAction } = require('../utils/logger');

const router = express.Router();
const prisma = new PrismaClient();

router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const grades = await prisma.grade.findMany({
      orderBy: [
        { ordre: 'asc' }
      ]
    });

    await logAction(req.user.id, 'LIST_GRADES', `Consultation des grades (${grades.length} résultats)`);

    res.json(grades);
  } catch (error) {
    console.error('Get grades error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Récupérer les grades pour les sélecteurs (format simplifié)
router.get('/options', async (req, res) => {
  try {
    const grades = await prisma.grade.findMany({
      select: {
        id: true,
        ordre: true,
        gradeComplet: true,
        gradeAbrege: true
      },
      orderBy: [
        { ordre: 'asc' }
      ]
    });

    res.json(grades);
  } catch (error) {
    console.error('Get grades options error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Récupérer les statistiques des grades
router.get('/stats', async (req, res) => {
  try {
    const totalGrades = await prisma.grade.count();
    
    const stats = {
      totalGrades
    };
    
    res.json(stats);
  } catch (error) {
    console.error('Get grades stats error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Route pour réorganiser les ordres des grades (DOIT être avant la route /:id)
router.put('/reorder', async (req, res) => {
  try {
    const { gradesList } = req.body;
    
    if (!Array.isArray(gradesList)) {
      return res.status(400).json({ error: 'La liste des grades doit être un tableau' });
    }

    // Utiliser une transaction pour mettre à jour tous les ordres
    await prisma.$transaction(async (tx) => {
      // Étape 1: Assigner des ordres temporaires uniques pour éviter les conflits
      for (let i = 0; i < gradesList.length; i++) {
        const grade = gradesList[i];
        const tempOrder = 10000 + i; // Ordre temporaire unique
        await tx.grade.update({
          where: { id: grade.id },
          data: { ordre: tempOrder }
        });
      }
      
      // Étape 2: Assigner les ordres finaux
      for (const grade of gradesList) {
        await tx.grade.update({
          where: { id: grade.id },
          data: { ordre: grade.ordre }
        });
      }
    });

    await logAction(req.user.id, 'REORDER_GRADES', `Réorganisation des grades (${gradesList.length} éléments)`);

    res.json({ message: 'Ordres mis à jour avec succès' });
  } catch (error) {
    console.error('Reorder grades error:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la réorganisation' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { gradeComplet, gradeAbrege } = req.body;
    
    if (!gradeComplet || !gradeAbrege) {
      return res.status(400).json({ error: 'Tous les champs sont requis' });
    }

    const existingGrade = await prisma.grade.findUnique({
      where: { gradeComplet }
    });

    if (existingGrade) {
      return res.status(400).json({ error: 'Un grade avec cette description existe déjà' });
    }

    // Trouver le prochain ordre disponible
    const maxGrade = await prisma.grade.findFirst({
      orderBy: { ordre: 'desc' }
    });
    const nextOrdre = (maxGrade?.ordre || 0) + 1;

    const grade = await prisma.grade.create({
      data: { 
        ordre: nextOrdre,
        gradeComplet,
        gradeAbrege
      }
    });

    await logAction(req.user.id, 'CREATE_GRADE', `Création grade ${grade.gradeComplet}`, 'GRADE', grade.id);

    res.status(201).json(grade);
  } catch (error) {
    console.error('Create grade error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { gradeComplet, gradeAbrege } = req.body;
    
    if (!gradeComplet || !gradeAbrege) {
      return res.status(400).json({ error: 'Tous les champs sont requis' });
    }

    const existingGrade = await prisma.grade.findFirst({
      where: { gradeComplet, NOT: { id } }
    });

    if (existingGrade) {
      return res.status(400).json({ error: 'Un grade avec cette description existe déjà' });
    }

    const grade = await prisma.grade.update({
      where: { id },
      data: { 
        gradeComplet,
        gradeAbrege
      }
    });

    await logAction(req.user.id, 'UPDATE_GRADE', `Modification grade ${grade.gradeComplet}`, 'GRADE', grade.id);

    res.json(grade);
  } catch (error) {
    console.error('Update grade error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Grade introuvable' });
    }
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const grade = await prisma.grade.findUnique({ where: { id } });
    
    await prisma.grade.delete({
      where: { id }
    });

    await logAction(req.user.id, 'DELETE_GRADE', `Suppression grade ${grade?.gradeComplet}`, 'GRADE', id);

    res.json({ message: 'Grade supprimé avec succès' });
  } catch (error) {
    console.error('Delete grade error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Grade introuvable' });
    }
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;