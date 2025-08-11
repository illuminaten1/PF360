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
    'SGAMI Ouest',
    'SGAMI Est',
    'SGAMI Nord',
    'SGAMI Sud',
    'SGAMI Centre',
    'SGAMI Île-de-France',
    'SGAMI Outre-mer'
  ]

  for (const nom of sgamiData) {
    await prisma.sgami.upsert({
      where: { nom },
      update: {},
      create: { nom }
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