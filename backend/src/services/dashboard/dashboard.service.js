const prisma = require('../../config/database');
const { startOfDay, endOfDay, startOfMonth, endOfMonth, subDays } = require('date-fns');

const calcOee = ({ producedQty, plannedQty, goodQty, totalWorkMin, totalDowntimeMin }) => {
  if (producedQty === 0 && plannedQty === 0) return 0;
  const unumdorlik = plannedQty > 0 ? producedQty / plannedQty : 0;
  const mavjudlik = totalWorkMin > 0
    ? Math.max(0, (totalWorkMin - totalDowntimeMin) / totalWorkMin)
    : 1;
  const sifat = producedQty > 0 ? goodQty / producedQty : 1;
  return Math.round(mavjudlik * unumdorlik * sifat * 10000) / 100;
};

const getKPIs = async (factoryId, date = new Date()) => {
  const dayStart = startOfDay(date);
  const dayEnd = endOfDay(date);
  const monthStart = startOfMonth(date);

  const where = factoryId
    ? { productionLine: { factoryId } }
    : {};
  const dtWhere = factoryId ? { productionLine: { factoryId } } : {};

  const [
    todayFacts, monthFacts, activeDowntimes, openDefects, employeeCount,
    todayDowntimeAgg, monthDowntimeAgg,
    todayXomashyo, monthXomashyo,
    todayKraska, monthKraska,
    todayPlans, monthPlans,
    todaySchedule, monthSchedule,
  ] = await Promise.all([
    prisma.productionFact.aggregate({
      where: { ...where, factDate: { gte: dayStart, lte: dayEnd } },
      _sum: { producedQty: true, defectQty: true, goodQty: true },
    }),
    prisma.productionFact.aggregate({
      where: { ...where, factDate: { gte: monthStart, lte: dayEnd } },
      _sum: { producedQty: true, goodQty: true },
    }),
    prisma.downtime.count({ where: { status: 'ACTIVE', ...dtWhere } }),
    prisma.defect.count({ where: { status: { in: ['OPEN', 'IN_REVIEW'] } } }),
    prisma.employee.count({ where: { isDeleted: false } }).catch(() => 0),
    prisma.downtime.aggregate({
      where: { startTime: { gte: dayStart, lte: dayEnd }, ...dtWhere },
      _count: { id: true },
      _sum: { durationMinutes: true },
    }),
    prisma.downtime.aggregate({
      where: { startTime: { gte: monthStart, lte: dayEnd }, ...dtWhere },
      _count: { id: true },
      _sum: { durationMinutes: true },
    }),
    prisma.material.aggregate({
      where: { isDeleted: false, recordDate: { gte: dayStart, lte: dayEnd } },
      _sum: { currentStock: true },
    }).catch(() => ({ _sum: { currentStock: 0 } })),
    prisma.material.aggregate({
      where: { isDeleted: false, recordDate: { gte: monthStart, lte: dayEnd } },
      _sum: { currentStock: true },
    }).catch(() => ({ _sum: { currentStock: 0 } })),
    prisma.paintRecord.aggregate({
      where: { date: { gte: dayStart, lte: dayEnd } },
      _sum: { quantity: true },
    }).catch(() => ({ _sum: { quantity: 0 } })),
    prisma.paintRecord.aggregate({
      where: { date: { gte: monthStart, lte: dayEnd } },
      _sum: { quantity: true },
    }).catch(() => ({ _sum: { quantity: 0 } })),
    prisma.productionPlan.aggregate({
      where: { isDeleted: false, planDate: { gte: dayStart, lte: dayEnd }, ...where },
      _sum: { plannedQty: true },
    }).catch(() => ({ _sum: { plannedQty: 0 } })),
    prisma.productionPlan.aggregate({
      where: { isDeleted: false, planDate: { gte: monthStart, lte: dayEnd }, ...where },
      _sum: { plannedQty: true },
    }).catch(() => ({ _sum: { plannedQty: 0 } })),
    prisma.dailyWorkSchedule.aggregate({
      where: { date: { gte: dayStart, lte: dayEnd } },
      _sum: { totalHours: true },
      _count: { id: true },
    }).catch(() => ({ _sum: { totalHours: 0 }, _count: { id: 0 } })),
    prisma.dailyWorkSchedule.aggregate({
      where: { date: { gte: monthStart, lte: dayEnd } },
      _sum: { totalHours: true },
      _count: { id: true },
    }).catch(() => ({ _sum: { totalHours: 0 }, _count: { id: 0 } })),
  ]);

  const msPerDay = 24 * 60 * 60 * 1000;
  const todayWorkMin = (todaySchedule._sum.totalHours || 0) * 60
    + (1 - (todaySchedule._count.id || 0)) * 480;
  const monthDayCount = Math.ceil((dayEnd - monthStart) / msPerDay);
  const monthWorkMin = (monthSchedule._sum.totalHours || 0) * 60
    + (monthDayCount - (monthSchedule._count.id || 0)) * 480;

  const todayOee = calcOee({
    producedQty: todayFacts._sum.producedQty || 0,
    plannedQty: todayPlans._sum.plannedQty || 0,
    goodQty: todayFacts._sum.goodQty || 0,
    totalWorkMin: todayWorkMin,
    totalDowntimeMin: todayDowntimeAgg._sum.durationMinutes || 0,
  });

  const monthOee = calcOee({
    producedQty: monthFacts._sum.producedQty || 0,
    plannedQty: monthPlans._sum.plannedQty || 0,
    goodQty: monthFacts._sum.goodQty || 0,
    totalWorkMin: monthWorkMin,
    totalDowntimeMin: monthDowntimeAgg._sum.durationMinutes || 0,
  });

  return {
    today: {
      produced: todayFacts._sum.producedQty || 0,
      defects: todayFacts._sum.defectQty || 0,
      good: todayFacts._sum.goodQty || 0,
      efficiency: todayOee,
      oee: todayOee,
      downtimes: todayDowntimeAgg._count.id || 0,
      xomashyo: Math.round((todayXomashyo._sum.currentStock || 0) * 100) / 100,
      kraska: Math.round((todayKraska._sum.quantity || 0) * 100) / 100,
    },
    month: {
      produced: monthFacts._sum.producedQty || 0,
      good: monthFacts._sum.goodQty || 0,
      efficiency: monthOee,
      oee: monthOee,
      downtimes: monthDowntimeAgg._count.id || 0,
      xomashyo: Math.round((monthXomashyo._sum.currentStock || 0) * 100) / 100,
      kraska: Math.round((monthKraska._sum.quantity || 0) * 100) / 100,
    },
    activeDowntimes,
    openDefects,
    employees: employeeCount,
  };
};

