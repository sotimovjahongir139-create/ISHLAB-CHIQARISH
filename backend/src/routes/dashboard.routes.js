const router = require('express').Router();
const ctrl = require('../controllers/dashboard.controller');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/kpis', ctrl.getKPIs);
router.get('/production-trend', ctrl.getProductionTrend);
router.get('/downtime-by-reason', ctrl.getDowntimeByReason);
router.get('/top-defects', ctrl.getTopDefects);
router.get('/department-comparison', ctrl.getDepartmentComparison);
router.get('/plan-vs-fact', ctrl.getPlanVsFact);

module.exports = router;
