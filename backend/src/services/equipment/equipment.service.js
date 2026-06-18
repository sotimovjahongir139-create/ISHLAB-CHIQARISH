const prisma = require('../../config/database');
const AppError = require('../../utils/AppError');
const { getPagination, getSort } = require('../../utils/pagination');

const getEquipment = async (query) => {
  const { page, limit, skip } = getPagination(query);
  const where = { isDeleted: false };

  if (query.search) where.OR = [
    { name: { contains: query.search, mode: 'insensitive' } },
    { code: { contains: query.search, mode: 'insensitive' } },
  ];
  if (query.factoryId) where.factoryId = query.factoryId;
  if (query.status) where.status = query.status;
  if (query.lineId) where.productionLineId = query.lineId;
  if (query.type) where.type = query.type;

  const [data, total] = await Promise.all([
    prisma.equipment.findMany({
      where,
      include: {
        factory: { select: { id: true, name: true } },
        productionLine: { select: { id: true, name: true } },
        _count: { select: { maintenances: true, downtimes: true } },
      },
      orderBy: getSort(query, ['name', 'status', 'createdAt']),
      skip,
      take: limit,
    }),
    prisma.equipment.count({ where }),
  ]);

  return { data, total, page, limit };
};

const createEquipment = async (body) => {
  return prisma.equipment.create({
    data: {
      name: body.name,
      code: body.code,
      type: body.type,
      brand: body.brand,
      model: body.model,
      serialNumber: body.serialNumber,
      purchaseDate: body.purchaseDate ? new Date(body.purchaseDate) : undefined,
      warrantyExpiry: body.warrantyExpiry ? new Date(body.warrantyExpiry) : undefined,
      location: body.location,
      description: body.description,
      factoryId: body.factoryId,
      productionLineId: body.productionLineId,
    },
    include: { factory: true, productionLine: true },
  });
};

const updateStatus = async (id, status) => {
  const equipment = await prisma.equipment.findFirst({ where: { id, isDeleted: false } });
  if (!equipment) throw new AppError('Uskuna topilmadi', 404);
  return prisma.equipment.update({ where: { id }, data: { status } });
};

const getMaintenances = async (equipmentId, query) => {
  const { page, limit, skip } = getPagination(query);
  const where = { equipmentId };

  if (query.status) where.status = query.status;
  if (query.type) where.type = query.type;

  const [data, total] = await Promise.all([
    prisma.maintenance.findMany({
      where,
      orderBy: getSort(query, ['scheduledDate', 'status']),
      skip,
      take: limit,
    }),
    prisma.maintenance.count({ where }),
  ]);

  return { data, total, page, limit };
};

const createMaintenance = async (body) => {
  return prisma.maintenance.create({
    data: {
      type: body.type,
      scheduledDate: new Date(body.scheduledDate),
      description: body.description,
      equipmentId: body.equipmentId,
      technicianId: body.technicianId,
      nextScheduled: body.nextScheduled ? new Date(body.nextScheduled) : undefined,
    },
    include: { equipment: { select: { id: true, name: true, code: true } } },
  });
};

const completeMaintenance = async (id, body) => {
  const m = await prisma.maintenance.findUnique({ where: { id } });
  if (!m) throw new AppError('Texnik xizmat topilmadi', 404);

  return prisma.$transaction([
    prisma.maintenance.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        completedDate: new Date(body.completedDate || new Date()),
        durationHours: body.durationHours,
        cost: body.cost,
        workDone: body.workDone,
        partsReplaced: body.partsReplaced,
        nextScheduled: body.nextScheduled ? new Date(body.nextScheduled) : undefined,
      },
    }),
    prisma.equipment.update({
      where: { id: m.equipmentId },
      data: { status: 'OPERATIONAL' },
    }),
  ]);
};

const updateEquipment = async (id, body) => {
  const eq = await prisma.equipment.findFirst({ where: { id, isDeleted: false } });
  if (!eq) throw new AppError('Uskuna topilmadi', 404);
  return prisma.equipment.update({
    where: { id },
    data: {
      name: body.name,
      type: body.type,
      brand: body.brand,
      model: body.model,
      location: body.location,
      description: body.description,
      warrantyExpiry: body.warrantyExpiry ? new Date(body.warrantyExpiry) : undefined,
      productionLineId: body.productionLineId || null,
    },
    include: { factory: true, productionLine: true },
  });
};

const deleteEquipment = async (id) => {
  const eq = await prisma.equipment.findFirst({ where: { id, isDeleted: false } });
  if (!eq) throw new AppError('Uskuna topilmadi', 404);
  return prisma.equipment.update({ where: { id }, data: { isDeleted: true, deletedAt: new Date() } });
};

module.exports = { getEquipment, createEquipment, updateEquipment, deleteEquipment, updateStatus, getMaintenances, createMaintenance, completeMaintenance };
