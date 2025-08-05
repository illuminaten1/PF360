const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');
const { logAction } = require('../utils/logger');

const prisma = new PrismaClient();

const loginSchema = z.object({
  identifiant: z.string().min(1, 'Identifiant requis'),
  password: z.string().min(1, 'Mot de passe requis')
});

const registerSchema = z.object({
  identifiant: z.string().min(3, 'Identifiant doit contenir au moins 3 caractères'),
  password: z.string().min(6, 'Mot de passe doit contenir au moins 6 caractères'),
  nom: z.string().min(1, 'Nom requis'),
  prenom: z.string().min(1, 'Prénom requis'),
  mail: z.string().email('Email invalide'),
  grade: z.string().optional(),
  telephone: z.string().optional(),
  role: z.enum(['ADMIN', 'UTILISATEUR']).default('UTILISATEUR')
});

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

const login = async (req, res) => {
  try {
    const validatedData = loginSchema.parse(req.body);
    const { identifiant, password } = validatedData;

    const user = await prisma.user.findUnique({
      where: { identifiant }
    });

    if (!user) {
      return res.status(401).json({ error: 'Identifiants invalides' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Identifiants invalides' });
    }

    const token = generateToken(user.id);

    await logAction(user.id, 'LOGIN', 'Connexion utilisateur');

    res.json({
      token,
      user: {
        id: user.id,
        identifiant: user.identifiant,
        nom: user.nom,
        prenom: user.prenom,
        mail: user.mail,
        role: user.role,
        grade: user.grade
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Login error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const register = async (req, res) => {
  try {
    const validatedData = registerSchema.parse(req.body);
    const { identifiant, password, nom, prenom, mail, grade, telephone, role } = validatedData;

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { identifiant },
          { mail }
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({ 
        error: existingUser.identifiant === identifiant 
          ? 'Cet identifiant existe déjà' 
          : 'Cet email existe déjà' 
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        identifiant,
        password: hashedPassword,
        nom,
        prenom,
        mail,
        grade,
        telephone,
        role
      }
    });

    await logAction(user.id, 'REGISTER', 'Création de compte');

    const token = generateToken(user.id);

    res.status(201).json({
      token,
      user: {
        id: user.id,
        identifiant: user.identifiant,
        nom: user.nom,
        prenom: user.prenom,
        mail: user.mail,
        role: user.role,
        grade: user.grade
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Register error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const me = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        identifiant: true,
        nom: true,
        prenom: true,
        mail: true,
        role: true,
        grade: true,
        telephone: true,
        createdAt: true
      }
    });

    res.json({ user });
  } catch (error) {
    console.error('Me error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

module.exports = { login, register, me };