const Redis = require('ioredis')

let redisClient

const connectRedis = () => {
    try {
        redisClient = new Redis(process.env.REDIS_URL, {
            tls: {}, // Necessary for Upstash or SSL-enabled Redis
        })

        redisClient.on('connect', () => console.log('Redis client connected'));
        redisClient.on('error', (err) => console.error('Redis Client Error', err))
    } catch (error) {
        console.error('Redis connection failed:', error);
    }
}

// Getter to access the Redis client instance anywhere else in your app
const getRedisClient = () => {
    if (!redisClient) {
        throw new Error('Redis client not connected yet!')
    }
    return redisClient
};

module.exports = {
    connectRedis,
    getRedisClient,
};
