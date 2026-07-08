const prisma = require('../../config/database');
const { getPagination } = require('../../utils/pagination');
const { endOfDay } = require('date-fns');

const INCLUDE = {
  productionLine: { select: { id: true, name: true } },
  employee: { select: { id: true, firstName: true, lastName: true } },
};

const getRecords = async (query) => {
  const { page, limit, skip } = getPagination(query);
  const where = { isDeleted: false };
  if (query.lineId) where.productionLineId = query.lineId;
  if (query.employeeId) where.employeeId = query.employeeId;
  if (query.startDate) where.date = { gte: new Date(query.startDate) };
  if (query.endDate) where.date = { ...(where.date || {}), lte: endOfDay(new Date(query.endDate)) };

  const [data, total, agg] = await Promise.all([
    prisma.kesishRecord.findMany({ where, include: INCLUDE, orderBy: { date: 'desc' }, skip, take: limit }),
    prisma.kesishRecord.count({ where }),
    prisma.kesishRecord.aggregate({ where, _sum: { producedQty: true } }),
  ]);

  return { data, total, page, limit, totalFakt: agg._sum.producedQty || 0 };
};

const createRecord = async (body) => {
  if (!body.productionLineId) throw Object.assign(new Error('productionLineId required'), { statusCode: 400 });
  return prisma.kesishRecord.create({
    data: {
      date: new Date(body.date),
      plannedQty: body.plannedQty != null ? parseInt(body.plannedQty) : null,
      producedQty: body.producedQty != null ? parseInt(body.producedQty) : null,
      brakQty: body.brakQty != null ? parseInt(body.brakQty) : 0,
      notes: body.notes || null,
      productionLineId: body.productionLineId,
      employeeId: body.employeeId || null,
    },
    include: INCLUDE,
  });
};

const updateRecord = async (id, body) => {
  return prisma.kesishRecord.update({
    where: { id },
    data: {
      date: body.date ? new Date(body.date) : undefined,
      plannedQty: body.plannedQty !== undefined ? (body.plannedQty != null ? parseInt(body.plannedQty) : null) : undefined,
      producedQty: body.producedQty !== undefined ? (body.producedQty != null ? parseInt(body.producedQty) : null) : undefined,
      brakQty: body.brakQty !== undefined ? parseInt(body.brakQty) : undefined,
      notes: body.notes !== undefined ? body.notes : undefined,
      productionLineId: body.productionLineId || undefined,
      employeeId: body.employeeId !== undefined ? (body.employeeId || null) : undefined,
    },
    include: INCLUDE,
  });
};

const deleteRecord = async (id) => {
  return prisma.kesishRecord.update({ where: { id }, data: { isDeleted: true } });
};

const getStats = async (query) => {
  const where = { isDeleted: false };
  if (query.startDate) where.date = { gte: new Date(query.startDate) };
  if (query.endDate) where.date = { ...(where.date || {}), lte: endOfDay(new Date(query.endDate)) };
  const [count, agg] = await Promise.all([
    prisma.kesishRecord.count({ where }),
    prisma.kesishRecord.aggregate({ where, _sum: { producedQty: true, plannedQty: true, brakQty: true } }),
  ]);
  return {
    recordCount: count,
    totalFakt: agg._sum.producedQty || 0,
    totalReja: agg._sum.plannedQty || 0,
    totalBrak: agg._sum.brakQty || 0,
  };
};

module.exports = { getRecords, createRecord, updateRecord, deleteRecord, getStats };
