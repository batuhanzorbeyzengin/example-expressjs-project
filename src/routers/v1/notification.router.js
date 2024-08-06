const express = require("express");
const { PrismaClient } = require("@prisma/client");
const router = express.Router();
const authenticateToken = require("../../middlewares/auth.middleware");
const handleRequest = require("../../lib/requestHandler");
const prisma = new PrismaClient();

router.post(
  "/mark-as-read",
  authenticateToken,
  handleRequest(async (req) => {
    await prisma.notification.updateMany({
      where: { userId: req.user.id, isRead: false },
      data: { isRead: true },
    });
    return { message: "Notifications marked as read" };
  })
);

module.exports = router;
