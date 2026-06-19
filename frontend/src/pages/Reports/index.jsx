import {
  Box, Typography, Grid, Card, CardContent,
  Button, Chip, ToggleButtonGroup, ToggleButton,
  FormControl, InputLabel, Select, MenuItem, Divider,
  IconButton, Skeleton, LinearProgress, Paper,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
} from '@mui/material';
import {
  FileDownload, DateRange,
  Factory, VerifiedUser, AccessTime,
  Inventory, People, Build,
  Close, Visibility, Assessment,
} from '@mui/icons-material';
import { useState, useEffect, useRef } from 'react';
import {
  BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { format } from 'date-fns';
import * as dashSvc from '../../services/dashboard.service';
import * as matSvc from '../../services/material.service';
import * as empSvc from '../../services/employee.service';
import * as eqSvc from '../../services/equipment.service';
import { CHART_COLORS } from '../../constants';

// ─── helpers ────────────────────────────────────────────────────────────────

const fmtD = (d, days) => {
  try { return days <= 1 ? format(new Date(d), 'HH:mm') : format(new Date(d), 'dd.MM'); }
  catch { return String(d); }
};

const StatBox = ({ label, value, unit, color = 'primary' }) => (
  <Box sx={{
    textAlign: 'center', p: 1.5, borderRadius: 2,
    bgcolor: `${color}.50`, border: '1px solid', borderColor: `${color}.100`,
    height: '100%', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
  }}>
    <Typography variant="h5" fontWeight={700} color={`${color}.main`} lineHeight={1.2}>
      {value !== null && value !== undefined && value !== '' ? value : '—'}
      {unit && value !== null && value !== undefined && value !== '' &&
        <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>{unit}</Typography>}
    </Typography>
    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>{label}</Typography>
  </Box>
);

const ChartCard = ({ title, height = 200, loading, children }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5 }}>{title}</Typography>
      {loading ? <Skeleton variant="rectangular" height={height} sx={{ borderRadius: 1 }} /> : children}
    </CardContent>
  </Card>
);

// ─── panel: PRODUCTION ───────────────────────────────────────────────────────

