import {
  Box, Card, CardContent, Typography, Button, ButtonGroup,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  CircularProgress, Alert, Chip,
} from '@mui/material';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { useState, useEffect, useCallback, useMemo } from 'react';
import * as sifatSvc from '../../services/sifat.service';
import { CHART_COLORS } from '../../constants';

const pad = (n) => String(n).padStart(2, '0');
const fmt = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

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

const BrakDinamikasi = () => {
  const [period, setPeriod] = useState('haftalik');
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
      setError("Sifat tizimiga ulanib bo'lmadi — qayta urinib ko'ring");
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    loadData();
    const id = setInterval(loadData, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [loadData]);

  const chartData = useMemo(() => {
    if (!brakData?.datasets?.length) return [];
    const allDates = [
      ...new Set(brakData.datasets.flatMap((ds) => ds.data.map((d) => d.date))),
    ].sort();
    return allDates.map((date) => {
      const row = { date };
      for (const ds of brakData.datasets) {
        const pt = ds.data.find((d) => d.date === date);
        row[ds.sku] = pt?.brak ?? 0;
      }
      return row;
    });
  }, [brakData]);

  const tableRows = useMemo(() => {
    if (!brakData?.datasets) return [];
    return brakData.datasets
      .flatMap((ds) => ds.data.map((d) => ({ sku: ds.sku, ...d })))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [brakData]);

  const skus = brakData?.datasets?.map((ds) => ds.sku) || [];
  const { totalBrak, totalFakt, avgFoiz } = brakData?.summary || {};

  const CustomTooltip = useCallback(
    ({ active, payload, label }) => {
      if (!active || !payload?.length) return null;
      return (
        <Box sx={{ bgcolor: 'background.paper', p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1, fontSize: 12 }}>
          <Typography variant="caption" fontWeight={700} display="block" mb={0.5}>{label}</Typography>
          {payload.map((p) => {
            const ds = brakData?.datasets?.find((d) => d.sku === p.name);
            const pt = ds?.data.find((d) => d.date === label);
            return (
              <Box key={p.name} mb={0.3}>
                <Box component="span" sx={{ color: p.color, fontWeight: 700 }}>{p.name}</Box>
                {' · '}Brak: <b>{p.value}</b>
                {pt ? <>{' · '}Fakt: <b>{pt.fakt}</b>{' · '}Foiz: <b>{pt.foiz}%</b></> : null}
              </Box>
            );
          })}
        </Box>
      );
    },
    [brakData]
  );

  return (
    <Card sx={{ mb: 2.5 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="subtitle1" fontWeight={700}>Brak dinamikasi</Typography>
          <ButtonGroup size="small">
            <Button
              variant={period === 'haftalik' ? 'contained' : 'outlined'}
              onClick={() => setPeriod('haftalik')}
            >
              Haftalik
            </Button>
            <Button
              variant={period === 'oylik' ? 'contained' : 'outlined'}
              onClick={() => setPeriod('oylik')}
            >
              Oylik
            </Button>
          </ButtonGroup>
        </Box>

        {loading && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 3 }}>
            <CircularProgress size={22} />
            <Typography color="text.secondary">Yuklanmoqda...</Typography>
          </Box>
        )}

        {!loading && error && <Alert severity="error" sx={{ mb: 1 }}>{error}</Alert>}

        {!loading && !error && brakData && (
          <>
            <Box sx={{ display: 'flex', gap: 1.5, mb: 2, flexWrap: 'wrap' }}>
              <Chip label={`Jami brak: ${totalBrak ?? 0} dona`} color="error" variant="outlined" />
              <Chip label={`Jami fakt: ${totalFakt ?? 0} dona`} color="primary" variant="outlined" />
              <Chip
                label={`O'rtacha foiz: ${avgFoiz ?? 0}%`}
                variant="outlined"
                sx={{ borderColor: foizColor(avgFoiz ?? 0), color: foizColor(avgFoiz ?? 0) }}
              />
            </Box>

            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData} margin={{ top: 4, right: 16, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={(d) => d.slice(5)} tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  {skus.map((sku, i) => (
                    <Line
                      key={sku}
                      type="monotone"
                      dataKey={sku}
                      stroke={CHART_COLORS[i % CHART_COLORS.length]}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                      strokeWidth={2}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <Typography color="text.secondary" sx={{ py: 2 }}>Ma'lumot topilmadi</Typography>
            )}

            {tableRows.length > 0 && (
              <TableContainer sx={{ mt: 2, maxHeight: 260 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>Sana</TableCell>
                      <TableCell>Model</TableCell>
                      <TableCell align="right">Fakt</TableCell>
                      <TableCell align="right">Brak</TableCell>
                      <TableCell align="right">Foiz %</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {tableRows.map((row, i) => (
                      <TableRow key={i} hover>
                        <TableCell sx={{ whiteSpace: 'nowrap', fontSize: 12 }}>{row.date}</TableCell>
                        <TableCell sx={{ fontSize: 12 }}>{row.sku}</TableCell>
                        <TableCell align="right" sx={{ fontSize: 12 }}>{row.fakt}</TableCell>
                        <TableCell align="right" sx={{ fontSize: 12, fontWeight: 600, color: 'error.main' }}>{row.brak}</TableCell>
                        <TableCell align="right">
                          <Typography variant="caption" fontWeight={700} sx={{ color: foizColor(row.foiz) }}>
                            {row.foiz}%
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </>
        )}

        {!loading && !error && !brakData && (
          <Typography color="text.secondary" sx={{ py: 2 }}>Ma'lumot topilmadi</Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default BrakDinamikasi;