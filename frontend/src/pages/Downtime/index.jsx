import {
  Box, Typography, Card, CardContent, Button, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, TablePagination, CircularProgress, TextField,
  Dialog, DialogTitle, DialogContent, DialogActions,
  FormControl, InputLabel, Select, MenuItem, Grid,
  IconButton, Tooltip, Alert,
} from '@mui/material';
import { Add, Refresh, CheckCircle, AccessTime, Timer } from '@mui/icons-material';
import UzDatePicker from '../../components/UzDatePicker';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useSnackbar } from 'notistack';
import {
  PieChart, Pie, Cell, Tooltip as RTooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
} from 'recharts';
import * as svc from '../../services/downtime.service';
import * as pSvc from '../../services/production.service';
import { DOWNTIME_STATUS, CHART_COLORS } from '../../constants';
import { format } from 'date-fns';
import usePermission from '../../hooks/usePermission';

const EMPTY_FORM = { productionLineId: '', reasonId: '', shiftId: '', startTime: '', description: '' };

const fmtDuration = (minutes) => {
  if (!minutes && minutes !== 0) return '—';
  const m = Math.max(0, Math.round(minutes));
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return h > 0 ? `${h}s ${rem}d` : `${rem}d`;
};

const getDuration = (row, now) => {
  if (row.status === 'ACTIVE') {
    return (now - new Date(row.startTime).getTime()) / 60000;
  }
  return row.durationMinutes;
};