const ProductionPanel = ({ days }) => {
  const [pvf, setPvf] = useState([]);
  const [trend, setTrend] = useState([]);
  const [kpis, setKpis] = useState(null);
  const [depts, setDepts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      dashSvc.getPlanVsFact({ days }),
      dashSvc.getProductionTrend({ days }),
      dashSvc.getKPIs(),
      dashSvc.getDepartmentComparison({ days }),
    ])
      .then(([pvfR, trendR, kpisR, deptR]) => {
        setPvf(pvfR.data.data);
        setTrend(trendR.data.data);
        setKpis(kpisR.data.data);
        setDepts(deptR.data.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [days]);

  const pvfFmt = pvf.map((d) => ({ ...d, date: fmtD(d.date, days) }));
  const trendFmt = trend.map((d) => ({ ...d, date: fmtD(d.date, days) }));

  return (
    <Box>
      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        {[
          { label: "Bugungi ishlab chiqarish", value: kpis?.today?.produced?.toLocaleString(), unit: 'dona', color: 'primary' },
          { label: "Oylik ishlab chiqarish", value: kpis?.month?.produced?.toLocaleString(), unit: 'dona', color: 'info' },
          { label: "Bugungi samaradorlik", value: kpis?.today?.efficiency, unit: '%', color: 'success' },
          { label: "Oylik samaradorlik", value: kpis?.month?.efficiency, unit: '%', color: 'secondary' },
        ].map((s) => (
          <Grid item xs={6} sm={3} key={s.label}>
            {loading ? <Skeleton variant="rectangular" height={70} sx={{ borderRadius: 2 }} /> : <StatBox {...s} />}
          </Grid>
        ))}
      </Grid>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <ChartCard title="Reja vs Fakt" loading={loading}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={pvfFmt}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => v.toLocaleString()} />
                <Legend />
                <Bar dataKey="planned" name="Reja" fill="#90CAF9" radius={[3, 3, 0, 0]} />
                <Bar dataKey="produced" name="Fakt" fill="#1565C0" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </Grid>
        <Grid item xs={12} md={6}>
          <ChartCard title="Ishlab chiqarish trendi" loading={loading}>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={trendFmt}>
                <defs>
                  <linearGradient id="rg-prod" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1565C0" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#1565C0" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => v.toLocaleString()} />
                <Legend />
                <Area type="monotone" dataKey="produced" stroke="#1565C0" fill="url(#rg-prod)" name="Ishlab chiqarilgan" strokeWidth={2} />
                <Area type="monotone" dataKey="good" stroke="#2E7D32" fill="none" name="Yaroqli" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </Grid>
        {depts.length > 0 && (
          <Grid item xs={12}>
            <ChartCard title="Liniyalar bo'yicha ko'rsatkichlar" loading={loading}>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Liniya</TableCell>
                      <TableCell align="right">Reja</TableCell>
                      <TableCell align="right">Fakt</TableCell>
                      <TableCell align="right">Yaroqli</TableCell>
                      <TableCell align="right">Samaradorlik</TableCell>
                      <TableCell>Bajarish</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {depts.map((row) => (
                      <TableRow key={row.lineId} hover>
                        <TableCell><Typography variant="body2" fontWeight={600}>{row.lineName}</Typography></TableCell>
                        <TableCell align="right">{row.planned?.toLocaleString()}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>{row.produced?.toLocaleString()}</TableCell>
                        <TableCell align="right">{row.good?.toLocaleString()}</TableCell>
                        <TableCell align="right">{row.efficiency}%</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <LinearProgress
                              variant="determinate"
                              value={Math.min(row.fulfillment || 0, 100)}
                              color={row.fulfillment >= 100 ? 'success' : row.fulfillment >= 80 ? 'warning' : 'error'}
                              sx={{ flexGrow: 1, height: 6, borderRadius: 3 }}
                            />
                            <Typography variant="caption">{row.fulfillment}%</Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </ChartCard>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

// ─── panel: QUALITY ──────────────────────────────────────────────────────────

const QualityPanel = ({ days }) => {
  const [defects, setDefects] = useState([]);
  const [kpis, setKpis] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      dashSvc.getTopDefects({ days }),
      dashSvc.getKPIs(),
    ])
      .then(([defR, kpisR]) => {
        setDefects(defR.data.data);
        setKpis(kpisR.data.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [days]);

  const defChart = defects.map((d) => ({ name: d.defectType || d.name, count: d.count || d.total }));

  return (
    <Box>
      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        {[
          { label: "Bugungi yaroqli", value: kpis?.today?.good?.toLocaleString(), unit: 'dona', color: 'success' },
          { label: "Bugungi ishlab chiqarildi", value: kpis?.today?.produced?.toLocaleString(), unit: 'dona', color: 'primary' },
          { label: "Ochiq nuqsonlar", value: kpis?.openDefects, unit: 'ta', color: 'error' },
          { label: "Bugungi samaradorlik", value: kpis?.today?.efficiency, unit: '%', color: 'info' },
        ].map((s) => (
          <Grid item xs={6} sm={3} key={s.label}>
            {loading ? <Skeleton variant="rectangular" height={70} sx={{ borderRadius: 2 }} /> : <StatBox {...s} />}
          </Grid>
        ))}
      </Grid>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <ChartCard title="Eng ko'p uchraydigan nuqsonlar" loading={loading}>
            {defChart.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4, color: 'success.main' }}>
                <VerifiedUser sx={{ fontSize: 40, mb: 1 }} />
                <Typography>Nuqsonlar yo'q</Typography>
              </Box>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={defChart} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={130} />
                  <Tooltip />
                  <Bar dataKey="count" name="Soni" fill="#C62828" radius={[0, 3, 3, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </Grid>
      </Grid>
    </Box>
  );
};

// ─── panel: DOWNTIME ─────────────────────────────────────────────────────────

const DowntimePanel = ({ days }) => {
  const [byReason, setByReason] = useState([]);
  const [kpis, setKpis] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      dashSvc.getDowntimeByReason({ days }),
      dashSvc.getKPIs(),
    ])
      .then(([dtR, kpisR]) => {
        setByReason(dtR.data.data);
        setKpis(kpisR.data.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [days]);

  const pieData = byReason.map((d) => ({ name: d.reason, value: Math.round(d.totalMinutes) }));
  const totalMin = byReason.reduce((s, d) => s + (d.totalMinutes || 0), 0);
  const totalHr = (totalMin / 60).toFixed(1);

  return (
    <Box>
      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        {[
          { label: "Faol to'xtalishlar", value: kpis?.activeDowntimes, unit: 'ta', color: 'error' },
          { label: `Jami to'xtalish (${days} kun)`, value: Math.round(totalMin), unit: 'daqiqa', color: 'warning' },
          { label: "Soatda", value: totalHr, unit: 'soat', color: 'secondary' },
          { label: "Sabab turlari", value: byReason.length, unit: 'xil', color: 'info' },
        ].map((s) => (
          <Grid item xs={6} sm={3} key={s.label}>
            {loading ? <Skeleton variant="rectangular" height={70} sx={{ borderRadius: 2 }} /> : <StatBox {...s} />}
          </Grid>
        ))}
      </Grid>
      <Grid container spacing={2}>
        <Grid item xs={12} md={5}>
          <ChartCard title="Sabab bo'yicha taqsimot" loading={loading}>
            {pieData.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 5, color: 'success.main' }}>
                <AccessTime sx={{ fontSize: 40, mb: 1 }} />
                <Typography>To'xtalish yo'q</Typography>
              </Box>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={3} dataKey="value">
                    {pieData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => [`${v} daqiqa`, 'Davomiyligi']} />
                  <Legend formatter={(v) => <span style={{ fontSize: 11 }}>{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </Grid>
        <Grid item xs={12} md={7}>
          <ChartCard title="To'xtalish davomiyligi (daqiqa)" loading={loading}>
            {byReason.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 5, color: 'text.secondary' }}>
                <Typography>Ma'lumot yo'q</Typography>
              </Box>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={byReason} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="reason" tick={{ fontSize: 11 }} width={140} />
                  <Tooltip formatter={(v) => [`${Math.round(v)} daqiqa`]} />
                  <Bar dataKey="totalMinutes" name="Davomiyligi" fill="#E65100" radius={[0, 3, 3, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </Grid>
      </Grid>
    </Box>
  );
};

// ─── panel: MATERIAL ─────────────────────────────────────────────────────────

const MaterialPanel = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    matSvc.getMaterials({ limit: 100 })
      .then((r) => {
        const data = r.data.data;
        const list = Array.isArray(data) ? data : (data?.items || []);
        setItems(list);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const lowStock = items.filter((m) => m.minQuantity && m.quantity <= m.minQuantity);
  const totalValue = items.reduce((s, m) => s + (m.quantity || 0), 0);

  return (
    <Box>
      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        {[
          { label: "Jami materiallar", value: items.length, unit: 'ta', color: 'primary' },
          { label: "Kam qolgan", value: lowStock.length, unit: 'ta', color: lowStock.length > 0 ? 'error' : 'success' },
          { label: "Jami miqdor", value: totalValue.toLocaleString(), unit: '', color: 'info' },
          { label: "Kategoriyalar", value: [...new Set(items.map((m) => m.category).filter(Boolean))].length, unit: 'xil', color: 'secondary' },
        ].map((s) => (
          <Grid item xs={6} sm={3} key={s.label}>
            {loading ? <Skeleton variant="rectangular" height={70} sx={{ borderRadius: 2 }} /> : <StatBox {...s} />}
          </Grid>
        ))}
      </Grid>
      <Card>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5 }}>Zaxira holati</Typography>
          {loading ? <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 1 }} /> : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Nomi</TableCell>
                    <TableCell>Kategoriya</TableCell>
                    <TableCell align="right">Miqdor</TableCell>
                    <TableCell align="right">Min. miqdor</TableCell>
                    <TableCell align="center">Holat</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.length === 0 && (
                    <TableRow><TableCell colSpan={5} align="center" sx={{ py: 3, color: 'text.secondary' }}>Ma'lumot yo'q</TableCell></TableRow>
                  )}
                  {[...items].sort((a, b) => {
                    const aLow = a.minQuantity && a.quantity <= a.minQuantity;
                    const bLow = b.minQuantity && b.quantity <= b.minQuantity;
                    return bLow - aLow;
                  }).slice(0, 20).map((m) => {
                    const isLow = m.minQuantity && m.quantity <= m.minQuantity;
                    return (
                      <TableRow key={m.id} hover sx={isLow ? { bgcolor: 'error.50' } : {}}>
                        <TableCell><Typography variant="body2" fontWeight={600}>{m.name}</Typography></TableCell>
                        <TableCell><Typography variant="caption">{m.category || '—'}</Typography></TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600, color: isLow ? 'error.main' : 'inherit' }}>
                          {m.quantity?.toLocaleString()} {m.unit}
                        </TableCell>
                        <TableCell align="right" sx={{ color: 'text.secondary', fontSize: 12 }}>
                          {m.minQuantity ? `${m.minQuantity} ${m.unit}` : '—'}
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={isLow ? 'Kam' : 'Normal'}
                            color={isLow ? 'error' : 'success'}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

// ─── panel: EMPLOYEE ─────────────────────────────────────────────────────────

const EmployeePanel = () => {
  const [employees, setEmployees] = useState([]);
  const [depts, setDepts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([empSvc.getEmployees({ limit: 200 }), empSvc.getDepartments()])
      .then(([empR, deptR]) => {
        const empData = empR.data.data;
        setEmployees(Array.isArray(empData) ? empData : (empData?.items || []));
        setDepts(Array.isArray(deptR.data.data) ? deptR.data.data : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const active = employees.filter((e) => e.isActive !== false);
  const byDept = depts.map((d) => ({
    name: d.name,
    count: employees.filter((e) => e.departmentId === d.id || e.department?.id === d.id).length,
  })).filter((d) => d.count > 0);

  return (
    <Box>
      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        {[
          { label: "Jami xodimlar", value: employees.length, unit: 'kishi', color: 'primary' },
          { label: "Faol xodimlar", value: active.length, unit: 'kishi', color: 'success' },
          { label: "Bo'limlar", value: depts.length, unit: 'ta', color: 'info' },
          { label: "Lavozimlar", value: [...new Set(employees.map((e) => e.position).filter(Boolean))].length, unit: 'xil', color: 'secondary' },
        ].map((s) => (
          <Grid item xs={6} sm={3} key={s.label}>
            {loading ? <Skeleton variant="rectangular" height={70} sx={{ borderRadius: 2 }} /> : <StatBox {...s} />}
          </Grid>
        ))}
      </Grid>
      <Grid container spacing={2}>
        {byDept.length > 0 && (
          <Grid item xs={12} md={6}>
            <ChartCard title="Bo'lim bo'yicha xodimlar" loading={loading}>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={byDept}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" name="Xodimlar" fill="#6A1B9A" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </Grid>
        )}
        <Grid item xs={12} md={byDept.length > 0 ? 6 : 12}>
          <ChartCard title="Xodimlar ro'yxati" loading={loading}>
            <TableContainer sx={{ maxHeight: 240 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>F.I.O</TableCell>
                    <TableCell>Bo'lim</TableCell>
                    <TableCell>Lavozim</TableCell>
                    <TableCell align="center">Holat</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {employees.length === 0 && (
                    <TableRow><TableCell colSpan={4} align="center" sx={{ py: 3, color: 'text.secondary' }}>Ma'lumot yo'q</TableCell></TableRow>
                  )}
                  {employees.slice(0, 15).map((e) => (
                    <TableRow key={e.id} hover>
                      <TableCell><Typography variant="body2" fontWeight={500}>{e.lastName} {e.firstName}</Typography></TableCell>
                      <TableCell><Typography variant="caption">{e.department?.name || '—'}</Typography></TableCell>
                      <TableCell><Typography variant="caption">{e.position || '—'}</Typography></TableCell>
                      <TableCell align="center">
                        <Chip label={e.isActive !== false ? 'Faol' : 'Nofaol'} color={e.isActive !== false ? 'success' : 'default'} size="small" variant="outlined" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </ChartCard>
        </Grid>
      </Grid>
    </Box>
  );
};

// ─── panel: EQUIPMENT ────────────────────────────────────────────────────────

const STATUS_MAP = {
  ACTIVE: { label: 'Faol', color: 'success' },
  MAINTENANCE: { label: "Ta'mirlashda", color: 'warning' },
  BROKEN: { label: 'Buzilgan', color: 'error' },
  INACTIVE: { label: 'Nofaol', color: 'default' },
};

const EquipmentPanel = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    eqSvc.getEquipment({ limit: 200 })
      .then((r) => {
        const data = r.data.data;
        setItems(Array.isArray(data) ? data : (data?.items || []));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const byStat = Object.keys(STATUS_MAP).map((s) => ({
    name: STATUS_MAP[s].label,
    count: items.filter((e) => e.status === s).length,
    fill: s === 'ACTIVE' ? '#2E7D32' : s === 'MAINTENANCE' ? '#F57C00' : s === 'BROKEN' ? '#C62828' : '#9E9E9E',
  })).filter((s) => s.count > 0);

  const needMaint = items.filter((e) => e.status === 'MAINTENANCE' || e.status === 'BROKEN');

  return (
    <Box>
      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        {[
          { label: "Jami uskunalar", value: items.length, unit: 'ta', color: 'primary' },
          { label: "Faol", value: items.filter((e) => e.status === 'ACTIVE').length, unit: 'ta', color: 'success' },
          { label: "Ta'mirlashda", value: items.filter((e) => e.status === 'MAINTENANCE').length, unit: 'ta', color: 'warning' },
          { label: "Buzilgan", value: items.filter((e) => e.status === 'BROKEN').length, unit: 'ta', color: 'error' },
        ].map((s) => (
          <Grid item xs={6} sm={3} key={s.label}>
            {loading ? <Skeleton variant="rectangular" height={70} sx={{ borderRadius: 2 }} /> : <StatBox {...s} />}
          </Grid>
        ))}
      </Grid>
      <Grid container spacing={2}>
        {byStat.length > 0 && (
          <Grid item xs={12} md={4}>
            <ChartCard title="Holat bo'yicha taqsimot" loading={loading}>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={byStat} cx="50%" cy="50%" outerRadius={80} dataKey="count">
                    {byStat.map((s, i) => <Cell key={i} fill={s.fill} />)}
                  </Pie>
                  <Tooltip />
                  <Legend formatter={(v) => <span style={{ fontSize: 11 }}>{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          </Grid>
        )}
        <Grid item xs={12} md={byStat.length > 0 ? 8 : 12}>
          <ChartCard title="Uskunalar ro'yxati" loading={loading}>
            <TableContainer sx={{ maxHeight: 240 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Nomi</TableCell>
                    <TableCell>Kod</TableCell>
                    <TableCell>Turi</TableCell>
                    <TableCell align="center">Holat</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.length === 0 && (
                    <TableRow><TableCell colSpan={4} align="center" sx={{ py: 3, color: 'text.secondary' }}>Ma'lumot yo'q</TableCell></TableRow>
                  )}
                  {[...items].sort((a, b) => {
                    const order = { BROKEN: 0, MAINTENANCE: 1, ACTIVE: 2, INACTIVE: 3 };
                    return (order[a.status] ?? 9) - (order[b.status] ?? 9);
                  }).map((eq) => {
                    const s = STATUS_MAP[eq.status] || { label: eq.status, color: 'default' };
                    return (
                      <TableRow key={eq.id} hover>
                        <TableCell><Typography variant="body2" fontWeight={500}>{eq.name}</Typography></TableCell>
                        <TableCell><Typography variant="caption" fontFamily="monospace">{eq.code}</Typography></TableCell>
                        <TableCell><Typography variant="caption">{eq.type || eq.category || '—'}</Typography></TableCell>
                        <TableCell align="center">
                          <Chip label={s.label} color={s.color} size="small" variant="outlined" />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </ChartCard>
        </Grid>
      </Grid>
    </Box>
  );
};

// ─── panel: PERIOD (DAILY / WEEKLY / MONTHLY / SHIFT) ───────────────────────

const PERIOD_DAYS = { DAILY: 1, WEEKLY: 7, MONTHLY: 30, SHIFT: 1 };

const PeriodPanel = ({ reportKey, days }) => {
  const fixedDays = PERIOD_DAYS[reportKey] || days;
  const [pvf, setPvf] = useState([]);
  const [depts, setDepts] = useState([]);
  const [kpis, setKpis] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      dashSvc.getPlanVsFact({ days: fixedDays }),
      dashSvc.getDepartmentComparison({ days: fixedDays }),
      dashSvc.getKPIs(),
    ])
      .then(([pvfR, deptR, kpisR]) => {
        setPvf(pvfR.data.data);
        setDepts(deptR.data.data);
        setKpis(kpisR.data.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [fixedDays]);

  const pvfFmt = pvf.map((d) => ({ ...d, date: fmtD(d.date, fixedDays) }));

  return (
    <Box>
      <Chip label={`Davr: ${fixedDays} kun`} size="small" color="primary" variant="outlined" sx={{ mb: 2 }} />
      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        {[
          { label: "Ishlab chiqarildi", value: kpis?.today?.produced?.toLocaleString(), unit: 'dona', color: 'primary' },
          { label: "Yaroqli", value: kpis?.today?.good?.toLocaleString(), unit: 'dona', color: 'success' },
          { label: "Samaradorlik", value: kpis?.today?.efficiency, unit: '%', color: 'info' },
          { label: "Faol to'xtalishlar", value: kpis?.activeDowntimes, unit: 'ta', color: 'warning' },
        ].map((s) => (
          <Grid item xs={6} sm={3} key={s.label}>
            {loading ? <Skeleton variant="rectangular" height={70} sx={{ borderRadius: 2 }} /> : <StatBox {...s} />}
          </Grid>
        ))}
      </Grid>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <ChartCard title="Reja vs Fakt" loading={loading}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={pvfFmt}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => v.toLocaleString()} />
                <Legend />
                <Bar dataKey="planned" name="Reja" fill="#90CAF9" radius={[3, 3, 0, 0]} />
                <Bar dataKey="produced" name="Fakt" fill="#1565C0" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </Grid>
        {depts.length > 0 && (
          <Grid item xs={12} md={6}>
            <ChartCard title="Liniyalar bajarish foizi" loading={loading}>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={depts}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="lineName" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
                  <Tooltip formatter={(v) => `${v}%`} />
                  <Bar dataKey="fulfillment" name="Bajarish %" fill="#0097A7" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

// ─── panel dispatcher ────────────────────────────────────────────────────────

const DashboardPanel = ({ reportKey, days }) => {
  switch (reportKey) {
    case 'PRODUCTION': return <ProductionPanel days={days} />;
    case 'QUALITY':    return <QualityPanel days={days} />;
    case 'DOWNTIME':   return <DowntimePanel days={days} />;
    case 'MATERIAL':   return <MaterialPanel />;
    case 'EMPLOYEE':   return <EmployeePanel />;
    case 'EQUIPMENT':  return <EquipmentPanel />;
    default:           return <PeriodPanel reportKey={reportKey} days={days} />;
  }
};

// ─── period to days ──────────────────────────────────────────────────────────

const PERIOD_OPTIONS = [
  { label: 'Bugun', value: 'today' },
  { label: 'Bu hafta', value: 'week' },
  { label: 'Bu oy', value: 'month' },
  { label: 'Maxsus', value: 'custom' },
];

const PERIOD_DAYS_MAP = { today: 1, week: 7, month: 30, custom: 30 };

// ─── ReportCard ──────────────────────────────────────────────────────────────

const REPORT_DEFS = [
  { key: 'PRODUCTION', label: 'Ishlab chiqarish', icon: <Factory />, color: 'primary', hasPuTep: true },
  { key: 'QUALITY', label: 'Sifat nazorati', icon: <VerifiedUser />, color: 'success', hasPuTep: true },
  { key: 'DOWNTIME', label: "To'xtalishlar", icon: <AccessTime />, color: 'error', hasPuTep: false },
  { key: 'MATERIAL', label: 'Xomashyo', icon: <Inventory />, color: 'warning', hasPuTep: false },
  { key: 'EMPLOYEE', label: 'Xodimlar', icon: <People />, color: 'secondary', hasPuTep: false },
  { key: 'EQUIPMENT', label: 'Uskunalar', icon: <Build />, color: 'info', hasPuTep: false },
  { key: 'DAILY', label: 'Kunlik hisobot', icon: <DateRange />, color: 'primary', hasPuTep: true },
  { key: 'WEEKLY', label: 'Haftalik hisobot', icon: <DateRange />, color: 'secondary', hasPuTep: true },
  { key: 'MONTHLY', label: 'Oylik hisobot', icon: <DateRange />, color: 'info', hasPuTep: true },
  { key: 'SHIFT', label: 'Smena hisoboti', icon: <Factory />, color: 'warning', hasPuTep: true },
];

const ReportCard = ({ def, selected, onSelect }) => {
  const [category, setCategory] = useState('PU');
  const [period, setPeriod] = useState('month');

  const handleGenerate = (fmt) => {
    // TODO: implement export with period + category + format
  };

  return (
    <Card
      sx={{
        height: '100%', display: 'flex', flexDirection: 'column',
        borderTop: '3px solid',
        borderTopColor: selected ? `${def.color}.main` : 'transparent',
        boxShadow: selected ? 3 : 1,
        transition: 'all 0.18s ease',
        '&:hover': { boxShadow: 4, borderTopColor: `${def.color}.light` },
      }}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
          <Box sx={{
            width: 44, height: 44, borderRadius: 2,
            background: selected
              ? `linear-gradient(135deg, var(--mui-palette-${def.color}-dark, #1565C0), var(--mui-palette-${def.color}-main, #1976D2))`
              : `${def.color}.main`,
            bgcolor: `${def.color}.main`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', flexShrink: 0,
            boxShadow: selected ? 2 : 0,
          }}>
            {def.icon}
          </Box>
          <Box>
            <Typography variant="body1" fontWeight={700} lineHeight={1.2}>{def.label}</Typography>
            {selected && <Typography variant="caption" color={`${def.color}.main`} fontWeight={600}>Ko'rinmoqda</Typography>}
          </Box>
        </Box>

        {def.hasPuTep && (
          <Box sx={{ mb: 1.5 }}>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>Bo'lim</Typography>
            <ToggleButtonGroup size="small" exclusive value={category} onChange={(_, v) => v && setCategory(v)} fullWidth>
              <ToggleButton value="PU" sx={{ fontSize: 12, py: 0.4 }}>PU (Haqiqiy)</ToggleButton>
              <ToggleButton value="TEP" sx={{ fontSize: 12, py: 0.4 }}>TEP (Reja)</ToggleButton>
            </ToggleButtonGroup>
          </Box>
        )}

        <FormControl size="small" fullWidth>
          <InputLabel>Davr</InputLabel>
          <Select value={period} label="Davr" onChange={(e) => setPeriod(e.target.value)}>
            {PERIOD_OPTIONS.map((o) => (
              <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </CardContent>

      <Divider />
      <Box sx={{ p: 1.5, display: 'flex', gap: 1 }}>
        <Button
          size="small"
          variant={selected ? 'contained' : 'outlined'}
          color={def.color}
          startIcon={<Visibility fontSize="small" />}
          onClick={() => onSelect(def.key, PERIOD_DAYS_MAP[period])}
          fullWidth
        >
          Ko'rish
        </Button>
        <Button size="small" variant="outlined" startIcon={<FileDownload fontSize="small" />} onClick={() => handleGenerate('excel')}>
          Excel
        </Button>
        <Button size="small" variant="outlined" color="error" startIcon={<FileDownload fontSize="small" />} onClick={() => handleGenerate('pdf')}>
          PDF
        </Button>
      </Box>
    </Card>
  );
};

// ─── main page ───────────────────────────────────────────────────────────────

const Reports = () => {
  const [selected, setSelected] = useState(null);
  const panelRef = useRef(null);

  const handleSelect = (key, days) => {
    setSelected((prev) => (prev?.key === key ? null : { key, days }));
  };

  // Scroll dashboard panel into view when a card is opened
  useEffect(() => {
    if (selected && panelRef.current) {
      setTimeout(() => panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
    }
  }, [selected?.key]);

  const selectedDef = selected ? REPORT_DEFS.find((d) => d.key === selected.key) : null;

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
        <Box sx={{ width: 42, height: 42, borderRadius: 2, bgcolor: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}>
          <Assessment />
        </Box>
        <Box>
          <Typography variant="h4">Hisobotlar markazi</Typography>
          <Typography variant="body2" color="text.secondary">
            Ko'rish tugmasini bosib tegishli dashboard — Excel/PDF eksport
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={2.5}>
        {REPORT_DEFS.map((def) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={def.key}>
            <ReportCard
              def={def}
              selected={selected?.key === def.key}
              onSelect={handleSelect}
            />
          </Grid>
        ))}
      </Grid>

      {/* Dashboard panel */}
      {selected && selectedDef && (
        <Paper
          ref={panelRef}
          elevation={0}
          sx={{
            mt: 3, p: 3,
            border: '1px solid', borderColor: `${selectedDef.color}.200`,
            borderTop: '3px solid', borderTopColor: `${selectedDef.color}.main`,
            borderRadius: 2, bgcolor: 'background.default',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{
                width: 40, height: 40, borderRadius: 2,
                bgcolor: `${selectedDef.color}.main`, display: 'flex',
                alignItems: 'center', justifyContent: 'center', color: '#fff',
                boxShadow: 2,
              }}>
                {selectedDef.icon}
              </Box>
              <Box>
                <Typography variant="h6" fontWeight={700}>{selectedDef.label}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {selected.days === 1 ? 'Bugungi' : selected.days === 7 ? 'Haftalik' : selected.days === 30 ? 'Oylik' : `${selected.days} kunlik`} ko'rsatkichlar
                </Typography>
              </Box>
            </Box>
            <IconButton size="small" onClick={() => setSelected(null)} sx={{ color: 'text.secondary' }}>
              <Close fontSize="small" />
            </IconButton>
          </Box>

          <DashboardPanel key={selected.key} reportKey={selected.key} days={selected.days} />
        </Paper>
      )}
    </Box>
  );
};

export default Reports;
