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
      nom: 'Administrateur',
      prenom: 'Système',
      mail: 'admin@pf360.fr',
      role: 'ADMIN',
      grade: 'Administrateur'
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
    { nom: 'Urgent', couleur: '#ef4444' },
    { nom: 'Complexe', couleur: '#f97316' },
    { nom: 'Médical', couleur: '#10b981' },
    { nom: 'Juridique', couleur: '#3b82f6' },
    { nom: 'Social', couleur: '#8b5cf6' },
    { nom: 'Psychologique', couleur: '#ec4899' },
    { nom: 'Prioritaire', couleur: '#dc2626' },
    { nom: 'Suivi particulier', couleur: '#059669' }
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
      nom: 'Dupont',
      prenom: 'Jean',
      cabinet: 'Cabinet Dupont & Associés',
      adresse: '15 rue de la Justice, 75001 Paris',
      telephone: '01.23.45.67.89',
      mail: 'j.dupont@avocats.fr'
    },
    {
      nom: 'Martin',
      prenom: 'Marie',
      cabinet: 'SCP Martin-Durand',
      adresse: '32 avenue des Droits, 69001 Lyon',
      telephone: '04.56.78.90.12',
      mail: 'm.martin@avocats.fr'
    },
    {
      nom: 'Leroy',
      prenom: 'Pierre',
      cabinet: 'Cabinet Leroy',
      adresse: '8 place du Palais, 13001 Marseille',
      telephone: '04.91.23.45.67',
      mail: 'p.leroy@avocats.fr'
    }
  ]

  for (const avocat of avocatsData) {
    const existing = await prisma.avocat.findFirst({
      where: { mail: avocat.mail }
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
      nom: 'Test',
      prenom: 'Utilisateur',
      mail: 'test@pf360.fr',
      role: 'UTILISATEUR',
      grade: 'Adjudant'
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