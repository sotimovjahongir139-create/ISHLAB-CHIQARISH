const Redis = require('ioredis');
const config = require('./config');
const logger = require('../utils/logger');

let redis;

function getRedis() {
  if (!redis) {
    redis = new Redis(config.redis.url, {
      password: config.redis.password,
      retryStrategy: (times) => {
        if (times > 3) return null; // stop retrying after 3 attempts
        return Math.min(times * 200, 1000);
      },
      maxRetriesPerRequest: 1,
      lazyConnect: true,
      enableOfflineQueue: false,
    });

    redis.on('connect', () => logger.info('Redis connected'));
    redis.on('error', () => {}); // suppress — Redis optional
  }
  return redis;
}

module.exports = { getRedis };
