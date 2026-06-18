const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const prisma = require('../config/database');
const config = require('../config/config');
const AppError = require('../utils/AppError');
const { auditLog } = require('../middleware/auditLog');

const generateTokens = (userId) => {
  const accessToken = jwt.sign({ userId }, config.jwt.secret, { expiresIn: config.jwt.expiresIn });
  const refreshToken = jwt.sign({ userId, jti: uuidv4() }, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn,
  });
  return { accessToken, refreshToken };
};

const login = async ({ email, password, ipAddress, userAgent }) => {
  const user = await prisma.user.findFirst({
    where: { email: email.toLowerCase(), isDeleted: false },
    include: {
      role: { include: { permissions: { include: { permission: true } } } },
    },
  });

  if (!user) throw new AppError('Email yoki parol noto\'g\'ri', 401);
  if (!user.isActive) throw new AppError('Foydalanuvchi bloklangan', 403);

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new AppError('Email yoki parol noto\'g\'ri', 401);

  const { accessToken, refreshToken } = generateTokens(user.id);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await prisma.$transaction([
    prisma.refreshToken.create({ data: { token: refreshToken, userId: user.id, expiresAt, ipAddress, userAgent } }),
    prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } }),
  ]);

  await auditLog({ userId: user.id, action: 'LOGIN', entity: 'users', entityId: user.id, req: { ip: ipAddress, headers: { 'user-agent': userAgent } } });

  const { passwordHash, ...userOut } = user;
  return { accessToken, refreshToken, user: userOut };
};

const refreshAccessToken = async (refreshToken) => {
  const stored = await prisma.refreshToken.findUnique({
    where: { token: refreshToken },
    include: { user: { include: { role: true } } },
  });

  if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
    throw new AppError('Yaroqsiz yoki muddati tugagan refresh token', 401);
  }

  jwt.verify(refreshToken, config.jwt.refreshSecret);

  const accessToken = jwt.sign({ userId: stored.userId }, config.jwt.secret, { expiresIn: config.jwt.expiresIn });
  return { accessToken };
};

const logout = async (refreshToken) => {
  await prisma.refreshToken.updateMany({
    where: { token: refreshToken, revokedAt: null },
    data: { revokedAt: new Date() },
  });
};

const changePassword = async (userId, currentPassword, newPassword) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) throw new AppError('Joriy parol noto\'g\'ri', 400);

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  await prisma.refreshToken.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } });
};

module.exports = { login, refreshAccessToken, logout, changePassword };
