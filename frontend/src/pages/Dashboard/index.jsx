import {
  Grid, Typography, Box, Chip, Card, CardContent,
  FormControl, InputLabel, Select, MenuItem, ToggleButtonGroup, ToggleButton,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  LinearProgress, Skeleton,
} from '@mui/material';
import {
  Factory, VerifiedUser, AccessTime, Warning,
  TrendingUp, CheckCircle, TrendingDown, TrendingFlat, People, Speed,
} from '@mui/icons-material';
import { useState, useEffect } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RTooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell,
} from 'recharts';
import { format } from 'date-fns';
import { useSnackbar } from 'notistack';
import * as svc from '../../services/dashboard.service';
import { CHART_COLORS } from '../../constants';

const KPI = ({ title, value, unit, icon, color = 'primary', loading, trend, trendVal }) => {
  const Icon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : TrendingFlat;
  const tc = trend === 'up' ? 'success.main' : trend === 'down' ? 'error.main' : 'text.secondary';
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1.5 }}>
          <Typography variant="body2" color="text.secondary" fontWeight={500}>{title}</Typography>
          <Box sx={{
            width: 38, height: 38, borderRadius: 1.5,
            bgcolor: `${color}.main`, opacity: 0.12,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Box sx={{ color: `${color}.main`, opacity: 10, display: 'flex' }}>{icon}</Box>
          </Box>
        </Box>
        {loading ? <Skeleton width={90} height={38} /> : (
          <Typography variant="h4" fontWeight={700}>
            {value !== null && value !== undefined ? Number(value).toLocaleString() : '—'}
            {unit && <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>{unit}</Typography>}
          </Typography>
        )}
        {trendVal !== undefined && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
            <Icon sx={{ fontSize: 15, color: tc }} />
            <Typography variant="caption" sx={{ color: tc, fontWeight: 600 }}>{trendVal > 0 ? '+' : ''}{trendVal}%</Typography>
            <Typography variant="caption" color="text.secondary">kechagiga nisbatan</Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

const PERIOD_OPTIONS = [
  { label: 'Bugun', value: 1 },
  { label: 'Hafta', value: 7 },
  { label: 'Oy', value: 30 },
];

const FULFILLMENT_COLOR = (v) => {
  if (v >= 100) return 'success';
  if (v >= 80) return 'warning';
  return 'error';
};

const fmtDate = (d, days) => {
  try {
    return days <= 1 ? format(new Date(d), 'HH:mm') : format(new Date(d), 'dd MMM');
  } catch { return d; }
};

const ChartPeriodHeader = ({ title, period, onChange }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
    <Typography variant="h6">{title}</Typography>
    <ToggleButtonGroup size="small" exclusive value={period} onChange={(_, v) => v && onChange(v)}>
      {PERIOD_OPTIONS.map((o) => (
        <ToggleButton key={o.value} value={o.value} sx={{ px: 1.5, py: 0.3, fontSize: 12 }}>
          {o.label}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  </Box>
);

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

  // Independent period selectors for PU and TEP charts
  const [puPeriod, setPuPeriod] = useState(7);
  const [tepPeriod, setTepPeriod] = useState(7);
  const [puData, setPuData] = useState([]);
  const [tepData, setTepData] = useState([]);
  const [puLoading, setPuLoading] = useState(false);
  const [tepLoading, setTepLoading] = useState(false);

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

  const loadPuChart = async (d = puPeriod) => {
    setPuLoading(true);
    try {
      const r = await svc.getPlanVsFact({ days: d, type: 'PU' });
      setPuData(r.data.data);
    } catch {} finally { setPuLoading(false); }
  };

  const loadTepChart = async (d = tepPeriod) => {
    setTepLoading(true);
    try {
      const r = await svc.getPlanVsFact({ days: d, type: 'TEP' });
      setTepData(r.data.data);
    } catch {} finally { setTepLoading(false); }
  };

  useEffect(() => { loadMain(days); }, [days]);
  useEffect(() => { loadPuChart(puPeriod); }, [puPeriod]);
  useEffect(() => { loadTepChart(tepPeriod); }, [tepPeriod]);

  const trendFormatted = trend.map((d) => ({ ...d, date: fmtDate(d.date, days) }));
  const puFormatted = puData.map((d) => ({ ...d, date: fmtDate(d.date, puPeriod) }));
  const tepFormatted = tepData.map((d) => ({ ...d, date: fmtDate(d.date, tepPeriod) }));
  const pieData = downtime.map((d) => ({ name: d.reason, value: Math.round(d.totalMinutes) }));

  // OEE = Availability × Performance × Quality (shown as %)
  const oeeValue = kpis?.today?.oee ?? null;

  return (
    <Box>
      {/* Header */}
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

      {/* KPI Cards: Ishlab chiqarish, Sifat, OEE, To'xtalishlar, Xodimlar */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={4} md={2.4}>
          <KPI
            title="Ishlab chiqarish"
            value={kpis?.today?.produced}
            unit="dona"
            icon={<Factory fontSize="small" />}
            color="primary"
            loading={loading}
          />
        </Grid>
        <Grid item xs={6} sm={4} md={2.4}>
          <KPI
            title="Sifat (yaroqli)"
            value={kpis?.today?.good}
            unit="dona"
            icon={<VerifiedUser fontSize="small" />}
            color="success"
            loading={loading}
          />
        </Grid>
        <Grid item xs={6} sm={4} md={2.4}>
          <KPI
            title="OEE"
            value={oeeValue}
            unit="%"
            icon={<Speed fontSize="small" />}
            color="info"
            loading={loading}
          />
        </Grid>
        <Grid item xs={6} sm={4} md={2.4}>
          <KPI
            title="To'xtalishlar (faol)"
            value={kpis?.activeDowntimes}
            unit="ta"
            icon={<AccessTime fontSize="small" />}
            color="warning"
            loading={loading}
          />
        </Grid>
        <Grid item xs={6} sm={4} md={2.4}>
          <KPI
            title="Xodimlar"
            value={kpis?.employees}
            unit="kishi"
            icon={<People fontSize="small" />}
            color="secondary"
            loading={loading}
          />
        </Grid>
      </Grid>

      {/* Secondary KPIs: monthly + defects */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <KPI title="Oylik ishlab chiqarish" value={kpis?.month?.produced} unit="dona" icon={<Factory fontSize="small" />} color="primary" loading={loading} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <KPI title="Oylik samaradorlik" value={kpis?.month?.efficiency} unit="%" icon={<TrendingUp fontSize="small" />} color="secondary" loading={loading} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <KPI title="Ochiq nuqsonlar" value={kpis?.openDefects} unit="ta" icon={<Warning fontSize="small" />} color="error" loading={loading} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <KPI title="Bugungi samaradorlik" value={kpis?.today?.efficiency} unit="%" icon={<CheckCircle fontSize="small" />} color="success" loading={loading} />
        </Grid>
      </Grid>

      {/* PU Chart (Haqiqiy natijalar) */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <ChartPeriodHeader
                title="PU — Reja ko'rsatkichlari"
                period={puPeriod}
                onChange={setPuPeriod}
              />
              {puLoading ? <Skeleton variant="rectangular" height={220} /> : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={puFormatted} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <RTooltip formatter={(v) => v.toLocaleString()} />
                    <Legend />
                    <Bar dataKey="planned" name="Reja" fill="#90CAF9" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="produced" name="Fakt" fill="#1565C0" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* TEP Chart (Reja ko'rsatkichlari) */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <ChartPeriodHeader
                title="TEP — Reja ko'rsatkichlari"
                period={tepPeriod}
                onChange={setTepPeriod}
              />
              {tepLoading ? <Skeleton variant="rectangular" height={220} /> : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={tepFormatted} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <RTooltip formatter={(v) => v.toLocaleString()} />
                    <Legend />
                    <Bar dataKey="planned" name="Reja" fill="#7B1FA2" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="produced" name="Fakt" fill="#CE93D8" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Downtime pie + Trend */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>To'xtalish sabablari ({days} kun)</Typography>
              {loading ? <Skeleton variant="rectangular" height={220} /> : pieData.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
                  <CheckCircle sx={{ fontSize: 40, color: 'success.light', mb: 1 }} />
                  <Typography>To'xtalish yo'q</Typography>
                </Box>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={80} paddingAngle={3} dataKey="value">
                      {pieData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Pie>
                    <RTooltip formatter={(v) => [`${v} daqiqa`, 'Davomiyligi']} />
                    <Legend formatter={(v) => <span style={{ fontSize: 11 }}>{v}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Ishlab chiqarish trendi ({days} kun)</Typography>
              {loading ? <Skeleton variant="rectangular" height={220} /> : (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={trendFormatted} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <defs>
                      <linearGradient id="grad-prod" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1565C0" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#1565C0" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="grad-good" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2E7D32" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#2E7D32" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <RTooltip formatter={(v) => v.toLocaleString()} />
                    <Legend />
                    <Area type="monotone" dataKey="produced" stroke="#1565C0" fill="url(#grad-prod)" name="Ishlab chiqarilgan" strokeWidth={2} />
                    <Area type="monotone" dataKey="good" stroke="#2E7D32" fill="url(#grad-good)" name="Yaroqli" strokeWidth={2} />
                    <Area type="monotone" dataKey="defects" stroke="#C62828" fill="none" name="Nuqsonlar" strokeWidth={2} strokeDasharray="4 2" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Department comparison + Top defects */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">Liniyalar bo'yicha ({days} kun)</Typography>
                <ToggleButtonGroup
                  size="small" exclusive value={lineTab}
                  onChange={(_, v) => { if (v !== null) setLineTab(v); }}
                  sx={{ height: 28 }}
                >
                  <ToggleButton value="pu" sx={{ px: 1.5, py: 0, fontSize: 12, fontWeight: 700 }}>PU</ToggleButton>
                  <ToggleButton value="tep" sx={{ px: 1.5, py: 0, fontSize: 12, fontWeight: 700 }}>TEP</ToggleButton>
                </ToggleButtonGroup>
              </Box>
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
                      <TableRow><TableCell colSpan={lineTab === 'pu' ? 6 : 4} align="center" sx={{ py: 3 }}><Skeleton /></TableCell></TableRow>
                    ) : deptComp.length === 0 ? (
                      <TableRow><TableCell colSpan={lineTab === 'pu' ? 6 : 4} align="center" sx={{ py: 3, color: 'text.secondary' }}>Ma'lumot yo'q</TableCell></TableRow>
                    ) : deptComp.map((row) => (
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
                              label={`${row.efficiency}%`}
                              size="small"
                              color={row.efficiency >= 90 ? 'success' : row.efficiency >= 70 ? 'warning' : 'error'}
                            />
                          </TableCell>
                        )}
                        <TableCell sx={{ minWidth: 160 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <LinearProgress
                              variant="determinate"
                              value={Math.min(row.fulfillment, 100)}
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
                [...Array(5)].map((_, i) => <Skeleton key={i} height={48} sx={{ mb: 1 }} />)
              ) : topDefects.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                  <CheckCircle sx={{ fontSize: 40, color: 'success.light', mb: 1 }} />
                  <Typography>Nuqson yo'q</Typography>
                </Box>
              ) : topDefects.map((d, i) => (
                <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.2, mb: 0.5, bgcolor: 'grey.50', borderRadius: 1.5 }}>
                  <Box sx={{
                    width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                    bgcolor: d.severity === 'CRITICAL' ? 'error.light' : d.severity === 'MAJOR' ? 'warning.light' : 'info.light',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: 13,
                    color: d.severity === 'CRITICAL' ? 'error.dark' : d.severity === 'MAJOR' ? 'warning.dark' : 'info.dark',
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
