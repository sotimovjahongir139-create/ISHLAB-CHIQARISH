const jwt = require('jsonwebtoken');
const config = require('../config/config');
const prisma = require('../config/database');
const AppError = require('../utils/AppError');

const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return next(new AppError('Token taqdim etilmagan', 401));
  }

  const token = authHeader.split(' ')[1];

  const decoded = jwt.verify(token, config.jwt.secret);

  const user = await prisma.user.findFirst({
    where: { id: decoded.userId, isActive: true, isDeleted: false },
    include: {
      role: {
        include: {
          permissions: { include: { permission: true } },
        },
      },
    },
  });

  if (!user) throw new AppError('Foydalanuvchi topilmadi', 401);

  req.user = user;
  req.permissions = user.role.permissions.map((rp) => rp.permission.name);
  next();
};

module.exports = { authenticate };