const getProductionTrend = async (factoryId, days = 7) => {
  const from = subDays(new Date(), days - 1);

  const facts = await prisma.productionFact.groupBy({
    by: ['factDate'],
    where: {
      factDate: { gte: startOfDay(from) },
      ...(factoryId ? { productionLine: { factoryId } } : {}),
    },
    _sum: { producedQty: true, defectQty: true, goodQty: true },
    _avg: { efficiency: true },
    orderBy: { factDate: 'asc' },
  });

  return facts.map((f) => ({
    date: f.factDate,
    produced: f._sum.producedQty || 0,
    defects: f._sum.defectQty || 0,
    good: f._sum.goodQty || 0,
    efficiency: Math.round((f._avg.efficiency || 0) * 100) / 100,
  }));
};

const getDowntimeByReason = async (factoryId, days = 30) => {
  const from = subDays(new Date(), days);

  const downtimes = await prisma.downtime.groupBy({
    by: ['reasonId'],
    where: {
      startTime: { gte: from },
      ...(factoryId ? { productionLine: { factoryId } } : {}),
    },
    _sum: { durationMinutes: true },
    _count: { id: true },
  });

  const reasons = await prisma.downtimeReason.findMany({
    where: { id: { in: downtimes.map((d) => d.reasonId) } },
  });

  return downtimes.map((d) => ({
    reason: reasons.find((r) => r.id === d.reasonId)?.name || 'Noma\'lum',
    category: reasons.find((r) => r.id === d.reasonId)?.category,
    totalMinutes: d._sum.durationMinutes || 0,
    count: d._count.id,
  }));
};

const getTopDefects = async (days = 30) => {
  const from = subDays(new Date(), days);

  const defects = await prisma.defect.groupBy({
    by: ['defectTypeId'],
    where: { createdAt: { gte: from } },
    _sum: { quantity: true },
    _count: { id: true },
    orderBy: { _sum: { quantity: 'desc' } },
    take: 5,
  });

  const types = await prisma.defectType.findMany({
    where: { id: { in: defects.map((d) => d.defectTypeId) } },
  });

  return defects.map((d) => ({
    type: types.find((t) => t.id === d.defectTypeId)?.name || 'Noma\'lum',
    severity: types.find((t) => t.id === d.defectTypeId)?.severity,
    total: d._sum.quantity || 0,
    count: d._count.id,
  }));
};

