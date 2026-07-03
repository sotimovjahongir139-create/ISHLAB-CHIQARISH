const dashboardService = require('../services/dashboard/dashboard.service');
const { success } = require('../utils/response');

const getKPIs = async (req, res) => {
  const factoryId = req.query.factoryId || req.user.factoryId;
  const date = req.query.date ? new Date(req.query.date) : new Date();
  const data = await dashboardService.getKPIs(factoryId, date);
  success(res, data);
};

const getProductionTrend = async (req, res) => {
  const factoryId = req.query.factoryId || req.user.factoryId;
  const days = parseInt(req.query.days) || 7;
  const data = await dashboardService.getProductionTrend(factoryId, days);
  success(res, data);
};

const getDowntimeByReason = async (req, res) => {
  const factoryId = req.query.factoryId || req.user.factoryId;
  const days = parseInt(req.query.days) || 30;
  const data = await dashboardService.getDowntimeByReason(factoryId, days);
  success(res, data);
};

const getTopDefects = async (req, res) => {
  const days = parseInt(req.query.days) || 30;
  const data = await dashboardService.getTopDefects(days);
  success(res, data);
};

const getDepartmentComparison = async (req, res) => {
  const factoryId = req.query.factoryId || req.user.factoryId;
  const days = parseInt(req.query.days) || 30;
  const { startDate, endDate } = req.query;
  const data = await dashboardService.getDepartmentComparison(factoryId, days, startDate || null, endDate || null);
  success(res, data);
};

const getPlanVsFact = async (req, res) => {
  const factoryId = req.query.factoryId || req.user.factoryId;
  const days = parseInt(req.query.days) || 30;
  const planType = req.query.planType || null;
  const data = await dashboardService.getPlanVsFact(factoryId, days, planType);
  success(res, data);
};

module.exports = { getKPIs, getProductionTrend, getDowntimeByReason, getTopDefects, getDepartmentComparison, getPlanVsFact };
