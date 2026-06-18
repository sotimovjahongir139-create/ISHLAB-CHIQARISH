const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// Retry connect for Neon auto-suspend wakeup
const connectWithRetry = async (retries = 5, delay = 2000) => {
  for (let i = 1; i <= retries; i++) {
    try {
      await prisma.$connect();
      return;
    } catch (err) {
      if (i === retries) throw err;
      await new Promise((r) => setTimeout(r, delay));
    }
  }
};

prisma._connectWithRetry = connectWithRetry;

module.exports = prisma;
