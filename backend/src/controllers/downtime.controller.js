const svc = require('../services/downtime/downtime.service');
const { success, created, paginated } = require('../utils/response');

const getDowntimes = async (req, res) => {
  const { data, total, page, limit } = await svc.getDowntimes(req.query);
  paginated(res, data, total, page, limit);
};

const createDowntime = async (req, res) => {
  const data = await svc.createDowntime(req.body);
  created(res, data, 'Toshlanish qayd etildi');
};

const resolveDowntime = async (req, res) => {
  const data = await svc.resolveDowntime(req.params.id, req.body.endTime);
  success(res, data, 'Toshlanish yopildi');
};

const getActive = async (req, res) => {
  const data = await svc.getActiveDowntimes(req.query.factoryId || req.user.factoryId);
  success(res, data);
};

const getReasons = async (req, res) => {
  const data = await svc.getReasons();
  success(res, data);
};

module.exports = { getDowntimes, createDowntime, resolveDowntime, getActive, getReasons };
