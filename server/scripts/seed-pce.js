const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function seedPCE() {
  try {
    console.log('🌱 Début du seed des PCE...');

    // Lire le fichier CSV
    const csvPath = path.join(__dirname, '../../PCE.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    
    // Parser le CSV (simple, en supposant que les données sont séparées par des virgules)
    const lines = csvContent.split('\n').filter(line => line.trim());
    const pceData = [];

    // Ignorer l'en-tête (première ligne)
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Parser la ligne CSV en tenant compte des guillemets
      const columns = [];
      let currentColumn = '';
      let inQuotes = false;
      
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          columns.push(currentColumn.trim());
          currentColumn = '';
        } else {
          currentColumn += char;
        }
      }
      
      // Ajouter la dernière colonne
      if (currentColumn.trim()) {
        columns.push(currentColumn.trim());
      }

      if (columns.length >= 3) {
        const [pceDetaille, pceNumerique, codeMarchandise] = columns;
        
        pceData.push({
          ordre: i, // Utiliser l'index de ligne comme ordre (i commence à 1)
          pceDetaille: pceDetaille,
          pceNumerique: pceNumerique,
          codeMarchandise: codeMarchandise
        });
      }
    }

    console.log(`📊 ${pceData.length} PCE à insérer...`);

    // Supprimer les PCE existants
    await prisma.pce.deleteMany({});
    console.log('🗑️  PCE existants supprimés');

    // Insérer les nouveaux PCE
    for (const pce of pceData) {
      try {
        await prisma.pce.create({
          data: pce
        });
      } catch (error) {
        console.error(`❌ Erreur lors de l'insertion du PCE: ${pce.pceDetaille}`, error.message);
      }
    }

    const count = await prisma.pce.count();
    console.log(`✅ ${count} PCE insérés avec succès!`);

  } catch (error) {
    console.error('❌ Erreur lors du seed des PCE:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le script si appelé directement
if (require.main === module) {
  seedPCE();
}

module.exports = { seedPCE };