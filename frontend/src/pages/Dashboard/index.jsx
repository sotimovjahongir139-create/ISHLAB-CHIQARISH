import {
  Grid, Typography, Box, Chip, Card, CardContent,
  FormControl, InputLabel, Select, MenuItem, ToggleButtonGroup, ToggleButton,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  LinearProgress, Skeleton,
} from '@mui/material';
import {
  Factory, VerifiedUser, AccessTime, ReportProblem,
  CheckCircle, Speed, Inventory, Palette,
} from '@mui/icons-material';
import { useState, useEffect } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RTooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell, LabelList,
} from 'recharts';
import { format } from 'date-fns';
import { useSnackbar } from 'notistack';
import * as svc from '../../services/dashboard.service';
import { CHART_COLORS } from '../../constants';

// ── Compute exact date range for Reja vs Fakt chart period buttons ───────────
const getPvfDates = (period) => {
  const now = new Date();
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const dayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  if (period === 1) {
    return { startDate: dayStart.toISOString(), endDate: dayEnd.toISOString() };
  }
  if (period === 7) {
    const dow = now.getDay();
    const diff = dow === 0 ? 6 : dow - 1;
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diff, 0, 0, 0);
    return { startDate: monday.toISOString(), endDate: dayEnd.toISOString() };
  }
  // oy (30)
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
  return { startDate: firstOfMonth.toISOString(), endDate: dayEnd.toISOString() };
};

// ── Color tokens for KPI cards (neon-on-navy accents) ─────────────────────────
const C = {
  blue:   { accent: '#22D3EE', bg: 'rgba(34,211,238,0.14)' },   // cyan
  green:  { accent: '#34D399', bg: 'rgba(52,211,153,0.14)' },   // green
  orange: { accent: '#F59E0B', bg: 'rgba(245,158,11,0.14)' },   // amber
  red:    { accent: '#F43F5E', bg: 'rgba(244,63,94,0.14)' },    // rose
  teal:   { accent: '#34D399', bg: 'rgba(52,211,153,0.14)' },   // green
  indigo: { accent: '#3B82F6', bg: 'rgba(59,130,246,0.14)' },   // blue
  purple: { accent: '#EC4899', bg: 'rgba(236,72,153,0.14)' },   // pink
};

const MONO_FONT = "'JetBrains Mono', 'Roboto Mono', monospace";

// ── KPI card (compact) ───────────────────────────────────────────────────────
const KPI = ({ title, value, unit, icon, c = C.blue, loading }) => (
  <Card sx={{
    height: '100%', borderRadius: '14px',
    '&:hover': { boxShadow: `0 0 22px ${c.accent}2E, 0 10px 28px rgba(0,0,0,0.5)` },
  }}>
    <CardContent sx={{ p: '16px 18px', '&:last-child': { pb: '16px' } }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1.25 }}>
        <Typography sx={{
          fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px',
          fontSize: '10px', color: '#8A97AC', lineHeight: 1.3, pr: 0.5,
        }}>
          {title}
        </Typography>
        <Box sx={{
          width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
          bgcolor: c.bg, boxShadow: `0 0 14px ${c.accent}40, inset 0 0 0 1px ${c.accent}33`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.accent,
        }}>
          {icon}
        </Box>
      </Box>
      {loading ? <Skeleton width={66} height={28} /> : (
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
          <Typography sx={{
            fontFamily: MONO_FONT,
            fontSize: '26px', fontWeight: 700, color: '#E7ECF5',
            lineHeight: 1, fontVariantNumeric: 'tabular-nums',
          }}>
            {value !== null && value !== undefined ? Number(value).toLocaleString() : '0'}
          </Typography>
          {unit && (
            <Typography sx={{ fontFamily: MONO_FONT, fontSize: '13px', color: '#8A97AC' }}>{unit}</Typography>
          )}
        </Box>
      )}
    </CardContent>
  </Card>
);

