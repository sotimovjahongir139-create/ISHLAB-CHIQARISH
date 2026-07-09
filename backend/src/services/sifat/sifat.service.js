const prisma = require('../../config/database');

const SIFAT_BASE = process.env.SIFAT_API_URL || 'https://sifat.arkon-group.uz';

// Extract 3-5 digit numeric identifier from a SKU string
// "Padosh - 9092 - qora" → "9092"
const extractNum = (str) => {
  const m = String(str || '').match(/\b(\d{3,5})\b/);
  return m ? m[1] : null;
};

// Local-timezone-safe date string — avoids toISOString() UTC shift
const pad = (n) => String(n).padStart(2, '0');
const dateToStr = (d) => {
  if (!(d instanceof Date)) return String(d).slice(0, 10);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

// Module-level token cache — avoids re-login on every request
let cachedToken = null;

async function getSifatToken() {
  if (cachedToken) return cachedToken;

  const delays = [0, 1000, 2000, 4000];
  let lastErr;
  for (let i = 0; i < delays.length; i++) {
    if (delays[i] > 0) await new Promise((r) => setTimeout(r, delays[i]));
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
      if (data.token) {
        cachedToken = data.token;
        return data.token;
      }
      lastErr = new Error('Login failed - no token in response');
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr || new Error('Login failed after retries');
}

// Authenticated fetch — clears cached token and retries once on 401
async function sifatFetch(url) {
  const token = await getSifatToken();
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (res.status === 401) {
    cachedToken = null;
    const freshToken = await getSifatToken();
    return fetch(url, { headers: { Authorization: `Bearer ${freshToken}` } });
  }
  return res;
}

async function getBrakDinamikasi(startDate, endDate) {
  const res = await sifatFetch(
    `${SIFAT_BASE}/api/defects?date_from=${startDate}&date_to=${endDate}`
  );
  if (!res.ok) throw new Error(`Defects fetch failed: ${res.status}`);
  const raw = await res.json();

  const defects = Array.isArray(raw)
    ? raw
    : (raw.data || raw.results || raw.items || raw.defects || []);

  if (defects.length > 0) {
    console.log('[Sifat] raw defect sample:', JSON.stringify(defects[0]));
  }

  // Group brak by sku + date
  // Normalize date to YYYY-MM-DD regardless of what Sifat returns (datetime, etc.)
  const bySkuDate = {};
  for (const d of defects) {
    const rawDate =
      d.date || d.fact_date || d.defect_date || d.report_date ||
      d.inspection_date || d.day || d.sana || d.created_at || d.createdAt;
    const date = rawDate ? String(rawDate).slice(0, 10) : null;
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

  // Build factsByNum: { '3317|2026-07-06': 105 }
  // Use local-timezone date string to avoid UTC-shift mismatches
  const factsByNum = {};
  for (const f of facts) {
    const date = dateToStr(f.factDate);
    const num = extractNum(f.productModel?.name);
    if (!num) continue;
    const key = `${num}|${date}`;
    factsByNum[key] = (factsByNum[key] || 0) + (f.producedQty || 0);
  }

  if (Object.keys(factsByNum).length > 0) {
    console.log('[Sifat] factsByNum sample:', Object.keys(factsByNum).slice(0, 3));
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

  // Only keep SKUs that have at least one brak > 0
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
  const res = await sifatFetch(`${SIFAT_BASE}/api/defects/weekly-summary`);
  if (!res.ok) throw new Error(`Weekly summary fetch failed: ${res.status}`);
  return res.json();
}

module.exports = { getBrakDinamikasi, getWeeklySummary };
