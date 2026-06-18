const svc = require('../services/employees/employee.service');
const { success, created, paginated } = require('../utils/response');

const getEmployees = async (req, res) => {
  const { data, total, page, limit } = await svc.getEmployees(req.query);
  paginated(res, data, total, page, limit);
};

const getEmployee = async (req, res) => {
  const data = await svc.getEmployee(req.params.id);
  success(res, data);
};

const createEmployee = async (req, res) => {
  const data = await svc.createEmployee(req.body);
  created(res, data, 'Xodim qo\'shildi');
};

const recordAttendance = async (req, res) => {
  const data = await svc.recordAttendance(req.body);
  success(res, data, 'Davomat qayd etildi');
};

const getAttendance = async (req, res) => {
  const { data, total, page, limit } = await svc.getAttendance(req.params.id, req.query);
  paginated(res, data, total, page, limit);
};

const updateEmployee = async (req, res) => {
  const data = await svc.updateEmployee(req.params.id, req.body);
  success(res, data, 'Xodim yangilandi');
};

const deleteEmployee = async (req, res) => {
  await svc.deleteEmployee(req.params.id);
  success(res, null, 'Xodim o\'chirildi');
};

const getDepartments = async (req, res) => {
  const data = await svc.getDepartments();
  success(res, data);
};

module.exports = { getEmployees, getEmployee, createEmployee, updateEmployee, deleteEmployee, recordAttendance, getAttendance, getDepartments };
