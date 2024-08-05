const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const config = require("../config");
const prisma = new PrismaClient();

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret);

    console.log("decoded auth:", decoded);

    const session = await prisma.session.findUnique({
      where: { sessionId: decoded.sessionId },
    });

    if (!session || session.userId !== decoded.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: "Unauthorized" });
  }
};

module.exports = authenticateToken;
