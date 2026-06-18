const prisma = require('../../config/database');
const { getPagination, getSort } = require('../../utils/pagination');

const getAuditLogs = async (query) => {
  const { page, limit, skip } = getPagination(query);
  const where = {};

  if (query.userId) where.userId = query.userId;
  if (query.entity) where.entity = query.entity;
  if (query.action) where.action = query.action;
  if (query.dateFrom) where.createdAt = { gte: new Date(query.dateFrom) };
  if (query.dateTo) where.createdAt = { ...(where.createdAt || {}), lte: new Date(query.dateTo) };
  if (query.search) {
    where.OR = [
      { entity: { contains: query.search, mode: 'insensitive' } },
      { entityId: { contains: query.search, mode: 'insensitive' } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { data, total, page, limit };
};

const getActivityStats = async (days = 7) => {
  const from = new Date();
  from.setDate(from.getDate() - days);

  const [byAction, byEntity, recentUsers] = await Promise.all([
    prisma.auditLog.groupBy({
      by: ['action'],
      where: { createdAt: { gte: from } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    }),
    prisma.auditLog.groupBy({
      by: ['entity'],
      where: { createdAt: { gte: from } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5,
    }),
    prisma.auditLog.groupBy({
      by: ['userId'],
      where: { createdAt: { gte: from }, userId: { not: null } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5,
    }),
  ]);

  const userIds = recentUsers.map((r) => r.userId).filter(Boolean);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, firstName: true, lastName: true, email: true },
  });

  return {
    byAction: byAction.map((r) => ({ action: r.action, count: r._count.id })),
    byEntity: byEntity.map((r) => ({ entity: r.entity, count: r._count.id })),
    topUsers: recentUsers.map((r) => ({
      user: users.find((u) => u.id === r.userId),
      count: r._count.id,
    })),
  };
};

module.exports = { getAuditLogs, getActivityStats };
