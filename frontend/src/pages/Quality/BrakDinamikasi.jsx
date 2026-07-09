import {
  Box, Card, CardContent, Typography, Button, ButtonGroup,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  CircularProgress, Tabs, Tab,
} from '@mui/material';
import { Refresh, WarningAmber } from '@mui/icons-material';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import * as sifatSvc from '../../services/sifat.service';

const pad = (n) => String(n).padStart(2, '0');
const fmt = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fmtDisplay = (iso) => (iso ? iso.split('-').reverse().join('.') : '—');

const getPeriodDates = (period) => {
  const now = new Date();
  if (period === 'haftalik') {
    const d = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - (d === 0 ? 6 : d - 1));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return { startDate: fmt(monday), endDate: fmt(sunday) };
  }
  if (period === 'otgan_oy') {
    return {
      startDate: fmt(new Date(now.getFullYear(), now.getMonth() - 1, 1)),
      endDate: fmt(new Date(now.getFullYear(), now.getMonth(), 0)),
    };
  }
  // oylik (default)
  return {
    startDate: fmt(new Date(now.getFullYear(), now.getMonth(), 1)),
    endDate: fmt(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
  };
};

const foizColor = (foiz) => {
  if (foiz <= 5) return '#16A34A';
  if (foiz <= 10) return '#EA580C';
  return '#DC2626';
};

const CATEGORIES = [
  { key: 'padosh', label: 'Padosh' },
  { key: 'stilka', label: 'Stilka' },
];

const HDR = {
  fontWeight: 600,
  fontSize: 13,
  bgcolor: '#f8f9fa',
  py: '12px',
  px: '16px',
  borderBottom: '2px solid #e0e0e0',
};

