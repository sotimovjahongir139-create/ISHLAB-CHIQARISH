const prisma = require('../../config/database');
const { getPagination } = require('../../utils/pagination');
const { endOfDay } = require('date-fns');

const INCLUDE = {
  employee: { select: { id: true, firstName: true, lastName: true } },
  department: { select: { id: true, name: true } },
};

const calcEff = (producedQty, plannedQty) =>
  plannedQty > 0 && producedQty != null
    ? Math.round((producedQty / plannedQty) * 10000) / 100
    : null;

const buildWhere = (query) => {
  const where = { isDeleted: false };
  if (query.employeeId) where.employeeId = query.employeeId;
  if (query.departmentId) where.departmentId = query.departmentId;
  if (query.startDate) where.date = { gte: new Date(query.startDate) };
  if (query.endDate) where.date = { ...(where.date || {}), lte: endOfDay(new Date(query.endDate)) };
  return where;
};

const getRecords = async (query) => {
  const { page, limit, skip } = getPagination(query);
  const where = buildWhere(query);

  const [data, total, agg] = await Promise.all([
    prisma.employeeDailyPerformance.findMany({
      where, include: INCLUDE, orderBy: { date: 'desc' }, skip, take: limit,
    }),
    prisma.employeeDailyPerformance.count({ where }),
    prisma.employeeDailyPerformance.aggregate({
      where, _sum: { producedQty: true, brakQty: true },
    }),
  ]);

  return {
    data, total, page, limit,
    totalFakt: agg._sum.producedQty || 0,
    totalBrak: agg._sum.brakQty || 0,
  };
};

const createRecord = async (body) => {
  if (!body.employeeId) throw Object.assign(new Error('employeeId required'), { statusCode: 400 });
  if (!body.departmentId) throw Object.assign(new Error('departmentId required'), { statusCode: 400 });
  const plannedQty = body.plannedQty != null ? parseInt(body.plannedQty) : null;
  const producedQty = body.producedQty != null ? parseInt(body.producedQty) : null;
  return prisma.employeeDailyPerformance.create({
    data: {
      date: new Date(body.date),
      plannedQty,
      producedQty,
      brakQty: body.brakQty != null ? parseInt(body.brakQty) : 0,
      efficiency: calcEff(producedQty, plannedQty),
      notes: body.notes || null,
      employeeId: body.employeeId,
      departmentId: body.departmentId,
    },
    include: INCLUDE,
  });
};

const updateRecord = async (id, body) => {
  const existing = await prisma.employeeDailyPerformance.findUnique({ where: { id } });
  const plannedQty = body.plannedQty !== undefined
    ? (body.plannedQty != null ? parseInt(body.plannedQty) : null)
    : existing?.plannedQty;
  const producedQty = body.producedQty !== undefined
    ? (body.producedQty != null ? parseInt(body.producedQty) : null)
    : existing?.producedQty;
  return prisma.employeeDailyPerformance.update({
    where: { id },
    data: {
      date: body.date ? new Date(body.date) : undefined,
      plannedQty: body.plannedQty !== undefined ? plannedQty : undefined,
      producedQty: body.producedQty !== undefined ? producedQty : undefined,
      brakQty: body.brakQty !== undefined ? parseInt(body.brakQty) : undefined,
      efficiency: calcEff(producedQty, plannedQty),
      notes: body.notes !== undefined ? body.notes : undefined,
      employeeId: body.employeeId || undefined,
      departmentId: body.departmentId || undefined,
    },
    include: INCLUDE,
  });
};

const deleteRecord = async (id) => {
  return prisma.employeeDailyPerformance.update({ where: { id }, data: { isDeleted: true } });
};

const getStats = async (query) => {
  const where = buildWhere(query);

  const [count, agg, byEmployee] = await Promise.all([
    prisma.employeeDailyPerformance.count({ where }),
    prisma.employeeDailyPerformance.aggregate({
      where,
      _sum: { producedQty: true, brakQty: true, plannedQty: true },
      _avg: { efficiency: true },
    }),
    prisma.employeeDailyPerformance.groupBy({
      by: ['employeeId'],
      where,
      _sum: { producedQty: true, plannedQty: true },
      _avg: { efficiency: true },
      orderBy: { _avg: { efficiency: 'desc' } },
      take: 5,
    }),
  ]);

  const empIds = byEmployee.map((e) => e.employeeId);
  const employees = await prisma.employee.findMany({
    where: { id: { in: empIds } },
    select: { id: true, firstName: true, lastName: true },
  });

  const topPerformers = byEmployee.map((e) => {
    const emp = employees.find((em) => em.id === e.employeeId);
    return {
      employeeId: e.employeeId,
      name: emp ? `${emp.firstName} ${emp.lastName}` : 'Noma\'lum',
      producedQty: e._sum.producedQty || 0,
      plannedQty: e._sum.plannedQty || 0,
      efficiency: Math.round((e._avg.efficiency || 0) * 100) / 100,
    };
  });

  return {
    totalRecords: count,
    totalFakt: agg._sum.producedQty || 0,
    totalBrak: agg._sum.brakQty || 0,
    avgEfficiency: Math.round((agg._avg.efficiency || 0) * 100) / 100,
    topPerformers,
  };
};

module.exports = { getRecords, createRecord, updateRecord, deleteRecord, getStats };
