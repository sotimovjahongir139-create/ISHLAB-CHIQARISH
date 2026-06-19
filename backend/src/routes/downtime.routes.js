const router = require('express').Router();
const ctrl = require('../controllers/downtime.controller');
const { authenticate } = require('../middleware/auth');
const { requirePermission } = require('../middleware/roles');
const { auditMiddleware } = require('../middleware/auditLog');
const { PERMISSIONS } = require('../utils/permissions');

router.use(authenticate);

router.get('/reasons', requirePermission(PERMISSIONS.DOWNTIME_READ), ctrl.getReasons);
router.post('/reasons', requirePermission(PERMISSIONS.DOWNTIME_CREATE), ctrl.createReason);
router.put('/reasons/:id', requirePermission(PERMISSIONS.DOWNTIME_UPDATE), ctrl.updateReason);
router.delete('/reasons/:id', requirePermission(PERMISSIONS.DOWNTIME_DELETE), ctrl.deleteReason);
router.get('/active', requirePermission(PERMISSIONS.DOWNTIME_READ), ctrl.getActive);
router.get('/', requirePermission(PERMISSIONS.DOWNTIME_READ), ctrl.getDowntimes);
router.post('/', requirePermission(PERMISSIONS.DOWNTIME_CREATE), auditMiddleware('downtime'), ctrl.createDowntime);
router.put('/:id/resolve', requirePermission(PERMISSIONS.DOWNTIME_UPDATE), auditMiddleware('downtime'), ctrl.resolveDowntime);

module.exports = router;
