const svc = require('../services/waste/waste.service');
const { success, created, paginated } = require('../utils/response');

const getWasteRecords = async (req, res) => {
  const { data, total, page, limit, totalQty } = await svc.getWasteRecords(req.query);
  paginated(res, data, total, page, limit, { totalQty });
};
const createWasteRecord = async (req, res) => {
  const data = await svc.createWasteRecord(req.body);
  created(res, data, 'Atxot yozuvi qo\'shildi');
};
const updateWasteRecord = async (req, res) => {
  const data = await svc.updateWasteRecord(req.params.id, req.body);
  success(res, data, 'Atxot yozuvi yangilandi');
};
const deleteWasteRecord = async (req, res) => {
  await svc.deleteWasteRecord(req.params.id);
  success(res, null, 'O\'chirildi');
};

module.exports = { getWasteRecords, createWasteRecord, updateWasteRecord, deleteWasteRecord };
