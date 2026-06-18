const prisma = require('../../config/database');
const AppError = require('../../utils/AppError');
const { getPagination, getSort } = require('../../utils/pagination');
const { endOfDay } = require('date-fns');

const getDowntimes = async (query) => {
  const { page, limit, skip } = getPagination(query);
  const where = {};

  if (query.status) where.status = query.status;
  if (query.lineId) where.productionLineId = query.lineId;
  if (query.reasonId) where.reasonId = query.reasonId;
  if (query.dateFrom) where.startTime = { gte: new Date(query.dateFrom) };
  if (query.dateTo) where.startTime = { ...(where.startTime || {}), lte: endOfDay(new Date(query.dateTo)) };

  const [data, total] = await Promise.all([
    prisma.downtime.findMany({
      where,
      include: {
        productionLine: { select: { id: true, name: true, code: true } },
        reason: { select: { id: true, name: true, category: true } },
        equipment: { select: { id: true, name: true, code: true } },
      },
      orderBy: getSort(query, ['startTime', 'durationMinutes']),
      skip,
      take: limit,
    }),
    prisma.downtime.count({ where }),
  ]);

  return { data, total, page, limit };
};

const createDowntime = async (body) => {
  return prisma.downtime.create({
    data: {
      startTime: new Date(body.startTime),
      productionLineId: body.productionLineId,
      reasonId: body.reasonId,
      equipmentId: body.equipmentId,
      shiftId: body.shiftId,
      description: body.description,
    },
    include: {
      productionLine: true,
      reason: true,
    },
  });
};

const resolveDowntime = async (id, endTime) => {
  const downtime = await prisma.downtime.findUnique({ where: { id } });
  if (!downtime) throw new AppError('Toshlanish topilmadi', 404);
  if (downtime.status !== 'ACTIVE') throw new AppError('Bu toshlanish allaqachon yopilgan', 400);

  const end = endTime ? new Date(endTime) : new Date();
  const durationMinutes = (end - downtime.startTime) / 60000;

  return prisma.downtime.update({
    where: { id },
    data: { endTime: end, durationMinutes, status: 'RESOLVED' },
    include: { productionLine: true, reason: true },
  });
};

const getActiveDowntimes = async (factoryId) => {
  return prisma.downtime.findMany({
    where: {
      status: 'ACTIVE',
      ...(factoryId ? { productionLine: { factoryId } } : {}),
    },
    include: {
      productionLine: { select: { id: true, name: true } },
      reason: { select: { id: true, name: true, category: true } },
    },
    orderBy: { startTime: 'asc' },
  });
};

const getReasons = async () => {
  return prisma.downtimeReason.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } });
};

module.exports = { getDowntimes, createDowntime, resolveDowntime, getActiveDowntimes, getReasons };
