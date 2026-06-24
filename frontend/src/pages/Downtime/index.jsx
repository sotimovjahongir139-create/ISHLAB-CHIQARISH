import {
  Box, Typography, Card, CardContent, Button, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, TablePagination, CircularProgress, TextField,
  Dialog, DialogTitle, DialogContent, DialogActions,
  FormControl, InputLabel, Select, MenuItem, Grid,
  IconButton, Tooltip, Alert,
} from '@mui/material';
import { Add, Refresh, CheckCircle, AccessTime, Timer, Delete, Save } from '@mui/icons-material';
import { useState, useEffect, useCallback } from 'react';
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

const todayStr = () => new Date().toISOString().split('T')[0];

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
  const { can, hasRole } = usePermission();

  const [downtimes, setDowntimes] = useState([]);
  const [reasons, setReasons] = useState([]);
  const [lines, setLines] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [now, setNow] = useState(Date.now());

  // New filter shape: date (required) + liniya + sabab + time range
  const [filters, setFilters] = useState({
    date: todayStr(),
    lineId: '',
    reasonId: '',
    timeFrom: '',
    timeTo: '',
  });

  // Umumiy ish vaqti state
  const [workHours, setWorkHours] = useState('');
  const [workHoursSaving, setWorkHoursSaving] = useState(false);

  const [createDialog, setCreateDialog] = useState(false);
  const [resolveDialog, setResolveDialog] = useState({ open: false, item: null, endTime: '' });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, item: null });
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [filterError, setFilterError] = useState(null);
  const [filterSaving, setFilterSaving] = useState(false);

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

  const loadWorkSchedule = useCallback(async (date) => {
    if (!date) return;
    try {
      const r = await svc.getWorkSchedule(date);
      setWorkHours(r.data.data?.totalHours != null ? String(r.data.data.totalHours) : '');
    } catch {}
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: page + 1, limit: 15 };
      if (filters.date) params.date = filters.date;
      if (filters.lineId) params.lineId = filters.lineId;
      if (filters.reasonId) params.reasonId = filters.reasonId;
      if (filters.timeFrom) params.timeFrom = filters.timeFrom;
      if (filters.timeTo) params.timeTo = filters.timeTo;
      const r = await svc.getDowntimes(params);
      setDowntimes(r.data.data);
      setTotal(r.data.pagination.total);
      setNow(Date.now());
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.message || err?.message || 'Xatolik yuz berdi', { variant: 'error' });
    } finally { setLoading(false); }
  }, [page, filters]);

  useEffect(() => { loadLookups(); }, []);
  useEffect(() => { load(); }, [page, filters]);
  useEffect(() => { loadWorkSchedule(filters.date); }, [filters.date]);

  const setFilter = (key) => (e) => {
    setFilters((f) => ({ ...f, [key]: e.target.value }));
    setPage(0);
    setFilterError(null);
  };

  const handleQuickSave = async () => {
    if (!filters.date || !filters.lineId || !filters.reasonId || !filters.timeFrom || !filters.timeTo) {
      setFilterError("Barcha maydonlarni to'ldiring!");
      return;
    }
    if (filters.timeTo <= filters.timeFrom) {
      setFilterError("Tugash vaqti boshlanish vaqtidan keyin bo'lishi kerak!");
      return;
    }
    setFilterError(null);
    setFilterSaving(true);
    try {
      const startTime = new Date(`${filters.date}T${filters.timeFrom}:00`).toISOString();
      const endTime = new Date(`${filters.date}T${filters.timeTo}:00`).toISOString();
      const res = await svc.createDowntime({ productionLineId: filters.lineId, reasonId: filters.reasonId, startTime });
      await svc.resolveDowntime(res.data.data.id, endTime);
      enqueueSnackbar("To'xtalish saqlandi!", { variant: 'success' });
      setFilters((f) => ({ ...f, lineId: '', reasonId: '', timeFrom: '', timeTo: '' }));
      setPage(0);
      await load();
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.message || 'Xatolik', { variant: 'error' });
    } finally {
      setFilterSaving(false);
    }
  };

  const handleSaveWorkHours = async () => {
    if (!workHours || !filters.date) return;
    setWorkHoursSaving(true);
    try {
      await svc.saveWorkSchedule(filters.date, parseFloat(workHours));
      enqueueSnackbar('Ish vaqti saqlandi', { variant: 'success' });
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.message || 'Xatolik', { variant: 'error' });
    } finally { setWorkHoursSaving(false); }
  };

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

  const handleDelete = async () => {
    try {
      await svc.deleteDowntime(deleteDialog.item.id);
      enqueueSnackbar("To'xtalish o'chirildi", { variant: 'success' });
      setDeleteDialog({ open: false, item: null });
      load();
    } catch (err) { enqueueSnackbar(err?.response?.data?.message || 'Xatolik', { variant: 'error' }); }
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
  const totalWorkMin = workHours ? parseFloat(workHours) * 60 : 0;
  const efficiency = totalWorkMin > 0
    ? Math.max(0, ((totalWorkMin - totalMinutes) / totalWorkMin) * 100).toFixed(1)
    : null;

  const hasActiveFilters = filters.lineId || filters.reasonId || filters.timeFrom || filters.timeTo;

  return (
    <Box>
      {/* Header */}
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
          Hozir <strong>{activeCount}</strong> ta faol to'xtalish mavjud — davomiyligi real vaqtda yangilanmoqda
        </Alert>
      )}

      {/* Stats + Umumiy ish vaqti row */}
      <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <Chip icon={<Timer fontSize="small" />} label={`Jami: ${fmtDuration(totalMinutes)}`} />
        <Chip label={`${total} ta yozuv`} variant="outlined" />
        {activeCount > 0 && <Chip label={`${activeCount} faol`} color="warning" size="small" />}
        {efficiency !== null && (
          <Chip
            label={`Samaradorlik: ${efficiency}%`}
            color={parseFloat(efficiency) >= 90 ? 'success' : parseFloat(efficiency) >= 75 ? 'warning' : 'error'}
            size="small"
          />
        )}

        {/* Umumiy ish vaqti input */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, ml: 0.5 }}>
          <TextField
            size="small"
            type="number"
            label="Umumiy ish vaqti (soat)"
            placeholder="Ish vaqti (soat)"
            value={workHours}
            onChange={(e) => setWorkHours(e.target.value)}
            inputProps={{ min: 0, max: 24, step: 0.5 }}
            sx={{ width: 190 }}
          />
          <Button
            size="small"
            variant="outlined"
            startIcon={workHoursSaving ? <CircularProgress size={14} /> : <Save fontSize="small" />}
            onClick={handleSaveWorkHours}
            disabled={workHoursSaving || !workHours || !filters.date}
          >
            Saqlash
          </Button>
        </Box>
      </Box>

      {/* Filters: Sana | Liniya | Sabab | Dan (vaqt) | Gacha (vaqt) */}
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
          <Grid container spacing={1.5}>
            <Grid item xs={6} sm={3} md={2}>
              <TextField
                size="small"
                fullWidth
                type="date"
                label="Sana"
                InputLabelProps={{ shrink: true }}
                value={filters.date}
                onChange={(e) => { setFilters((f) => ({ ...f, date: e.target.value })); setPage(0); setFilterError(null); }}
              />
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
              <TextField
                size="small"
                fullWidth
                type="time"
                label="Dan (vaqt)"
                InputLabelProps={{ shrink: true }}
                value={filters.timeFrom}
                onChange={(e) => { setFilters((f) => ({ ...f, timeFrom: e.target.value })); setPage(0); setFilterError(null); }}
              />
            </Grid>
            <Grid item xs={6} sm={3} md={2}>
              <TextField
                size="small"
                fullWidth
                type="time"
                label="Gacha (vaqt)"
                InputLabelProps={{ shrink: true }}
                value={filters.timeTo}
                onChange={(e) => { setFilters((f) => ({ ...f, timeTo: e.target.value })); setPage(0); setFilterError(null); }}
              />
            </Grid>
            <Grid item xs={12} sm="auto" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Button
                variant="contained"
                size="small"
                startIcon={filterSaving ? <CircularProgress size={14} color="inherit" /> : <Save fontSize="small" />}
                onClick={handleQuickSave}
                disabled={filterSaving}
                sx={{
                  bgcolor: '#2563eb',
                  '&:hover': { bgcolor: '#1d4ed8' },
                  height: 40,
                  whiteSpace: 'nowrap',
                  borderRadius: 1,
                }}
              >
                Saqlash
              </Button>
              {hasActiveFilters && (
                <Button
                  size="small"
                  onClick={() => {
                    setFilters((f) => ({ ...f, lineId: '', reasonId: '', timeFrom: '', timeTo: '' }));
                    setPage(0);
                    setFilterError(null);
                  }}
                >
                  Tozalash
                </Button>
              )}
            </Grid>
          </Grid>
          {filterError && (
            <Typography variant="caption" color="error" sx={{ mt: 0.75, display: 'block' }}>
              {filterError}
            </Typography>
          )}
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
                    <Pie
                      data={byReason.map((d) => ({ name: d.name, value: Math.round(d.minutes) }))}
                      cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value"
                    >
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
                {(can('downtime:update') || can('downtime:delete') || hasRole('super_admin', 'admin')) && (
                  <TableCell align="center">Amallar</TableCell>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <CircularProgress size={26} />
                  </TableCell>
                </TableRow>
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
                    {(can('downtime:update') || can('downtime:delete') || hasRole('super_admin', 'admin')) && (
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center', alignItems: 'center' }}>
                          {d.status === 'ACTIVE' && can('downtime:update') && (
                            <Button
                              size="small" variant="contained" color="success"
                              startIcon={<CheckCircle fontSize="small" />}
                              onClick={() => setResolveDialog({ open: true, item: d, endTime: '' })}
                              sx={{ whiteSpace: 'nowrap', fontSize: 12, py: 0.4, px: 1.2 }}
                            >
                              Tugatish
                            </Button>
                          )}
                          <Tooltip title="O'chirish">
                            <IconButton size="small" color="error" onClick={() => setDeleteDialog({ open: true, item: d })}>
                              <Delete fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
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
            variant="contained" color="warning"
            onClick={handleCreate}
            disabled={saving || !form.productionLineId || !form.reasonId}
          >
            {saving ? <CircularProgress size={18} color="inherit" /> : 'Qayd etish'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirm dialog */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, item: null })} maxWidth="xs" fullWidth>
        <DialogTitle>To'xtalishni o'chirish</DialogTitle>
        <DialogContent>
          <Typography>
            <strong>{deleteDialog.item?.reason?.name}</strong> sababi bilan{' '}
            {deleteDialog.item?.startTime && format(new Date(deleteDialog.item.startTime), 'd MMM, HH:mm')}
            {' '}da qayd etilgan to'xtalish o'chiriladi. Tasdiqlaysizmi?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, item: null })}>Bekor</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>O'chirish</Button>
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
