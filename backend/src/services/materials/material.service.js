const prisma = require('../../config/database');
const AppError = require('../../utils/AppError');
const { getPagination, getSort } = require('../../utils/pagination');

const endOfDay = (d) => {
  const r = new Date(d);
  r.setHours(23, 59, 59, 999);
  return r;
};

const getMaterials = async (query) => {
  const { page, limit, skip } = getPagination(query);
  const where = { isDeleted: false };

  if (query.search) where.OR = [
    { name: { contains: query.search, mode: 'insensitive' } },
    { code: { contains: query.search, mode: 'insensitive' } },
  ];
  if (query.warehouseId) where.warehouseId = query.warehouseId;
  if (query.category) where.category = query.category;
  if (query.lowStock === 'true') where.AND = [
    { minStock: { not: null } },
    { currentStock: { lte: prisma.$queryRaw`"min_stock"` } },
  ];
  if (query.dateFrom) where.recordDate = { gte: new Date(query.dateFrom) };
  if (query.dateTo) {
    where.recordDate = { ...(where.recordDate || {}), lte: endOfDay(new Date(query.dateTo)) };
  }

  const [data, total] = await Promise.all([
    prisma.material.findMany({
      where,
      include: { warehouse: { select: { id: true, name: true, code: true } } },
      orderBy: getSort(query, ['name', 'currentStock', 'createdAt']) || [{ recordDate: 'desc' }, { createdAt: 'desc' }],
      skip,
      take: limit,
    }),
    prisma.material.count({ where }),
  ]);

  return { data, total, page, limit };
};

const createMaterial = async (body) => {
  return prisma.material.create({
    data: {
      name: body.name,
      code: body.code,
      description: body.description,
      unit: body.unit,
      category: body.category,
      minStock: body.minStock != null ? parseFloat(body.minStock) : null,
      maxStock: body.maxStock != null ? parseFloat(body.maxStock) : null,
      currentStock: body.currentStock != null ? parseFloat(body.currentStock) : 0,
      unitCost: body.unitCost,
      recordDate: body.recordDate ? new Date(body.recordDate) : null,
      ...(body.warehouseId ? { warehouseId: body.warehouseId } : {}),
    },
    include: { warehouse: true },
  });
};

const updateMaterial = async (id, body) => {
  const material = await prisma.material.findFirst({ where: { id, isDeleted: false } });
  if (!material) throw new AppError('Xomashyo topilmadi', 404);

  return prisma.material.update({
    where: { id },
    data: {
      name: body.name,
      description: body.description,
      unit: body.unit,
      category: body.category,
      minStock: body.minStock != null ? parseFloat(body.minStock) : null,
      maxStock: body.maxStock != null ? parseFloat(body.maxStock) : null,
      unitCost: body.unitCost,
      ...(body.currentStock != null ? { currentStock: parseFloat(body.currentStock) } : {}),
      ...(body.recordDate !== undefined ? { recordDate: body.recordDate ? new Date(body.recordDate) : null } : {}),
    },
    include: { warehouse: true },
  });
};

const deleteMaterial = async (id) => {
  const material = await prisma.material.findFirst({ where: { id, isDeleted: false } });
  if (!material) throw new AppError('Xomashyo topilmadi', 404);
  return prisma.material.update({
    where: { id },
    data: { isDeleted: true, deletedAt: new Date() },
  });
};

const addTransaction = async (materialId, body, userId) => {
  const material = await prisma.material.findFirst({ where: { id: materialId, isDeleted: false } });
  if (!material) throw new AppError('Xomashyo topilmadi', 404);

  const stockBefore = material.currentStock;
  const delta = body.type === 'OUT' || body.type === 'TRANSFER' ? -body.quantity : body.quantity;
  const stockAfter = stockBefore + delta;

  if (stockAfter < 0) throw new AppError('Omborda yetarli xomashyo yo\'q', 400);

  const totalCost = body.unitCost ? body.quantity * body.unitCost : null;

  const [transaction] = await prisma.$transaction([
    prisma.materialTransaction.create({
      data: {
        transactionDate: new Date(body.transactionDate || new Date()),
        type: body.type,
        quantity: body.quantity,
        unitCost: body.unitCost,
        totalCost,
        stockBefore,
        stockAfter,
        reference: body.reference,
        notes: body.notes,
        materialId,
        createdById: userId,
      },
    }),
    prisma.material.update({
      where: { id: materialId },
      data: { currentStock: stockAfter },
    }),
  ]);

  return transaction;
};

const getTransactions = async (materialId, query) => {
  const { page, limit, skip } = getPagination(query);

  const [data, total] = await Promise.all([
    prisma.materialTransaction.findMany({
      where: { materialId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.materialTransaction.count({ where: { materialId } }),
  ]);

  return { data, total, page, limit };
};

module.exports = { getMaterials, createMaterial, updateMaterial, deleteMaterial, addTransaction, getTransactions };
