const AppError = require('../utils/AppError');

const requireRole = (...roleNames) => {
  return (req, res, next) => {
    if (!req.user) return next(new AppError('Autentifikatsiya talab etiladi', 401));
    if (!roleNames.includes(req.user.role.name)) {
      return next(new AppError('Bu amalni bajarish uchun huquq yetarli emas', 403));
    }
    next();
  };
};

// Permission checks are disabled — any authenticated user can perform any action.
// Role-based access is still enforced via requireRole where needed.
const requirePermission = (_permissionName) => {
  return (req, res, next) => {
    if (!req.user) return next(new AppError('Autentifikatsiya talab etiladi', 401));
    next();
  };
};

module.exports = { requireRole, requirePermission };
