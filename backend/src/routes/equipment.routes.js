const router = require('express').Router();
const ctrl = require('../controllers/equipment.controller');
const { authenticate } = require('../middleware/auth');
const { requirePermission } = require('../middleware/roles');
const { auditMiddleware } = require('../middleware/auditLog');
const { PERMISSIONS } = require('../utils/permissions');

router.use(authenticate);

router.get('/', requirePermission(PERMISSIONS.EQUIPMENT_READ), ctrl.getEquipment);
router.post('/', requirePermission(PERMISSIONS.EQUIPMENT_CREATE), auditMiddleware('equipment'), ctrl.createEquipment);
router.put('/:id', requirePermission(PERMISSIONS.EQUIPMENT_UPDATE), auditMiddleware('equipment'), ctrl.updateEquipment);
router.delete('/:id', requirePermission(PERMISSIONS.EQUIPMENT_DELETE), auditMiddleware('equipment'), ctrl.deleteEquipment);
router.put('/:id/status', requirePermission(PERMISSIONS.EQUIPMENT_UPDATE), auditMiddleware('equipment'), ctrl.updateStatus);
router.get('/:id/maintenances', requirePermission(PERMISSIONS.EQUIPMENT_READ), ctrl.getMaintenances);
router.post('/:id/maintenances', requirePermission(PERMISSIONS.EQUIPMENT_UPDATE), auditMiddleware('maintenance'), ctrl.createMaintenance);
router.put('/:id/maintenances/:maintenanceId/complete', requirePermission(PERMISSIONS.EQUIPMENT_UPDATE), auditMiddleware('maintenance'), ctrl.completeMaintenance);

module.exports = router;