const BrakDinamikasi = () => {
  const [period, setPeriod] = useState('haftalik');
  const [catTab, setCatTab] = useState(0);
  const [brakData, setBrakData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);
  const [stale, setStale] = useState(false);
  const [error, setError] = useState('');
  const hasData = useRef(false);

  const loadData = useCallback(async (isManual = false) => {
    if (isManual) setRetrying(true);
    setStale(false);
    const { startDate, endDate } = getPeriodDates(period);
    try {
      const r = await sifatSvc.getBrakDinamikasi({ startDate, endDate });
      if (r.data?.error) {
        if (hasData.current) setStale(true);
        else setError(r.data.error);
      } else {
        setBrakData(r.data?.data || null);
        hasData.current = true;
        setError('');
      }
    } catch {
      if (hasData.current) setStale(true);
      else setError('Sifat tizimi hozir mavjud emas');
    } finally {
      setLoading(false);
      if (isManual) setRetrying(false);
    }
  }, [period]);

  useEffect(() => {
    setLoading(true);
    setBrakData(null);
    setError('');
    setStale(false);
    hasData.current = false;
    loadData();
    const id = setInterval(() => loadData(false), 2 * 60 * 1000);
    return () => clearInterval(id);
  }, [loadData]);

  const tableRows = useMemo(() => {
    if (!brakData?.datasets) return [];
    const catKey = CATEGORIES[catTab].key;
    return brakData.datasets
      .filter((ds) => ds.sku.toLowerCase().includes(catKey))
      .flatMap((ds) => ds.data.map((d) => ({ sku: ds.sku, ...d })))
      .filter((r) => r.brak > 0)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [brakData, catTab]);

  return (
    <Card sx={{ mb: 2.5 }}>
      <CardContent sx={{ pb: '12px !important' }}>
        {/* Header: category tabs LEFT, period buttons RIGHT */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ mr: 1 }}>
              Brak dinamikasi
            </Typography>
            <Tabs
              value={catTab}
              onChange={(_, v) => setCatTab(v)}
              sx={{ minHeight: 32, '& .MuiTab-root': { minHeight: 32, py: 0.5, fontSize: '0.8rem' } }}
            >
              {CATEGORIES.map((c) => <Tab key={c.key} label={c.label} />)}
            </Tabs>
          </Box>
          <ButtonGroup size="small">
            {[
              { key: 'haftalik', label: 'Haftalik' },
              { key: 'oylik', label: 'Oylik' },
              { key: 'otgan_oy', label: "O'tgan oy" },
            ].map((p) => (
              <Button
                key={p.key}
                variant={period === p.key ? 'contained' : 'outlined'}
                onClick={() => setPeriod(p.key)}
              >
                {p.label}
              </Button>
            ))}
          </ButtonGroup>
        </Box>

        {/* Initial load spinner */}
        {loading && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 3 }}>
            <CircularProgress size={20} />
            <Typography variant="body2" color="text.secondary">Yuklanmoqda...</Typography>
          </Box>
        )}

        {/* Full error — no data at all */}
        {!loading && error && !brakData && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 2 }}>
            <Typography variant="body2" color="text.secondary">{error}</Typography>
            <Button
              size="small"
              startIcon={retrying ? <CircularProgress size={14} /> : <Refresh />}
              onClick={() => loadData(true)}
              disabled={retrying}
            >
              Qayta urinish
            </Button>
          </Box>
        )}

        {/* Stale warning — old data still shown in table below */}
        {!loading && stale && brakData && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
            <WarningAmber sx={{ fontSize: 14, color: 'warning.main' }} />
            <Typography variant="caption" color="text.secondary">
              Ma'lumotlar eskirgan bo'lishi mumkin
            </Typography>
            <Button
              size="small"
              sx={{ ml: 0.5, minWidth: 0, fontSize: 11 }}
              startIcon={retrying ? <CircularProgress size={12} /> : <Refresh />}
              onClick={() => loadData(true)}
              disabled={retrying}
            >
              Yangilash
            </Button>
          </Box>
        )}

        {/* Table — visible whenever we have data (fresh or stale) */}
        {!loading && brakData && (
          <TableContainer sx={{ minHeight: 400, maxHeight: 600, overflow: 'auto' }}>
            <Table stickyHeader sx={{ tableLayout: 'fixed', width: '100%' }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ ...HDR, width: 130 }}>Sana</TableCell>
                  <TableCell sx={{ ...HDR }}>Model</TableCell>
                  <TableCell align="right" sx={{ ...HDR, width: 100 }}>Fakt</TableCell>
                  <TableCell align="right" sx={{ ...HDR, width: 100 }}>Brak</TableCell>
                  <TableCell align="right" sx={{ ...HDR, width: 110 }}>Foiz %</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tableRows.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      align="center"
                      sx={{ py: 6, color: 'text.secondary', fontSize: 14 }}
                    >
                      {CATEGORIES[catTab].label} bo'yicha brak ma'lumoti topilmadi
                    </TableCell>
                  </TableRow>
                ) : (
                  tableRows.map((row, i) => (
                    <TableRow
                      key={i}
                      sx={{
                        height: 52,
                        '&:hover td': { bgcolor: '#f0f4ff' },
                        '& td': { borderBottom: '1px solid #f0f0f0' },
                      }}
                    >
                      <TableCell sx={{ whiteSpace: 'nowrap', fontSize: 15, px: '16px' }}>
                        {fmtDisplay(row.date)}
                      </TableCell>
                      <TableCell sx={{ fontSize: 15, px: '16px' }}>{row.sku}</TableCell>
                      <TableCell align="right" sx={{ fontSize: 15, px: '16px' }}>
                        {row.fakt > 0 ? row.fakt : '—'}
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{ fontSize: 16, fontWeight: 700, color: 'error.main', px: '16px' }}
                      >
                        {row.brak}
                      </TableCell>
                      <TableCell align="right" sx={{ px: '16px' }}>
                        {row.fakt > 0 ? (
                          <Typography
                            fontWeight={700}
                            sx={{ fontSize: 15, color: foizColor(row.foiz) }}
                          >
                            {row.foiz}%
                          </Typography>
                        ) : (
                          <Typography sx={{ fontSize: 15 }} color="text.secondary">—</Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default BrakDinamikasi;
