const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function cleanDiligences() {
  try {
    console.log('🧹 Nettoyage des diligences existantes...')

    const result = await prisma.diligence.deleteMany({})
    
    console.log(`✅ ${result.count} diligences supprimées`)

  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Exécuter si le script est appelé directement
if (require.main === module) {
  cleanDiligences()
}

module.exports = { cleanDiligences }