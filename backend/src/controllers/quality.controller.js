const svc = require('../services/quality/quality.service');
const { success, created, paginated } = require('../utils/response');

const getDefects = async (req, res) => {
  const { data, total, page, limit } = await svc.getDefects(req.query);
  paginated(res, data, total, page, limit);
};

const createDefect = async (req, res) => {
  const data = await svc.createDefect(req.body);
  created(res, data, 'Nuqson qayd etildi');
};

const updateDefectStatus = async (req, res) => {
  const { status, actionTaken } = req.body;
  const data = await svc.updateDefectStatus(req.params.id, status, actionTaken);
  success(res, data, 'Nuqson holati yangilandi');
};

const getInspections = async (req, res) => {
  const { data, total, page, limit } = await svc.getInspections(req.query);
  paginated(res, data, total, page, limit);
};

const createInspection = async (req, res) => {
  const data = await svc.createInspection(req.body);
  created(res, data, 'Tekshiruv yaratildi');
};

const getDefectTypes = async (req, res) => {
  const data = await svc.getDefectTypes();
  success(res, data);
};

module.exports = { getDefects, createDefect, updateDefectStatus, getInspections, createInspection, getDefectTypes };
