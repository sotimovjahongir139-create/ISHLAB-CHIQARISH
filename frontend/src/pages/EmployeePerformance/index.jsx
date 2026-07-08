import {
  Box, Typography, Card, CardContent, Button, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, TablePagination, CircularProgress, TextField,
  Dialog, DialogTitle, DialogContent, DialogActions,
  FormControl, InputLabel, Select, MenuItem, Grid, IconButton, Tooltip,
  Autocomplete,
} from '@mui/material';
import { Refresh, Delete, Save, Edit, TrendingUp } from '@mui/icons-material';
import { useState, useEffect, useCallback } from 'react';
import { useSnackbar } from 'notistack';
import * as svc from '../../services/emp-performance.service';
import * as empSvc from '../../services/employee.service';
import { format } from 'date-fns';

const localDateStr = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const todayStr = () => localDateStr(new Date());

const getPeriodDates = (period) => {
  const now = new Date();
  const todayLocal = localDateStr(now);
  if (period === 'kunlik') return { startDate: todayLocal, endDate: todayLocal };
  if (period === 'haftalik') {
    const dow = now.getDay();
    const diff = dow === 0 ? 6 : dow - 1;
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diff);
    return { startDate: localDateStr(monday), endDate: todayLocal };
  }
  if (period === 'otgan_oy') {
    return {
      startDate: localDateStr(new Date(now.getFullYear(), now.getMonth() - 1, 1)),
      endDate: localDateStr(new Date(now.getFullYear(), now.getMonth(), 0)),
    };
  }
  return { startDate: localDateStr(new Date(now.getFullYear(), now.getMonth(), 1)), endDate: todayLocal };
};

const EMPTY_ENTRY = { date: todayStr(), employeeId: '', departmentId: '', reja: '', fakt: '', brak: '' };

const effColor = (eff) => {
  if (eff == null) return 'text.secondary';
  if (eff >= 90) return '#16A34A';
  if (eff >= 70) return '#EA580C';
  return '#DC2626';
};

const EffChip = ({ plannedQty, producedQty }) => {
  if (!plannedQty || plannedQty === 0) return <Typography variant="caption" color="text.secondary">—</Typography>;
  const eff = Math.round((producedQty / plannedQty) * 10000) / 100;
  return (
    <Typography variant="body2" fontWeight={700} sx={{ color: effColor(eff) }}>
      {eff}%
    </Typography>
  );
};

