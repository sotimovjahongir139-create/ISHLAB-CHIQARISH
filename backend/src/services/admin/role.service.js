const prisma = require('../../config/database');
const AppError = require('../../utils/AppError');
const { auditLog } = require('../../middleware/auditLog');

const INCLUDE = {
  permissions: {
    include: {
      permission: { select: { id: true, name: true, displayName: true, module: true, action: true } },
    },
  },
  _count: { select: { users: true } },
};

const getRoles = async () => {
  return prisma.role.findMany({
    include: INCLUDE,
    orderBy: { name: 'asc' },
  });
};

const getRole = async (id) => {
  const role = await prisma.role.findUnique({ where: { id }, include: INCLUDE });
  if (!role) throw new AppError('Rol topilmadi', 404);
  return role;
};

const createRole = async (body, actorId, req) => {
  const exists = await prisma.role.findUnique({ where: { name: body.name } });
  if (exists) throw new AppError('Bu nom bilan rol allaqachon mavjud', 409);

  const role = await prisma.role.create({
    data: { name: body.name, displayName: body.displayName, description: body.description },
    include: INCLUDE,
  });

  await auditLog({ userId: actorId, action: 'CREATE', entity: 'roles', entityId: role.id, newValues: { name: role.name }, req });
  return role;
};

const updateRole = async (id, body, actorId, req) => {
  const role = await prisma.role.findUnique({ where: { id } });
  if (!role) throw new AppError('Rol topilmadi', 404);
  if (role.isSystem && body.name && body.name !== role.name) {
    throw new AppError('Tizim rollarining nomini o\'zgartirish mumkin emas', 400);
  }

  const updated = await prisma.role.update({
    where: { id },
    data: { displayName: body.displayName, description: body.description },
    include: INCLUDE,
  });

  await auditLog({ userId: actorId, action: 'UPDATE', entity: 'roles', entityId: id, newValues: body, req });
  return updated;
};

const deleteRole = async (id, actorId, req) => {
  const role = await prisma.role.findUnique({ where: { id }, include: { _count: { select: { users: true } } } });
  if (!role) throw new AppError('Rol topilmadi', 404);
  if (role.isSystem) throw new AppError('Tizim rollarini o\'chirish mumkin emas', 400);
  if (role._count.users > 0) throw new AppError(`Bu rolda ${role._count.users} ta foydalanuvchi bor`, 400);

  await prisma.role.delete({ where: { id } });
  await auditLog({ userId: actorId, action: 'DELETE', entity: 'roles', entityId: id, req });
};

/**
 * Replace all permissions for a role atomically.
 * permissionIds: string[] — full set (not delta)
 */
const setRolePermissions = async (roleId, permissionIds, actorId, req) => {
  const role = await prisma.role.findUnique({ where: { id: roleId } });
  if (!role) throw new AppError('Rol topilmadi', 404);

  await prisma.$transaction([
    prisma.rolePermission.deleteMany({ where: { roleId } }),
    prisma.rolePermission.createMany({
      data: permissionIds.map((permissionId) => ({ roleId, permissionId })),
      skipDuplicates: true,
    }),
  ]);

  await auditLog({ userId: actorId, action: 'UPDATE', entity: 'roles', entityId: roleId, newValues: { permissionIds }, req });
  return getRole(roleId);
};

const getAllPermissions = async () => {
  const permissions = await prisma.permission.findMany({ orderBy: [{ module: 'asc' }, { action: 'asc' }] });

  // Group by module
  const grouped = {};
  for (const p of permissions) {
    if (!grouped[p.module]) grouped[p.module] = [];
    grouped[p.module].push(p);
  }
  return grouped;
};

module.exports = { getRoles, getRole, createRole, updateRole, deleteRole, setRolePermissions, getAllPermissions };
