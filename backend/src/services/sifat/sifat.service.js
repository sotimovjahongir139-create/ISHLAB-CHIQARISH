const prisma = require('../../config/database');

const SIFAT_BASE = process.env.SIFAT_API_URL || 'https://sifat.arkon-group.uz';

// Extract numeric part from Sifat SKU (primary: split by " - ", fallback: regex)
// "Padosh - 9092 - qora" → "9092"
const extractSkuNum = (sku) => {
  const parts = String(sku || '').split(' - ');
  const numPart = parts.find((p) => /^\d+$/.test(p.trim()));
  if (numPart) return numPart.trim();
  const m = String(sku || '').match(/\b(\d{3,5})\b/);
  return m ? m[1] : null;
};

// Extract category word from Sifat SKU (first segment before " - ")
// "Padosh - 9092 - qora" → "padosh"
// "Stilka - 6668 - ko'k" → "stilka"
const extractSkuCategory = (sku) => {
  const first = String(sku || '').split(' - ')[0].trim().toLowerCase();
  return ['padosh', 'stilka'].includes(first) ? first : null;
};

// Local-timezone-safe date string — avoids toISOString() UTC shift
const pad = (n) => String(n).padStart(2, '0');
const dateToStr = (d) => {
  if (!(d instanceof Date)) return String(d).slice(0, 10);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

// Subtract 1 day from a YYYY-MM-DD string, returns YYYY-MM-DD
// Parses as local midnight to avoid UTC-shift issues
const subtractOneDay = (dateStr) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d); // local midnight
  date.setDate(date.getDate() - 1);
  return dateToStr(date);
};

// Module-level token cache
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

// Authenticated fetch with 401 re-auth and 3-attempt network retry
async function sifatFetch(url) {
  const token = await getSifatToken();
  let lastErr;
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) await new Promise((r) => setTimeout(r, 2000));
    try {
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (res.status === 401) {
        cachedToken = null;
        const freshToken = await getSifatToken();
        return fetch(url, { headers: { Authorization: `Bearer ${freshToken}` } });
      }
      return res;
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr;
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

  // Group brak by sku + date (normalize date to YYYY-MM-DD)
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

  // Fetch all facts — extend range by 1 day back to cover date-shift lookups
  const faktStartDate = subtractOneDay(startDate);
  const facts = await prisma.productionFact.findMany({
    where: {
      factDate: { gte: new Date(faktStartDate), lte: new Date(endDate) },
    },
    select: {
      factDate: true,
      producedQty: true,
      productModel: { select: { name: true } },
    },
  });

  // Build factsByDate: { '2026-07-05': [{ modelName: '9092 padosh', qty: 150 }] }
  const factsByDate = {};
  for (const f of facts) {
    const date = dateToStr(f.factDate);
    if (!factsByDate[date]) factsByDate[date] = [];
    factsByDate[date].push({
      modelName: f.productModel?.name || '',
      qty: f.producedQty || 0,
    });
  }

  // Lookup fakt for a brak record:
  //   - brakDate: the date the brak was recorded
  //   - faktDate: one day BEFORE brakDate (production happened before defect is logged)
  //   - matches: modelName.includes(num) AND modelName.includes(category)
  //   Equivalent SQL: WHERE fact_date = faktDate AND name LIKE '%9092%' AND name ILIKE '%padosh%'
  const lookupFakt = (num, category, brakDate) => {
    const faktDate = subtractOneDay(brakDate);
    if (!num || !factsByDate[faktDate]) return { fakt: 0, faktDate };
    const fakt = factsByDate[faktDate]
      .filter((f) => {
        const name = f.modelName.toLowerCase();
        const hasNum = name.includes(num);
        const hasCat = !category || name.includes(category);
        return hasNum && hasCat;
      })
      .reduce((sum, f) => sum + f.qty, 0);
    return { fakt, faktDate };
  };

  // Build datasets with per-row debug log
  const rawDatasets = Object.entries(bySkuDate).map(([sku, dateMap]) => {
    const num = extractSkuNum(sku);
    const category = extractSkuCategory(sku);
    const data = Object.entries(dateMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, brak]) => {
        const { fakt, faktDate } = lookupFakt(num, category, date);
        const foiz = fakt > 0 ? Math.round((brak / fakt) * 10000) / 100 : 0;
        console.log('[FAKT]', {
          skuDate: date,
          faktLookupDate: faktDate,
          extracted: num,
          category,
          faktFound: fakt,
          brak,
          foiz: fakt > 0 ? `${foiz}%` : '—',
        });
        return { date, brak, fakt, foiz };
      });
    return { sku, data };
  });

  const datasets = rawDatasets.filter((ds) => ds.data.some((d) => d.brak > 0));

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
