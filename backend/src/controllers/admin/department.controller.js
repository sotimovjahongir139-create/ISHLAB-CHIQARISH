const svc = require('../../services/admin/department.service');
const { success, created, paginated } = require('../../utils/response');

const getDepartments = async (req, res) => {
  const { data, total, page, limit } = await svc.getDepartments(req.query);
  paginated(res, data, total, page, limit);
};

const createDepartment = async (req, res) => {
  const data = await svc.createDepartment(req.body, req.user.id, req);
  created(res, data, 'Bo\'lim yaratildi');
};

const updateDepartment = async (req, res) => {
  const data = await svc.updateDepartment(req.params.id, req.body, req.user.id, req);
  success(res, data, 'Bo\'lim yangilandi');
};

const deleteDepartment = async (req, res) => {
  await svc.deleteDepartment(req.params.id, req.user.id, req);
  success(res, null, 'Bo\'lim o\'chirildi');
};

module.exports = { getDepartments, createDepartment, updateDepartment, deleteDepartment };
