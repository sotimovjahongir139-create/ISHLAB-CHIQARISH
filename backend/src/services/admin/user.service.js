const bcrypt = require('bcryptjs');
const prisma = require('../../config/database');
const AppError = require('../../utils/AppError');
const { getPagination, getSort } = require('../../utils/pagination');
const { auditLog } = require('../../middleware/auditLog');

const INCLUDE = {
  role: { select: { id: true, name: true, displayName: true } },
  department: { select: { id: true, name: true, code: true } },
  factory: { select: { id: true, name: true } },
};

const SAFE_SELECT = {
  id: true, email: true, username: true,
  firstName: true, lastName: true, phone: true,
  avatar: true, isActive: true, isDeleted: true,
  lastLoginAt: true, createdAt: true, updatedAt: true,
  roleId: true, departmentId: true, factoryId: true,
  role: { select: { id: true, name: true, displayName: true } },
  department: { select: { id: true, name: true } },
  factory: { select: { id: true, name: true } },
};

const getUsers = async (query) => {
  const { page, limit, skip } = getPagination(query);
  const where = { isDeleted: false };

  if (query.search) {
    where.OR = [
      { email: { contains: query.search, mode: 'insensitive' } },
      { username: { contains: query.search, mode: 'insensitive' } },
      { firstName: { contains: query.search, mode: 'insensitive' } },
      { lastName: { contains: query.search, mode: 'insensitive' } },
    ];
  }
  if (query.roleId) where.roleId = query.roleId;
  if (query.departmentId) where.departmentId = query.departmentId;
  if (query.isActive !== undefined) where.isActive = query.isActive === 'true';

  const [data, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: SAFE_SELECT,
      orderBy: getSort(query, ['email', 'firstName', 'lastName', 'createdAt']),
      skip,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  return { data, total, page, limit };
};

const getUser = async (id) => {
  const user = await prisma.user.findFirst({
    where: { id, isDeleted: false },
    select: SAFE_SELECT,
  });
  if (!user) throw new AppError('Foydalanuvchi topilmadi', 404);
  return user;
};

const createUser = async (body, actorId, req) => {
  const exists = await prisma.user.findFirst({
    where: { OR: [{ email: body.email.toLowerCase() }, { username: body.username }], isDeleted: false },
  });
  if (exists) throw new AppError('Bu email yoki username allaqachon mavjud', 409);

  const passwordHash = await bcrypt.hash(body.password, 12);

  const user = await prisma.user.create({
    data: {
      email: body.email.toLowerCase(),
      username: body.username,
      passwordHash,
      firstName: body.firstName,
      lastName: body.lastName,
      phone: body.phone,
      roleId: body.roleId,
      departmentId: body.departmentId || undefined,
      factoryId: body.factoryId || undefined,
    },
    select: SAFE_SELECT,
  });

  await auditLog({ userId: actorId, action: 'CREATE', entity: 'users', entityId: user.id, newValues: { email: user.email, roleId: user.roleId }, req });
  return user;
};

const updateUser = async (id, body, actorId, req) => {
  const existing = await prisma.user.findFirst({ where: { id, isDeleted: false }, select: SAFE_SELECT });
  if (!existing) throw new AppError('Foydalanuvchi topilmadi', 404);

  if (body.email && body.email.toLowerCase() !== existing.email) {
    const dup = await prisma.user.findFirst({ where: { email: body.email.toLowerCase(), isDeleted: false, NOT: { id } } });
    if (dup) throw new AppError('Bu email allaqachon ishlatilmoqda', 409);
  }

  const data = {
    firstName: body.firstName,
    lastName: body.lastName,
    phone: body.phone,
    roleId: body.roleId,
    departmentId: body.departmentId || undefined,
    factoryId: body.factoryId || undefined,
  };

  if (body.email) data.email = body.email.toLowerCase();
  if (body.password) data.passwordHash = await bcrypt.hash(body.password, 12);

  const updated = await prisma.user.update({ where: { id }, data, select: SAFE_SELECT });

  await auditLog({ userId: actorId, action: 'UPDATE', entity: 'users', entityId: id, oldValues: existing, newValues: data, req });
  return updated;
};

const toggleActive = async (id, actorId, req) => {
  const user = await prisma.user.findFirst({ where: { id, isDeleted: false } });
  if (!user) throw new AppError('Foydalanuvchi topilmadi', 404);
  if (user.id === actorId) throw new AppError('O\'z hisobingizni bloklashingiz mumkin emas', 400);

  const updated = await prisma.user.update({ where: { id }, data: { isActive: !user.isActive }, select: SAFE_SELECT });
  await auditLog({ userId: actorId, action: 'UPDATE', entity: 'users', entityId: id, newValues: { isActive: updated.isActive }, req });
  return updated;
};

const deleteUser = async (id, actorId, req) => {
  const user = await prisma.user.findFirst({ where: { id, isDeleted: false } });
  if (!user) throw new AppError('Foydalanuvchi topilmadi', 404);
  if (user.id === actorId) throw new AppError('O\'z hisobingizni o\'chirishingiz mumkin emas', 400);

  await prisma.user.update({ where: { id }, data: { isDeleted: true, deletedAt: new Date(), isActive: false } });
  await auditLog({ userId: actorId, action: 'DELETE', entity: 'users', entityId: id, req });
};

const resetPassword = async (id, newPassword, actorId, req) => {
  const user = await prisma.user.findFirst({ where: { id, isDeleted: false } });
  if (!user) throw new AppError('Foydalanuvchi topilmadi', 404);

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where: { id }, data: { passwordHash } });
  await prisma.refreshToken.updateMany({ where: { userId: id, revokedAt: null }, data: { revokedAt: new Date() } });
  await auditLog({ userId: actorId, action: 'UPDATE', entity: 'users', entityId: id, newValues: { action: 'password_reset' }, req });
};

module.exports = { getUsers, getUser, createUser, updateUser, toggleActive, deleteUser, resetPassword };
