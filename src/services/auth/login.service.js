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
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new Error("Invalid email or password");
  }

  return user;
};

/**
 * Validates the password
 * @param {string} plainPassword
 * @param {string} hashedPassword
 * @returns {boolean} isPasswordValid
 * @throws {Error} Throws an error if the password is invalid
 */
const validatePassword = async (plainPassword, hashedPassword) => {
  const isPasswordValid = await bcrypt.compare(plainPassword, hashedPassword);

  if (!isPasswordValid) {
    throw new Error("Invalid email or password");
  }

  return isPasswordValid;
};

/**
 * Creates a session ID
 * @returns {string} sessionId
 */
const createSessionId = () => {
  return crypto.randomBytes(16).toString("hex");
};

/**
 * Generates a JWT token
 * @param {object} user
 * @param {string} sessionId
 * @returns {string} token
 */
const generateToken = (user, sessionId) => {
  return jwt.sign(
    { id: user.id, email: user.email, sessionId },
    config.jwtSecret,
    { expiresIn: "1h" }
  );
};

/**
 * Clears all sessions for a user
 * @param {string} userId
 */
const clearUserSessions = async (userId) => {
  await prisma.session.deleteMany({
    where: { userId },
  });
};

/**
 * Creates a new session
 * @param {string} userId
 * @param {string} sessionId
 */
const createSession = async (userId, sessionId) => {
  await prisma.session.create({
    data: {
      userId,
      sessionId,
    },
  });
};

/**
 * Performs user login
 * @param {object} userData
 * @returns {string} token
 * @throws {Error} Throws an error if login fails
 */
const login = async (userData) => {
  const { email, password } = userData;

  const user = await findUserByEmail(email);
  await validatePassword(password, user.password);

  const sessionId = createSessionId();
  const token = generateToken(user, sessionId);

  await clearUserSessions(user.id);
  await createSession(user.id, sessionId);

  return token;
};

module.exports = login;