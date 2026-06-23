const prisma = require('../../config/database');
const AppError = require('../../utils/AppError');
const { getPagination, getSort } = require('../../utils/pagination');
const { endOfDay } = require('date-fns');

// Ensure daily_work_schedule table exists
(async () => {
  try {
    await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS daily_work_schedule (id TEXT NOT NULL, date DATE NOT NULL, total_hours NUMERIC(5,2) NOT NULL DEFAULT 8, notes TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), CONSTRAINT daily_work_schedule_pkey PRIMARY KEY (id), CONSTRAINT daily_work_schedule_date_key UNIQUE (date))`);
  } catch (_) {}
})();

const getDowntimes = async (query) => {
  const { page, limit, skip } = getPagination(query);
  const where = {};

  if (query.status) where.status = query.status;
  if (query.lineId) where.productionLineId = query.lineId;
  if (query.reasonId) where.reasonId = query.reasonId;

  // Date + optional time-range filter
  if (query.date) {
    const dateStr = query.date.slice(0, 10);
    const fromStr = query.timeFrom ? `${dateStr}T${query.timeFrom}:00` : `${dateStr}T00:00:00`;
    const toStr   = query.timeTo   ? `${dateStr}T${query.timeTo}:59`   : `${dateStr}T23:59:59`;
    where.startTime = { gte: new Date(fromStr), lte: new Date(toStr) };
  } else {
    // legacy dateFrom/dateTo support (fallback)
    if (query.dateFrom) where.startTime = { gte: new Date(query.dateFrom) };
    if (query.dateTo) where.startTime = { ...(where.startTime || {}), lte: endOfDay(new Date(query.dateTo)) };
  }

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
  if (!downtime) throw new AppError('To\'xtalish topilmadi', 404);
  if (downtime.status !== 'ACTIVE') throw new AppError('Bu to\'xtalish allaqachon yopilgan', 400);

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

const createReason = async (body) => {
  return prisma.downtimeReason.create({
    data: {
      name: body.name,
      code: body.code,
      category: body.category || 'UNPLANNED',
      description: body.description || null,
    },
  });
};

const updateReason = async (id, body) => {
  const reason = await prisma.downtimeReason.findFirst({ where: { id } });
  if (!reason) throw new AppError('Sabab topilmadi', 404);
  return prisma.downtimeReason.update({
    where: { id },
    data: {
      name: body.name !== undefined ? body.name : reason.name,
      code: body.code !== undefined ? body.code : reason.code,
      category: body.category || reason.category,
      description: body.description !== undefined ? body.description : reason.description,
    },
  });
};

const deleteReason = async (id) => {
  const reason = await prisma.downtimeReason.findFirst({ where: { id } });
  if (!reason) throw new AppError('Sabab topilmadi', 404);
  return prisma.downtimeReason.update({ where: { id }, data: { isActive: false } });
};

const deleteDowntime = async (id) => {
  const downtime = await prisma.downtime.findUnique({ where: { id } });
  if (!downtime) throw new AppError("To'xtalish topilmadi", 404);
  await prisma.downtime.delete({ where: { id } });
};

const getWorkSchedule = async (date) => {
  if (!date) return null;
  const d = new Date(date.slice(0, 10) + 'T00:00:00');
  return prisma.dailyWorkSchedule.findFirst({ where: { date: d } });
};

const upsertWorkSchedule = async (date, totalHours) => {
  if (!date || totalHours === undefined || totalHours === null) throw new AppError('Sana va ish vaqti kiritilishi shart', 400);
  const d = new Date(date.slice(0, 10) + 'T00:00:00');
  const hours = parseFloat(totalHours);
  if (isNaN(hours) || hours < 0 || hours > 24) throw new AppError("Ish vaqti 0–24 soat oralig'ida bo'lishi shart", 400);
  const existing = await prisma.dailyWorkSchedule.findFirst({ where: { date: d } });
  if (existing) {
    return prisma.dailyWorkSchedule.update({ where: { id: existing.id }, data: { totalHours: hours, updatedAt: new Date() } });
  }
  return prisma.dailyWorkSchedule.create({ data: { date: d, totalHours: hours } });
};

module.exports = { getDowntimes, createDowntime, resolveDowntime, getActiveDowntimes, getReasons, createReason, updateReason, deleteReason, deleteDowntime, getWorkSchedule, upsertWorkSchedule };
