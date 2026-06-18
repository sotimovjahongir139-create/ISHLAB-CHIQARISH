const prisma = require('../../config/database');
const AppError = require('../../utils/AppError');
const { auditLog } = require('../../middleware/auditLog');
const { getPagination, getSort } = require('../../utils/pagination');

const INCLUDE = {
  factory: { select: { id: true, name: true, code: true } },
  _count: { select: { employees: true, users: true } },
};

const getDepartments = async (query) => {
  const { page, limit, skip } = getPagination(query);
  const where = { isDeleted: false };

  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: 'insensitive' } },
      { code: { contains: query.search, mode: 'insensitive' } },
    ];
  }
  if (query.factoryId) where.factoryId = query.factoryId;
  if (query.isActive !== undefined) where.isActive = query.isActive === 'true';

  const [data, total] = await Promise.all([
    prisma.department.findMany({
      where,
      include: INCLUDE,
      orderBy: getSort(query, ['name', 'code', 'createdAt']),
      skip,
      take: limit,
    }),
    prisma.department.count({ where }),
  ]);

  return { data, total, page, limit };
};

const createDepartment = async (body, actorId, req) => {
  const exists = await prisma.department.findFirst({
    where: { code: body.code, isDeleted: false },
  });
  if (exists) throw new AppError('Bu kod bilan bo\'lim allaqachon mavjud', 409);

  const dept = await prisma.department.create({
    data: {
      name: body.name,
      code: body.code.toUpperCase(),
      description: body.description,
      factoryId: body.factoryId,
      managerId: body.managerId || undefined,
    },
    include: INCLUDE,
  });

  await auditLog({ userId: actorId, action: 'CREATE', entity: 'departments', entityId: dept.id, newValues: { name: dept.name, code: dept.code }, req });
  return dept;
};

const updateDepartment = async (id, body, actorId, req) => {
  const dept = await prisma.department.findFirst({ where: { id, isDeleted: false } });
  if (!dept) throw new AppError('Bo\'lim topilmadi', 404);

  const updated = await prisma.department.update({
    where: { id },
    data: {
      name: body.name,
      description: body.description,
      isActive: body.isActive,
      managerId: body.managerId || undefined,
    },
    include: INCLUDE,
  });

  await auditLog({ userId: actorId, action: 'UPDATE', entity: 'departments', entityId: id, oldValues: { name: dept.name }, newValues: body, req });
  return updated;
};

const deleteDepartment = async (id, actorId, req) => {
  const dept = await prisma.department.findFirst({
    where: { id, isDeleted: false },
    include: { _count: { select: { employees: true } } },
  });
  if (!dept) throw new AppError('Bo\'lim topilmadi', 404);
  if (dept._count.employees > 0) throw new AppError(`Bu bo'limda ${dept._count.employees} ta xodim bor`, 400);

  await prisma.department.update({ where: { id }, data: { isDeleted: true, deletedAt: new Date() } });
  await auditLog({ userId: actorId, action: 'DELETE', entity: 'departments', entityId: id, req });
};

module.exports = { getDepartments, createDepartment, updateDepartment, deleteDepartment };
