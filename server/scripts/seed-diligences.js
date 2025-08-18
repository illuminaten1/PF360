const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()

function parseCSV(content) {
  const lines = []
  let currentLine = ''
  let inQuotes = false
  let char = ''
  
  for (let i = 0; i < content.length; i++) {
    char = content[i]
    
    if (char === '"') {
      if (inQuotes && content[i + 1] === '"') {
        // Double quote - escape sequence
        currentLine += '"'
        i++ // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes
      }
    } else if (char === '\n' && !inQuotes) {
      // End of line outside quotes
      if (currentLine.trim()) {
        lines.push(currentLine)
      }
      currentLine = ''
    } else {
      currentLine += char
    }
  }
  
  // Add last line if exists
  if (currentLine.trim()) {
    lines.push(currentLine)
  }
  
  return lines
}

function parseCSVLine(line) {
  const result = []
  let current = ''
  let inQuotes = false
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  
  result.push(current.trim())
  return result
}

async function seedDiligences() {
  try {
    console.log('🌱 Début de l\'importation des diligences...')

    // Lire le fichier CSV
    const csvPath = path.join(__dirname, '../../diligences.csv')
    
    if (!fs.existsSync(csvPath)) {
      console.log('❌ Fichier diligences.csv non trouvé dans la racine du projet')
      return
    }

    const csvContent = fs.readFileSync(csvPath, 'utf-8')
    const lines = parseCSV(csvContent)
    
    // Ignorer la première ligne (en-têtes)
    const dataLines = lines.slice(1)
    
    console.log(`📄 ${dataLines.length} lignes trouvées dans le CSV`)

    let importedCount = 0
    let skippedCount = 0

    for (const line of dataLines) {
      if (!line.trim()) continue
      
      const [nom, details] = parseCSVLine(line)
      
      if (!nom || !details) {
        console.log(`⚠️  Ligne ignorée (données manquantes): ${line.substring(0, 50)}...`)
        skippedCount++
        continue
      }

      // Nettoyer les données
      const nomClean = nom.trim()
      const detailsClean = details.trim()

      // Vérifier si la diligence existe déjà
      const existingDiligence = await prisma.diligence.findFirst({
        where: {
          nom: nomClean
        }
      })

      if (existingDiligence) {
        console.log(`⚠️  Diligence "${nomClean}" existe déjà, ignorée`)
        skippedCount++
        continue
      }

      // Déterminer le type de tarification par défaut
      let typeTarification = 'FORFAITAIRE'
      
      // Si le détail contient des mots-clés liés à la durée, on peut l'interpréter comme demi-journée
      const detailsLower = detailsClean.toLowerCase()
      if (detailsLower.includes('audience') || detailsLower.includes('présence') || detailsLower.includes('plaidoirie')) {
        typeTarification = 'DEMI_JOURNEE'
      }

      // Créer la diligence
      await prisma.diligence.create({
        data: {
          nom: nomClean,
          details: detailsClean,
          typeTarification,
          active: true
        }
      })

      console.log(`✅ Importé: "${nomClean}" (${typeTarification})`)
      importedCount++
    }

    console.log(`\n🎉 Importation terminée!`)
    console.log(`   - ${importedCount} diligences importées`)
    console.log(`   - ${skippedCount} diligences ignorées`)

  } catch (error) {
    console.error('❌ Erreur lors de l\'importation:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Exécuter si le script est appelé directement
if (require.main === module) {
  seedDiligences()
}

module.exports = { seedDiligences }