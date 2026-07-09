const prisma = require('../../config/database');

const SIFAT_BASE = process.env.SIFAT_API_URL || 'https://sifat.arkon-group.uz';

// Extract 3-5 digit numeric identifier from a SKU string
// "Padosh - 9092 - qora" → "9092"
// "9092 padosh" → "9092"
const extractNum = (str) => {
  const m = String(str || '').match(/\b(\d{3,5})\b/);
  return m ? m[1] : null;
};

async function getSifatToken() {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(`${SIFAT_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: process.env.SIFAT_USERNAME,
          password: process.env.SIFAT_PASSWORD,
        }),
      });
      const data = await res.json();
      if (data.token) return data.token;
    } catch (err) {
      if (attempt === 1) throw err;
    }
    await new Promise((r) => setTimeout(r, 1500));
  }
  throw new Error('Login failed - no token after retry');
}

async function getBrakDinamikasi(startDate, endDate) {
  const token = await getSifatToken();

  const res = await fetch(
    `${SIFAT_BASE}/api/defects?date_from=${startDate}&date_to=${endDate}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) throw new Error(`Defects fetch failed: ${res.status}`);
  const raw = await res.json();

  const defects = Array.isArray(raw)
    ? raw
    : (raw.data || raw.results || raw.items || raw.defects || []);

  if (defects.length > 0) {
    console.log('[Sifat] raw defect sample:', JSON.stringify(defects[0]));
  }

  // Group brak by sku + date — try every plausible field name
  const bySkuDate = {};
  for (const d of defects) {
    const date =
      d.date || d.fact_date || d.defect_date || d.report_date ||
      d.inspection_date || d.day || d.sana ||
      (d.created_at ? String(d.created_at).slice(0, 10) : null) ||
      (d.createdAt ? String(d.createdAt).slice(0, 10) : null);
    const sku =
      d.sku || d.model || d.product_model || d.product_name ||
      d.model_name || d.modelName || d.product || d.item ||
      d.name || d.artikul || d.nomi;
    const brak = Number(
      d.brak_qty ?? d.brak ?? d.quantity ?? d.qty ??
      d.defect_qty ?? d.defect_count ?? d.count ?? d.amount ??
      d.miqdor ?? 0
    );
    if (!sku || !date) continue;
    if (!bySkuDate[sku]) bySkuDate[sku] = {};
    bySkuDate[sku][date] = (bySkuDate[sku][date] || 0) + brak;
  }

  // Fakt from our DB — match by numeric identifier in model name
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

  // factsByNum: { '9092': { '2026-07-07': 150, '2026-07-08': 200 } }
  const factsByNum = {};
  for (const f of facts) {
    const date = f.factDate instanceof Date
      ? f.factDate.toISOString().slice(0, 10)
      : String(f.factDate).slice(0, 10);
    const num = extractNum(f.productModel?.name);
    if (!num) continue;
    const key = `${num}|${date}`;
    factsByNum[key] = (factsByNum[key] || 0) + (f.producedQty || 0);
  }

  // Build datasets, matching fakt by numeric SKU identifier
  const rawDatasets = Object.entries(bySkuDate).map(([sku, dateMap]) => {
    const skuNum = extractNum(sku);
    const data = Object.entries(dateMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, brak]) => {
        const fakt = skuNum ? (factsByNum[`${skuNum}|${date}`] || 0) : 0;
        const foiz = fakt > 0 ? Math.round((brak / fakt) * 10000) / 100 : 0;
        return { date, brak, fakt, foiz };
      });
    return { sku, data };
  });

  // Only include SKUs that have at least one brak > 0
  const datasets = rawDatasets.filter((ds) => ds.data.some((d) => d.brak > 0));

  // Accumulate summary from filtered datasets
  let totalBrak = 0, totalFakt = 0, foizSum = 0, foizCount = 0;
  for (const ds of datasets) {
    for (const d of ds.data) {
      totalBrak += d.brak;
      totalFakt += d.fakt;
      if (d.fakt > 0) { foizSum += d.foiz; foizCount++; }
    }
  }
  const avgFoiz = foizCount > 0 ? Math.round((foizSum / foizCount) * 100) / 100 : 0;

  return {
    datasets,
    summary: { totalBrak, totalFakt, avgFoiz },
    _rawSample: defects.slice(0, 2),
  };
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
