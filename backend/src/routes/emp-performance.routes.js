const router = require('express').Router();
const ctrl = require('../controllers/emp-performance.controller');
const { authenticate } = require('../middleware/auth');
const { auditMiddleware } = require('../middleware/auditLog');

router.use(authenticate);

router.get('/stats', ctrl.getStats);
router.get('/', ctrl.getRecords);
router.post('/', auditMiddleware('emp-performance'), ctrl.createRecord);
router.patch('/:id', auditMiddleware('emp-performance'), ctrl.updateRecord);
router.delete('/:id', auditMiddleware('emp-performance'), ctrl.deleteRecord);

module.exports = router;
