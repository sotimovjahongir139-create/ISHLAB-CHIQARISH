const svc = require('../services/production/production.service');
const { success, created, paginated } = require('../utils/response');

const getPlans = async (req, res) => {
  const { data, total, page, limit } = await svc.getPlans(req.query);
  paginated(res, data, total, page, limit);
};

const createPlan = async (req, res) => {
  const data = await svc.createPlan(req.body);
  created(res, data, 'Reja yaratildi');
};

const updatePlan = async (req, res) => {
  const data = await svc.updatePlan(req.params.id, req.body);
  success(res, data, 'Reja yangilandi');
};

const getFacts = async (req, res) => {
  const { data, total, page, limit } = await svc.getFacts(req.query);
  paginated(res, data, total, page, limit);
};

const createFact = async (req, res) => {
  const data = await svc.createFact(req.body);
  created(res, data, 'Natija kiritildi');
};

const getLines = async (req, res) => {
  const data = await svc.getLines(req.query.factoryId || req.user.factoryId);
  success(res, data);
};

const getProductModels = async (req, res) => {
  const data = await svc.getProductModels();
  success(res, data);
};

const getShifts = async (req, res) => {
  const data = await svc.getShifts();
  success(res, data);
};

const deletePlan = async (req, res) => {
  await svc.deletePlan(req.params.id);
  success(res, null, 'Reja o\'chirildi');
};

module.exports = { getPlans, createPlan, updatePlan, getFacts, createFact, getLines, getProductModels, getShifts, deletePlan };
