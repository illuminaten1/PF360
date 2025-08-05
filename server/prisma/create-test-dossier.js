const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function createTestDossier() {
  console.log('Creating test dossier...')

  // Get first SGAMI and User
  const sgami = await prisma.sgami.findFirst()
  const user = await prisma.user.findFirst()

  const dossier = await prisma.dossier.create({
    data: {
      notes: 'Dossier de test pour les demandes',
      sgamiId: sgami?.id,
      assigneAId: user?.id
    }
  })

  console.log('✅ Test dossier created:', dossier.numero)
  console.log('ID:', dossier.id)
}

createTestDossier()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })