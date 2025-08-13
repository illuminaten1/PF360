const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('Starting database seeding...')

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 12)
  
  const adminUser = await prisma.user.upsert({
    where: { identifiant: 'admin' },
    update: {},
    create: {
      identifiant: 'admin',
      password: hashedPassword,
      nom: 'LECHEF',
      prenom: 'Michel',
      mail: 'miche.lechef@interieur.gouv.fr',
      role: 'ADMIN',
      grade: 'LCL'
    }
  })

  console.log('✅ Admin user created:', adminUser.identifiant)

  // Create SGAMI entries
  const sgamiData = [
    { nom: 'SGAMI OUEST', formatCourtNommage: 'OUEST' },
    { nom: 'SGAMI NORD', formatCourtNommage: 'NORD' },
    { nom: 'SGAMI SUD-OUEST', formatCourtNommage: 'SO' },
    { nom: 'SGAMI SUD-EST', formatCourtNommage: 'SE' },
    { nom: 'SGAMI ILE-DE-FRANCE', formatCourtNommage: 'IDF' },
    { nom: 'SGAMI EST', formatCourtNommage: 'EST-CONSIGNATION' },
    { nom: 'SGAMI EST', formatCourtNommage: 'EST' },
    { nom: 'SGAMI SUD', formatCourtNommage: 'SUD' },
    { nom: 'SATPN NOUVELLE-CALEDONIE', formatCourtNommage: 'NC' },
    { nom: 'SATPN LA REUNION', formatCourtNommage: 'REUNION' },
    { nom: 'SATPN GUYANE', formatCourtNommage: 'GUYANE' },
    { nom: 'SATPN MARTINIQUE', formatCourtNommage: 'MARTINIQUE' },
    { nom: 'SATPN GUADELOUPE', formatCourtNommage: 'GUADELOUPE' },
    { nom: 'SATPN MAYOTTE', formatCourtNommage: 'MAYOTTE' },
    { nom: 'SGAP POLYNESIE FRANCAISE', formatCourtNommage: 'POLYNESIE' },
    { nom: 'CPFI', formatCourtNommage: 'CPFI' }
  ]

  for (const sgami of sgamiData) {
    await prisma.sgami.upsert({
      where: { nom: sgami.nom },
      update: { formatCourtNommage: sgami.formatCourtNommage },
      create: { nom: sgami.nom, formatCourtNommage: sgami.formatCourtNommage }
    })
  }

  console.log('✅ SGAMI entries created')

  // Create badges
  const badgesData = [
    { nom: 'Signalé', couleur: '#ef4444' },
    { nom: 'UDA', couleur: '#f97316' },
    { nom: 'VSS', couleur: '#10b981' }
  ]

  for (const badge of badgesData) {
    await prisma.badge.upsert({
      where: { nom: badge.nom },
      update: {},
      create: badge
    })
  }

  console.log('✅ Badges created')

  // Create sample lawyers
  const avocatsData = [
    {
      nom: 'DUPONT',
      prenom: 'Jean',
      region: 'Île-de-France',
      adressePostale: '15 rue de la Justice, 75001 Paris',
      telephonePublic1: '01.23.45.67.89',
      email: 'j.dupont@avocats.fr',
      villesIntervention: JSON.stringify(['Paris', 'Versailles', 'Créteil', 'Bobigny', 'Pontoise']),
      notes: 'Très expérimenté en droit pénal. Disponible pour interventions urgentes. Excellentes relations avec les tribunaux parisiens.',
      specialisation: 'Droit pénal'
    },
    {
      nom: 'MARTIN',
      prenom: 'Marie',
      region: 'Auvergne-Rhône-Alpes',
      adressePostale: '32 avenue des Droits, 69001 Lyon',
      telephonePublic1: '04.56.78.90.12',
      email: 'm.martin@avocats.fr',
      villesIntervention: JSON.stringify(['Lyon', 'Villeurbanne', 'Saint-Étienne', 'Grenoble', 'Chambéry']),
      notes: 'Spécialisée dans les affaires familiales et successions. Très pédagogue avec les clients. Maîtrise parfaitement les procédures d\'urgence.',
      specialisation: 'Droit civil'
    },
    {
      nom: 'LEROY',
      prenom: 'Pierre',
      region: 'Provence-Alpes-Côte d\'Azur',
      adressePostale: '8 place du Palais, 13001 Marseille',
      telephonePublic1: '04.91.23.45.67',
      email: 'p.leroy@avocats.fr',
      villesIntervention: JSON.stringify(['Marseille', 'Aix-en-Provence', 'Toulon', 'Nice', 'Avignon']),
      notes: 'Expert en contentieux administratif et marchés publics. Ancien magistrat administratif. Très rigoureux dans le suivi des dossiers.',
      specialisation: 'Droit administratif'
    }
  ]

  for (const avocat of avocatsData) {
    const existing = await prisma.avocat.findFirst({
      where: { email: avocat.email }
    })
    
    if (!existing) {
      await prisma.avocat.create({
        data: avocat
      })
    }
  }

  console.log('✅ Sample lawyers created')

  // Create a test user
  const testUserPassword = await bcrypt.hash('test123', 12)
  
  const testUser = await prisma.user.upsert({
    where: { identifiant: 'test' },
    update: {},
    create: {
      identifiant: 'test',
      password: testUserPassword,
      nom: 'PASCHEF',
      prenom: 'Laurent',
      mail: 'laurent.pachef@interieur.gouv.fr',
      role: 'REDACTEUR',
      grade: 'GAV'
    }
  })

  console.log('✅ Test user created:', testUser.identifiant)

  // Create default visas
  const visasData = [
    {
      typeVisa: 'MILITAIRE',
      texteVisa: 'Vu le code de la défense, notamment son article L. 4123-10 ;\nVu le code de la sécurité intérieure, notamment son article L. 113-1;\nVu la fiche Astrée 5.7.1.1 relative à la protection fonctionnelle;',
      active: true
    },
    {
      typeVisa: 'CIVIL',
      texteVisa: 'Vu le code général de la fonction publique, notamment ses articles L. 134-1 et suivants;\nVu le décret n° 2017-97 du 26 janvier 2017;',
      active: true
    }
  ]

  for (const visa of visasData) {
    await prisma.visa.upsert({
      where: { typeVisa: visa.typeVisa },
      update: {},
      create: visa
    })
  }

  console.log('✅ Default visas created')

  // Seed PCE data
  console.log('🌱 Starting PCE seeding...')
  
  const pceData = [
    {
      ordre: 1,
      pceDetaille: 'Règlement des frais et honoraires d\'avocat (PCE 6131.000.000)',
      pceNumerique: 'PCE 6131.000.000',
      codeMarchandise: '40.03.02'
    },
    {
      ordre: 2,
      pceDetaille: 'Remboursement des frais et honoraires d\'avocat (PCE 6131.000.000)',
      pceNumerique: 'PCE 6131.000.000',
      codeMarchandise: '40.03.02'
    },
    {
      ordre: 3,
      pceDetaille: 'Règlement des frais de consignation d\'expertise (PCE 6135.000.000)',
      pceNumerique: 'PCE 6135.000.000',
      codeMarchandise: '43.01.01'
    },
    {
      ordre: 4,
      pceDetaille: 'Remboursement des frais de consignation d\'expertise (PCE 6135.000.000)',
      pceNumerique: 'PCE 6135.000.000',
      codeMarchandise: '43.01.01'
    },
    {
      ordre: 5,
      pceDetaille: 'Règlement des frais et honoraires d\'huissier (PCE 6134.000.000)',
      pceNumerique: 'PCE 6134.000.000',
      codeMarchandise: '40.03.03'
    },
    {
      ordre: 6,
      pceDetaille: 'Remboursement des honoraires d\'huissier (PCE 6134.000.000)',
      pceNumerique: 'PCE 6134.000.000',
      codeMarchandise: '40.03.03'
    },
    {
      ordre: 7,
      pceDetaille: 'Règlement des frais et honoraires d\'un médecin conseil (PCE 6135.000.000)',
      pceNumerique: 'PCE 6135.000.000',
      codeMarchandise: '43.01.01'
    },
    {
      ordre: 8,
      pceDetaille: 'Remboursement des frais et honoraires d\'un médecin conseil (PCE 6135.000.000)',
      pceNumerique: 'PCE 6135.000.000',
      codeMarchandise: '43.01.01'
    },
    {
      ordre: 9,
      pceDetaille: 'Réparation directe du préjudice (PCE 6222.000.000)',
      pceNumerique: 'PCE 6222.000.000',
      codeMarchandise: '46.01.02'
    },
    {
      ordre: 10,
      pceDetaille: 'Règlement des frais de mission, déplacement et repas (PCE 6153.110.000)',
      pceNumerique: 'PCE 6135.110.000',
      codeMarchandise: '25.01.01'
    },
    {
      ordre: 11,
      pceDetaille: 'Remboursement des frais de mission, déplacement et repas (PCE 6153.110.000)',
      pceNumerique: 'PCE 6135.110.000',
      codeMarchandise: '25.01.01'
    },
    {
      ordre: 12,
      pceDetaille: 'Remboursement FGTI des sommes versées (PCE 6222.000.000) au profit',
      pceNumerique: 'PCE 6222.000.000',
      codeMarchandise: '46.01.02'
    },
    {
      ordre: 13,
      pceDetaille: 'Règlement des frais d\'actes et de procédure (PCE 6137.000.000)',
      pceNumerique: 'PCE 6137.000.000',
      codeMarchandise: '45.03.01'
    },
    {
      ordre: 14,
      pceDetaille: 'Remboursement des frais d\'actes et de procédure (PCE 6137.000.000)',
      pceNumerique: 'PCE 6137.000.000',
      codeMarchandise: '45.03.01'
    },
    {
      ordre: 15,
      pceDetaille: 'Règlement des autres pénalités et condamnations (PCE 6228.000.000)',
      pceNumerique: 'PCE 6228.000.000',
      codeMarchandise: '46.01.03'
    },
    {
      ordre: 16,
      pceDetaille: 'Remboursement des autres pénalités et condamnations (PCE 6228.000.000)',
      pceNumerique: 'PCE 6228.000.000',
      codeMarchandise: '46.01.03'
    }
  ]

  console.log(`📊 ${pceData.length} PCE à insérer...`)

  // Supprimer les PCE existants
  await prisma.pce.deleteMany({})
  console.log('🗑️  PCE existants supprimés')

  // Insérer les nouveaux PCE
  for (const pce of pceData) {
    try {
      await prisma.pce.create({
        data: pce
      })
    } catch (error) {
      console.error(`❌ Erreur lors de l'insertion du PCE: ${pce.pceDetaille}`, error.message)
    }
  }

  const pceCount = await prisma.pce.count()
  console.log(`✅ ${pceCount} PCE insérés avec succès!`)

  console.log('🎉 Database seeding completed!')
  console.log('')
  console.log('Login credentials:')
  console.log('Admin - identifiant: admin, password: admin123')
  console.log('Test user - identifiant: test, password: test123')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })