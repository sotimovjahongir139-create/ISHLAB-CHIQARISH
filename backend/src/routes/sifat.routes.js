const router = require('express').Router();
const ctrl = require('../controllers/sifat.controller');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/brak-dinamikasi', ctrl.getBrakDinamikasi);
router.get('/weekly-summary', ctrl.getWeeklySummary);

module.exports = router;