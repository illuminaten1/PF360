const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('🗑️  Suppression de toutes les demandes et dossiers...')
  
  try {
    // Compter les éléments avant suppression
    const countDemandesBefore = await prisma.demande.count()
    const countDossiersBefore = await prisma.dossier.count()
    const countBadgesDemandes = await prisma.demandeBadge.count()
    const countBadgesDossiers = await prisma.dossierBadge.count()
    
    console.log(`📊 Éléments trouvés :`)
    console.log(`   - Demandes : ${countDemandesBefore}`)
    console.log(`   - Dossiers : ${countDossiersBefore}`)
    console.log(`   - Badges demandes : ${countBadgesDemandes}`)
    console.log(`   - Badges dossiers : ${countBadgesDossiers}`)
    
    if (countDemandesBefore === 0 && countDossiersBefore === 0) {
      console.log('✅ Aucun élément à supprimer.')
      return
    }
    
    console.log(`⚠️  Vous êtes sur le point de supprimer tous ces éléments.`)
    
    // Supprimer dans l'ordre des dépendances
    console.log('🔄 Suppression des badges de demandes...')
    const badgesDemandesResult = await prisma.demandeBadge.deleteMany({})
    console.log(`✅ ${badgesDemandesResult.count} badges de demandes supprimés`)
    
    console.log('🔄 Suppression des badges de dossiers...')
    const badgesDossiersResult = await prisma.dossierBadge.deleteMany({})
    console.log(`✅ ${badgesDossiersResult.count} badges de dossiers supprimés`)
    
    console.log('🔄 Suppression des demandes...')
    const demandesResult = await prisma.demande.deleteMany({})
    console.log(`✅ ${demandesResult.count} demandes supprimées`)
    
    console.log('🔄 Suppression des dossiers...')
    const dossiersResult = await prisma.dossier.deleteMany({})
    console.log(`✅ ${dossiersResult.count} dossiers supprimés`)
    
    // Vérifier que tout a été supprimé
    const countDemandesAfter = await prisma.demande.count()
    const countDossiersAfter = await prisma.dossier.count()
    
    console.log(`📊 Éléments restants :`)
    console.log(`   - Demandes : ${countDemandesAfter}`)
    console.log(`   - Dossiers : ${countDossiersAfter}`)
    
    if (countDemandesAfter === 0 && countDossiersAfter === 0) {
      console.log('🎉 Tous les éléments ont été supprimés!')
    } else {
      console.log(`⚠️  Il reste encore des éléments en base.`)
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la suppression:', error.message)
    console.error('Stack:', error.stack)
  }
}

main()
  .catch((e) => {
    console.error('❌ Erreur:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })