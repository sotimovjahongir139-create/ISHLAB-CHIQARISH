const prisma = require('../../config/database');
const { getPagination } = require('../../utils/pagination');
const { endOfDay } = require('date-fns');

const getWasteRecords = async (query) => {
  const { page, limit, skip } = getPagination(query);
  const where = {};
  if (query.departmentId) where.departmentId = query.departmentId;
  if (query.dateFrom) where.date = { gte: new Date(query.dateFrom) };
  if (query.dateTo) where.date = { ...(where.date || {}), lte: endOfDay(new Date(query.dateTo)) };

  const [data, total] = await Promise.all([
    prisma.wasteRecord.findMany({
      where,
      include: { department: { select: { id: true, name: true } } },
      orderBy: { date: 'desc' },
      skip,
      take: limit,
    }),
    prisma.wasteRecord.count({ where }),
  ]);
  const totalQty = await prisma.wasteRecord.aggregate({ where, _sum: { quantity: true } });
  return { data, total, page, limit, totalQty: totalQty._sum.quantity || 0 };
};

const createWasteRecord = async (body) => {
  return prisma.wasteRecord.create({
    data: {
      name: body.name,
      quantity: parseFloat(body.quantity),
      date: new Date(body.date),
      notes: body.notes,
      departmentId: body.departmentId,
    },
    include: { department: { select: { id: true, name: true } } },
  });
};

const updateWasteRecord = async (id, body) => {
  return prisma.wasteRecord.update({
    where: { id },
    data: {
      name: body.name,
      quantity: body.quantity !== undefined ? parseFloat(body.quantity) : undefined,
      date: body.date ? new Date(body.date) : undefined,
      notes: body.notes,
      departmentId: body.departmentId,
    },
    include: { department: { select: { id: true, name: true } } },
  });
};

const deleteWasteRecord = async (id) => {
  return prisma.wasteRecord.delete({ where: { id } });
};

module.exports = { getWasteRecords, createWasteRecord, updateWasteRecord, deleteWasteRecord };
