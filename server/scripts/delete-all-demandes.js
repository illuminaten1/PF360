const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('🗑️  Suppression de toutes les demandes et dossiers...')
  
  try {
    // Compter les éléments avant suppression
    const countDemandesBefore = await prisma.demande.count()
    const countDossiersBefore = await prisma.dossier.count()
    const countDecisionDemandes = await prisma.decisionDemande.count()
    const countConventionDemandes = await prisma.conventionDemande.count()
    const countConventionDiligences = await prisma.conventionDiligence.count()
    const countBadgesDemandes = await prisma.demandeBadge.count()
    const countBadgesDossiers = await prisma.dossierBadge.count()
    const countBAPsDemandes = await prisma.demandeBAP.count()
    const countBAPsDossiers = await prisma.dossierBAP.count()
    const countPaiementDecisions = await prisma.paiementDecision.count()
    const countPaiements = await prisma.paiement.count()
    const countConventionDecisions = await prisma.conventionDecision.count()
    const countConventions = await prisma.convention.count()
    const countDecisions = await prisma.decision.count()
    const countDossiersAttendus = await prisma.dossierAttendu.count()
    
    console.log(`📊 Éléments trouvés :`)
    console.log(`   - Demandes : ${countDemandesBefore}`)
    console.log(`   - Dossiers : ${countDossiersBefore}`)
    console.log(`   - Liaisons décisions-demandes : ${countDecisionDemandes}`)
    console.log(`   - Liaisons conventions-demandes : ${countConventionDemandes}`)
    console.log(`   - Liaisons conventions-diligences : ${countConventionDiligences}`)
    console.log(`   - Badges demandes : ${countBadgesDemandes}`)
    console.log(`   - Badges dossiers : ${countBadgesDossiers}`)
    console.log(`   - BAPs demandes : ${countBAPsDemandes}`)
    console.log(`   - BAPs dossiers : ${countBAPsDossiers}`)
    console.log(`   - Liaisons paiements-décisions : ${countPaiementDecisions}`)
    console.log(`   - Paiements : ${countPaiements}`)
    console.log(`   - Liaisons conventions-décisions : ${countConventionDecisions}`)
    console.log(`   - Conventions : ${countConventions}`)
    console.log(`   - Décisions : ${countDecisions}`)
    console.log(`   - Dossiers attendus : ${countDossiersAttendus}`)
    
    if (countDemandesBefore === 0 && countDossiersBefore === 0) {
      console.log('✅ Aucun élément à supprimer.')
      return
    }
    
    console.log(`⚠️  Vous êtes sur le point de supprimer tous ces éléments.`)
    
    // Supprimer dans l'ordre des dépendances (foreign keys first)
    console.log('🔄 Suppression des liaisons décisions-demandes...')
    const decisionDemandesResult = await prisma.decisionDemande.deleteMany({})
    console.log(`✅ ${decisionDemandesResult.count} liaisons décisions-demandes supprimées`)
    
    console.log('🔄 Suppression des liaisons conventions-demandes...')
    const conventionDemandesResult = await prisma.conventionDemande.deleteMany({})
    console.log(`✅ ${conventionDemandesResult.count} liaisons conventions-demandes supprimées`)
    
    console.log('🔄 Suppression des liaisons conventions-diligences...')
    const conventionDiligencesResult = await prisma.conventionDiligence.deleteMany({})
    console.log(`✅ ${conventionDiligencesResult.count} liaisons conventions-diligences supprimées`)
    
    console.log('🔄 Suppression des badges de demandes...')
    const badgesDemandesResult = await prisma.demandeBadge.deleteMany({})
    console.log(`✅ ${badgesDemandesResult.count} badges de demandes supprimés`)
    
    console.log('🔄 Suppression des badges de dossiers...')
    const badgesDossiersResult = await prisma.dossierBadge.deleteMany({})
    console.log(`✅ ${badgesDossiersResult.count} badges de dossiers supprimés`)
    
    console.log('🔄 Suppression des BAPs de demandes...')
    const bapsDemandesResult = await prisma.demandeBAP.deleteMany({})
    console.log(`✅ ${bapsDemandesResult.count} BAPs de demandes supprimés`)
    
    console.log('🔄 Suppression des BAPs de dossiers...')
    const bapsDossiersResult = await prisma.dossierBAP.deleteMany({})
    console.log(`✅ ${bapsDossiersResult.count} BAPs de dossiers supprimés`)
    
    console.log('🔄 Suppression des liaisons paiements-décisions...')
    const paiementDecisionsResult = await prisma.paiementDecision.deleteMany({})
    console.log(`✅ ${paiementDecisionsResult.count} liaisons paiements-décisions supprimées`)
    
    console.log('🔄 Suppression des paiements...')
    const paiementsResult = await prisma.paiement.deleteMany({})
    console.log(`✅ ${paiementsResult.count} paiements supprimés`)
    
    console.log('🔄 Suppression des liaisons conventions-décisions...')
    const conventionDecisionsResult = await prisma.conventionDecision.deleteMany({})
    console.log(`✅ ${conventionDecisionsResult.count} liaisons conventions-décisions supprimées`)
    
    console.log('🔄 Suppression des conventions...')
    const conventionsResult = await prisma.convention.deleteMany({})
    console.log(`✅ ${conventionsResult.count} conventions supprimées`)
    
    console.log('🔄 Suppression des décisions...')
    const decisionsResult = await prisma.decision.deleteMany({})
    console.log(`✅ ${decisionsResult.count} décisions supprimées`)
    
    console.log('🔄 Suppression des dossiers attendus...')
    const dossiersAttendusResult = await prisma.dossierAttendu.deleteMany({})
    console.log(`✅ ${dossiersAttendusResult.count} dossiers attendus supprimés`)
    
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