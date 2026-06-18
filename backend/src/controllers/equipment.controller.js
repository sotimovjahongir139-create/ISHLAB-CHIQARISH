const svc = require('../services/equipment/equipment.service');
const { success, created, paginated } = require('../utils/response');

const getEquipment = async (req, res) => {
  const { data, total, page, limit } = await svc.getEquipment(req.query);
  paginated(res, data, total, page, limit);
};

const createEquipment = async (req, res) => {
  const data = await svc.createEquipment(req.body);
  created(res, data, 'Uskuna qo\'shildi');
};

const updateStatus = async (req, res) => {
  const data = await svc.updateStatus(req.params.id, req.body.status);
  success(res, data, 'Status yangilandi');
};

const getMaintenances = async (req, res) => {
  const { data, total, page, limit } = await svc.getMaintenances(req.params.id, req.query);
  paginated(res, data, total, page, limit);
};

const createMaintenance = async (req, res) => {
  const data = await svc.createMaintenance({ ...req.body, equipmentId: req.params.id });
  created(res, data, 'Texnik xizmat rejalashtirildi');
};

const completeMaintenance = async (req, res) => {
  const [maintenance] = await svc.completeMaintenance(req.params.maintenanceId, req.body);
  success(res, maintenance, 'Texnik xizmat yakunlandi');
};

const updateEquipment = async (req, res) => {
  const data = await svc.updateEquipment(req.params.id, req.body);
  success(res, data, 'Uskuna yangilandi');
};

const deleteEquipment = async (req, res) => {
  await svc.deleteEquipment(req.params.id);
  success(res, null, 'Uskuna o\'chirildi');
};

module.exports = { getEquipment, createEquipment, updateEquipment, deleteEquipment, updateStatus, getMaintenances, createMaintenance, completeMaintenance };
