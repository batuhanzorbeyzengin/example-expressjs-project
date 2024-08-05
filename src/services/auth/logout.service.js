const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Logout service to delete the user's session from the database.
 *
 * @param {string} userId - The ID of the user logging out.
 * @param {string} sessionId - The ID of the session to be deleted.
 */
async function logout(userId, sessionId) {
  // Delete the session from the database
  await prisma.session.deleteMany({
    where: {
      userId,
      sessionId,
    },
  });
}

module.exports = logout;