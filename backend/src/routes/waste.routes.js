const router = require('express').Router();
const ctrl = require('../controllers/waste.controller');
const { authenticate } = require('../middleware/auth');
const { auditMiddleware } = require('../middleware/auditLog');

router.use(authenticate);

router.get('/', ctrl.getWasteRecords);
router.post('/', auditMiddleware('waste'), ctrl.createWasteRecord);
router.put('/:id', auditMiddleware('waste'), ctrl.updateWasteRecord);
router.delete('/:id', auditMiddleware('waste'), ctrl.deleteWasteRecord);

module.exports = router;
