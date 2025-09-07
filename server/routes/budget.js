const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /budget/:annee - Récupérer le budget pour une année donnée
router.get('/:annee', authMiddleware, async (req, res) => {
  try {
    const annee = parseInt(req.params.annee);
    
    const budget = await prisma.budgetAnnuel.findUnique({
      where: { annee },
      include: {
        creePar: {
          select: { id: true, nom: true, prenom: true, identifiant: true }
        },
        modifiePar: {
          select: { id: true, nom: true, prenom: true, identifiant: true }
        }
      }
    });

    res.json(budget);
  } catch (error) {
    console.error('Erreur lors de la récupération du budget:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération du budget' });
  }
});

// POST /budget - Créer ou mettre à jour un budget (admin uniquement)
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { annee, budgetBase, abondements } = req.body;

    // Validation des données
    if (!annee || typeof budgetBase !== 'number') {
      return res.status(400).json({ 
        error: 'L\'année et le budget de base sont requis' 
      });
    }

    const budgetData = {
      annee: parseInt(annee),
      budgetBase: parseFloat(budgetBase),
      abondements: parseFloat(abondements || 0),
      modifiePar: { connect: { id: req.user.id } },
      modifieParId: req.user.id
    };

    // Vérifier si le budget existe déjà
    const existingBudget = await prisma.budgetAnnuel.findUnique({
      where: { annee: parseInt(annee) }
    });

    let budget;
    if (existingBudget) {
      // Mettre à jour le budget existant
      budget = await prisma.budgetAnnuel.update({
        where: { annee: parseInt(annee) },
        data: budgetData,
        include: {
          creePar: {
            select: { id: true, nom: true, prenom: true, identifiant: true }
          },
          modifiePar: {
            select: { id: true, nom: true, prenom: true, identifiant: true }
          }
        }
      });
    } else {
      // Créer un nouveau budget
      budget = await prisma.budgetAnnuel.create({
        data: {
          ...budgetData,
          creePar: { connect: { id: req.user.id } },
          creeParId: req.user.id
        },
        include: {
          creePar: {
            select: { id: true, nom: true, prenom: true, identifiant: true }
          },
          modifiePar: {
            select: { id: true, nom: true, prenom: true, identifiant: true }
          }
        }
      });
    }

    res.json(budget);
  } catch (error) {
    console.error('Erreur lors de la création/modification du budget:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la création/modification du budget' });
  }
});

// GET /budget - Récupérer tous les budgets disponibles
router.get('/', authMiddleware, async (req, res) => {
  try {
    const budgets = await prisma.budgetAnnuel.findMany({
      orderBy: { annee: 'desc' },
      include: {
        creePar: {
          select: { id: true, nom: true, prenom: true, identifiant: true }
        },
        modifiePar: {
          select: { id: true, nom: true, prenom: true, identifiant: true }
        }
      }
    });

    res.json(budgets);
  } catch (error) {
    console.error('Erreur lors de la récupération des budgets:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération des budgets' });
  }
});

module.exports = router;