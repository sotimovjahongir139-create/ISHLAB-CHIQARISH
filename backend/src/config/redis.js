const Redis = require('ioredis');
const config = require('./config');
const logger = require('../utils/logger');

let redis;

function getRedis() {
  if (!redis) {
    redis = new Redis(config.redis.url, {
      password: config.redis.password,
      retryStrategy: (times) => Math.min(times * 50, 2000),
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });

    redis.on('connect', () => logger.info('Redis connected'));
    redis.on('error', (err) => logger.error('Redis error:', err.message));
  }
  return redis;
}

module.exports = { getRedis };