// ── Constants ────────────────────────────────────────────────────────────────
const PERIOD_OPTIONS = [
  { label: 'Bugun', value: 1 },
  { label: 'Hafta', value: 7 },
  { label: 'Oy', value: 30 },
];

const FULFILLMENT_COLOR = (v) => v >= 100 ? 'success' : v >= 80 ? 'warning' : 'error';

const fmtDate = (d, days) => {
  try {
    return days <= 1 ? format(new Date(d), 'HH:mm') : format(new Date(d), 'dd MMM');
  } catch { return d; }
};

// ── Chart section header ──────────────────────────────────────────────────────
const ChartHeader = ({ title, right }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
    <Typography variant="h6">{title}</Typography>
    {right}
  </Box>
);

const PeriodToggle = ({ value, onChange }) => (
  <ToggleButtonGroup size="small" exclusive value={value} onChange={(_, v) => v && onChange(v)}>
    {PERIOD_OPTIONS.map((o) => (
      <ToggleButton key={o.value} value={o.value} sx={{ px: 1.5, py: 0.3, fontSize: 12 }}>{o.label}</ToggleButton>
    ))}
  </ToggleButtonGroup>
);

// ── Dark glass tooltip ────────────────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <Box sx={{
      bgcolor: '#0B1220', color: '#E0E8F0', p: '10px 14px', borderRadius: '8px',
      boxShadow: '0 0 0 1px rgba(34,211,238,0.22), 0 12px 32px rgba(0,0,0,0.55)',
      border: 'none',
      minWidth: 148, pointerEvents: 'none',
    }}>
      <Typography sx={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', mb: 0.75, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        {label}
      </Typography>
      {payload.map((p, i) => (
        <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: i < payload.length - 1 ? 0.5 : 0 }}>
          <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: p.color || p.fill, flexShrink: 0 }} />
          <Typography sx={{ fontSize: 12, color: 'rgba(255,255,255,0.72)', flexGrow: 1 }}>{p.name}</Typography>
          <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#fff', ml: 1, fontVariantNumeric: 'tabular-nums' }}>
            {typeof p.value === 'number' ? p.value.toLocaleString() : p.value}
          </Typography>
        </Box>
      ))}
    </Box>
  );
};

// ── Shared axis + grid style ──────────────────────────────────────────────────
const axTick = { fontSize: 10, fill: '#8A97AC' };
const gridStyle = { stroke: 'rgba(148,163,184,0.14)' };

