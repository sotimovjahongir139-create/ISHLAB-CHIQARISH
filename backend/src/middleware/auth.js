const jwt = require('jsonwebtoken');
const config = require('../config/config');
const prisma = require('../config/database');
const AppError = require('../utils/AppError');

const USER_QUERY = {
  include: {
    role: {
      include: {
        permissions: { include: { permission: true } },
      },
    },
  },
};

// Retry DB lookup to survive Neon cold-start wakeup latency
const findUserWithRetry = async (userId) => {
  let lastErr;
  for (let i = 0; i < 3; i++) {
    try {
      return await prisma.user.findFirst({
        where: { id: userId, isActive: true, isDeleted: false },
        ...USER_QUERY,
      });
    } catch (err) {
      lastErr = err;
      if (i < 2) await new Promise((r) => setTimeout(r, 800 * (i + 1)));
    }
  }
  throw lastErr;
};

const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return next(new AppError('Token taqdim etilmagan', 401));
  }

  const token = authHeader.split(' ')[1];
  const decoded = jwt.verify(token, config.jwt.secret);

  const user = await findUserWithRetry(decoded.userId);
  if (!user) throw new AppError('Foydalanuvchi topilmadi', 401);

  req.user = user;
  req.permissions = user.role.permissions.map((rp) => rp.permission.name);
  next();
};

module.exports = { authenticate };
