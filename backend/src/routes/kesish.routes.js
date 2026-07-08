const router = require('express').Router();
const ctrl = require('../controllers/kesish.controller');
const { authenticate } = require('../middleware/auth');
const { auditMiddleware } = require('../middleware/auditLog');

router.use(authenticate);

router.get('/stats', ctrl.getStats);
router.get('/', ctrl.getRecords);
router.post('/', auditMiddleware('kesish'), ctrl.createRecord);
router.patch('/:id', auditMiddleware('kesish'), ctrl.updateRecord);
router.delete('/:id', auditMiddleware('kesish'), ctrl.deleteRecord);

module.exports = router;
