const svc = require('../services/charxlash/charxlash.service');
const { success, created, paginated } = require('../utils/response');

const getRecords = async (req, res) => {
  const { data, total, page, limit, totalFakt } = await svc.getRecords(req.query);
  paginated(res, data, total, page, limit, { totalFakt });
};
const createRecord = async (req, res) => {
  const data = await svc.createRecord(req.body);
  created(res, data, 'Charxlash yozuvi qo\'shildi');
};
const updateRecord = async (req, res) => {
  const data = await svc.updateRecord(req.params.id, req.body);
  success(res, data, 'Charxlash yozuvi yangilandi');
};
const deleteRecord = async (req, res) => {
  await svc.deleteRecord(req.params.id);
  success(res, null, 'O\'chirildi');
};
const getStats = async (req, res) => {
  const data = await svc.getStats(req.query);
  success(res, data);
};

module.exports = { getRecords, createRecord, updateRecord, deleteRecord, getStats };
