const { PrismaClient } = require('@prisma/client');
const fs = require('fs').promises;
const path = require('path');

const prisma = new PrismaClient();

const TEMPLATE_TYPES = ['decision', 'convention', 'avenant', 'reglement'];
const OLD_TEMPLATES_DIR = path.join(__dirname, '../uploads/templates');
const NEW_TEMPLATES_DIR = path.join(__dirname, '../uploads/templates');

async function migrateTemplates() {
  try {
    console.log('🚀 Début de la migration des templates...');
    
    // Obtenir l'utilisateur admin (assumé être le premier admin créé)
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });
    
    if (!adminUser) {
      throw new Error('Aucun utilisateur admin trouvé pour la migration');
    }
    
    for (const templateType of TEMPLATE_TYPES) {
      console.log(`📂 Migration du type ${templateType}...`);
      
      const customFilePath = path.join(OLD_TEMPLATES_DIR, `${templateType}_custom.docx`);
      
      try {
        // Vérifier si un template personnalisé existe
        await fs.access(customFilePath);
        
        // Obtenir les infos du fichier
        const stats = await fs.stat(customFilePath);
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const newFilename = `${templateType}_v1_${timestamp}.docx`;
        const newFilePath = path.join(NEW_TEMPLATES_DIR, templateType, newFilename);
        
        // Créer le répertoire de destination
        await fs.mkdir(path.dirname(newFilePath), { recursive: true });
        
        // Déplacer le fichier
        await fs.rename(customFilePath, newFilePath);
        
        // Créer l'entrée en base de données
        await prisma.templateVersion.create({
          data: {
            templateType,
            versionNumber: 1,
            filename: newFilename,
            originalName: `${templateType}_custom.docx`,
            isActive: true,
            fileSize: stats.size,
            uploadedById: adminUser.id
          }
        });
        
        console.log(`✅ ${templateType}: Template personnalisé migré vers la version 1`);
      } catch (error) {
        if (error.code === 'ENOENT') {
          console.log(`ℹ️  ${templateType}: Aucun template personnalisé à migrer`);
        } else {
          throw error;
        }
      }
    }
    
    console.log('🎉 Migration terminée avec succès !');
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter la migration si le script est lancé directement
if (require.main === module) {
  migrateTemplates();
}

module.exports = { migrateTemplates };