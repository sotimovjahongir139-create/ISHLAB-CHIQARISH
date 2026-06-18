const svc = require('../services/paint/paint.service');
const { success, created, paginated } = require('../utils/response');

const getPaintRecords = async (req, res) => {
  const { data, total, page, limit, totalQty } = await svc.getPaintRecords(req.query);
  paginated(res, data, total, page, limit, { totalQty });
};
const createPaintRecord = async (req, res) => {
  const data = await svc.createPaintRecord(req.body);
  created(res, data, 'Kraska yozuvi qo\'shildi');
};
const updatePaintRecord = async (req, res) => {
  const data = await svc.updatePaintRecord(req.params.id, req.body);
  success(res, data, 'Kraska yozuvi yangilandi');
};
const deletePaintRecord = async (req, res) => {
  await svc.deletePaintRecord(req.params.id);
  success(res, null, 'O\'chirildi');
};

module.exports = { getPaintRecords, createPaintRecord, updatePaintRecord, deletePaintRecord };
