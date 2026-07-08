const router = require('express').Router();
const ctrl = require('../controllers/charxlash.controller');
const { authenticate } = require('../middleware/auth');
const { auditMiddleware } = require('../middleware/auditLog');

router.use(authenticate);

router.get('/stats', ctrl.getStats);
router.get('/', ctrl.getRecords);
router.post('/', auditMiddleware('charxlash'), ctrl.createRecord);
router.patch('/:id', auditMiddleware('charxlash'), ctrl.updateRecord);
router.delete('/:id', auditMiddleware('charxlash'), ctrl.deleteRecord);

module.exports = router;
