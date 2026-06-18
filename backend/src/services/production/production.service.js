const prisma = require('../../config/database');
const AppError = require('../../utils/AppError');
const { getPagination, getSort } = require('../../utils/pagination');

const INCLUDE_FULL = {
  productionLine: { select: { id: true, name: true, code: true } },
  productModel: { select: { id: true, name: true, code: true, unit: true } },
  shift: { select: { id: true, name: true, code: true } },
};

// --- Production Plans ---
const getPlans = async (query) => {
  const { page, limit, skip } = getPagination(query);
  const where = { isDeleted: false };

  if (query.date) where.planDate = new Date(query.date);
  if (query.lineId) where.productionLineId = query.lineId;
  if (query.modelId) where.productModelId = query.modelId;
  if (query.shiftId) where.shiftId = query.shiftId;
  if (query.status) where.status = query.status;

  const [data, total] = await Promise.all([
    prisma.productionPlan.findMany({
      where,
      include: INCLUDE_FULL,
      orderBy: getSort(query, ['planDate', 'createdAt', 'status']),
      skip,
      take: limit,
    }),
    prisma.productionPlan.count({ where }),
  ]);

  return { data, total, page, limit };
};

const createPlan = async (body) => {
  return prisma.productionPlan.create({
    data: {
      planDate: new Date(body.planDate),
      plannedQty: body.plannedQty,
      productionLineId: body.productionLineId,
      productModelId: body.productModelId,
      shiftId: body.shiftId,
      notes: body.notes,
    },
    include: INCLUDE_FULL,
  });
};

const updatePlan = async (id, body) => {
  const plan = await prisma.productionPlan.findFirst({ where: { id, isDeleted: false } });
  if (!plan) throw new AppError('Reja topilmadi', 404);
  if (['COMPLETED', 'CANCELLED'].includes(plan.status)) throw new AppError('Bu rejani o\'zgartirish mumkin emas', 400);

  return prisma.productionPlan.update({
    where: { id },
    data: {
      plannedQty: body.plannedQty,
      status: body.status,
      notes: body.notes,
    },
    include: INCLUDE_FULL,
  });
};

// --- Production Facts ---
const getFacts = async (query) => {
  const { page, limit, skip } = getPagination(query);
  const where = {};

  if (query.dateFrom) where.factDate = { gte: new Date(query.dateFrom) };
  if (query.dateTo) where.factDate = { ...(where.factDate || {}), lte: new Date(query.dateTo) };
  if (query.lineId) where.productionLineId = query.lineId;
  if (query.modelId) where.productModelId = query.modelId;
  if (query.shiftId) where.shiftId = query.shiftId;

  const [data, total] = await Promise.all([
    prisma.productionFact.findMany({
      where,
      include: { ...INCLUDE_FULL, plan: { select: { id: true, plannedQty: true } } },
      orderBy: getSort(query, ['factDate', 'createdAt', 'efficiency']),
      skip,
      take: limit,
    }),
    prisma.productionFact.count({ where }),
  ]);

  return { data, total, page, limit };
};

const createFact = async (body) => {
  const goodQty = body.producedQty - (body.defectQty || 0);
  let efficiency = null;

  if (body.planId) {
    const plan = await prisma.productionPlan.findUnique({ where: { id: body.planId } });
    if (plan) efficiency = Math.round((body.producedQty / plan.plannedQty) * 10000) / 100;
  }

  const fact = await prisma.productionFact.create({
    data: {
      factDate: new Date(body.factDate),
      producedQty: body.producedQty,
      defectQty: body.defectQty || 0,
      goodQty,
      startTime: body.startTime ? new Date(body.startTime) : undefined,
      endTime: body.endTime ? new Date(body.endTime) : undefined,
      efficiency,
      productionLineId: body.productionLineId,
      productModelId: body.productModelId,
      shiftId: body.shiftId,
      planId: body.planId,
      notes: body.notes,
    },
    include: INCLUDE_FULL,
  });

  if (body.planId) {
    await prisma.productionPlan.update({
      where: { id: body.planId },
      data: { status: 'IN_PROGRESS' },
    });
  }

  return fact;
};

const getLines = async (factoryId) => {
  return prisma.productionLine.findMany({
    where: { isDeleted: false, isActive: true, ...(factoryId ? { factoryId } : {}) },
    orderBy: { name: 'asc' },
  });
};

const getProductModels = async () => {
  return prisma.productModel.findMany({
    where: { isDeleted: false, isActive: true },
    orderBy: { name: 'asc' },
  });
};

const getShifts = async () => {
  return prisma.shift.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } });
};

const deletePlan = async (id) => {
  const plan = await prisma.productionPlan.findFirst({ where: { id, isDeleted: false } });
  if (!plan) throw new AppError('Reja topilmadi', 404);
  if (plan.status !== 'DRAFT') throw new AppError('Faqat qoralama rejalarni o\'chirish mumkin', 400);
  return prisma.productionPlan.update({
    where: { id },
    data: { isDeleted: true, deletedAt: new Date() },
  });
};

module.exports = { getPlans, createPlan, updatePlan, getFacts, createFact, getLines, getProductModels, getShifts, deletePlan };
