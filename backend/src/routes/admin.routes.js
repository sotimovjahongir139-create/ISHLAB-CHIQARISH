const router = require('express').Router();
const { body, param, query } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const { requireRole, requirePermission } = require('../middleware/roles');
const { validate } = require('../middleware/validator');
const { PERMISSIONS } = require('../utils/permissions');

const userCtrl = require('../controllers/admin/user.controller');
const roleCtrl = require('../controllers/admin/role.controller');
const deptCtrl = require('../controllers/admin/department.controller');
const auditCtrl = require('../controllers/admin/audit.controller');

router.use(authenticate);

// ── Only super_admin / admin can access admin section ──────────────────────
router.use(requireRole('super_admin', 'admin'));

// ──────────────────────────────────────────────────────────────────────────
// USERS
// ──────────────────────────────────────────────────────────────────────────
const userCreateRules = [
  body('email').isEmail().normalizeEmail().withMessage('Email noto\'g\'ri'),
  body('username').isLength({ min: 3 }).withMessage('Username kamida 3 belgi'),
  body('password').isLength({ min: 8 }).withMessage('Parol kamida 8 belgi'),
  body('firstName').notEmpty().withMessage('Ism kiritilmagan'),
  body('lastName').notEmpty().withMessage('Familiya kiritilmagan'),
  body('roleId').notEmpty().withMessage('Rol tanlanmagan'),
];

const userUpdateRules = [
  body('firstName').optional().notEmpty().withMessage('Ism bo\'sh bo\'lmasin'),
  body('lastName').optional().notEmpty().withMessage('Familiya bo\'sh bo\'lmasin'),
];

router.get('/users', requirePermission(PERMISSIONS.USERS_READ), userCtrl.getUsers);
router.get('/users/:id', requirePermission(PERMISSIONS.USERS_READ), userCtrl.getUser);
router.post('/users', requirePermission(PERMISSIONS.USERS_CREATE), userCreateRules, validate, userCtrl.createUser);
router.put('/users/:id', requirePermission(PERMISSIONS.USERS_UPDATE), userUpdateRules, validate, userCtrl.updateUser);
router.patch('/users/:id/toggle-active', requirePermission(PERMISSIONS.USERS_UPDATE), userCtrl.toggleActive);
router.delete('/users/:id', requirePermission(PERMISSIONS.USERS_DELETE), userCtrl.deleteUser);
router.post('/users/:id/reset-password', requirePermission(PERMISSIONS.USERS_UPDATE), [
  body('newPassword').isLength({ min: 8 }).withMessage('Yangi parol kamida 8 belgi'),
], validate, userCtrl.resetPassword);

// ──────────────────────────────────────────────────────────────────────────
// ROLES
// ──────────────────────────────────────────────────────────────────────────
router.get('/roles', requirePermission(PERMISSIONS.ROLES_READ), roleCtrl.getRoles);
router.get('/roles/:id', requirePermission(PERMISSIONS.ROLES_READ), roleCtrl.getRole);
router.post('/roles', requirePermission(PERMISSIONS.ROLES_CREATE), [
  body('name').matches(/^[a-z_]+$/).withMessage('Rol nomi faqat kichik harf va _ dan iborat bo\'lishi kerak'),
  body('displayName').notEmpty().withMessage('Ko\'rsatiladigan nom kiritilmagan'),
], validate, roleCtrl.createRole);
router.put('/roles/:id', requirePermission(PERMISSIONS.ROLES_UPDATE), roleCtrl.updateRole);
router.delete('/roles/:id', requirePermission(PERMISSIONS.ROLES_DELETE), roleCtrl.deleteRole);
router.put('/roles/:id/permissions', requirePermission(PERMISSIONS.ROLES_UPDATE), [
  body('permissionIds').isArray().withMessage('permissionIds massiv bo\'lishi kerak'),
], validate, roleCtrl.setPermissions);

// ──────────────────────────────────────────────────────────────────────────
// PERMISSIONS (read-only, for UI matrix)
// ──────────────────────────────────────────────────────────────────────────
router.get('/permissions', roleCtrl.getAllPermissions);

// ──────────────────────────────────────────────────────────────────────────
// DEPARTMENTS
// ──────────────────────────────────────────────────────────────────────────
router.get('/departments', requirePermission(PERMISSIONS.DEPARTMENTS_READ), deptCtrl.getDepartments);
router.post('/departments', requirePermission(PERMISSIONS.DEPARTMENTS_CREATE), [
  body('name').notEmpty().withMessage('Nomi kiritilmagan'),
  body('code').notEmpty().withMessage('Kodi kiritilmagan'),
  body('factoryId').notEmpty().withMessage('Zavod tanlanmagan'),
], validate, deptCtrl.createDepartment);
router.put('/departments/:id', requirePermission(PERMISSIONS.DEPARTMENTS_UPDATE), deptCtrl.updateDepartment);
router.delete('/departments/:id', requirePermission(PERMISSIONS.DEPARTMENTS_DELETE), deptCtrl.deleteDepartment);

// ──────────────────────────────────────────────────────────────────────────
// LOOKUP LISTS (material categories, etc.)
// ──────────────────────────────────────────────────────────────────────────
const lookupCtrl = require('../controllers/admin/lookup.controller');
router.get('/lookups/:type', lookupCtrl.getLookup);
router.put('/lookups/:type', lookupCtrl.setLookup);

// ──────────────────────────────────────────────────────────────────────────
// AUDIT LOGS (super_admin only)
// ──────────────────────────────────────────────────────────────────────────
router.get('/audit-logs', requireRole('super_admin'), requirePermission(PERMISSIONS.AUDIT_READ), auditCtrl.getAuditLogs);
router.get('/audit-logs/stats', requireRole('super_admin'), auditCtrl.getActivityStats);

module.exports = router;
