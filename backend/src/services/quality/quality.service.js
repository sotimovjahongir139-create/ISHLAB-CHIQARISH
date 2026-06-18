const prisma = require('../../config/database');
const AppError = require('../../utils/AppError');
const { getPagination, getSort } = require('../../utils/pagination');

const getDefects = async (query) => {
  const { page, limit, skip } = getPagination(query);
  const where = {};

  if (query.status) where.status = query.status;
  if (query.defectTypeId) where.defectTypeId = query.defectTypeId;
  if (query.productionFactId) where.productionFactId = query.productionFactId;
  if (query.dateFrom) where.createdAt = { gte: new Date(query.dateFrom) };
  if (query.dateTo) where.createdAt = { ...(where.createdAt || {}), lte: new Date(query.dateTo) };

  const [data, total] = await Promise.all([
    prisma.defect.findMany({
      where,
      include: {
        defectType: { select: { id: true, name: true, severity: true } },
        productionFact: { select: { id: true, factDate: true } },
        productModel: { select: { id: true, name: true, code: true } },
      },
      orderBy: getSort(query, ['createdAt', 'quantity', 'status']),
      skip,
      take: limit,
    }),
    prisma.defect.count({ where }),
  ]);

  return { data, total, page, limit };
};

const createDefect = async (body) => {
  return prisma.defect.create({
    data: {
      quantity: body.quantity || 1,
      description: body.description,
      actionTaken: body.actionTaken,
      defectTypeId: body.defectTypeId,
      productionFactId: body.productionFactId,
      productModelId: body.productModelId,
      inspectionId: body.inspectionId,
    },
    include: { defectType: true },
  });
};

const updateDefectStatus = async (id, status, actionTaken) => {
  const defect = await prisma.defect.findUnique({ where: { id } });
  if (!defect) throw new AppError('Nuqson topilmadi', 404);

  return prisma.defect.update({
    where: { id },
    data: {
      status,
      actionTaken,
      resolvedAt: ['RESOLVED', 'CLOSED'].includes(status) ? new Date() : undefined,
    },
    include: { defectType: true },
  });
};

const getInspections = async (query) => {
  const { page, limit, skip } = getPagination(query);
  const where = {};

  if (query.status) where.status = query.status;
  if (query.productModelId) where.productModelId = query.productModelId;
  if (query.dateFrom) where.inspectionDate = { gte: new Date(query.dateFrom) };
  if (query.dateTo) where.inspectionDate = { ...(where.inspectionDate || {}), lte: new Date(query.dateTo) };

  const [data, total] = await Promise.all([
    prisma.qualityInspection.findMany({
      where,
      include: {
        productModel: { select: { id: true, name: true, code: true } },
        _count: { select: { defects: true } },
      },
      orderBy: getSort(query, ['inspectionDate', 'passRate']),
      skip,
      take: limit,
    }),
    prisma.qualityInspection.count({ where }),
  ]);

  return { data, total, page, limit };
};

const createInspection = async (body) => {
  const passRate = body.inspectedQty > 0
    ? Math.round((body.passedQty / body.inspectedQty) * 10000) / 100
    : 0;

  return prisma.qualityInspection.create({
    data: {
      inspectionDate: new Date(body.inspectionDate),
      inspectedQty: body.inspectedQty,
      passedQty: body.passedQty,
      failedQty: body.inspectedQty - body.passedQty,
      passRate,
      productModelId: body.productModelId,
      inspectorId: body.inspectorId,
      notes: body.notes,
    },
  });
};

const getDefectTypes = async () => {
  return prisma.defectType.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } });
};

module.exports = { getDefects, createDefect, updateDefectStatus, getInspections, createInspection, getDefectTypes };