const Downtime = () => {
  const { enqueueSnackbar } = useSnackbar();
  const { can } = usePermission();

  const [downtimes, setDowntimes] = useState([]);
  const [reasons, setReasons] = useState([]);
  const [lines, setLines] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [now, setNow] = useState(Date.now());

  const [filters, setFilters] = useState({ status: '', lineId: '', reasonId: '', dateFrom: '', dateTo: '' });

  const [createDialog, setCreateDialog] = useState(false);
  const [resolveDialog, setResolveDialog] = useState({ open: false, item: null, endTime: '' });
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // Update "now" every 30s so active duration auto-refreshes
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);

  const loadLookups = useCallback(async () => {
    try {
      const [rR, lR, sR] = await Promise.all([svc.getReasons(), pSvc.getLines(), pSvc.getShifts()]);
      setReasons(rR.data.data);
      setLines(lR.data.data);
      setShifts(sR.data.data);
    } catch {}
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: page + 1, limit: 15 };
      if (filters.status) params.status = filters.status;
      if (filters.lineId) params.lineId = filters.lineId;
      if (filters.reasonId) params.reasonId = filters.reasonId;
      if (filters.dateFrom) params.dateFrom = filters.dateFrom;
      if (filters.dateTo) params.dateTo = filters.dateTo;
      const r = await svc.getDowntimes(params);
      setDowntimes(r.data.data);
      setTotal(r.data.pagination.total);
      setNow(Date.now());
    } catch { enqueueSnackbar('Xatolik', { variant: 'error' }); }
    finally { setLoading(false); }
  }, [page, filters]);

  useEffect(() => { loadLookups(); }, []);
  useEffect(() => { load(); }, [page, filters]);

  const setFilter = (key) => (e) => { setFilters((f) => ({ ...f, [key]: e.target.value })); setPage(0); };

  const handleCreate = async () => {
    setSaving(true);
    try {
      await svc.createDowntime({
        ...form,
        startTime: form.startTime ? new Date(form.startTime).toISOString() : new Date().toISOString(),
      });
      enqueueSnackbar("To'xtalish qayd etildi", { variant: 'success' });
      setCreateDialog(false);
      setForm(EMPTY_FORM);
      await load();
    } catch (err) { enqueueSnackbar(err.response?.data?.message || 'Xatolik', { variant: 'error' }); }
    finally { setSaving(false); }
  };

  const handleResolve = async () => {
    setSaving(true);
    try {
      await svc.resolveDowntime(resolveDialog.item.id, resolveDialog.endTime || undefined);
      enqueueSnackbar("To'xtalish yopildi", { variant: 'success' });
      setResolveDialog({ open: false, item: null, endTime: '' });
      load();
    } catch (err) { enqueueSnackbar(err.response?.data?.message || 'Xatolik', { variant: 'error' }); }
    finally { setSaving(false); }
  };

  const Ff = (key) => ({ value: form[key], onChange: (e) => setForm((f) => ({ ...f, [key]: e.target.value })) });

  const byReason = reasons.map((r) => ({
    name: r.name,
    minutes: downtimes
      .filter((d) => d.reasonId === r.id)
      .reduce((a, d) => a + getDuration(d, now), 0),
  })).filter((d) => d.minutes > 0);

  const activeCount = downtimes.filter((d) => d.status === 'ACTIVE').length;
  const totalMinutes = downtimes.reduce((a, d) => a + getDuration(d, now), 0);

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <AccessTime sx={{ fontSize: 30, color: 'warning.main' }} />
          <Box>
            <Typography variant="h4">To'xtalishlar</Typography>
            <Typography variant="body2" color="text.secondary">Ishlab chiqarish to'xtalishi qayd etish</Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button startIcon={<Refresh />} onClick={load}>Yangilash</Button>
          {can('downtime:create') && (
            <Button variant="contained" color="warning" startIcon={<Add />} onClick={() => { setForm(EMPTY_FORM); setCreateDialog(true); }}>
              To'xtalish qo'shish
            </Button>
          )}
        </Box>
      </Box>

      {activeCount > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Hozir <strong>{activeCount}</strong> ta faol toshlanish mavjud — davomiyligi real vaqtda yangilanmoqda
        </Alert>
      )}

      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <Chip icon={<Timer fontSize="small" />} label={`Jami: ${fmtDuration(totalMinutes)}`} />
        <Chip label={`${total} ta yozuv`} variant="outlined" />
        {activeCount > 0 && <Chip label={`${activeCount} faol`} color="warning" size="small" />}
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
          <Grid container spacing={1.5}>
            <Grid item xs={6} sm={3} md={2}>
              <FormControl size="small" fullWidth>
                <InputLabel>Status</InputLabel>
                <Select value={filters.status} label="Status" onChange={setFilter('status')}>
                  <MenuItem value="">Barchasi</MenuItem>
                  <MenuItem value="ACTIVE">Faol</MenuItem>
                  <MenuItem value="RESOLVED">Yopildi</MenuItem>
                  <MenuItem value="CANCELLED">Bekor</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} sm={3} md={2}>
              <FormControl size="small" fullWidth>
                <InputLabel>Liniya</InputLabel>
                <Select value={filters.lineId} label="Liniya" onChange={setFilter('lineId')}>
                  <MenuItem value="">Barchasi</MenuItem>
                  {lines.map((l) => <MenuItem key={l.id} value={l.id}>{l.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} sm={3} md={2}>
              <FormControl size="small" fullWidth>
                <InputLabel>Sabab</InputLabel>
                <Select value={filters.reasonId} label="Sabab" onChange={setFilter('reasonId')}>
                  <MenuItem value="">Barchasi</MenuItem>
                  {reasons.map((r) => <MenuItem key={r.id} value={r.id}>{r.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} sm={3} md={2}>
              <UzDatePicker label="Dan" value={filters.dateFrom} onChange={setFilter('dateFrom')} />
            </Grid>
            <Grid item xs={6} sm={3} md={2}>
              <UzDatePicker label="Gacha" value={filters.dateTo} onChange={setFilter('dateTo')} />
            </Grid>
            {(filters.dateFrom || filters.dateTo || filters.status || filters.lineId || filters.reasonId) && (
              <Grid item xs={6} sm={3} md={2}>
                <Button size="small" onClick={() => { setFilters({ status: '', lineId: '', reasonId: '', dateFrom: '', dateTo: '' }); setPage(0); }}>
                  Tozalash
                </Button>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>

      {byReason.length > 0 && (
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="subtitle2" sx={{ mb: 1.5 }}>Sabablarga ko'ra (daqiqa)</Typography>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={byReason} layout="vertical" margin={{ left: 0, right: 20, top: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={120} />
                    <RTooltip formatter={(v) => [`${fmtDuration(v)}`, 'Davomiyligi']} />
                    <Bar dataKey="minutes" name="Daqiqa" fill="#F57C00" radius={[0, 3, 3, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="subtitle2" sx={{ mb: 1.5 }}>Ulush</Typography>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={byReason.map((d) => ({ name: d.name, value: Math.round(d.minutes) }))} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value">
                      {byReason.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Pie>
                    <RTooltip formatter={(v) => [`${fmtDuration(v)}`, 'Davomiyligi']} />
                    <Legend formatter={(v) => <span style={{ fontSize: 11 }}>{v}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      <Card>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Boshlanish</TableCell>
                <TableCell>Liniya</TableCell>
                <TableCell>Sabab</TableCell>
                <TableCell>Davomiyligi</TableCell>
                <TableCell>Holat</TableCell>
                <TableCell>Tavsif</TableCell>
                {can('downtime:update') && <TableCell align="center">Amallar</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4 }}><CircularProgress size={26} /></TableCell></TableRow>
              ) : downtimes.map((d) => {
                const durMin = getDuration(d, now);
                return (
                  <TableRow key={d.id} hover sx={{ bgcolor: d.status === 'ACTIVE' ? 'warning.50' : 'inherit' }}>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      {format(new Date(d.startTime), 'd MMM, HH:mm')}
                    </TableCell>
                    <TableCell>{d.productionLine?.name}</TableCell>
                    <TableCell>
                      <Typography variant="body2">{d.reason?.name}</Typography>
                      {d.reason?.category && (
                        <Typography variant="caption" color="text.secondary">{d.reason.category}</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Typography variant="body2" fontWeight={600}>{fmtDuration(durMin)}</Typography>
                        {d.status === 'ACTIVE' && (
                          <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'warning.main', animation: 'pulse 2s infinite' }} />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={DOWNTIME_STATUS[d.status]?.label || d.status}
                        color={DOWNTIME_STATUS[d.status]?.color || 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">{d.description || '—'}</Typography>
                    </TableCell>
                    {can('downtime:update') && (
                      <TableCell align="center">
                        {d.status === 'ACTIVE' && (
                          <Button
                            size="small"
                            variant="contained"
                            color="success"
                            startIcon={<CheckCircle fontSize="small" />}
                            onClick={() => setResolveDialog({ open: true, item: d, endTime: '' })}
                            sx={{ whiteSpace: 'nowrap', fontSize: 12, py: 0.4, px: 1.2 }}
                          >
                            Tugatish
                          </Button>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
              {!loading && downtimes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    Ma'lumot topilmadi
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={total}
          page={page}
          rowsPerPage={15}
          rowsPerPageOptions={[15]}
          onPageChange={(_, p) => setPage(p)}
          labelDisplayedRows={({ from, to, count }) => `${from}–${to} / ${count}`}
        />
      </Card>

      {/* Create dialog */}
      <Dialog open={createDialog} onClose={() => setCreateDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>To'xtalish qayd etish</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <FormControl fullWidth size="small">
                <InputLabel>Liniya *</InputLabel>
                <Select value={form.productionLineId} label="Liniya *" onChange={(e) => setForm((f) => ({ ...f, productionLineId: e.target.value }))}>
                  {lines.map((l) => <MenuItem key={l.id} value={l.id}>{l.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth size="small">
                <InputLabel>Sabab *</InputLabel>
                <Select value={form.reasonId} label="Sabab *" onChange={(e) => setForm((f) => ({ ...f, reasonId: e.target.value }))}>
                  {reasons.map((r) => <MenuItem key={r.id} value={r.id}>{r.name} ({r.category})</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Boshlanish vaqti"
                type="datetime-local"
                size="small"
                fullWidth
                InputLabelProps={{ shrink: true }}
                helperText="Bo'sh qoldirilsa — hozirgi vaqt"
                {...Ff('startTime')}
              />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Smena</InputLabel>
                <Select value={form.shiftId} label="Smena" onChange={(e) => setForm((f) => ({ ...f, shiftId: e.target.value }))}>
                  <MenuItem value="">—</MenuItem>
                  {shifts.map((s) => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField label="Tavsif" size="small" fullWidth multiline rows={2} {...Ff('description')} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setCreateDialog(false)}>Bekor</Button>
          <Button
            variant="contained"
            color="warning"
            onClick={handleCreate}
            disabled={saving || !form.productionLineId || !form.reasonId}
          >
            {saving ? <CircularProgress size={18} color="inherit" /> : 'Qayd etish'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Resolve dialog */}
      <Dialog open={resolveDialog.open} onClose={() => setResolveDialog({ open: false, item: null, endTime: '' })} maxWidth="xs" fullWidth>
        <DialogTitle>To'xtalishni yopish</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Liniya: <strong>{resolveDialog.item?.productionLine?.name}</strong><br />
            Sabab: <strong>{resolveDialog.item?.reason?.name}</strong><br />
            Davomiyligi: <strong>{fmtDuration(getDuration(resolveDialog.item || {}, now))}</strong>
          </Typography>
          <TextField
            label="Tugash vaqti (bo'sh = hozir)"
            type="datetime-local"
            size="small"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={resolveDialog.endTime}
            onChange={(e) => setResolveDialog((d) => ({ ...d, endTime: e.target.value }))}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResolveDialog({ open: false, item: null, endTime: '' })}>Bekor</Button>
          <Button variant="contained" color="success" onClick={handleResolve} disabled={saving}>
            {saving ? <CircularProgress size={18} color="inherit" /> : 'Tugatish'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Downtime;
