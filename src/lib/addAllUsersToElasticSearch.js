const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { bulkAddUsersToIndex } = require('../lib/elasticsearch');

const addAllUsersToElasticSearch = async () => {
  try {
    const users = await prisma.user.findMany();
    await bulkAddUsersToIndex(users);
    console.log('All users have been added to ElasticSearch.');
  } catch (err) {
    console.error('Error adding users to ElasticSearch:', err);
  } finally {
    await prisma.$disconnect();
    console.log('Disconnected from the database.');
  }
};

addAllUsersToElasticSearch();
