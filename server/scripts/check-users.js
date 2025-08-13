const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    console.log('👥 Vérification des utilisateurs...');

    const usersCount = await prisma.user.count();
    console.log(`📊 Nombre d'utilisateurs: ${usersCount}`);

    if (usersCount > 0) {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          identifiant: true,
          nom: true,
          prenom: true,
          role: true,
          active: true
        }
      });

      console.log('\n👤 Utilisateurs trouvés:');
      users.forEach(user => {
        const status = user.active ? '✅' : '❌';
        console.log(`${status} ${user.identifiant} - ${user.prenom} ${user.nom} (${user.role})`);
      });
    } else {
      console.log('⚠️  Aucun utilisateur trouvé en base de données');
      console.log('💡 Il faut peut-être recréer un utilisateur admin');
    }

  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le script si appelé directement
if (require.main === module) {
  checkUsers();
}

module.exports = { checkUsers };