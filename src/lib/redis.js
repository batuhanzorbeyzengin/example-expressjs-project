const redis = require("redis");
const config = require('../config');

const redisClient = redis.createClient({
  url: `redis://${config.redisHost}:${config.redisPort}`,
});

redisClient.on("error", (err) => {
  console.error("Redis client not connected to the server:", err);
});

redisClient.on("connect", () => {
  console.log("Redis client connected to the server");
});

redisClient.connect();

module.exports = redisClient;
