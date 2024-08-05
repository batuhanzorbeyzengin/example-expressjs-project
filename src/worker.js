const WebSocket = require("ws");
const redisClient = require("./lib/redis");
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const config = require("./config");

const prisma = new PrismaClient();
const wss = new WebSocket.Server({ port: config.notificationWsPort });

const clients = new Map();

wss.on("connection", async (ws, req) => {
  const token = new URLSearchParams(req.url.split("?")[1]).get("token");

  if (!token) {
    ws.close(4001, "Unauthorized: No token provided");
    return;
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    const { id: userId, sessionId } = decoded;

    const session = await prisma.session.findUnique({
      where: { sessionId },
    });

    if (!session || session.userId !== userId) {
      ws.close(4001, "Unauthorized: Invalid session");
      return;
    }

    clients.set(ws, userId);
    console.log(`User ${userId} registered for notifications.`);

    const unreadNotifications = await prisma.notification.findMany({
      where: { userId, isRead: false },
    });

    if (unreadNotifications.length > 0) {
      unreadNotifications.forEach(async (notification) => {
        const formattedMessage = await formatNotificationMessage(notification);
        ws.send(JSON.stringify(formattedMessage));
      });

      await prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true },
      });

      console.log(
        `Sent ${unreadNotifications.length} unread notifications to user ${userId}`
      );
    }

    ws.on("close", () => {
      clients.delete(ws);
      console.log(`User ${userId} disconnected`);
    });
  } catch (error) {
    console.error("Token verification failed:", error);
    ws.close(4001, "Unauthorized: Invalid token");
  }
});

redisClient.subscribe("notifications", async (message) => {
  console.log("New notification received from Redis:", message);

  const notification = JSON.parse(message);
  const { userId } = notification;

  let sent = false;

  const formattedMessage = await formatNotificationMessage(notification);

  clients.forEach((clientUserId, clientWs) => {
    if (clientUserId === userId && clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(JSON.stringify(formattedMessage));
      console.log(`Notification sent to user ${userId}`);
      sent = true;
    }
  });

  if (!sent) {
    console.log(`No active WebSocket connection for user ${userId}`);
    await prisma.notification.create({
      data: {
        userId,
        type: notification.type,
        isRead: false,
        createdAt: new Date(notification.timestamp),
      },
    });
  }
});

console.log("Worker is listening for notifications...");

async function formatNotificationMessage(notification) {
  try {
    const sender = await prisma.user.findUnique({
      where: { id: notification.userId },
    });

    let messageType = "liked";

    if (notification.type === "DISLIKE") {
      messageType = "disliked";
    }

    return {
      message: `${sender.name} has ${messageType} your profile.`,
      timestamp: notification.timestamp,
    };
  } catch (error) {
    console.error("Error formatting notification message:", error);
    return {
      message: "You have a new notification.",
      timestamp: notification.timestamp,
    };
  }
}
