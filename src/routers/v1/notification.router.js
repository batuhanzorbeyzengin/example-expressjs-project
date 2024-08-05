const express = require("express");
const { PrismaClient } = require("@prisma/client");
const router = express.Router();
const authenticateToken = require("../../middlewares/auth.middleware");
const prisma = new PrismaClient();

router.post(
  "/mark-as-read",
  authenticateToken,
  async (req, res) => {
    const userId = req.user.id;

    try {
      await prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true },
      });

      res.status(200).json({ message: "Notifications marked as read" });
    } catch (error) {
      console.error("Error marking notifications as read:", error);
      res.status(500).json({ error: "Failed to update notifications" });
    }
  }
);

module.exports = router;
