const svc = require('../../services/admin/role.service');
const { success, created } = require('../../utils/response');

const getRoles = async (req, res) => {
  const data = await svc.getRoles();
  success(res, data);
};

const getRole = async (req, res) => {
  const data = await svc.getRole(req.params.id);
  success(res, data);
};

const createRole = async (req, res) => {
  const data = await svc.createRole(req.body, req.user.id, req);
  created(res, data, 'Rol yaratildi');
};

const updateRole = async (req, res) => {
  const data = await svc.updateRole(req.params.id, req.body, req.user.id, req);
  success(res, data, 'Rol yangilandi');
};

const deleteRole = async (req, res) => {
  await svc.deleteRole(req.params.id, req.user.id, req);
  success(res, null, 'Rol o\'chirildi');
};

const setPermissions = async (req, res) => {
  const data = await svc.setRolePermissions(req.params.id, req.body.permissionIds, req.user.id, req);
  success(res, data, 'Ruxsatlar yangilandi');
};

const getAllPermissions = async (req, res) => {
  const data = await svc.getAllPermissions();
  success(res, data);
};

module.exports = { getRoles, getRole, createRole, updateRole, deleteRole, setPermissions, getAllPermissions };
