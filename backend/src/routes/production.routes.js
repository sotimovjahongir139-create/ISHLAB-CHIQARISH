const router = require('express').Router();
const ctrl = require('../controllers/production.controller');
const { authenticate } = require('../middleware/auth');
const { requirePermission } = require('../middleware/roles');
const { auditMiddleware } = require('../middleware/auditLog');
const { PERMISSIONS } = require('../utils/permissions');

router.use(authenticate);

router.get('/lines', requirePermission(PERMISSIONS.PRODUCTION_READ), ctrl.getLines);
router.post('/lines', requirePermission(PERMISSIONS.PRODUCTION_CREATE), ctrl.createLine);
router.put('/lines/:id', requirePermission(PERMISSIONS.PRODUCTION_UPDATE), ctrl.updateLine);
router.delete('/lines/:id', requirePermission(PERMISSIONS.PRODUCTION_DELETE), ctrl.deleteLine);
router.get('/categories', requirePermission(PERMISSIONS.PRODUCTION_READ), ctrl.getProductCategories);
router.get('/models', requirePermission(PERMISSIONS.PRODUCTION_READ), ctrl.getProductModels);
router.get('/models/all', requirePermission(PERMISSIONS.PRODUCTION_READ), ctrl.getAllProductModels);
router.post('/models', requirePermission(PERMISSIONS.PRODUCTION_CREATE), auditMiddleware('product_model'), ctrl.createProductModel);
router.put('/models/:id', requirePermission(PERMISSIONS.PRODUCTION_UPDATE), auditMiddleware('product_model'), ctrl.updateProductModel);
router.delete('/models/:id', requirePermission(PERMISSIONS.PRODUCTION_DELETE), ctrl.deleteProductModel);
router.get('/shifts', requirePermission(PERMISSIONS.PRODUCTION_READ), ctrl.getShifts);
router.get('/plans', requirePermission(PERMISSIONS.PRODUCTION_READ), ctrl.getPlans);
router.post('/plans', requirePermission(PERMISSIONS.PRODUCTION_CREATE), auditMiddleware('production_plan'), ctrl.createPlan);
router.put('/plans/:id', requirePermission(PERMISSIONS.PRODUCTION_UPDATE), auditMiddleware('production_plan'), ctrl.updatePlan);
router.delete('/plans/:id', requirePermission(PERMISSIONS.PRODUCTION_DELETE), auditMiddleware('production_plan'), ctrl.deletePlan);
router.get('/facts', requirePermission(PERMISSIONS.PRODUCTION_READ), ctrl.getFacts);
router.post('/facts', requirePermission(PERMISSIONS.PRODUCTION_CREATE), auditMiddleware('production_fact'), ctrl.createFact);

module.exports = router;
