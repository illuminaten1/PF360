const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const { search, region, specialisation, includeInactive } = req.query;
    
    const where = {};
    
    // Par défaut, ne montrer que les avocats actifs
    if (includeInactive !== 'true') {
      where.active = true;
    }
    
    if (search) {
      where.OR = [
        { nom: { contains: search, mode: 'insensitive' } },
        { prenom: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }
    if (region) {
      where.region = { contains: region, mode: 'insensitive' };
    }
    if (specialisation) {
      where.specialisation = { contains: specialisation, mode: 'insensitive' };
    }

    const avocats = await prisma.avocat.findMany({
      where,
      include: {
        creePar: {
          select: { nom: true, prenom: true, grade: true }
        },
        modifiePar: {
          select: { nom: true, prenom: true, grade: true }
        }
      },
      orderBy: {
        nom: 'asc'
      }
    });

    // Parser le JSON des villes d'intervention
    const avocatsWithParsedData = avocats.map(avocat => ({
      ...avocat,
      villesIntervention: avocat.villesIntervention ? 
        (typeof avocat.villesIntervention === 'string' ? 
          JSON.parse(avocat.villesIntervention) : 
          avocat.villesIntervention) : 
        []
    }));

    res.json(avocatsWithParsedData);
  } catch (error) {
    console.error('Get avocats error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/', async (req, res) => {
  try {
    const {
      nom,
      prenom,
      region,
      adressePostale,
      telephonePublic1,
      telephonePublic2,
      telephonePrive,
      email,
      siretOuRidet,
      villesIntervention,
      notes,
      specialisation,
      titulaireDuCompteBancaire,
      codeEtablissement,
      codeGuichet,
      numeroDeCompte,
      cle
    } = req.body;

    if (!nom || !prenom) {
      return res.status(400).json({ error: 'Le nom et le prénom sont obligatoires' });
    }

    const avocat = await prisma.avocat.create({
      data: {
        nom,
        prenom,
        region,
        adressePostale,
        telephonePublic1,
        telephonePublic2,
        telephonePrive,
        email,
        siretOuRidet,
        villesIntervention: villesIntervention ? JSON.stringify(villesIntervention) : null,
        notes,
        specialisation,
        titulaireDuCompteBancaire,
        codeEtablissement,
        codeGuichet,
        numeroDeCompte,
        cle,
        creeParId: req.user.id
      },
      include: {
        creePar: {
          select: { nom: true, prenom: true, grade: true }
        }
      }
    });

    res.status(201).json(avocat);
  } catch (error) {
    console.error('Create avocat error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const avocat = await prisma.avocat.findUnique({
      where: { id, active: true },
      include: {
        creePar: {
          select: { nom: true, prenom: true, grade: true }
        },
        modifiePar: {
          select: { nom: true, prenom: true, grade: true }
        },
        conventions: {
          include: {
            dossier: {
              select: { numero: true }
            }
          }
        }
      }
    });

    if (!avocat) {
      return res.status(404).json({ error: 'Avocat non trouvé' });
    }

    if (avocat.villesIntervention) {
      try {
        avocat.villesIntervention = JSON.parse(avocat.villesIntervention);
      } catch (e) {
        avocat.villesIntervention = [];
      }
    }


    res.json(avocat);
  } catch (error) {
    console.error('Get avocat by id error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nom,
      prenom,
      region,
      adressePostale,
      telephonePublic1,
      telephonePublic2,
      telephonePrive,
      email,
      siretOuRidet,
      villesIntervention,
      notes,
      specialisation,
      titulaireDuCompteBancaire,
      codeEtablissement,
      codeGuichet,
      numeroDeCompte,
      cle
    } = req.body;

    const avocatExistant = await prisma.avocat.findUnique({
      where: { id, active: true }
    });

    if (!avocatExistant) {
      return res.status(404).json({ error: 'Avocat non trouvé' });
    }

    if (!nom || !prenom) {
      return res.status(400).json({ error: 'Le nom et le prénom sont obligatoires' });
    }

    const avocat = await prisma.avocat.update({
      where: { id },
      data: {
        nom,
        prenom,
        region,
        adressePostale,
        telephonePublic1,
        telephonePublic2,
        telephonePrive,
        email,
        siretOuRidet,
        villesIntervention: villesIntervention ? JSON.stringify(villesIntervention) : null,
        notes,
        specialisation,
        titulaireDuCompteBancaire,
        codeEtablissement,
        codeGuichet,
        numeroDeCompte,
        cle,
        modifieParId: req.user.id
      },
      include: {
        creePar: {
          select: { nom: true, prenom: true, grade: true }
        },
        modifiePar: {
          select: { nom: true, prenom: true, grade: true }
        }
      }
    });

    res.json(avocat);
  } catch (error) {
    console.error('Update avocat error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const avocatExistant = await prisma.avocat.findUnique({
      where: { id }
    });

    if (!avocatExistant) {
      return res.status(404).json({ error: 'Avocat non trouvé' });
    }

    if (!avocatExistant.active) {
      return res.status(400).json({ error: 'Avocat déjà désactivé' });
    }

    await prisma.avocat.update({
      where: { id },
      data: { 
        active: false,
        modifieParId: req.user.id
      }
    });

    res.json({ message: 'Avocat désactivé avec succès' });
  } catch (error) {
    console.error('Delete avocat error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.put('/:id/activate', async (req, res) => {
  try {
    const { id } = req.params;
    
    const avocatExistant = await prisma.avocat.findUnique({
      where: { id }
    });

    if (!avocatExistant) {
      return res.status(404).json({ error: 'Avocat non trouvé' });
    }

    if (avocatExistant.active) {
      return res.status(400).json({ error: 'Avocat déjà actif' });
    }

    await prisma.avocat.update({
      where: { id },
      data: { 
        active: true,
        modifieParId: req.user.id
      }
    });

    res.json({ message: 'Avocat réactivé avec succès' });
  } catch (error) {
    console.error('Activate avocat error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.get('/suggestions/villes', async (_req, res) => {
  try {
    const avocats = await prisma.avocat.findMany({
      where: { 
        active: true,
        villesIntervention: { not: null }
      },
      select: { villesIntervention: true }
    });

    const villesSet = new Set();
    
    avocats.forEach(avocat => {
      if (avocat.villesIntervention) {
        try {
          const villes = typeof avocat.villesIntervention === 'string' 
            ? JSON.parse(avocat.villesIntervention)
            : avocat.villesIntervention;
          
          if (Array.isArray(villes)) {
            villes.forEach(ville => {
              if (ville && ville.trim()) {
                villesSet.add(ville.trim());
              }
            });
          }
        } catch (e) {
          // Ignorer les erreurs de parsing JSON
        }
      }
    });

    const villesUniques = Array.from(villesSet).sort();
    res.json(villesUniques);
  } catch (error) {
    console.error('Get villes suggestions error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;