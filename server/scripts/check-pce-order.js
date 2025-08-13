const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkPCEOrder() {
  try {
    console.log('📊 Vérification de l\'ordre des PCE...');

    const pceList = await prisma.pce.findMany({
      orderBy: [
        { ordre: 'asc' }
      ],
      select: {
        ordre: true,
        pceDetaille: true
      }
    });

    console.log(`✅ ${pceList.length} PCE trouvés, classés par ordre:`);
    console.log('');

    pceList.forEach(pce => {
      console.log(`${pce.ordre.toString().padStart(2, '0')}. ${pce.pceDetaille}`);
    });

  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le script si appelé directement
if (require.main === module) {
  checkPCEOrder();
}

module.exports = { checkPCEOrder };