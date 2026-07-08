const prisma = require('../../config/database');
const AppError = require('../../utils/AppError');
const { getPagination, getSort } = require('../../utils/pagination');

// Drop NOT NULL on shift_id if it survived from an old deployment
(async () => {
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE production_plan ALTER COLUMN shift_id DROP NOT NULL`);
    await prisma.$executeRawUnsafe(`ALTER TABLE production_fact ALTER COLUMN shift_id DROP NOT NULL`);
  } catch (_) {}
})();

// Ensure plan_type column exists and PU line plans are correctly tagged
(async () => {
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE production_plan ADD COLUMN IF NOT EXISTS plan_type VARCHAR(10) NOT NULL DEFAULT 'TEP'`);
    await prisma.$executeRawUnsafe(`UPDATE production_plan SET plan_type='PU' FROM production_lines WHERE production_plan.production_line_id=production_lines.id AND production_lines.name ILIKE 'PU%'`);
  } catch (_) {}
})();

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
  if (query.planType) where.planType = query.planType;

  let data, total;
  try {
    [data, total] = await Promise.all([
      prisma.productionPlan.findMany({
        where,
        include: INCLUDE_FULL,
        orderBy: getSort(query, ['planDate', 'createdAt', 'status']),
        skip,
        take: limit,
      }),
      prisma.productionPlan.count({ where }),
    ]);
  } catch (err) {
    if (where.planType && (err.code === 'P2022' || err.name === 'PrismaClientValidationError')) {
      delete where.planType;
      [data, total] = await Promise.all([
        prisma.productionPlan.findMany({
          where,
          include: INCLUDE_FULL,
          orderBy: getSort(query, ['planDate', 'createdAt', 'status']),
          skip,
          take: limit,
        }),
        prisma.productionPlan.count({ where }),
      ]);
    } else {
      throw err;
    }
  }

  // Attach facts by date+line+model (facts may have null plan_id)
  if (data.length > 0) {
    const planDates = [...new Set(data.map((p) => p.planDate))];
    const factsAgg = await prisma.productionFact.groupBy({
      by: ['factDate', 'productionLineId', 'productModelId'],
      where: { factDate: { in: planDates } },
      _sum: { producedQty: true },
    });

    const fkey = (date, lineId, modelId) =>
      `${date instanceof Date ? date.toISOString().slice(0, 10) : String(date).slice(0, 10)}|${lineId ?? ''}|${modelId ?? ''}`;

    const factMap = {};
    for (const f of factsAgg) {
      factMap[fkey(f.factDate, f.productionLineId, f.productModelId)] = f._sum.producedQty ?? 0;
    }

    data = data.map((plan) => ({
      ...plan,
      productionFacts: [{ producedQty: factMap[fkey(plan.planDate, plan.productionLineId, plan.productModelId)] ?? 0 }],
    }));
  }

  return { data, total, page, limit };
};

