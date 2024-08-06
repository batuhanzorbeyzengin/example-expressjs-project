const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");
const { addUserToIndex } = require("../../lib/elasticsearch");

const prisma = new PrismaClient();

/**
 * Checks if a user already exists with the given email
 * @param {string} email
 * @throws {Error} Throws an error if the email is already in use
 */
const checkUserExists = async (email) => {
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) throw Object.assign(new Error("Email is already in use"), { status: 409 });
};

/**
 * Hashes a user's password
 * @param {string} password
 * @returns {string} hashed password
 */
const hashPassword = (password) => bcrypt.hash(password, 10);

/**
 * Creates a new user in the database
 * @param {object} userData
 * @returns {object} newUser
 */
const createUser = async ({ name, email, password, bio, location, latitude, longitude }) => {
  const hashedPassword = await hashPassword(password);
  return prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      bio,
      location,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      role: "USER",
    },
  });
};

/**
 * Saves uploaded avatar files to the server
 * @param {array} files
 * @param {string} userId
 * @returns {array} avatarsData
 */
const saveAvatarFiles = (files, userId) => {
  if (!files || files.length === 0) return [];

  const userDir = path.join(__dirname, "../../../uploads", userId);
  if (!fs.existsSync(userDir)) fs.mkdirSync(userDir, { recursive: true });

  return files.map((file) => {
    if (!file || !file.originalname) throw new Error("File upload failed, no filename provided");
    const filename = `${Date.now()}-${file.originalname}`;
    const avatarPath = path.join(userDir, filename);
    fs.writeFileSync(avatarPath, file.buffer);
    return { url: `/uploads/${userId}/${filename}` };
  });
};

/**
 * Updates user with avatar information
 * @param {string} userId
 * @param {array} avatarsData
 */
const updateUserAvatars = (userId, avatarsData) => {
  if (avatarsData.length === 0) return;
  return prisma.user.update({
    where: { id: userId },
    data: { avatars: { create: avatarsData } },
  });
};

/**
 * Registers a new user
 * @param {object} userData
 * @param {array} files
 * @returns {object} registration result
 */
const register = async (userData, files) => {
  await checkUserExists(userData.email);
  const newUser = await createUser(userData);
  const avatarsData = saveAvatarFiles(files, newUser.id);
  await updateUserAvatars(newUser.id, avatarsData);
  await addUserToIndex(newUser);
  return { message: "User registration successful" };
};

module.exports = register;