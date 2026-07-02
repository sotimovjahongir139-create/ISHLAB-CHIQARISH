const prisma = require('../../config/database');
const { getPagination } = require('../../utils/pagination');
const { endOfDay } = require('date-fns');

const INCLUDE = {
  department: { select: { id: true, name: true } },
  productionLine: { select: { id: true, name: true } },
  employee: { select: { id: true, firstName: true, lastName: true } },
};

const getPaintRecords = async (query) => {
  const { page, limit, skip } = getPagination(query);
  const where = {};
  if (query.departmentId) where.departmentId = query.departmentId;
  if (query.lineId) where.lineId = query.lineId;
  if (query.dateFrom) where.date = { gte: new Date(query.dateFrom) };
  if (query.dateTo) where.date = { ...(where.date || {}), lte: endOfDay(new Date(query.dateTo)) };

  const [data, total] = await Promise.all([
    prisma.paintRecord.findMany({ where, include: INCLUDE, orderBy: { date: 'desc' }, skip, take: limit }),
    prisma.paintRecord.count({ where }),
  ]);
  const totalQty = await prisma.paintRecord.aggregate({ where, _sum: { quantity: true } });
  return { data, total, page, limit, totalQty: totalQty._sum.quantity || 0 };
};

const createPaintRecord = async (body) => {
  const lineId = body.lineId || body.departmentId || null;
  return prisma.paintRecord.create({
    data: {
      paintName: body.paintName || '',
      quantity: parseFloat(body.quantity),
      date: new Date(body.date),
      notes: body.notes || null,
      planned: body.planned != null ? parseFloat(body.planned) : null,
      lineId: lineId || undefined,
      employeeId: body.employeeId || null,
    },
    include: INCLUDE,
  });
};

const updatePaintRecord = async (id, body) => {
  const lineId = body.lineId || body.departmentId || undefined;
  return prisma.paintRecord.update({
    where: { id },
    data: {
      paintName: body.paintName !== undefined ? body.paintName : undefined,
      quantity: body.quantity !== undefined ? parseFloat(body.quantity) : undefined,
      date: body.date ? new Date(body.date) : undefined,
      notes: body.notes,
      planned: body.planned != null ? parseFloat(body.planned) : undefined,
      lineId: lineId || undefined,
      employeeId: body.employeeId || null,
    },
    include: INCLUDE,
  });
};

const deletePaintRecord = async (id) => {
  return prisma.paintRecord.delete({ where: { id } });
};

module.exports = { getPaintRecords, createPaintRecord, updatePaintRecord, deletePaintRecord };