const createPlan = async (body) => {
  if (!body.planDate) throw new AppError('Sana kiritilishi shart', 400);
  if (!body.plannedQty) throw new AppError('Reja miqdori kiritilishi shart', 400);
  if (!body.productionLineId) throw new AppError('Ishlab chiqarish liniyasi tanlanishi shart', 400);
  return prisma.productionPlan.create({
    data: {
      planDate: new Date(body.planDate),
      plannedQty: Number(body.plannedQty),
      productionLineId: body.productionLineId,
      productModelId: body.productModelId || null,
      shiftId: body.shiftId || null,
      notes: body.notes || null,
      planType: body.planType || 'TEP',
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
  if (query.linePrefix) where.productionLine = { name: { startsWith: query.linePrefix, mode: 'insensitive' } };

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
  if (!body.factDate) throw new AppError('Sana kiritilishi shart', 400);
  if (!body.producedQty) throw new AppError('Ishlab chiqarilgan miqdor kiritilishi shart', 400);
  if (!body.productionLineId) throw new AppError('Ishlab chiqarish liniyasi tanlanishi shart', 400);
  const goodQty = Number(body.producedQty) - (Number(body.defectQty) || 0);
  let efficiency = null;

  if (body.planId) {
    const plan = await prisma.productionPlan.findUnique({ where: { id: body.planId } });
    if (plan) efficiency = Math.round((Number(body.producedQty) / plan.plannedQty) * 10000) / 100;
  }

  const fact = await prisma.productionFact.create({
    data: {
      factDate: new Date(body.factDate),
      producedQty: Number(body.producedQty),
      defectQty: Number(body.defectQty) || 0,
      goodQty,
      startTime: body.startTime ? new Date(body.startTime) : null,
      endTime: body.endTime ? new Date(body.endTime) : null,
      efficiency,
      productionLineId: body.productionLineId,
      productModelId: body.productModelId || null,
      shiftId: body.shiftId || null,
      planId: body.planId || null,
      notes: body.notes || null,
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

const createLine = async (body, factoryId) => {
  return prisma.productionLine.create({
    data: {
      name: body.name,
      code: body.code,
      description: body.description || null,
      capacity: body.capacity ? parseInt(body.capacity) : null,
      factoryId,
    },
  });
};

const updateLine = async (id, body) => {
  const line = await prisma.productionLine.findFirst({ where: { id, isDeleted: false } });
  if (!line) throw new AppError('Liniya topilmadi', 404);
  return prisma.productionLine.update({
    where: { id },
    data: {
      name: body.name,
      code: body.code,
      description: body.description !== undefined ? body.description : line.description,
      capacity: body.capacity !== undefined ? (body.capacity ? parseInt(body.capacity) : null) : line.capacity,
    },
  });
};

const deleteLine = async (id) => {
  const line = await prisma.productionLine.findFirst({ where: { id, isDeleted: false } });
  if (!line) throw new AppError('Liniya topilmadi', 404);
  return prisma.productionLine.update({
    where: { id },
    data: { isActive: false, isDeleted: true, deletedAt: new Date() },
  });
};

const getProductCategories = async () => {
  return prisma.productCategory.findMany({ orderBy: { name: 'asc' } });
};

const getProductModels = async () => {
  return prisma.productModel.findMany({
    where: { isDeleted: false, isActive: true },
    orderBy: { name: 'asc' },
    include: { category: { select: { id: true, name: true } } },
  });
};

const getAllProductModels = async (query = {}) => {
  const { getPagination } = require('../../utils/pagination');
  const { page, limit, skip } = getPagination(query);
  const search = query.search?.trim();
  const where = { isDeleted: false };
  if (search) where.OR = [{ name: { contains: search, mode: 'insensitive' } }, { code: { contains: search, mode: 'insensitive' } }];
  const [data, total] = await Promise.all([
    prisma.productModel.findMany({
      where, skip, take: limit, orderBy: { name: 'asc' },
      include: { category: { select: { id: true, name: true } } },
    }),
    prisma.productModel.count({ where }),
  ]);
  return { data, total, page, limit };
};

const createProductModel = async (body) => {
  const exists = await prisma.productModel.findFirst({ where: { code: body.code, isDeleted: false } });
  if (exists) throw new AppError('Bu kod allaqachon mavjud', 400);
  return prisma.productModel.create({
    data: {
      name: body.name,
      code: body.code.toUpperCase(),
      description: body.description || null,
      unit: body.unit || 'dona',
      categoryId: body.categoryId,
    },
    include: { category: { select: { id: true, name: true } } },
  });
};

const updateProductModel = async (id, body) => {
  const model = await prisma.productModel.findFirst({ where: { id, isDeleted: false } });
  if (!model) throw new AppError('Model topilmadi', 404);
  return prisma.productModel.update({
    where: { id },
    data: {
      name: body.name !== undefined ? body.name : model.name,
      description: body.description !== undefined ? body.description : model.description,
      unit: body.unit !== undefined ? body.unit : model.unit,
      isActive: body.isActive !== undefined ? body.isActive : model.isActive,
      categoryId: body.categoryId !== undefined ? body.categoryId : model.categoryId,
    },
    include: { category: { select: { id: true, name: true } } },
  });
};

const deleteProductModel = async (id) => {
  const model = await prisma.productModel.findFirst({ where: { id, isDeleted: false } });
  if (!model) throw new AppError('Model topilmadi', 404);
  const usedInPlans = await prisma.productionPlan.count({ where: { productModelId: id } });
  const usedInFacts = await prisma.productionFact.count({ where: { productModelId: id } });
  if (usedInPlans + usedInFacts > 0) {
    return prisma.productModel.update({ where: { id }, data: { isActive: false } });
  }
  return prisma.productModel.update({ where: { id }, data: { isActive: false, isDeleted: true, deletedAt: new Date() } });
};

const getShifts = async () => {
  return prisma.shift.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } });
};

const deletePlan = async (id) => {
  const plan = await prisma.productionPlan.findFirst({ where: { id, isDeleted: false } });
  if (!plan) throw new AppError('Reja topilmadi', 404);
  if (['COMPLETED', 'IN_PROGRESS'].includes(plan.status)) throw new AppError('Tugallangan yoki jarayondagi rejani o\'chirish mumkin emas', 400);
  return prisma.productionPlan.update({
    where: { id },
    data: { isDeleted: true, deletedAt: new Date() },
  });
};

module.exports = { getPlans, createPlan, updatePlan, getFacts, createFact, getLines, createLine, updateLine, deleteLine, getProductCategories, getProductModels, getAllProductModels, createProductModel, updateProductModel, deleteProductModel, getShifts, deletePlan };
