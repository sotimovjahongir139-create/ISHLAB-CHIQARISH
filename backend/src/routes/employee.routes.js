const router = require('express').Router();
const ctrl = require('../controllers/employee.controller');
const { authenticate } = require('../middleware/auth');
const { requirePermission } = require('../middleware/roles');
const { auditMiddleware } = require('../middleware/auditLog');
const { PERMISSIONS } = require('../utils/permissions');

router.use(authenticate);

router.get('/departments', requirePermission(PERMISSIONS.EMPLOYEES_READ), ctrl.getDepartments);
router.get('/', requirePermission(PERMISSIONS.EMPLOYEES_READ), ctrl.getEmployees);
router.post('/', requirePermission(PERMISSIONS.EMPLOYEES_CREATE), auditMiddleware('employees'), ctrl.createEmployee);
router.post('/attendance', requirePermission(PERMISSIONS.EMPLOYEES_UPDATE), auditMiddleware('employee_attendance'), ctrl.recordAttendance);
router.get('/:id', requirePermission(PERMISSIONS.EMPLOYEES_READ), ctrl.getEmployee);
router.put('/:id', requirePermission(PERMISSIONS.EMPLOYEES_UPDATE), auditMiddleware('employees'), ctrl.updateEmployee);
router.delete('/:id', requirePermission(PERMISSIONS.EMPLOYEES_DELETE), auditMiddleware('employees'), ctrl.deleteEmployee);
router.get('/:id/attendance', requirePermission(PERMISSIONS.EMPLOYEES_READ), ctrl.getAttendance);

module.exports = router;
