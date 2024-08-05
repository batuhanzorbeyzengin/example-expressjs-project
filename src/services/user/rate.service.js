const { PrismaClient } = require("@prisma/client");
const redisClient = require("../../lib/redis");
const prisma = new PrismaClient();

/**
 * Rates a user by liking or disliking
 * @param {string} userId
 * @param {string} targetId
 * @param {string} type - "LIKE" or "DISLIKE"
 * @returns {object} Result message and likeId if applicable
 */
async function rate(userId, targetId, type) {
  const existingLike = await findExistingLike(userId, targetId);

  if (existingLike) {
    return handleExistingLike(existingLike, targetId, type);
  }

  return handleNewLike(userId, targetId, type);
}

/**
 * Finds existing like or dislike for a target user by a specific user
 * @param {string} userId
 * @param {string} targetId
 * @returns {object|null} Existing like object or null
 */
async function findExistingLike(userId, targetId) {
  return await prisma.like.findUnique({
    where: {
      userId_targetId: {
        userId,
        targetId,
      },
    },
  });
}

/**
 * Handles logic when an existing like or dislike is found
 * @param {object} existingLike
 * @param {string} targetId
 * @param {string} type
 * @returns {object} Result message and likeId if applicable
 */
async function handleExistingLike(existingLike, targetId, type) {
  if (existingLike.type === type) {
    await removeExistingLike(existingLike.id, targetId, type);
    return { message: `Successfully removed your ${type} for this user.` };
  } else {
    await updateExistingLike(existingLike.id, targetId, type, existingLike.type);
    return { message: `Successfully updated to ${type}.`, likeId: existingLike.id };
  }
}

/**
 * Handles logic for adding a new like or dislike
 * @param {string} userId
 * @param {string} targetId
 * @param {string} type
 * @returns {object} Result message and likeId
 */
async function handleNewLike(userId, targetId, type) {
  const newLike = await createNewLike(userId, targetId, type);
  await updateLikeDislikeCount(targetId, type);
  await sendNotification(targetId, type);
  return { message: `Successfully added ${type}.`, likeId: newLike.id };
}

/**
 * Removes an existing like or dislike
 * @param {string} likeId
 * @param {string} targetId
 * @param {string} type
 */
async function removeExistingLike(likeId, targetId, type) {
  await prisma.like.delete({
    where: { id: likeId },
  });

  await updateLikeDislikeCount(targetId, null, type);
  await sendNotification(targetId, "UNDO");
}

/**
 * Updates an existing like or dislike to a new type
 * @param {string} likeId
 * @param {string} targetId
 * @param {string} newType
 * @param {string} oldType
 */
async function updateExistingLike(likeId, targetId, newType, oldType) {
  await prisma.like.update({
    where: { id: likeId },
    data: { type: newType },
  });

  await updateLikeDislikeCount(targetId, newType, oldType);
  await sendNotification(targetId, newType);
}

/**
 * Creates a new like or dislike entry
 * @param {string} userId
 * @param {string} targetId
 * @param {string} type
 * @returns {object} New like object
 */
async function createNewLike(userId, targetId, type) {
  return await prisma.like.create({
    data: {
      userId,
      targetId,
      type,
    },
  });
}

/**
 * Sends a notification to a user
 * @param {string} targetId
 * @param {string} type
 */
async function sendNotification(targetId, type) {
  const notificationData = {
    userId: targetId,
    type,
    timestamp: new Date().toISOString(),
  };

  await redisClient.publish("notifications", JSON.stringify(notificationData));

  if (type !== "UNDO") {
    await prisma.notification.create({
      data: {
        userId: targetId,
        type: type === "LIKE" ? "LIKE" : "DISLIKE",
        isRead: false,
      },
    });
  }
}

/**
 * Updates the like and dislike counts for a user
 * @param {string} targetId
 * @param {string|null} newType
 * @param {string} [oldType]
 */
async function updateLikeDislikeCount(targetId, newType, oldType) {
  const updateData = {};

  if (newType === "LIKE") {
    updateData.totalLikes = { increment: 1 };
    if (oldType === "DISLIKE") updateData.totalDislikes = { decrement: 1 };
  } else if (newType === "DISLIKE") {
    updateData.totalDislikes = { increment: 1 };
    if (oldType === "LIKE") updateData.totalLikes = { decrement: 1 };
  } else if (newType === null) {
    if (oldType === "LIKE") {
      updateData.totalLikes = { decrement: 1 };
    } else if (oldType === "DISLIKE") {
      updateData.totalDislikes = { decrement: 1 };
    }
  }

  await prisma.user.update({
    where: { id: targetId },
    data: updateData,
  });
}

module.exports = {
  rate,
};