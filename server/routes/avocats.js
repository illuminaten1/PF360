const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/auth');
const { logAction } = require('../utils/logger');

const router = express.Router();
const prisma = new PrismaClient();

router.use(authMiddleware);

// Get facets for filters
router.get('/facets', async (req, res) => {
  try {
    const { includeInactive } = req.query;

    const where = {};
    if (includeInactive !== 'true') {
      where.active = true;
    }

    const [regions, specialisations, villes] = await Promise.all([
      // Get unique regions
      prisma.avocat.findMany({
        where,
        select: { region: true },
        distinct: ['region']
      }),
      // Get unique specialisations
      prisma.avocat.findMany({
        where,
        select: { specialisation: true },
        distinct: ['specialisation']
      }),
      // Get all villes d'intervention
      prisma.avocat.findMany({
        where: {
          ...where,
          villesIntervention: { not: null }
        },
        select: { villesIntervention: true }
      })
    ]);

    // Extract and deduplicate villes
    const villesSet = new Set();
    villes.forEach(avocat => {
      if (avocat.villesIntervention) {
        try {
          const villesArray = typeof avocat.villesIntervention === 'string'
            ? JSON.parse(avocat.villesIntervention)
            : avocat.villesIntervention;

          if (Array.isArray(villesArray)) {
            villesArray.forEach(ville => {
              if (ville && ville.trim()) {
                villesSet.add(ville.trim());
              }
            });
          }
        } catch (e) {
          // Ignore parsing errors
        }
      }
    });

    res.json({
      regions: regions
        .map(r => r.region)
        .filter(r => r && r.trim())
        .sort(),
      specialisations: specialisations
        .map(s => s.specialisation)
        .filter(s => s && s.trim())
        .sort(),
      villes: Array.from(villesSet).sort()
    });
  } catch (error) {
    console.error('Get avocats facets error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Get avocats with pagination and filtering (server-side)
router.get('/paginated', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      nom,
      prenom,
      region,
      specialisation,
      email,
      telephonePublic1,
      villesIntervention,
      sortBy,
      sortOrder,
      includeInactive
    } = req.query;

    const skip = (page - 1) * limit;
    const where = {};

    // Par défaut, ne montrer que les avocats actifs
    if (includeInactive !== 'true') {
      where.active = true;
    }

    // Global search
    if (search) {
      const searchTerms = search.trim().split(/\s+/);

      if (searchTerms.length === 1) {
        const term = searchTerms[0];
        where.OR = [
          { nom: { contains: term, mode: 'insensitive' } },
          { prenom: { contains: term, mode: 'insensitive' } },
          { email: { contains: term, mode: 'insensitive' } },
          { region: { contains: term, mode: 'insensitive' } },
          { specialisation: { contains: term, mode: 'insensitive' } },
          { telephonePublic1: { contains: term } },
          { telephonePublic2: { contains: term } }
        ];
      } else if (searchTerms.length === 2) {
        const [term1, term2] = searchTerms;
        where.OR = [
          // Search on each term individually
          { email: { contains: search, mode: 'insensitive' } },
          { region: { contains: search, mode: 'insensitive' } },
          { specialisation: { contains: search, mode: 'insensitive' } },
          // Name combinations in both directions
          {
            AND: [
              { prenom: { contains: term1, mode: 'insensitive' } },
              { nom: { contains: term2, mode: 'insensitive' } }
            ]
          },
          {
            AND: [
              { nom: { contains: term1, mode: 'insensitive' } },
              { prenom: { contains: term2, mode: 'insensitive' } }
            ]
          }
        ];
      } else {
        where.OR = [
          { nom: { contains: search, mode: 'insensitive' } },
          { prenom: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { region: { contains: search, mode: 'insensitive' } },
          { specialisation: { contains: search, mode: 'insensitive' } }
        ];
      }
    }

    // Individual column filters
    if (nom) where.nom = { contains: nom, mode: 'insensitive' };
    if (prenom) where.prenom = { contains: prenom, mode: 'insensitive' };
    if (email) where.email = { contains: email, mode: 'insensitive' };
    if (telephonePublic1) {
      where.OR = [
        { telephonePublic1: { contains: telephonePublic1 } },
        { telephonePublic2: { contains: telephonePublic1 } }
      ];
    }

    // Filtering by region (can be array for multi-select)
    if (region) {
      const regions = Array.isArray(region) ? region : [region];
      where.region = { in: regions };
    }

    // Filtering by specialisation (can be array for multi-select)
    if (specialisation) {
      const specialisations = Array.isArray(specialisation) ? specialisation : [specialisation];
      where.specialisation = { in: specialisations };
    }

    // Filtering by villesIntervention - requires special handling since it's JSON
    // We'll handle this in post-processing if needed

    // Build orderBy clause
    let orderBy = { nom: 'asc' }; // Default sort

    if (sortBy) {
      const validSortFields = {
        'nom': 'nom',
        'prenom': 'prenom',
        'region': 'region',
        'specialisation': 'specialisation',
        'email': 'email',
        'telephonePublic1': 'telephonePublic1'
      };

      if (validSortFields[sortBy]) {
        const direction = sortOrder === 'desc' ? 'desc' : 'asc';
        orderBy = { [validSortFields[sortBy]]: direction };
      }
    }

    // Fetch data
    let avocats = await prisma.avocat.findMany({
      where,
      include: {
        creePar: {
          select: { nom: true, prenom: true, grade: true }
        },
        modifiePar: {
          select: { nom: true, prenom: true, grade: true }
        }
      },
      orderBy,
      skip: parseInt(skip),
      take: parseInt(limit)
    });

    // Parse villesIntervention from JSON
    avocats = avocats.map(avocat => ({
      ...avocat,
      villesIntervention: avocat.villesIntervention
        ? (typeof avocat.villesIntervention === 'string'
          ? JSON.parse(avocat.villesIntervention)
          : avocat.villesIntervention)
        : []
    }));

    // Filter by villesIntervention if provided (post-processing)
    if (villesIntervention) {
      const villesFilter = Array.isArray(villesIntervention) ? villesIntervention : [villesIntervention];
      avocats = avocats.filter(avocat =>
        avocat.villesIntervention && avocat.villesIntervention.some(v =>
          villesFilter.includes(v)
        )
      );
    }

    // Get total count
    const total = await prisma.avocat.count({ where });

    await logAction(req.user.id, 'LIST_AVOCATS', `Consultation des avocats paginés (page ${page}, ${avocats.length} résultats)`);

    res.json({
      avocats,
      total,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get avocats paginated error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

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

    await logAction(req.user.id, 'LIST_AVOCATS', `Consultation des avocats (${avocatsWithParsedData.length} résultats)`);

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

    await logAction(req.user.id, 'CREATE_AVOCAT', `Création avocat ${avocat.nom} ${avocat.prenom}`, 'Avocat', avocat.id);

    res.status(201).json(avocat);
  } catch (error) {
    console.error('Create avocat error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Route suggestions/villes AVANT /:id pour éviter le conflit
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

    await logAction(req.user.id, 'VIEW_AVOCAT', `Consultation avocat ${avocat.nom} ${avocat.prenom}`, 'Avocat', avocat.id);

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

    await logAction(req.user.id, 'UPDATE_AVOCAT', `Modification avocat ${avocat.nom} ${avocat.prenom}`, 'Avocat', avocat.id);

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

    await logAction(req.user.id, 'DEACTIVATE_AVOCAT', `Désactivation avocat ${avocatExistant.nom} ${avocatExistant.prenom}`, 'Avocat', id);

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

    await logAction(req.user.id, 'ACTIVATE_AVOCAT', `Réactivation avocat ${avocatExistant.nom} ${avocatExistant.prenom}`, 'Avocat', id);

    res.json({ message: 'Avocat réactivé avec succès' });
  } catch (error) {
    console.error('Activate avocat error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;