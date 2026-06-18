const router = require('express').Router();
const ctrl = require('../controllers/paint.controller');
const { authenticate } = require('../middleware/auth');
const { auditMiddleware } = require('../middleware/auditLog');

router.use(authenticate);

router.get('/', ctrl.getPaintRecords);
router.post('/', auditMiddleware('paint'), ctrl.createPaintRecord);
router.put('/:id', auditMiddleware('paint'), ctrl.updatePaintRecord);
router.delete('/:id', auditMiddleware('paint'), ctrl.deletePaintRecord);

module.exports = router;
