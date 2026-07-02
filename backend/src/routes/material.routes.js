const router = require('express').Router();
const ctrl = require('../controllers/material.controller');
const { authenticate } = require('../middleware/auth');
const { requirePermission } = require('../middleware/roles');
const { auditMiddleware } = require('../middleware/auditLog');
const { PERMISSIONS } = require('../utils/permissions');

router.use(authenticate);

router.get('/', requirePermission(PERMISSIONS.MATERIALS_READ), ctrl.getMaterials);
router.post('/', requirePermission(PERMISSIONS.MATERIALS_CREATE), auditMiddleware('materials'), ctrl.createMaterial);
router.put('/:id', requirePermission(PERMISSIONS.MATERIALS_UPDATE), auditMiddleware('materials'), ctrl.updateMaterial);
router.delete('/:id', requirePermission(PERMISSIONS.MATERIALS_UPDATE), auditMiddleware('materials'), ctrl.deleteMaterial);
router.post('/:id/transactions', requirePermission(PERMISSIONS.MATERIALS_UPDATE), auditMiddleware('material_transactions'), ctrl.addTransaction);
router.get('/:id/transactions', requirePermission(PERMISSIONS.MATERIALS_READ), ctrl.getTransactions);

module.exports = router;
