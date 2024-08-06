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
  const existingLike = await prisma.like.findUnique({
    where: { userId_targetId: { userId, targetId } },
  });

  if (existingLike) {
    return existingLike.type === type
      ? removeLike(existingLike.id, targetId, type)
      : updateLike(existingLike.id, targetId, type, existingLike.type);
  }

  return addNewLike(userId, targetId, type);
}

/**
 * Removes an existing like or dislike
 * @param {string} likeId
 * @param {string} targetId
 * @param {string} type
 * @returns {object} Result message
 */
async function removeLike(likeId, targetId, type) {
  await prisma.like.delete({ where: { id: likeId } });
  await updateLikeDislikeCount(targetId, null, type);
  await sendNotification(targetId, "UNDO");
  return { message: `Successfully removed your ${type} for this user.` };
}

/**
 * Updates an existing like or dislike to a new type
 * @param {string} likeId
 * @param {string} targetId
 * @param {string} newType
 * @param {string} oldType
 * @returns {object} Result message and likeId
 */
async function updateLike(likeId, targetId, newType, oldType) {
  await prisma.like.update({ where: { id: likeId }, data: { type: newType } });
  await updateLikeDislikeCount(targetId, newType, oldType);
  await sendNotification(targetId, newType);
  return { message: `Successfully updated to ${newType}.`, likeId };
}

/**
 * Adds a new like or dislike entry
 * @param {string} userId
 * @param {string} targetId
 * @param {string} type
 * @returns {object} Result message and likeId
 */
async function addNewLike(userId, targetId, type) {
  const newLike = await prisma.like.create({
    data: { userId, targetId, type },
  });
  await updateLikeDislikeCount(targetId, type);
  await sendNotification(targetId, type);
  return { message: `Successfully added ${type}.`, likeId: newLike.id };
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
      data: { userId: targetId, type, isRead: false },
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
  const updateData = {
    ...(newType === "LIKE" && { totalLikes: { increment: 1 } }),
    ...(newType === "DISLIKE" && { totalDislikes: { increment: 1 } }),
    ...(newType === null && oldType === "LIKE" && { totalLikes: { decrement: 1 } }),
    ...(newType === null && oldType === "DISLIKE" && { totalDislikes: { decrement: 1 } }),
    ...(oldType === "DISLIKE" && newType === "LIKE" && { totalDislikes: { decrement: 1 } }),
    ...(oldType === "LIKE" && newType === "DISLIKE" && { totalLikes: { decrement: 1 } }),
  };

  await prisma.user.update({ where: { id: targetId }, data: updateData });
}

module.exports = { rate };