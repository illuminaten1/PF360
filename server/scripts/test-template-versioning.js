const { PrismaClient } = require('@prisma/client');
const fs = require('fs').promises;
const path = require('path');

const prisma = new PrismaClient();

async function testTemplateVersioning() {
  try {
    console.log('🧪 Test du système de versioning des templates...\n');
    
    // 1. Vérifier que la table existe
    console.log('1. Vérification de la table TemplateVersion...');
    const tableExists = await prisma.templateVersion.findMany({ take: 1 });
    console.log('✅ Table TemplateVersion accessible\n');
    
    // 2. Créer un utilisateur de test si nécessaire
    let testUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });
    
    if (!testUser) {
      console.log('2. Création d\'un utilisateur de test...');
      testUser = await prisma.user.create({
        data: {
          identifiant: 'test-admin',
          password: 'hashed-password',
          nom: 'Test',
          prenom: 'Admin',
          mail: 'test@example.com',
          role: 'ADMIN'
        }
      });
      console.log('✅ Utilisateur de test créé\n');
    } else {
      console.log('2. Utilisateur admin trouvé\n');
    }
    
    // 3. Tester la création d'une version
    console.log('3. Test de création d\'une version...');
    
    // Supprimer les versions de test existantes
    await prisma.templateVersion.deleteMany({
      where: { templateType: 'decision' }
    });
    
    const version1 = await prisma.templateVersion.create({
      data: {
        templateType: 'decision',
        versionNumber: 1,
        filename: 'decision_v1_test.docx',
        originalName: 'decision_test.docx',
        isActive: true,
        fileSize: 1024,
        uploadedById: testUser.id
      }
    });
    
    console.log('✅ Version 1 créée:', version1.id);
    
    // 4. Tester la création d'une deuxième version
    console.log('4. Test de création d\'une deuxième version...');
    
    // Désactiver la version précédente
    await prisma.templateVersion.update({
      where: { id: version1.id },
      data: { isActive: false }
    });
    
    const version2 = await prisma.templateVersion.create({
      data: {
        templateType: 'decision',
        versionNumber: 2,
        filename: 'decision_v2_test.docx',
        originalName: 'decision_test_v2.docx',
        isActive: true,
        fileSize: 2048,
        uploadedById: testUser.id
      }
    });
    
    console.log('✅ Version 2 créée:', version2.id);
    
    // 5. Tester la récupération des versions
    console.log('5. Test de récupération des versions...');
    const versions = await prisma.templateVersion.findMany({
      where: { templateType: 'decision' },
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
    
    console.log('✅ Versions récupérées:', versions.length);
    versions.forEach(v => {
      console.log(`  - Version ${v.versionNumber}: ${v.filename} (Active: ${v.isActive})`);
    });
    
    // 6. Tester l'activation d'une version
    console.log('\n6. Test d\'activation d\'une version...');
    
    // Désactiver toutes les versions
    await prisma.templateVersion.updateMany({
      where: { templateType: 'decision' },
      data: { isActive: false }
    });
    
    // Activer la version 1
    await prisma.templateVersion.update({
      where: { id: version1.id },
      data: { isActive: true }
    });
    
    const activeVersion = await prisma.templateVersion.findFirst({
      where: { 
        templateType: 'decision',
        isActive: true 
      }
    });
    
    console.log('✅ Version active:', activeVersion?.versionNumber);
    
    // 7. Tester la suppression d'une version
    console.log('7. Test de suppression d\'une version...');
    
    await prisma.templateVersion.delete({
      where: { id: version2.id }
    });
    
    const remainingVersions = await prisma.templateVersion.findMany({
      where: { templateType: 'decision' }
    });
    
    console.log('✅ Versions restantes:', remainingVersions.length);
    
    // 8. Nettoyer
    console.log('8. Nettoyage...');
    await prisma.templateVersion.deleteMany({
      where: { templateType: 'decision' }
    });
    
    console.log('✅ Nettoyage terminé\n');
    console.log('🎉 Tous les tests sont passés avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur lors des tests:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter les tests si le script est lancé directement
if (require.main === module) {
  testTemplateVersioning();
}

module.exports = { testTemplateVersioning };