const prisma = require('../../config/database');
const { getPagination } = require('../../utils/pagination');
const { endOfDay, startOfMonth, endOfMonth, subDays } = require('date-fns');

const getWorkHours = async (query) => {
  const { page, limit, skip } = getPagination(query);
  const where = {};
  if (query.employeeId) where.employeeId = query.employeeId;
  if (query.departmentId) where.departmentId = query.departmentId;
  if (query.dateFrom) where.date = { gte: new Date(query.dateFrom) };
  if (query.dateTo) where.date = { ...(where.date || {}), lte: endOfDay(new Date(query.dateTo)) };

  const [data, total] = await Promise.all([
    prisma.employeeWorkHour.findMany({
      where,
      include: {
        employee: { select: { id: true, firstName: true, lastName: true, employeeNumber: true } },
        department: { select: { id: true, name: true } },
        shift: { select: { id: true, name: true } },
      },
      orderBy: { date: 'desc' },
      skip,
      take: limit,
    }),
    prisma.employeeWorkHour.count({ where }),
  ]);
  const totalHrs = await prisma.employeeWorkHour.aggregate({ where, _sum: { hoursWorked: true } });
  return { data, total, page, limit, totalHours: totalHrs._sum.hoursWorked || 0 };
};

const createWorkHour = async (body) => {
  return prisma.employeeWorkHour.create({
    data: {
      date: new Date(body.date),
      hoursWorked: parseFloat(body.hoursWorked),
      notes: body.notes,
      employeeId: body.employeeId,
      shiftId: body.shiftId || null,
      departmentId: body.departmentId,
    },
    include: {
      employee: { select: { id: true, firstName: true, lastName: true } },
      department: { select: { id: true, name: true } },
      shift: { select: { id: true, name: true } },
    },
  });
};

const deleteWorkHour = async (id) => {
  return prisma.employeeWorkHour.delete({ where: { id } });
};

const getDeptMonthlyStats = async (departmentId) => {
  const now = new Date();
  const from = startOfMonth(now);
  const to = endOfMonth(now);
  const where = { departmentId, date: { gte: from, lte: to } };

  const [daily, total] = await Promise.all([
    prisma.employeeWorkHour.groupBy({
      by: ['date'],
      where,
      _sum: { hoursWorked: true },
      orderBy: { date: 'asc' },
    }),
    prisma.employeeWorkHour.aggregate({ where, _sum: { hoursWorked: true } }),
  ]);

  return {
    daily: daily.map((d) => ({ date: d.date, hours: d._sum.hoursWorked || 0 })),
    totalHours: total._sum.hoursWorked || 0,
  };
};

module.exports = { getWorkHours, createWorkHour, deleteWorkHour, getDeptMonthlyStats };
