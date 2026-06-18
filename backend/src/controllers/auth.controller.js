const authService = require('../services/auth.service');
const { success } = require('../utils/response');

const login = async (req, res) => {
  const { email, password } = req.body;
  const data = await authService.login({
    email,
    password,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  });
  success(res, data, 'Muvaffaqiyatli kirdingiz');
};

const refresh = async (req, res) => {
  const { refreshToken } = req.body;
  const data = await authService.refreshAccessToken(refreshToken);
  success(res, data);
};

const logout = async (req, res) => {
  const { refreshToken } = req.body;
  await authService.logout(refreshToken);
  success(res, null, 'Chiqildi');
};

const me = async (req, res) => {
  const { passwordHash, ...user } = req.user;
  success(res, { user });
};

const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  await authService.changePassword(req.user.id, currentPassword, newPassword);
  success(res, null, 'Parol o\'zgartirildi');
};

module.exports = { login, refresh, logout, me, changePassword };
