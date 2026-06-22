import {
  Grid, Typography, Box, Chip, Card, CardContent,
  FormControl, InputLabel, Select, MenuItem, ToggleButtonGroup, ToggleButton,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  LinearProgress, Skeleton,
} from '@mui/material';
import {
  Factory, VerifiedUser, AccessTime, ReportProblem,
  CheckCircle, People, Speed, Inventory, Percent,
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

// ── Color tokens for KPI cards ───────────────────────────────────────────────
const C = {
  blue:   { accent: '#2563EB', bg: '#EFF6FF' },
  green:  { accent: '#16A34A', bg: '#F0FDF4' },
  orange: { accent: '#E65100', bg: '#FFF3E0' },
  red:    { accent: '#DC2626', bg: '#FEF2F2' },
  teal:   { accent: '#0097A7', bg: '#E0F7FA' },
  indigo: { accent: '#3949AB', bg: '#EEF2FF' },
  purple: { accent: '#7B1FA2', bg: '#F5F3FF' },
};

// ── KPI card ─────────────────────────────────────────────────────────────────
const KPI = ({ title, value, unit, icon, c = C.blue, loading }) => (
  <Card sx={{
    height: '100%', borderLeft: `3px solid ${c.accent}`,
    transition: 'box-shadow 0.2s ease, transform 0.15s ease',
    '&:hover': { boxShadow: 6, transform: 'translateY(-1px)' },
  }}>
    <CardContent sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1.5 }}>
        <Typography sx={{
          fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.055em',
          fontSize: '0.67rem', color: 'text.secondary', lineHeight: 1.4, pr: 0.5,
        }}>
          {title}
        </Typography>
        <Box sx={{
          width: 40, height: 40, borderRadius: 2.5, flexShrink: 0,
          background: `linear-gradient(135deg, ${c.bg} 0%, ${c.bg}bb 100%)`,
          border: `1px solid ${c.accent}28`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.accent,
        }}>
          {icon}
        </Box>
      </Box>
      {loading ? <Skeleton width={88} height={38} /> : (
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
          <Typography sx={{
            fontSize: '1.65rem', fontWeight: 700, color: '#0F172A',
            lineHeight: 1, fontVariantNumeric: 'tabular-nums',
          }}>
            {value !== null && value !== undefined ? Number(value).toLocaleString() : '0'}
          </Typography>
          {unit && (
            <Typography variant="body2" color="text.secondary" fontWeight={400}>{unit}</Typography>
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
      bgcolor: '#0D1B2A', color: '#E0E8F0', p: '10px 14px', borderRadius: '8px',
      boxShadow: '0 12px 32px rgba(0,0,0,0.45)', border: '1px solid rgba(255,255,255,0.07)',
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
const axTick = { fontSize: 10, fill: '#64748B' };
const gridStyle = { stroke: '#E2E8F0' };

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
      const r = await svc.getDepartmentComparison({ days: d });
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

      {/* ── Row 1: Primary KPIs (today) ── */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={6} sm={4} md={2.4}>
          <KPI title="Bugungi chiqarish" value={kpis?.today?.produced} unit="dona"
            icon={<Factory fontSize="small" />} c={C.blue} loading={loading} />
        </Grid>
        <Grid item xs={6} sm={4} md={2.4}>
          <KPI title="Yaroqli mahsulot" value={kpis?.today?.good} unit="dona"
            icon={<VerifiedUser fontSize="small" />} c={C.green} loading={loading} />
        </Grid>
        <Grid item xs={6} sm={4} md={2.4}>
          <KPI title="OEE" value={kpis?.today?.oee} unit="%"
            icon={<Speed fontSize="small" />} c={C.indigo} loading={loading} />
        </Grid>
        <Grid item xs={6} sm={4} md={2.4}>
          <KPI title="To'xtalishlar (faol)" value={kpis?.activeDowntimes} unit="ta"
            icon={<AccessTime fontSize="small" />} c={C.orange} loading={loading} />
        </Grid>
        <Grid item xs={6} sm={4} md={2.4}>
          <KPI title="Xodimlar" value={kpis?.employees} unit="kishi"
            icon={<People fontSize="small" />} c={C.teal} loading={loading} />
        </Grid>
      </Grid>

      {/* ── Row 2: Monthly KPIs ── */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <KPI title="Oylik ishlab chiqarish" value={kpis?.month?.produced} unit="dona"
            icon={<Inventory fontSize="small" />} c={C.blue} loading={loading} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <KPI title="Oylik samaradorlik" value={kpis?.month?.efficiency} unit="%"
            icon={<Percent fontSize="small" />} c={C.teal} loading={loading} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <KPI title="Ochiq nuqsonlar" value={kpis?.openDefects} unit="ta"
            icon={<ReportProblem fontSize="small" />} c={C.red} loading={loading} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <KPI title="Bugungi samaradorlik" value={kpis?.today?.efficiency} unit="%"
            icon={<CheckCircle fontSize="small" />} c={C.green} loading={loading} />
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
                    <Bar dataKey="planned" name="Reja" fill="#2563EB" radius={[4, 4, 0, 0]} maxBarSize={56}>
                      <LabelList dataKey="planned" position="top"
                        style={{ fontSize: 10, fontWeight: 700, fill: '#1D4ED8' }}
                        formatter={(v) => v > 0 ? v.toLocaleString() : ''} />
                    </Bar>
                    <Bar dataKey="produced" name="Fakt" fill="#93C5FD" radius={[4, 4, 0, 0]} maxBarSize={56}>
                      <LabelList dataKey="produced" position="top"
                        style={{ fontSize: 10, fontWeight: 700, fill: '#2563EB' }}
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
                      paddingAngle={3} dataKey="value" strokeWidth={0}>
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
                        <stop offset="5%" stopColor="#2563EB" stopOpacity={0.14} />
                        <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="g-good" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#16A34A" stopOpacity={0.14} />
                        <stop offset="95%" stopColor="#16A34A" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" {...gridStyle} vertical={false} />
                    <XAxis dataKey="date" tick={axTick} axisLine={false} tickLine={false} />
                    <YAxis tick={axTick} axisLine={false} tickLine={false} width={36} />
                    <RTooltip content={<ChartTooltip />} />
                    <Legend iconSize={10} formatter={(v) => <span style={{ fontSize: 11 }}>{v}</span>} />
                    <Area type="monotone" dataKey="produced" stroke="#2563EB" fill="url(#g-prod)"
                      name="Ishlab chiqarilgan" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />
                    <Area type="monotone" dataKey="good" stroke="#16A34A" fill="url(#g-good)"
                      name="Yaroqli" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                    <Area type="monotone" dataKey="defects" stroke="#EF4444" fill="none"
                      name="Nuqsonlar" strokeWidth={2} strokeDasharray="5 3"
                      dot={{ r: 2.5, fill: '#EF4444', strokeWidth: 0 }} activeDot={{ r: 5 }} />
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
                  p: 1.2, mb: 0.5, bgcolor: '#F8FAFC', borderRadius: 1.5,
                  border: '1px solid #E2E8F0',
                }}>
                  <Box sx={{
                    width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                    bgcolor: d.severity === 'CRITICAL' ? '#FEF2F2' : d.severity === 'MAJOR' ? '#FFF3E0' : '#EFF6FF',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: 12,
                    color: d.severity === 'CRITICAL' ? '#DC2626' : d.severity === 'MAJOR' ? '#E65100' : '#2563EB',
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
