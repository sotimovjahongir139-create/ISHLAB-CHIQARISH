const svc = require('../services/workhour/workhour.service');
const { success, created, paginated } = require('../utils/response');

const getWorkHours = async (req, res) => {
  const { data, total, page, limit, totalHours } = await svc.getWorkHours(req.query);
  paginated(res, data, total, page, limit, { totalHours });
};
const createWorkHour = async (req, res) => {
  const data = await svc.createWorkHour(req.body);
  created(res, data, 'Ish soati qo\'shildi');
};
const deleteWorkHour = async (req, res) => {
  await svc.deleteWorkHour(req.params.id);
  success(res, null, 'O\'chirildi');
};
const getDeptStats = async (req, res) => {
  const data = await svc.getDeptMonthlyStats(req.params.departmentId);
  success(res, data);
};

module.exports = { getWorkHours, createWorkHour, deleteWorkHour, getDeptStats };
