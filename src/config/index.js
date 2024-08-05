require('dotenv').config({
    path: `.env.${process.env.NODE_ENV}`
});

module.exports = {
    port: process.env.PORT || 3010,
    jwtSecret: process.env.JWT_SECRET || 'euex0pumtIJXZtTv5d7WJfB2Ej4JO8mX',
    elasticsearchNode: process.env.ELASTICSEARCH_NODE || 'http://localhost:9200',
    redisHost: process.env.REDIS_HOST || 'localhost',
    redisPort: process.env.REDIS_PORT || 6379,
    notificationWsPort: process.env.NOTIFICATION_WEBSOCKET_PORT || 8080
};