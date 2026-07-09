import {
  Box, Card, CardContent, Typography, Button, ButtonGroup,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  CircularProgress, Tabs, Tab,
} from '@mui/material';
import { Refresh } from '@mui/icons-material';
import { useState, useEffect, useCallback, useMemo } from 'react';
import * as sifatSvc from '../../services/sifat.service';

const pad = (n) => String(n).padStart(2, '0');
const fmt = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fmtDisplay = (iso) => (iso ? iso.split('-').reverse().join('.') : '—');

const getPeriodDates = (period) => {
  const today = new Date();
  if (period === 'haftalik') {
    const day = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (day === 0 ? 6 : day - 1));
    return { startDate: fmt(monday), endDate: fmt(today) };
  }
  return {
    startDate: fmt(new Date(today.getFullYear(), today.getMonth(), 1)),
    endDate: fmt(today),
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

const BrakDinamikasi = () => {
  const [period, setPeriod] = useState('haftalik');
  const [catTab, setCatTab] = useState(0);
  const [brakData, setBrakData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    const { startDate, endDate } = getPeriodDates(period);
    try {
      const r = await sifatSvc.getBrakDinamikasi({ startDate, endDate });
      if (r.data?.error) {
        setError(r.data.error);
        setBrakData(null);
      } else {
        setBrakData(r.data?.data || null);
      }
    } catch {
      setError("Sifat tizimi hozir mavjud emas");
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    loadData();
    const id = setInterval(loadData, 60 * 1000);
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
        {/* Header: tabs LEFT, period buttons RIGHT */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ mr: 1 }}>Brak dinamikasi</Typography>
            <Tabs
              value={catTab}
              onChange={(_, v) => setCatTab(v)}
              sx={{ minHeight: 32, '& .MuiTab-root': { minHeight: 32, py: 0.5, fontSize: '0.8rem' } }}
            >
              {CATEGORIES.map((c) => <Tab key={c.key} label={c.label} />)}
            </Tabs>
          </Box>
          <ButtonGroup size="small">
            <Button variant={period === 'haftalik' ? 'contained' : 'outlined'} onClick={() => setPeriod('haftalik')}>
              Haftalik
            </Button>
            <Button variant={period === 'oylik' ? 'contained' : 'outlined'} onClick={() => setPeriod('oylik')}>
              Oylik
            </Button>
          </ButtonGroup>
        </Box>

        {loading && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 3 }}>
            <CircularProgress size={20} />
            <Typography variant="body2" color="text.secondary">Yuklanmoqda...</Typography>
          </Box>
        )}

        {!loading && error && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 2 }}>
            <Typography variant="body2" color="text.secondary">{error}</Typography>
            <Button size="small" startIcon={<Refresh />} onClick={loadData}>Qayta urinish</Button>
          </Box>
        )}

        {!loading && !error && (
          <TableContainer sx={{ maxHeight: 320 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Sana</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Model</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, fontSize: 12 }}>Fakt</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, fontSize: 12 }}>Brak</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, fontSize: 12 }}>Foiz %</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tableRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 3, color: 'text.secondary', fontSize: 13 }}>
                      {CATEGORIES[catTab].label} bo'yicha brak ma'lumoti topilmadi
                    </TableCell>
                  </TableRow>
                ) : (
                  tableRows.map((row, i) => (
                    <TableRow key={i} hover>
                      <TableCell sx={{ whiteSpace: 'nowrap', fontSize: 12 }}>{fmtDisplay(row.date)}</TableCell>
                      <TableCell sx={{ fontSize: 12 }}>{row.sku}</TableCell>
                      <TableCell align="right" sx={{ fontSize: 12 }}>{row.fakt > 0 ? row.fakt : '—'}</TableCell>
                      <TableCell align="right" sx={{ fontSize: 12, fontWeight: 700, color: 'error.main' }}>{row.brak}</TableCell>
                      <TableCell align="right">
                        {row.fakt > 0
                          ? <Typography variant="caption" fontWeight={700} sx={{ color: foizColor(row.foiz) }}>{row.foiz}%</Typography>
                          : <Typography variant="caption" color="text.secondary">—</Typography>
                        }
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