const EmpPerformance = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [totalFakt, setTotalFakt] = useState(0);
  const [totalBrak, setTotalBrak] = useState(0);
  const [period, setPeriod] = useState('kunlik');
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [entry, setEntry] = useState(EMPTY_ENTRY);
  const [entryError, setEntryError] = useState(null);
  const [entrySaving, setEntrySaving] = useState(false);
  const [editDialog, setEditDialog] = useState({ open: false, item: null });
  const [editForm, setEditForm] = useState({});
  const [editSaving, setEditSaving] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, item: null });
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      empSvc.getEmployees({ status: 'ACTIVE', limit: 200 }),
      empSvc.getDepartments(),
    ]).then(([eR, dR]) => {
      setEmployees(eR.data.data || []);
      setDepartments(dR.data.data || []);
    }).catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { startDate, endDate } = getPeriodDates(period);
      const r = await svc.getEmpPerfRecords({ page: page + 1, limit: 20, startDate, endDate });
      setRecords(r.data.data || []);
      setTotal(r.data.pagination?.total ?? 0);
      setTotalFakt(r.data.totalFakt || 0);
      setTotalBrak(r.data.totalBrak || 0);
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.message || 'Xatolik', { variant: 'error' });
    } finally { setLoading(false); }
  }, [page, period]);

  useEffect(() => { setPage(0); }, [period]);
  useEffect(() => { load(); }, [load]);

  const setE = (key) => (e) => { setEntry(f => ({ ...f, [key]: e.target.value })); setEntryError(null); };

  const validate = (form) => {
    if (!form.employeeId) return 'Xodimni tanlang';
    if (!form.departmentId) return "Bo'limni tanlang";
    if ((form.reja === '' || form.reja == null) && (form.fakt === '' || form.fakt == null))
      return "Reja yoki fakt kiritilishi shart";
    if (form.brak !== '' && form.brak != null && form.fakt !== '' && form.fakt != null
      && parseInt(form.brak) > parseInt(form.fakt))
      return "Brak fakt miqdoridan ko'p bo'lishi mumkin emas";
    return null;
  };

  const handleSave = async () => {
    const err = validate(entry);
    if (err) { setEntryError(err); return; }
    setEntrySaving(true);
    try {
      await svc.createEmpPerfRecord({
        date: entry.date,
        employeeId: entry.employeeId,
        departmentId: entry.departmentId,
        plannedQty: entry.reja !== '' ? parseInt(entry.reja) : null,
        producedQty: entry.fakt !== '' ? parseInt(entry.fakt) : null,
        brakQty: entry.brak !== '' ? parseInt(entry.brak) : 0,
      });
      enqueueSnackbar('Saqlandi!', { variant: 'success' });
      setEntry(f => ({ ...EMPTY_ENTRY, date: f.date, departmentId: f.departmentId }));
      load();
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.message || 'Xatolik', { variant: 'error' });
    } finally { setEntrySaving(false); }
  };

  const openEdit = (item) => {
    setEditForm({
      date: item.date ? item.date.split('T')[0] : todayStr(),
      employeeId: item.employeeId || '',
      departmentId: item.departmentId || '',
      reja: item.plannedQty ?? '',
      fakt: item.producedQty ?? '',
      brak: item.brakQty ?? 0,
    });
    setEditDialog({ open: true, item });
  };

  const handleEditSave = async () => {
    const err = validate(editForm);
    if (err) { enqueueSnackbar(err, { variant: 'warning' }); return; }
    setEditSaving(true);
    try {
      await svc.updateEmpPerfRecord(editDialog.item.id, {
        date: editForm.date,
        employeeId: editForm.employeeId,
        departmentId: editForm.departmentId,
        plannedQty: editForm.reja !== '' ? parseInt(editForm.reja) : null,
        producedQty: editForm.fakt !== '' ? parseInt(editForm.fakt) : null,
        brakQty: editForm.brak !== '' ? parseInt(editForm.brak) : 0,
      });
      enqueueSnackbar('Yangilandi!', { variant: 'success' });
      setEditDialog({ open: false, item: null });
      load();
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.message || 'Xatolik', { variant: 'error' });
    } finally { setEditSaving(false); }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await svc.deleteEmpPerfRecord(deleteDialog.item.id);
      enqueueSnackbar("O'chirildi", { variant: 'success' });
      setDeleteDialog({ open: false, item: null });
      load();
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.message || 'Xatolik', { variant: 'error' });
    } finally { setDeleteLoading(false); }
  };

  const empById = (id) => employees.find(e => e.id === id) || null;
  const empLabel = (o) => `${o.firstName} ${o.lastName}`;

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <TrendingUp sx={{ fontSize: 30, color: '#16A34A' }} />
          <Box>
            <Typography variant="h4">Xodimlar samaradorligi</Typography>
            <Typography variant="body2" color="text.secondary">Xodimlar kunlik ko'rsatkichlari</Typography>
          </Box>
        </Box>
        <Button startIcon={<Refresh />} onClick={load}>Yangilash</Button>
      </Box>

      {/* Summary badges */}
      <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
        <Chip label={`Jami yozuvlar: ${total} ta`} variant="outlined"
          sx={{ bgcolor: '#F0FDF4', color: '#16A34A', border: '1px solid #BBF7D0', fontWeight: 600 }} />
        <Chip label={`Jami fakt: ${totalFakt.toLocaleString()} dona`} variant="outlined"
          sx={{ bgcolor: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE', fontWeight: 600 }} />
        <Chip label={`Jami brak: ${totalBrak.toLocaleString()} dona`} variant="outlined"
          sx={{ bgcolor: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', fontWeight: 600 }} />
      </Box>

      {/* Entry row */}
      <Card sx={{ mb: 1.5 }}>
        <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
          <Grid container spacing={1.5} alignItems="flex-end">
            <Grid item xs={6} sm={2}>
              <TextField size="small" fullWidth type="date" label="Sana"
                InputLabelProps={{ shrink: true }} value={entry.date} onChange={setE('date')} />
            </Grid>
            <Grid item xs={12} sm={2}>
              <Autocomplete
                size="small"
                options={employees}
                getOptionLabel={empLabel}
                value={empById(entry.employeeId)}
                onChange={(_, v) => { setEntry(f => ({ ...f, employeeId: v?.id || '' })); setEntryError(null); }}
                renderInput={(params) => <TextField {...params} label="Xodim" size="small" />}
                isOptionEqualToValue={(o, v) => o.id === v.id}
                noOptionsText="Topilmadi"
              />
            </Grid>
            <Grid item xs={6} sm={2}>
              <FormControl size="small" fullWidth>
                <InputLabel>Bo'lim</InputLabel>
                <Select value={entry.departmentId} label="Bo'lim" onChange={setE('departmentId')}>
                  {departments.map(d => <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} sm={1.5}>
              <TextField size="small" fullWidth type="number" label="Reja (dona)"
                inputProps={{ min: 0 }} value={entry.reja} onChange={setE('reja')} />
            </Grid>
            <Grid item xs={6} sm={1.5}>
              <TextField size="small" fullWidth type="number" label="Fakt (dona)"
                inputProps={{ min: 0 }} value={entry.fakt} onChange={setE('fakt')} />
            </Grid>
            <Grid item xs={6} sm={1.5}>
              <TextField size="small" fullWidth type="number" label="Brak (dona)"
                inputProps={{ min: 0 }} value={entry.brak} onChange={setE('brak')} />
            </Grid>
            <Grid item xs={6} sm="auto">
              <Button variant="contained" size="small"
                startIcon={entrySaving ? <CircularProgress size={14} color="inherit" /> : <Save fontSize="small" />}
                onClick={handleSave} disabled={entrySaving}
                sx={{ bgcolor: '#16A34A', '&:hover': { bgcolor: '#15803D' }, height: 40, whiteSpace: 'nowrap' }}>
                Saqlash
              </Button>
            </Grid>
          </Grid>
          {entryError && (
            <Typography variant="caption" color="error" sx={{ mt: 0.75, display: 'block' }}>{entryError}</Typography>
          )}
        </CardContent>
      </Card>

      {/* Period buttons */}
      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        {[['kunlik', 'Kunlik'], ['haftalik', 'Haftalik'], ['oylik', 'Oylik'], ['otgan_oy', "O'tgan oy"]].map(([p, label]) => (
          <Button key={p} size="small"
            variant={period === p ? 'contained' : 'outlined'}
            onClick={() => setPeriod(p)}
            sx={{
              textTransform: 'none', minWidth: 80,
              ...(period === p ? { bgcolor: '#16A34A', '&:hover': { bgcolor: '#15803D' }, borderColor: '#16A34A' } : {}),
            }}>
            {label}
          </Button>
        ))}
      </Box>

      {/* Table */}
      <Card>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>SANA</TableCell>
                <TableCell>XODIM</TableCell>
                <TableCell>BO'LIM</TableCell>
                <TableCell align="right">REJA (DONA)</TableCell>
                <TableCell align="right">FAKT (DONA)</TableCell>
                <TableCell align="right">BRAK (DONA)</TableCell>
                <TableCell align="right">SAMARADORLIK</TableCell>
                <TableCell align="center">AMALLAR</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <CircularProgress size={26} />
                  </TableCell>
                </TableRow>
              ) : records.map((r) => (
                <TableRow key={r.id} hover>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>
                    {r.date ? format(new Date(r.date), 'dd.MM.yyyy') : '—'}
                  </TableCell>
                  <TableCell>
                    {r.employee ? `${r.employee.firstName} ${r.employee.lastName}` : '—'}
                  </TableCell>
                  <TableCell>{r.department?.name || '—'}</TableCell>
                  <TableCell align="right">{r.plannedQty ?? '—'}</TableCell>
                  <TableCell align="right">
                    <Chip label={r.producedQty ?? 0} size="small"
                      sx={{ bgcolor: '#F0FDF4', color: '#16A34A', fontWeight: 600 }} />
                  </TableCell>
                  <TableCell align="right">
                    {r.brakQty > 0
                      ? <Chip label={r.brakQty} size="small" color="error" variant="outlined" />
                      : <Typography variant="caption" color="text.secondary">0</Typography>}
                  </TableCell>
                  <TableCell align="right">
                    <EffChip plannedQty={r.plannedQty} producedQty={r.producedQty} />
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                      <Tooltip title="Tahrirlash">
                        <IconButton size="small" onClick={() => openEdit(r)}>
                          <Edit fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="O'chirish">
                        <IconButton size="small" color="error" onClick={() => setDeleteDialog({ open: true, item: r })}>
                          <Delete fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
              {!loading && records.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    Ma'lumot topilmadi
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination component="div" count={total} page={page} rowsPerPage={20} rowsPerPageOptions={[20]}
          onPageChange={(_, p) => setPage(p)}
          labelDisplayedRows={({ from, to, count }) => `${from}–${to} / ${count}`} />
      </Card>

      {/* Edit dialog */}
      <Dialog open={editDialog.open} onClose={() => setEditDialog({ open: false, item: null })} maxWidth="sm" fullWidth>
        <DialogTitle>Samaradorlik yozuvini tahrirlash</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={6}>
              <TextField size="small" fullWidth type="date" label="Sana"
                InputLabelProps={{ shrink: true }} value={editForm.date || ''}
                onChange={(e) => setEditForm(f => ({ ...f, date: e.target.value }))} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl size="small" fullWidth>
                <InputLabel>Bo'lim</InputLabel>
                <Select value={editForm.departmentId || ''} label="Bo'lim"
                  onChange={(e) => setEditForm(f => ({ ...f, departmentId: e.target.value }))}>
                  {departments.map(d => <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Autocomplete size="small" options={employees}
                getOptionLabel={empLabel}
                value={empById(editForm.employeeId)}
                onChange={(_, v) => setEditForm(f => ({ ...f, employeeId: v?.id || '' }))}
                renderInput={(params) => <TextField {...params} label="Xodim" size="small" />}
                isOptionEqualToValue={(o, v) => o.id === v.id}
                noOptionsText="Topilmadi" />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField size="small" fullWidth type="number" label="Reja (dona)"
                inputProps={{ min: 0 }} value={editForm.reja ?? ''}
                onChange={(e) => setEditForm(f => ({ ...f, reja: e.target.value }))} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField size="small" fullWidth type="number" label="Fakt (dona)"
                inputProps={{ min: 0 }} value={editForm.fakt ?? ''}
                onChange={(e) => setEditForm(f => ({ ...f, fakt: e.target.value }))} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField size="small" fullWidth type="number" label="Brak (dona)"
                inputProps={{ min: 0 }} value={editForm.brak ?? 0}
                onChange={(e) => setEditForm(f => ({ ...f, brak: e.target.value }))} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEditDialog({ open: false, item: null })}>Bekor</Button>
          <Button variant="contained" onClick={handleEditSave} disabled={editSaving}
            sx={{ bgcolor: '#16A34A', '&:hover': { bgcolor: '#15803D' } }}>
            {editSaving ? <CircularProgress size={18} color="inherit" /> : 'Saqlash'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, item: null })} maxWidth="xs" fullWidth>
        <DialogTitle>O'chirishni tasdiqlang</DialogTitle>
        <DialogContent>
          <Typography>
            {deleteDialog.item?.employee
              ? <strong>{deleteDialog.item.employee.firstName} {deleteDialog.item.employee.lastName}</strong>
              : null}
            {' '}yozuvi o'chiriladi. Tasdiqlaysizmi?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, item: null })}>Bekor</Button>
          <Button variant="contained" color="error" onClick={handleDelete} disabled={deleteLoading}>
            {deleteLoading ? <CircularProgress size={18} color="inherit" /> : "O'chirish"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EmpPerformance;
