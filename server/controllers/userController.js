const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');
const { logAction } = require('../utils/logger');

const prisma = new PrismaClient();

const createUserSchema = z.object({
  identifiant: z.string().min(3, 'Identifiant doit contenir au moins 3 caractères'),
  password: z.string().min(6, 'Mot de passe doit contenir au moins 6 caractères'),
  nom: z.string().min(1, 'Nom requis'),
  prenom: z.string().min(1, 'Prénom requis'),
  mail: z.string().email('Email invalide'),
  grade: z.string().optional(),
  telephone: z.string().optional(),
  role: z.enum(['ADMIN', 'UTILISATEUR']).default('UTILISATEUR')
});

const updateUserSchema = z.object({
  identifiant: z.string().min(3, 'Identifiant doit contenir au moins 3 caractères').optional(),
  password: z.string().min(6, 'Mot de passe doit contenir au moins 6 caractères').optional(),
  nom: z.string().min(1, 'Nom requis').optional(),
  prenom: z.string().min(1, 'Prénom requis').optional(),
  mail: z.string().email('Email invalide').optional(),
  grade: z.string().optional(),
  telephone: z.string().optional(),
  role: z.enum(['ADMIN', 'UTILISATEUR']).optional()
});

// Récupérer tous les utilisateurs avec recherche
const getUsers = async (req, res) => {
  try {
    const { search } = req.query;
    
    const where = search ? {
      OR: [
        { nom: { contains: search, mode: 'insensitive' } },
        { prenom: { contains: search, mode: 'insensitive' } },
        { mail: { contains: search, mode: 'insensitive' } },
        { identifiant: { contains: search, mode: 'insensitive' } }
      ]
    } : {};

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        identifiant: true,
        nom: true,
        prenom: true,
        mail: true,
        role: true,
        grade: true,
        telephone: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    await logAction(req.user.id, 'VIEW_USERS', 'USER', null, `Consulté la liste des utilisateurs${search ? ` (recherche: ${search})` : ''}`);

    res.json({ users });
  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Récupérer les statistiques des utilisateurs
const getUsersStats = async (req, res) => {
  try {
    const [totalUsers, adminUsers] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'ADMIN' } })
    ]);

    // Pour cet exemple, nous considérons tous les utilisateurs comme actifs
    // Vous pourriez ajouter un champ 'active' ou une logique basée sur la dernière connexion
    const activeUsers = totalUsers;

    res.json({
      totalUsers,
      adminUsers,
      activeUsers
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques utilisateurs:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Créer un utilisateur
const createUser = async (req, res) => {
  try {
    const validatedData = createUserSchema.parse(req.body);
    
    // Vérifier si l'identifiant ou l'email existe déjà
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { identifiant: validatedData.identifiant },
          { mail: validatedData.mail }
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({ 
        message: existingUser.identifiant === validatedData.identifiant 
          ? 'Cet identifiant est déjà utilisé' 
          : 'Cet email est déjà utilisé' 
      });
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(validatedData.password, 12);

    const user = await prisma.user.create({
      data: {
        ...validatedData,
        password: hashedPassword
      },
      select: {
        id: true,
        identifiant: true,
        nom: true,
        prenom: true,
        mail: true,
        role: true,
        grade: true,
        telephone: true,
        createdAt: true,
        updatedAt: true
      }
    });

    await logAction(req.user.id, 'CREATE_USER', 'USER', user.id, `Créé l'utilisateur: ${user.identifiant}`);

    res.status(201).json(user);
  } catch (error) {
    console.error('Erreur lors de la création de l\'utilisateur:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: 'Données invalides',
        errors: error.errors.map(e => ({ field: e.path[0], message: e.message }))
      });
    }
    
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Mettre à jour un utilisateur
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = updateUserSchema.parse(req.body);

    // Vérifier si l'utilisateur existe
    const existingUser = await prisma.user.findUnique({
      where: { id }
    });

    if (!existingUser) {
      return res.status(404).json({ message: 'Utilisateur introuvable' });
    }

    // Si on met à jour l'identifiant ou l'email, vérifier qu'ils ne sont pas déjà utilisés par un autre utilisateur
    if (validatedData.identifiant || validatedData.mail) {
      const duplicateUser = await prisma.user.findFirst({
        where: {
          AND: [
            { id: { not: id } },
            {
              OR: [
                validatedData.identifiant ? { identifiant: validatedData.identifiant } : {},
                validatedData.mail ? { mail: validatedData.mail } : {}
              ]
            }
          ]
        }
      });

      if (duplicateUser) {
        return res.status(400).json({ 
          message: duplicateUser.identifiant === validatedData.identifiant 
            ? 'Cet identifiant est déjà utilisé' 
            : 'Cet email est déjà utilisé' 
        });
      }
    }

    // Hasher le nouveau mot de passe si fourni
    const updateData = { ...validatedData };
    if (validatedData.password) {
      updateData.password = await bcrypt.hash(validatedData.password, 12);
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        identifiant: true,
        nom: true,
        prenom: true,
        mail: true,
        role: true,
        grade: true,
        telephone: true,
        createdAt: true,
        updatedAt: true
      }
    });

    await logAction(req.user.id, 'UPDATE_USER', 'USER', user.id, `Modifié l'utilisateur: ${user.identifiant}`);

    res.json(user);
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: 'Données invalides',
        errors: error.errors.map(e => ({ field: e.path[0], message: e.message }))
      });
    }
    
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Supprimer un utilisateur
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier si l'utilisateur existe
    const existingUser = await prisma.user.findUnique({
      where: { id }
    });

    if (!existingUser) {
      return res.status(404).json({ message: 'Utilisateur introuvable' });
    }

    // Empêcher la suppression de son propre compte
    if (req.user.id === id) {
      return res.status(400).json({ message: 'Vous ne pouvez pas supprimer votre propre compte' });
    }

    await prisma.user.delete({
      where: { id }
    });

    await logAction(req.user.id, 'DELETE_USER', 'USER', id, `Supprimé l'utilisateur: ${existingUser.identifiant}`);

    res.json({ message: 'Utilisateur supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'utilisateur:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

module.exports = {
  getUsers,
  getUsersStats,
  createUser,
  updateUser,
  deleteUser
};