const svc = require('../services/sifat/sifat.service');

const getBrakDinamikasi = async (req, res) => {
  const { startDate, endDate } = req.query;
  if (!startDate || !endDate) {
    return res.status(400).json({ success: false, error: 'startDate va endDate kerak' });
  }
  try {
    const data = await svc.getBrakDinamikasi(startDate, endDate);
    return res.json({ success: true, data });
  } catch (err) {
    console.error('[Sifat] getBrakDinamikasi error:', err.message);
    const isLoginErr = /login|token/i.test(err.message);
    return res.json({
      success: false,
      error: isLoginErr ? "Sifat tizimiga kirib bo'lmadi" : "Sifat tizimiga ulanib bo'lmadi",
    });
  }
};

const getWeeklySummary = async (req, res) => {
  try {
    const data = await svc.getWeeklySummary();
    return res.json({ success: true, data });
  } catch (err) {
    console.error('[Sifat] getWeeklySummary error:', err.message);
    return res.json({ success: false, error: "Sifat tizimiga ulanib bo'lmadi" });
  }
};

module.exports = { getBrakDinamikasi, getWeeklySummary };