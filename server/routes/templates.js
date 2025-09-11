const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/auth');
const { logAction } = require('../utils/logger');

const router = express.Router();
const prisma = new PrismaClient();

// Configuration multer pour l'upload de fichiers avec versioning
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const templateType = req.params.type;
    const uploadDir = path.join(__dirname, '../uploads/templates', templateType);
    // Créer le répertoire s'il n'existe pas
    fs.mkdir(uploadDir, { recursive: true }).then(() => {
      cb(null, uploadDir);
    }).catch(err => {
      cb(err);
    });
  },
  filename: (req, file, cb) => {
    const templateType = req.params.type;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const extension = path.extname(file.originalname);
    // Format: templateType_v{version}_{timestamp}.docx
    cb(null, `${templateType}_v{version}_${timestamp}${extension}`);
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

// Fonction pour obtenir la prochaine version disponible
const getNextVersionNumber = async (templateType) => {
  const lastVersion = await prisma.templateVersion.findFirst({
    where: { templateType },
    orderBy: { versionNumber: 'desc' }
  });
  
  return lastVersion ? lastVersion.versionNumber + 1 : 1;
};

// Fonction pour obtenir le statut d'un template (avec versioning)
const getTemplateStatus = async (templateType) => {
  const activeVersion = await prisma.templateVersion.findFirst({
    where: { 
      templateType,
      isActive: true 
    }
  });
  
  return activeVersion ? 'custom' : 'default';
};

// Fonction pour obtenir le chemin du template actuel
const getTemplatePath = async (templateType) => {
  const activeVersion = await prisma.templateVersion.findFirst({
    where: { 
      templateType,
      isActive: true 
    }
  });
  
  if (activeVersion) {
    return path.join(TEMPLATES_DIR, templateType, activeVersion.filename);
  }
  
  return path.join(DEFAULT_TEMPLATES_DIR, TEMPLATE_TYPES[templateType]);
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

// POST /api/templates/:type/upload - Uploader un template personnalisé (avec versioning)
router.post('/:type/upload', upload.single('template'), async (req, res) => {
  try {
    const { type } = req.params;
    
    if (!TEMPLATE_TYPES[type]) {
      return res.status(400).json({ error: 'Type de template invalide' });
    }
    
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier uploadé' });
    }
    
    // Obtenir le prochain numéro de version
    const versionNumber = await getNextVersionNumber(type);
    
    // Créer le nom de fichier avec le bon numéro de version
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const extension = path.extname(req.file.originalname);
    const finalFilename = `${type}_v${versionNumber}_${timestamp}${extension}`;
    
    // Renommer le fichier uploadé
    const oldPath = req.file.path;
    const newPath = path.join(path.dirname(oldPath), finalFilename);
    await fs.rename(oldPath, newPath);
    
    // Désactiver toutes les versions précédentes
    await prisma.templateVersion.updateMany({
      where: { templateType: type },
      data: { isActive: false }
    });
    
    // Créer la nouvelle version en base
    const templateVersion = await prisma.templateVersion.create({
      data: {
        templateType: type,
        versionNumber,
        filename: finalFilename,
        originalName: req.file.originalname,
        isActive: true,
        fileSize: req.file.size,
        uploadedById: req.user.id
      },
      include: {
        uploadedBy: {
          select: {
            nom: true,
            prenom: true
          }
        }
      }
    });
    
    await logAction(req.user.id, 'UPLOAD_TEMPLATE', `Upload du template ${type} version ${versionNumber}`, 'Template', type);
    
    res.json({ 
      message: 'Template uploadé avec succès',
      status: 'custom',
      version: templateVersion
    });
    
  } catch (error) {
    console.error('Upload template error:', error);
    if (error.message === 'Le fichier doit être au format DOCX') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/templates/:type/versions - Récupérer l'historique des versions
router.get('/:type/versions', async (req, res) => {
  try {
    const { type } = req.params;
    
    if (!TEMPLATE_TYPES[type]) {
      return res.status(400).json({ error: 'Type de template invalide' });
    }
    
    const versions = await prisma.templateVersion.findMany({
      where: { templateType: type },
      orderBy: { versionNumber: 'desc' },
      include: {
        uploadedBy: {
          select: {
            nom: true,
            prenom: true
          }
        }
      }
    });
    
    res.json(versions);
  } catch (error) {
    console.error('Get template versions error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/templates/:type/activate/:versionId - Activer une version spécifique
router.post('/:type/activate/:versionId', async (req, res) => {
  try {
    const { type, versionId } = req.params;
    
    if (!TEMPLATE_TYPES[type]) {
      return res.status(400).json({ error: 'Type de template invalide' });
    }
    
    // Vérifier que la version existe
    const version = await prisma.templateVersion.findUnique({
      where: { id: versionId }
    });
    
    if (!version || version.templateType !== type) {
      return res.status(404).json({ error: 'Version non trouvée' });
    }
    
    // Désactiver toutes les versions
    await prisma.templateVersion.updateMany({
      where: { templateType: type },
      data: { isActive: false }
    });
    
    // Activer la version demandée
    await prisma.templateVersion.update({
      where: { id: versionId },
      data: { isActive: true }
    });
    
    await logAction(req.user.id, 'ACTIVATE_TEMPLATE_VERSION', `Activation du template ${type} version ${version.versionNumber}`, 'Template', type);
    
    res.json({ 
      message: 'Version activée avec succès',
      version: version.versionNumber
    });
    
  } catch (error) {
    console.error('Activate template version error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// DELETE /api/templates/:type/versions/:versionId - Supprimer une version
router.delete('/:type/versions/:versionId', async (req, res) => {
  try {
    const { type, versionId } = req.params;
    
    if (!TEMPLATE_TYPES[type]) {
      return res.status(400).json({ error: 'Type de template invalide' });
    }
    
    // Récupérer la version
    const version = await prisma.templateVersion.findUnique({
      where: { id: versionId }
    });
    
    if (!version || version.templateType !== type) {
      return res.status(404).json({ error: 'Version non trouvée' });
    }
    
    if (version.isActive) {
      return res.status(400).json({ error: 'Impossible de supprimer la version active' });
    }
    
    // Supprimer le fichier
    const filePath = path.join(TEMPLATES_DIR, type, version.filename);
    try {
      await fs.unlink(filePath);
    } catch (error) {
      console.warn('Fichier déjà supprimé:', filePath);
    }
    
    // Supprimer de la base de données
    await prisma.templateVersion.delete({
      where: { id: versionId }
    });
    
    await logAction(req.user.id, 'DELETE_TEMPLATE_VERSION', `Suppression du template ${type} version ${version.versionNumber}`, 'Template', type);
    
    res.json({ 
      message: 'Version supprimée avec succès'
    });
    
  } catch (error) {
    console.error('Delete template version error:', error);
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
    
    // Désactiver toutes les versions personnalisées
    await prisma.templateVersion.updateMany({
      where: { templateType: type },
      data: { isActive: false }
    });
    
    await logAction(req.user.id, 'RESTORE_TEMPLATE', `Restauration du template par défaut ${type}`, 'Template', type);
    
    res.json({ 
      message: 'Template restauré avec succès',
      status: 'default'
    });
    
  } catch (error) {
    console.error('Restore template error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/templates/:type/status - Obtenir le statut d'un template spécifique avec détails
router.get('/:type/status', async (req, res) => {
  try {
    const { type } = req.params;
    
    if (!TEMPLATE_TYPES[type]) {
      return res.status(400).json({ error: 'Type de template invalide' });
    }
    
    const status = await getTemplateStatus(type);
    const activeVersion = await prisma.templateVersion.findFirst({
      where: { 
        templateType: type,
        isActive: true 
      },
      include: {
        uploadedBy: {
          select: {
            nom: true,
            prenom: true
          }
        }
      }
    });
    
    res.json({ 
      type,
      status,
      filename: TEMPLATE_TYPES[type],
      activeVersion
    });
    
  } catch (error) {
    console.error('Get template status error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/templates/:type/versions/:versionId/download - Télécharger une version spécifique
router.get('/:type/versions/:versionId/download', async (req, res) => {
  try {
    const { type, versionId } = req.params;
    
    if (!TEMPLATE_TYPES[type]) {
      return res.status(400).json({ error: 'Type de template invalide' });
    }
    
    const version = await prisma.templateVersion.findUnique({
      where: { id: versionId }
    });
    
    if (!version || version.templateType !== type) {
      return res.status(404).json({ error: 'Version non trouvée' });
    }
    
    const filePath = path.join(TEMPLATES_DIR, type, version.filename);
    
    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).json({ error: 'Fichier non trouvé' });
    }
    
    await logAction(req.user.id, 'DOWNLOAD_TEMPLATE_VERSION', `Téléchargement du template ${type} version ${version.versionNumber}`, 'Template', type);
    
    res.download(filePath, version.originalName, (err) => {
      if (err) {
        console.error('Download error:', err);
        res.status(500).json({ error: 'Erreur lors du téléchargement' });
      }
    });
    
  } catch (error) {
    console.error('Download template version error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;