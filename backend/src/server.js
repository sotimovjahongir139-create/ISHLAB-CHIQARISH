require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const http = require('http');
const app = require('./app');
const { initSocket } = require('./config/socket');
const { getRedis } = require('./config/redis');
const prisma = require('./config/database');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);
initSocket(server);

const start = async () => {
  try {
    await prisma._connectWithRetry();
    logger.info('Database connected');
    logger.info('DB host: ' + (process.env.DATABASE_URL || '').replace(/:[^:@]+@/, ':***@').split('@')[1]?.split('/')[0]);

    await require('../scripts/migrate')().catch((err) => logger.error('Migration error (non-fatal):', err.message));

    const redis = getRedis();
    await redis.connect().catch(() => logger.warn('Redis connection skipped'));

    server.listen(PORT, () => {
      logger.info(`Server running on port ${PORT} [${process.env.NODE_ENV}]`);
    });
  } catch (err) {
    logger.error('Startup failed:', err);
    process.exit(1);
  }
};

process.on('uncaughtException', (err) => {
  console.error('[FATAL uncaughtException]', new Date().toISOString(), err);
  // Keep server running — do not exit
});

process.on('unhandledRejection', (reason) => {
  console.error('[FATAL unhandledRejection]', new Date().toISOString(), reason);
  // Keep server running — do not exit
});

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down...');
  await prisma.$disconnect();
  server.close(() => process.exit(0));
});

start();
