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

const requirePermission = (permissionName) => {
  return (req, res, next) => {
    if (!req.user) return next(new AppError('Autentifikatsiya talab etiladi', 401));
    if (req.user.role.name === 'super_admin') return next();
    if (!req.permissions?.includes(permissionName)) {
      return next(new AppError(`"${permissionName}" huquqi kerak`, 403));
    }
    next();
  };
};

module.exports = { requireRole, requirePermission };
