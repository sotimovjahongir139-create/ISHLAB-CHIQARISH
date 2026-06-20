const svc = require('../services/downtime/downtime.service');
const { success, created, paginated } = require('../utils/response');

const getDowntimes = async (req, res) => {
  const { data, total, page, limit } = await svc.getDowntimes(req.query);
  paginated(res, data, total, page, limit);
};

const createDowntime = async (req, res) => {
  const data = await svc.createDowntime(req.body);
  created(res, data, 'To\'xtalish qayd etildi');
};

const resolveDowntime = async (req, res) => {
  const data = await svc.resolveDowntime(req.params.id, req.body.endTime);
  success(res, data, 'To\'xtalish yopildi');
};

const getActive = async (req, res) => {
  const data = await svc.getActiveDowntimes(req.query.factoryId || req.user.factoryId);
  success(res, data);
};

const getReasons = async (req, res) => {
  const data = await svc.getReasons();
  success(res, data);
};

const createReason = async (req, res) => {
  const data = await svc.createReason(req.body);
  created(res, data, 'Sabab qo\'shildi');
};

const updateReason = async (req, res) => {
  const data = await svc.updateReason(req.params.id, req.body);
  success(res, data, 'Sabab yangilandi');
};

const deleteReason = async (req, res) => {
  await svc.deleteReason(req.params.id);
  success(res, null, 'Sabab o\'chirildi');
};

const deleteDowntime = async (req, res) => {
  await svc.deleteDowntime(req.params.id);
  success(res, null, "To'xtalish o'chirildi");
};

module.exports = { getDowntimes, createDowntime, resolveDowntime, getActive, getReasons, createReason, updateReason, deleteReason, deleteDowntime };