const getDepartmentComparison = async (factoryId, days = 30, startDate = null, endDate = null) => {
  let from, to;
  if (startDate && endDate) {
    from = startOfDay(new Date(startDate));
    to = endOfDay(new Date(endDate));
  } else {
    from = startOfDay(subDays(new Date(), days));
    to = endOfDay(new Date());
  }

  const msPerDay = 24 * 60 * 60 * 1000;
  const periodDayCount = Math.ceil((to - from) / msPerDay);

  const [plans, facts, lineDowntimes, schedules] = await Promise.all([
    prisma.productionPlan.groupBy({
      by: ['productionLineId'],
      where: {
        isDeleted: false,
        planDate: { gte: from, lte: to },
        ...(factoryId ? { productionLine: { factoryId } } : {}),
      },
      _sum: { plannedQty: true },
    }),
    prisma.productionFact.groupBy({
      by: ['productionLineId'],
      where: {
        factDate: { gte: from, lte: to },
        ...(factoryId ? { productionLine: { factoryId } } : {}),
      },
      _sum: { producedQty: true, goodQty: true, defectQty: true },
    }),
    prisma.downtime.groupBy({
      by: ['productionLineId'],
      where: {
        startTime: { gte: from, lte: to },
        ...(factoryId ? { productionLine: { factoryId } } : {}),
      },
      _sum: { durationMinutes: true },
    }),
    prisma.dailyWorkSchedule.aggregate({
      where: { date: { gte: from, lte: to } },
      _sum: { totalHours: true },
      _count: { id: true },
    }).catch(() => ({ _sum: { totalHours: 0 }, _count: { id: 0 } })),
  ]);

  const totalWorkMin = (schedules._sum.totalHours || 0) * 60
    + (periodDayCount - (schedules._count.id || 0)) * 480;

  const lines = await prisma.productionLine.findMany({
    where: { isDeleted: false, ...(factoryId ? { factoryId } : {}) },
    select: { id: true, name: true, code: true },
  });

  return lines.map((line) => {
    const plan = plans.find((p) => p.productionLineId === line.id);
    const fact = facts.find((f) => f.productionLineId === line.id);
    const dt = lineDowntimes.find((d) => d.productionLineId === line.id);
    const planned = plan?._sum.plannedQty || 0;
    const produced = fact?._sum.producedQty || 0;
    const goodQty = fact?._sum.goodQty || 0;
    const dtMin = dt?._sum.durationMinutes || 0;
    const unumdorlik = planned > 0 ? produced / planned : 0;
    const mavjudlik = totalWorkMin > 0 ? Math.max(0, (totalWorkMin - dtMin) / totalWorkMin) : 1;
    const sifat = produced > 0 ? goodQty / produced : 1;
    const efficiency = planned > 0 || produced > 0
      ? Math.round(mavjudlik * unumdorlik * sifat * 10000) / 100
      : 0;
    return {
      lineId: line.id,
      lineName: line.name,
      lineCode: line.code,
      planned,
      produced,
      good: goodQty,
      defects: fact?._sum.defectQty || 0,
      efficiency,
      fulfillment: planned > 0 ? Math.round((produced / planned) * 10000) / 100 : 0,
    };
  });
};

const getPlanVsFact = async (factoryId, days = 30, planType = null) => {
  const from = subDays(new Date(), days - 1);

  const planLineWhere = {};
  if (factoryId) planLineWhere.factoryId = factoryId;
  const planWhere = {
    isDeleted: false,
    planDate: { gte: startOfDay(from) },
    ...(Object.keys(planLineWhere).length > 0 ? { productionLine: planLineWhere } : {}),
    ...(planType ? { planType } : {}),
  };

  const factLineWhere = {};
  if (factoryId) factLineWhere.factoryId = factoryId;
  if (planType === 'PU') factLineWhere.name = { startsWith: 'PU', mode: 'insensitive' };
  else if (planType === 'TEP') factLineWhere.name = { startsWith: 'TEP', mode: 'insensitive' };
  const factWhere = {
    factDate: { gte: startOfDay(from) },
    ...(Object.keys(factLineWhere).length > 0 ? { productionLine: factLineWhere } : {}),
  };

  const [plans, facts] = await Promise.all([
    prisma.productionPlan.groupBy({
      by: ['planDate'],
      where: planWhere,
      _sum: { plannedQty: true },
      orderBy: { planDate: 'asc' },
    }),
    prisma.productionFact.groupBy({
      by: ['factDate'],
      where: factWhere,
      _sum: { producedQty: true, goodQty: true },
      _avg: { efficiency: true },
      orderBy: { factDate: 'asc' },
    }),
  ]);

  const dateMap = {};
  plans.forEach((p) => {
    const d = p.planDate.toISOString().split('T')[0];
    dateMap[d] = { date: d, planned: p._sum.plannedQty || 0, produced: 0, good: 0, efficiency: 0 };
  });
  facts.forEach((f) => {
    const d = f.factDate.toISOString().split('T')[0];
    if (!dateMap[d]) dateMap[d] = { date: d, planned: 0, produced: 0, good: 0, efficiency: 0 };
    dateMap[d].produced = f._sum.producedQty || 0;
    dateMap[d].good = f._sum.goodQty || 0;
    dateMap[d].efficiency = Math.round((f._avg.efficiency || 0) * 100) / 100;
  });

  return Object.values(dateMap).sort((a, b) => a.date.localeCompare(b.date));
};

module.exports = { getKPIs, getProductionTrend, getDowntimeByReason, getTopDefects, getDepartmentComparison, getPlanVsFact };
