const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const logAction = async (userId, action, detail = null, entite = null, entiteId = null) => {
  try {
    await prisma.log.create({
      data: {
        userId,
        action,
        detail,
        entite,
        entiteId,
        timestamp: new Date()
      }
    });
  } catch (error) {
    console.error('Error logging action:', error);
  }
};

module.exports = { logAction };