// ── Dashboard ────────────────────────────────────────────────────────────────
const Dashboard = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [days, setDays] = useState(30);

  const [kpis, setKpis] = useState(null);
  const [trend, setTrend] = useState([]);
  const [downtime, setDowntime] = useState([]);
  const [topDefects, setTopDefects] = useState([]);
  const [deptComp, setDeptComp] = useState([]);
  const [loading, setLoading] = useState(true);

  const [lineTab, setLineTab] = useState('pu');

  const [pvfPeriod, setPvfPeriod] = useState(7);
  const [pvfTab, setPvfTab] = useState('TEP');
  const [pvfLines, setPvfLines] = useState([]);
  const [pvfLoading, setPvfLoading] = useState(false);

  const loadMain = async (d = days) => {
    setLoading(true);
    try {
      const [kpisR, trendR, dtR, defR, deptR] = await Promise.all([
        svc.getKPIs(),
        svc.getProductionTrend({ days: d }),
        svc.getDowntimeByReason({ days: d }),
        svc.getTopDefects({ days: d }),
        svc.getDepartmentComparison({ days: d }),
      ]);
      setKpis(kpisR.data.data);
      setTrend(trendR.data.data);
      setDowntime(dtR.data.data);
      setTopDefects(defR.data.data);
      setDeptComp(deptR.data.data);
    } catch {
      enqueueSnackbar('Ma\'lumot yuklanmadi', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const loadPvfChart = async (d = pvfPeriod, tab = pvfTab) => {
    setPvfLoading(true);
    try {
      const { startDate, endDate } = getPvfDates(d);
      const r = await svc.getDepartmentComparison({ startDate, endDate });
      setPvfLines(r.data.data || []);
    } catch {} finally { setPvfLoading(false); }
  };

  useEffect(() => { loadMain(days); }, [days]);
  useEffect(() => { loadPvfChart(pvfPeriod, pvfTab); }, [pvfPeriod, pvfTab]);

  const trendFormatted = trend.map((d) => ({ ...d, date: fmtDate(d.date, days) }));
  const pieData = downtime.map((d) => ({ name: d.reason, value: Math.round(d.totalMinutes) }));

  // Per-line data for Reja vs Fakt chart, filtered by PU or TEP prefix
  const pvfLinesFiltered = pvfLines.filter((r) =>
    pvfTab === 'PU' ? /^pu/i.test(r.lineName) : /^tep/i.test(r.lineName)
  );

  // Liniyalar table: filter by active tab
  const filteredDeptComp = deptComp.filter((r) =>
    lineTab === 'pu' ? /^pu/i.test(r.lineName) : /^tep/i.test(r.lineName)
  );

  return (
    <Box>
      {/* ── Header ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="h4">Bosh sahifa</Typography>
          <Typography variant="body2" color="text.secondary">Ishlab chiqarish ko'rsatkichlari</Typography>
        </Box>
        <FormControl size="small" sx={{ width: 140 }}>
          <InputLabel>Trend davri</InputLabel>
          <Select value={days} label="Trend davri" onChange={(e) => setDays(e.target.value)}>
            <MenuItem value={7}>7 kun</MenuItem>
            <MenuItem value={14}>14 kun</MenuItem>
            <MenuItem value={30}>30 kun</MenuItem>
            <MenuItem value={60}>60 kun</MenuItem>
            <MenuItem value={90}>90 kun</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* ── Kunlik ko'rsatkichlar ── */}
      <Typography sx={{ fontSize: '11px', fontWeight: 600, color: '#8A97AC', textTransform: 'uppercase', letterSpacing: '0.8px', mb: 1 }}>
        Kunlik ko'rsatkichlar
      </Typography>
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={2.4}>
          <KPI title="Ishlab chiqarish" value={kpis?.today?.produced} unit="dona"
            icon={<Factory fontSize="small" />} c={C.blue} loading={loading} />
        </Grid>
        <Grid item xs={2.4}>
          <KPI title="OEE" value={kpis?.today?.oee} unit="%"
            icon={<Speed fontSize="small" />} c={C.indigo} loading={loading} />
        </Grid>
        <Grid item xs={2.4}>
          <KPI title="To'xtalishlar" value={kpis?.today?.downtimes} unit="ta"
            icon={<AccessTime fontSize="small" />} c={C.orange} loading={loading} />
        </Grid>
        <Grid item xs={2.4}>
          <KPI title="Xomashyo miqdori" value={kpis?.today?.xomashyo} unit="kg"
            icon={<Inventory fontSize="small" />} c={C.teal} loading={loading} />
        </Grid>
        <Grid item xs={2.4}>
          <KPI title="Kraska miqdori" value={kpis?.today?.kraska} unit="kg"
            icon={<Palette fontSize="small" />} c={C.purple} loading={loading} />
        </Grid>
      </Grid>

      {/* ── Oylik ko'rsatkichlar ── */}
      <Typography sx={{ fontSize: '11px', fontWeight: 600, color: '#8A97AC', textTransform: 'uppercase', letterSpacing: '0.8px', mb: 1 }}>
        Oylik ko'rsatkichlar
      </Typography>
      <Grid container spacing={2} sx={{ mb: 2.5 }}>
        <Grid item xs={2.4}>
          <KPI title="Ishlab chiqarish" value={kpis?.month?.produced} unit="dona"
            icon={<Factory fontSize="small" />} c={C.blue} loading={loading} />
        </Grid>
        <Grid item xs={2.4}>
          <KPI title="OEE" value={kpis?.month?.oee} unit="%"
            icon={<Speed fontSize="small" />} c={C.indigo} loading={loading} />
        </Grid>
        <Grid item xs={2.4}>
          <KPI title="To'xtalishlar" value={kpis?.month?.downtimes} unit="ta"
            icon={<AccessTime fontSize="small" />} c={C.orange} loading={loading} />
        </Grid>
        <Grid item xs={2.4}>
          <KPI title="Xomashyo miqdori" value={kpis?.month?.xomashyo} unit="kg"
            icon={<Inventory fontSize="small" />} c={C.teal} loading={loading} />
        </Grid>
        <Grid item xs={2.4}>
          <KPI title="Kraska miqdori" value={kpis?.month?.kraska} unit="kg"
            icon={<Palette fontSize="small" />} c={C.purple} loading={loading} />
        </Grid>
      </Grid>

      {/* ── Reja vs Fakt per-line grouped bar chart ── */}
      <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <ChartHeader
                title="Reja va Fakt ko'rsatkichlari"
                right={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <ToggleButtonGroup
                      size="small" exclusive value={pvfTab}
                      onChange={(_, v) => { if (v !== null) setPvfTab(v); }}
                      sx={{ height: 26 }}
                    >
                      <ToggleButton value="PU" sx={{ px: 1.5, py: 0, fontSize: 11, fontWeight: 700 }}>PU</ToggleButton>
                      <ToggleButton value="TEP" sx={{ px: 1.5, py: 0, fontSize: 11, fontWeight: 700 }}>TEP</ToggleButton>
                    </ToggleButtonGroup>
                    <PeriodToggle value={pvfPeriod} onChange={setPvfPeriod} />
                  </Box>
                }
              />
              {pvfLoading ? <Skeleton variant="rectangular" height={220} /> : pvfLinesFiltered.length === 0 ? (
                <Box sx={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'text.secondary' }}>
                  <Typography variant="body2">Ma'lumot yo'q</Typography>
                </Box>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={pvfLinesFiltered} margin={{ top: 24, right: 16, left: 0, bottom: 0 }} barCategoryGap="28%" barGap={6}>
                    <CartesianGrid strokeDasharray="3 3" {...gridStyle} vertical={false} />
                    <XAxis dataKey="lineName" tick={axTick} axisLine={false} tickLine={false} />
                    <YAxis tick={axTick} axisLine={false} tickLine={false} width={44} padding={{ top: 10 }} />
                    <RTooltip content={<ChartTooltip />} />
                    <Legend verticalAlign="bottom" iconSize={10} height={22}
                      formatter={(v) => <span style={{ fontSize: 11 }}>{v}</span>} />
                    <Bar dataKey="planned" name="Reja" fill="#3B82F6" radius={[4, 4, 0, 0]} maxBarSize={56}>
                      <LabelList dataKey="planned" position="top"
                        style={{ fontSize: 10, fontWeight: 700, fontFamily: MONO_FONT, fill: '#60A5FA' }}
                        formatter={(v) => v > 0 ? v.toLocaleString() : ''} />
                    </Bar>
                    <Bar dataKey="produced" name="Fakt" fill="#22D3EE" radius={[4, 4, 0, 0]} maxBarSize={56}>
                      <LabelList dataKey="produced" position="top"
                        style={{ fontSize: 10, fontWeight: 700, fontFamily: MONO_FONT, fill: '#67E8F9' }}
                        formatter={(v) => v > 0 ? v.toLocaleString() : ''} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ── Downtime pie + Trend ── */}
      <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>To'xtalish sabablari ({days} kun)</Typography>
              {loading ? <Skeleton variant="rectangular" height={220} /> : pieData.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
                  <CheckCircle sx={{ fontSize: 40, color: 'success.light', mb: 1 }} />
                  <Typography variant="body2">To'xtalish yo'q</Typography>
                </Box>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={46} outerRadius={80}
                      paddingAngle={3} dataKey="value" strokeWidth={0}
                      label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                        if (percent <= 0.04) return null;
                        const R = Math.PI / 180;
                        const r = innerRadius + (outerRadius - innerRadius) * 0.5;
                        const x = cx + (r + 16) * Math.cos(-midAngle * R);
                        const y = cy + (r + 16) * Math.sin(-midAngle * R);
                        return (
                          <text x={x} y={y} fill="#E7ECF5" textAnchor="middle"
                            dominantBaseline="central" fontSize={11} fontWeight={600}>
                            {`${(percent * 100).toFixed(0)}%`}
                          </text>
                        );
                      }}
                      labelLine={false}>
                      {pieData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Pie>
                    <RTooltip formatter={(v) => [`${v} daqiqa`, 'Davomiyligi']} />
                    <Legend iconSize={10} formatter={(v) => <span style={{ fontSize: 11 }}>{v}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Ishlab chiqarish trendi ({days} kun)</Typography>
              {loading ? <Skeleton variant="rectangular" height={220} /> : (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={trendFormatted} margin={{ top: 5, right: 16, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="g-prod" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22D3EE" stopOpacity={0.28} />
                        <stop offset="95%" stopColor="#22D3EE" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="g-good" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#34D399" stopOpacity={0.24} />
                        <stop offset="95%" stopColor="#34D399" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" {...gridStyle} vertical={false} />
                    <XAxis dataKey="date" tick={axTick} axisLine={false} tickLine={false} />
                    <YAxis tick={axTick} axisLine={false} tickLine={false} width={36} />
                    <RTooltip content={<ChartTooltip />} />
                    <Legend iconSize={10} formatter={(v) => <span style={{ fontSize: 11 }}>{v}</span>} />
                    <Area type="monotone" dataKey="produced" stroke="#22D3EE" fill="url(#g-prod)"
                      name="Ishlab chiqarilgan" strokeWidth={2.5}
                      dot={{ r: 2.5, fill: '#22D3EE', strokeWidth: 0 }} activeDot={{ r: 5 }}>
                      <LabelList dataKey="produced" position="top"
                        style={{ fontSize: 9, fill: '#67E8F9', fontWeight: 600, fontFamily: MONO_FONT }}
                        formatter={(v) => v > 0 ? v.toLocaleString() : ''} />
                    </Area>
                    <Area type="monotone" dataKey="good" stroke="#34D399" fill="url(#g-good)"
                      name="Yaroqli" strokeWidth={2}
                      dot={{ r: 2.5, fill: '#34D399', strokeWidth: 0 }} activeDot={{ r: 4 }}>
                      <LabelList dataKey="good" position="top"
                        style={{ fontSize: 9, fill: '#6EE7B7', fontWeight: 600, fontFamily: MONO_FONT }}
                        formatter={(v) => v > 0 ? v.toLocaleString() : ''} />
                    </Area>
                    <Area type="monotone" dataKey="defects" stroke="#F43F5E" fill="none"
                      name="Nuqsonlar" strokeWidth={2} strokeDasharray="5 3"
                      dot={{ r: 2.5, fill: '#F43F5E', strokeWidth: 0 }} activeDot={{ r: 5 }}>
                      <LabelList dataKey="defects" position="bottom"
                        style={{ fontSize: 9, fill: '#FB7185', fontWeight: 600, fontFamily: MONO_FONT }}
                        formatter={(v) => v > 0 ? v.toLocaleString() : ''} />
                    </Area>
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ── Lines table + Top defects ── */}
      <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <ChartHeader
                title={`Liniyalar bo'yicha (${days} kun)`}
                right={
                  <ToggleButtonGroup
                    size="small" exclusive value={lineTab}
                    onChange={(_, v) => { if (v !== null) setLineTab(v); }}
                    sx={{ height: 28 }}
                  >
                    <ToggleButton value="pu" sx={{ px: 1.5, py: 0, fontSize: 12, fontWeight: 700 }}>PU</ToggleButton>
                    <ToggleButton value="tep" sx={{ px: 1.5, py: 0, fontSize: 12, fontWeight: 700 }}>TEP</ToggleButton>
                  </ToggleButtonGroup>
                }
              />
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Liniya</TableCell>
                      <TableCell align="right">Reja</TableCell>
                      <TableCell align="right">Fakt</TableCell>
                      {lineTab === 'pu' && <TableCell align="right">Yaroqli</TableCell>}
                      {lineTab === 'pu' && <TableCell align="right">Samaradorlik</TableCell>}
                      <TableCell>Bajarish %</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={lineTab === 'pu' ? 6 : 4} align="center" sx={{ py: 3 }}>
                          <Skeleton />
                        </TableCell>
                      </TableRow>
                    ) : filteredDeptComp.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={lineTab === 'pu' ? 6 : 4} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                          Ma'lumot yo'q
                        </TableCell>
                      </TableRow>
                    ) : filteredDeptComp.map((row) => (
                      <TableRow key={row.lineId} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>{row.lineName}</Typography>
                          <Typography variant="caption" color="text.secondary" fontFamily="monospace">{row.lineCode}</Typography>
                        </TableCell>
                        <TableCell align="right">{row.planned.toLocaleString()}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>{row.produced.toLocaleString()}</TableCell>
                        {lineTab === 'pu' && (
                          <TableCell align="right" sx={{ color: 'success.main' }}>{row.good.toLocaleString()}</TableCell>
                        )}
                        {lineTab === 'pu' && (
                          <TableCell align="right">
                            <Chip
                              label={`${row.efficiency}%`} size="small"
                              color={row.efficiency >= 90 ? 'success' : row.efficiency >= 70 ? 'warning' : 'error'}
                            />
                          </TableCell>
                        )}
                        <TableCell sx={{ minWidth: 160 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <LinearProgress
                              variant="determinate" value={Math.min(row.fulfillment, 100)}
                              color={FULFILLMENT_COLOR(row.fulfillment)}
                              sx={{ flexGrow: 1, height: 6, borderRadius: 3 }}
                            />
                            <Typography variant="caption" fontWeight={700} sx={{ minWidth: 42 }}>
                              {row.fulfillment}%
                            </Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Top nuqsonlar ({days} kun)</Typography>
              {loading ? (
                [...Array(4)].map((_, i) => <Skeleton key={i} height={48} sx={{ mb: 0.5 }} />)
              ) : topDefects.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                  <CheckCircle sx={{ fontSize: 40, color: 'success.light', mb: 1 }} />
                  <Typography variant="body2">Nuqson yo'q</Typography>
                </Box>
              ) : topDefects.map((d, i) => (
                <Box key={i} sx={{
                  display: 'flex', alignItems: 'center', gap: 1.5,
                  p: 1.2, mb: 0.5, bgcolor: 'rgba(148,163,184,0.05)', borderRadius: 1.5,
                  border: '1px solid rgba(148,163,184,0.12)',
                }}>
                  <Box sx={{
                    width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                    bgcolor: d.severity === 'CRITICAL' ? 'rgba(244,63,94,0.16)' : d.severity === 'MAJOR' ? 'rgba(245,158,11,0.16)' : 'rgba(59,130,246,0.16)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: 12, fontFamily: MONO_FONT,
                    color: d.severity === 'CRITICAL' ? '#FB7185' : d.severity === 'MAJOR' ? '#FBBF24' : '#60A5FA',
                  }}>
                    {i + 1}
                  </Box>
                  <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
                    <Typography variant="body2" fontWeight={600} noWrap>{d.type}</Typography>
                    <Typography variant="caption" color="text.secondary">{d.total} dona</Typography>
                  </Box>
                  <Chip
                    label={d.severity === 'CRITICAL' ? 'Kritik' : d.severity === 'MAJOR' ? 'Muhim' : 'Kichik'}
                    size="small"
                    color={d.severity === 'CRITICAL' ? 'error' : d.severity === 'MAJOR' ? 'warning' : 'default'}
                  />
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
