const router = require('express').Router();
const ctrl = require('../controllers/quality.controller');
const { authenticate } = require('../middleware/auth');
const { requirePermission } = require('../middleware/roles');
const { auditMiddleware } = require('../middleware/auditLog');
const { PERMISSIONS } = require('../utils/permissions');

router.use(authenticate);

router.get('/defect-types', requirePermission(PERMISSIONS.QUALITY_READ), ctrl.getDefectTypes);
router.get('/defects', requirePermission(PERMISSIONS.QUALITY_READ), ctrl.getDefects);
router.post('/defects', requirePermission(PERMISSIONS.QUALITY_CREATE), auditMiddleware('defects'), ctrl.createDefect);
router.put('/defects/:id/status', requirePermission(PERMISSIONS.QUALITY_UPDATE), auditMiddleware('defects'), ctrl.updateDefectStatus);
router.get('/inspections', requirePermission(PERMISSIONS.QUALITY_READ), ctrl.getInspections);
router.post('/inspections', requirePermission(PERMISSIONS.QUALITY_CREATE), auditMiddleware('quality_inspections'), ctrl.createInspection);

module.exports = router;
