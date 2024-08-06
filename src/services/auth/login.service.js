const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const config = require("../../config");
const prisma = new PrismaClient();

/**
 * Finds a user by email
 * @param {string} email
 * @returns {object} user
 * @throws {Error} Throws an error if the user is not found
 */
const findUserByEmail = async (email) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error("Invalid email or password");
  return user;
};

/**
 * Validates the password
 * @param {string} plainPassword
 * @param {string} hashedPassword
 * @throws {Error} Throws an error if the password is invalid
 */
const validatePassword = async (plainPassword, hashedPassword) => {
  if (!(await bcrypt.compare(plainPassword, hashedPassword))) {
    throw new Error("Invalid email or password");
  }
};

/**
 * Generates a JWT token
 * @param {object} user
 * @param {string} sessionId
 * @returns {string} token
 */
const generateToken = (user, sessionId) =>
  jwt.sign({ id: user.id, email: user.email, sessionId }, config.jwtSecret, {
    expiresIn: "1h",
  });

/**
 * Clears all sessions for a user and creates a new session
 * @param {string} userId
 * @param {string} sessionId
 */
const resetUserSession = async (userId, sessionId) => {
  await prisma.session.deleteMany({ where: { userId } });
  await prisma.session.create({ data: { userId, sessionId } });
};

/**
 * Performs user login
 * @param {object} userData
 * @returns {string} token
 * @throws {Error} Throws an error if login fails
 */
const login = async ({ email, password }) => {
  const user = await findUserByEmail(email);
  await validatePassword(password, user.password);
  const sessionId = crypto.randomBytes(16).toString("hex");
  await resetUserSession(user.id, sessionId);
  return generateToken(user, sessionId);
};

module.exports = login;
