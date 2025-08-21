const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function migrateGrades() {
  console.log('🔄 Starting grade migration...')

  try {
    // 1. Récupérer tous les grades de la base
    const grades = await prisma.grade.findMany({
      select: {
        id: true,
        gradeComplet: true,
        gradeAbrege: true
      }
    })

    console.log(`📋 Found ${grades.length} grades in database`)

    // 2. Créer un mapping grade complet -> ID
    const gradeMapping = new Map()
    grades.forEach(grade => {
      gradeMapping.set(grade.gradeComplet, grade.id)
    })

    // 3. Récupérer toutes les demandes avec un grade non null
    const demandes = await prisma.demande.findMany({
      where: {
        grade: {
          not: null
        }
      },
      select: {
        id: true,
        grade: true
      }
    })

    console.log(`📊 Found ${demandes.length} demandes with grades to migrate`)

    let migratedCount = 0
    let notFoundCount = 0

    // 4. Migrer chaque demande
    for (const demande of demandes) {
      const gradeId = gradeMapping.get(demande.grade)
      
      if (gradeId) {
        try {
          await prisma.demande.update({
            where: { id: demande.id },
            data: { gradeId: gradeId }
          })
          migratedCount++
          console.log(`✅ Migrated: "${demande.grade}" -> ${gradeId}`)
        } catch (error) {
          console.error(`❌ Error migrating demande ${demande.id}:`, error.message)
        }
      } else {
        notFoundCount++
        console.warn(`⚠️  Grade not found: "${demande.grade}" for demande ${demande.id}`)
      }
    }

    console.log('')
    console.log('📈 Migration Summary:')
    console.log(`✅ Successfully migrated: ${migratedCount} demandes`)
    console.log(`⚠️  Grades not found: ${notFoundCount} demandes`)
    console.log('')
    
    if (notFoundCount > 0) {
      console.log('🔍 Demandes with unmapped grades:')
      for (const demande of demandes) {
        if (!gradeMapping.get(demande.grade)) {
          console.log(`  - Demande ${demande.id}: "${demande.grade}"`)
        }
      }
    }

    console.log('🎉 Grade migration completed!')

  } catch (error) {
    console.error('💥 Migration failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Exécuter la migration
if (require.main === module) {
  migrateGrades()
    .then(() => {
      process.exit(0)
    })
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
}

module.exports = { migrateGrades }