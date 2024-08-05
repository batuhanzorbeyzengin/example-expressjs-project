const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const faker = require('faker');

async function main() {
  // Generate fake users
  const users = Array.from({ length: 100 }).map(() => {
    // Generate realistic location data
    const city = faker.address.city();
    const latitude = parseFloat(faker.address.latitude());
    const longitude = parseFloat(faker.address.longitude());

    return {
      name: faker.name.findName(),
      email: faker.internet.email(),
      password: faker.internet.password(),
      bio: faker.lorem.sentence(),
      location: city,
      latitude: latitude,
      longitude: longitude,
      avatars: {
        create: [
          { url: faker.image.avatar() },
          { url: faker.image.avatar() },
        ],
      },
    };
  });

  // Insert each user into the database
  for (const userData of users) {
    try {
      const user = await prisma.user.create({
        data: userData,
      });
      console.log(`Created user with id: ${user.id}`);
    } catch (error) {
      console.error('Error creating user:', error);
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
