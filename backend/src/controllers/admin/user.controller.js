const svc = require('../../services/admin/user.service');
const { success, created, paginated } = require('../../utils/response');

const getUsers = async (req, res) => {
  const { data, total, page, limit } = await svc.getUsers(req.query);
  paginated(res, data, total, page, limit);
};

const getUser = async (req, res) => {
  const data = await svc.getUser(req.params.id);
  success(res, data);
};

const createUser = async (req, res) => {
  const data = await svc.createUser(req.body, req.user.id, req);
  created(res, data, 'Foydalanuvchi yaratildi');
};

const updateUser = async (req, res) => {
  const data = await svc.updateUser(req.params.id, req.body, req.user.id, req);
  success(res, data, 'Foydalanuvchi yangilandi');
};

const toggleActive = async (req, res) => {
  const data = await svc.toggleActive(req.params.id, req.user.id, req);
  success(res, data, `Foydalanuvchi ${data.isActive ? 'faollashtirildi' : 'bloklandi'}`);
};

const deleteUser = async (req, res) => {
  await svc.deleteUser(req.params.id, req.user.id, req);
  success(res, null, 'Foydalanuvchi o\'chirildi');
};

const resetPassword = async (req, res) => {
  await svc.resetPassword(req.params.id, req.body.newPassword, req.user.id, req);
  success(res, null, 'Parol tiklandi');
};

module.exports = { getUsers, getUser, createUser, updateUser, toggleActive, deleteUser, resetPassword };
