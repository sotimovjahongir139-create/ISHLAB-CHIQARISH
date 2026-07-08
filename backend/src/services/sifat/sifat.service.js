const prisma = require('../../config/database');

const SIFAT_BASE = process.env.SIFAT_API_URL || 'https://sifat.arkon-group.uz';

async function getSifatToken() {
  const res = await fetch(`${SIFAT_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: process.env.SIFAT_USERNAME,
      password: process.env.SIFAT_PASSWORD,
    }),
  });
  const data = await res.json();
  if (!data.token) throw new Error('Login failed - no token');
  return data.token;
}

async function getBrakDinamikasi(startDate, endDate) {
  const token = await getSifatToken();

  const res = await fetch(
    `${SIFAT_BASE}/api/defects?date_from=${startDate}&date_to=${endDate}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) throw new Error(`Defects fetch failed: ${res.status}`);
  const raw = await res.json();

  const defects = Array.isArray(raw) ? raw : (raw.data || raw.results || []);

  // Group brak by sku + date
  const bySkuDate = {};
  for (const d of defects) {
    const date = d.date || d.fact_date || (d.created_at ? d.created_at.slice(0, 10) : null);
    const sku = d.sku || d.model || d.product_model;
    const brak = Number(d.brak_qty ?? d.quantity ?? d.defect_qty ?? 0);
    if (!sku || !date) continue;
    if (!bySkuDate[sku]) bySkuDate[sku] = {};
    bySkuDate[sku][date] = (bySkuDate[sku][date] || 0) + brak;
  }

  // Fakt from our DB grouped by factDate + productModel.name
  const facts = await prisma.productionFact.findMany({
    where: {
      factDate: { gte: new Date(startDate), lte: new Date(endDate) },
    },
    select: {
      factDate: true,
      producedQty: true,
      productModel: { select: { name: true } },
    },
  });

  const faktMap = {};
  for (const f of facts) {
    const date = f.factDate instanceof Date
      ? f.factDate.toISOString().slice(0, 10)
      : String(f.factDate).slice(0, 10);
    const sku = f.productModel?.name;
    if (!sku) continue;
    const key = `${sku}|${date}`;
    faktMap[key] = (faktMap[key] || 0) + (f.producedQty || 0);
  }

  let totalBrak = 0;
  let totalFakt = 0;
  let foizSum = 0;
  let foizCount = 0;

  const datasets = Object.entries(bySkuDate).map(([sku, dateMap]) => {
    const data = Object.entries(dateMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, brak]) => {
        const fakt = faktMap[`${sku}|${date}`] || 0;
        const foiz = fakt > 0 ? Math.round((brak / fakt) * 10000) / 100 : 0;
        totalBrak += brak;
        totalFakt += fakt;
        if (fakt > 0) { foizSum += foiz; foizCount++; }
        return { date, brak, fakt, foiz };
      });
    return { sku, data };
  });

  const avgFoiz = foizCount > 0 ? Math.round((foizSum / foizCount) * 100) / 100 : 0;

  return { datasets, summary: { totalBrak, totalFakt, avgFoiz } };
}

async function getWeeklySummary() {
  const token = await getSifatToken();
  const res = await fetch(`${SIFAT_BASE}/api/defects/weekly-summary`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Weekly summary fetch failed: ${res.status}`);
  return res.json();
}

module.exports = { getBrakDinamikasi, getWeeklySummary };