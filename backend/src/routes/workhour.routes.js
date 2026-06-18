const router = require('express').Router();
const ctrl = require('../controllers/workhour.controller');
const { authenticate } = require('../middleware/auth');
const { auditMiddleware } = require('../middleware/auditLog');

router.use(authenticate);

router.get('/', ctrl.getWorkHours);
router.post('/', auditMiddleware('workhour'), ctrl.createWorkHour);
router.delete('/:id', auditMiddleware('workhour'), ctrl.deleteWorkHour);
router.get('/dept/:departmentId/stats', ctrl.getDeptStats);

module.exports = router;
