const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { authMiddleware } = require('../middleware/auth');
const { logAction } = require('../utils/logger');

const router = express.Router();

// Configuration multer pour l'upload de fichiers
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/templates');
    // Créer le répertoire s'il n'existe pas
    fs.mkdir(uploadDir, { recursive: true }).then(() => {
      cb(null, uploadDir);
    }).catch(err => {
      cb(err);
    });
  },
  filename: (req, file, cb) => {
    const templateType = req.params.type;
    const extension = path.extname(file.originalname);
    cb(null, `${templateType}_custom${extension}`);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    // Vérifier que le fichier est un DOCX
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        path.extname(file.originalname).toLowerCase() === '.docx') {
      cb(null, true);
    } else {
      cb(new Error('Le fichier doit être au format DOCX'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max
  }
});

// Middleware d'authentification et admin uniquement
router.use(authMiddleware);
router.use((req, res, next) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Accès refusé. Droits administrateur requis.' });
  }
  next();
});

// Types de templates supportés
const TEMPLATE_TYPES = {
  decision: 'decision_template.docx',
  convention: 'convention_template.docx',
  avenant: 'avenant_template.docx',
  reglement: 'reglement_template.docx'
};

// Chemins des templates
const TEMPLATES_DIR = path.join(__dirname, '../uploads/templates');
const DEFAULT_TEMPLATES_DIR = path.join(__dirname, '../templates/default');

// Fonction pour obtenir le statut d'un template
const getTemplateStatus = async (templateType) => {
  try {
    const customPath = path.join(TEMPLATES_DIR, `${templateType}_custom.docx`);
    await fs.access(customPath);
    return 'custom';
  } catch {
    return 'default';
  }
};

// Fonction pour obtenir le chemin du template actuel
const getTemplatePath = async (templateType) => {
  const customPath = path.join(TEMPLATES_DIR, `${templateType}_custom.docx`);
  const defaultPath = path.join(DEFAULT_TEMPLATES_DIR, TEMPLATE_TYPES[templateType]);
  
  try {
    await fs.access(customPath);
    return customPath;
  } catch {
    return defaultPath;
  }
};

// GET /api/templates/status - Récupérer le statut de tous les templates
router.get('/status', async (req, res) => {
  try {
    const status = {};
    
    for (const templateType of Object.keys(TEMPLATE_TYPES)) {
      status[templateType] = await getTemplateStatus(templateType);
    }
    
    res.json(status);
  } catch (error) {
    console.error('Get templates status error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/templates/:type/download - Télécharger un template
router.get('/:type/download', async (req, res) => {
  try {
    const { type } = req.params;
    
    if (!TEMPLATE_TYPES[type]) {
      return res.status(400).json({ error: 'Type de template invalide' });
    }
    
    const templatePath = await getTemplatePath(type);
    
    try {
      await fs.access(templatePath);
    } catch {
      return res.status(404).json({ error: 'Template non trouvé' });
    }
    
    const filename = TEMPLATE_TYPES[type];
    
    await logAction(req.user.id, 'DOWNLOAD_TEMPLATE', `Téléchargement du template ${type}`, 'Template', type);
    
    res.download(templatePath, filename, (err) => {
      if (err) {
        console.error('Download error:', err);
        res.status(500).json({ error: 'Erreur lors du téléchargement' });
      }
    });
    
  } catch (error) {
    console.error('Download template error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/templates/:type/upload - Uploader un template personnalisé
router.post('/:type/upload', upload.single('template'), async (req, res) => {
  try {
    const { type } = req.params;
    
    if (!TEMPLATE_TYPES[type]) {
      return res.status(400).json({ error: 'Type de template invalide' });
    }
    
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier uploadé' });
    }
    
    await logAction(req.user.id, 'UPLOAD_TEMPLATE', `Upload d'un template personnalisé ${type}`, 'Template', type);
    
    res.json({ 
      message: 'Template uploadé avec succès',
      status: 'custom',
      filename: req.file.filename
    });
    
  } catch (error) {
    console.error('Upload template error:', error);
    if (error.message === 'Le fichier doit être au format DOCX') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/templates/:type/restore - Restaurer un template par défaut
router.post('/:type/restore', async (req, res) => {
  try {
    const { type } = req.params;
    
    if (!TEMPLATE_TYPES[type]) {
      return res.status(400).json({ error: 'Type de template invalide' });
    }
    
    const customPath = path.join(TEMPLATES_DIR, `${type}_custom.docx`);
    
    try {
      await fs.unlink(customPath);
      
      await logAction(req.user.id, 'RESTORE_TEMPLATE', `Restauration du template par défaut ${type}`, 'Template', type);
      
      res.json({ 
        message: 'Template restauré avec succès',
        status: 'default'
      });
    } catch (error) {
      if (error.code === 'ENOENT') {
        return res.status(400).json({ error: 'Aucun template personnalisé à restaurer' });
      }
      throw error;
    }
    
  } catch (error) {
    console.error('Restore template error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/templates/:type/status - Obtenir le statut d'un template spécifique
router.get('/:type/status', async (req, res) => {
  try {
    const { type } = req.params;
    
    if (!TEMPLATE_TYPES[type]) {
      return res.status(400).json({ error: 'Type de template invalide' });
    }
    
    const status = await getTemplateStatus(type);
    
    res.json({ 
      type,
      status,
      filename: TEMPLATE_TYPES[type]
    });
    
  } catch (error) {
    console.error('Get template status error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;