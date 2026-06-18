const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const exportSvc = require('../services/reports/export.service');

router.use(authenticate);

router.get('/production/excel', async (req, res) => {
  const wb = await exportSvc.exportProductionExcel(req.query);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="production.xlsx"');
  await wb.xlsx.write(res);
  res.end();
});

router.get('/downtime/excel', async (req, res) => {
  const wb = await exportSvc.exportDowntimeExcel(req.query);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="downtime.xlsx"');
  await wb.xlsx.write(res);
  res.end();
});

module.exports = router;
