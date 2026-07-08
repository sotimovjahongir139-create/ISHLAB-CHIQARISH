import {
  Box, Typography, Card, CardContent, Button, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, TablePagination, CircularProgress, TextField,
  Dialog, DialogTitle, DialogContent, DialogActions,
  FormControl, InputLabel, Select, MenuItem, Grid, IconButton, Tooltip,
  Autocomplete,
} from '@mui/material';
import { Refresh, Delete, Save, Edit, PrecisionManufacturing } from '@mui/icons-material';
import { useState, useEffect, useCallback } from 'react';
import { useSnackbar } from 'notistack';
import * as svc from '../../services/charxlash.service';
import * as pSvc from '../../services/production.service';
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
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    return { startDate: localDateStr(prevMonthStart), endDate: localDateStr(prevMonthEnd) };
  }
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  return { startDate: localDateStr(firstOfMonth), endDate: todayLocal };
};

const EMPTY_ENTRY = { date: todayStr(), lineId: '', employeeId: '', reja: '', fakt: '', brak: '' };

const TEAL = '#0891B2';
const TEAL_DARK = '#0E7490';

const Charxlash = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [totalFakt, setTotalFakt] = useState(0);
  const [period, setPeriod] = useState('kunlik');
  const [lines, setLines] = useState([]);
  const [employees, setEmployees] = useState([]);
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
      pSvc.getLines({ limit: 100 }),
      empSvc.getEmployees({ status: 'ACTIVE', limit: 200 }),
    ]).then(([lR, eR]) => {
      setLines(lR.data.data || []);
      setEmployees(eR.data.data || []);
    }).catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { startDate, endDate } = getPeriodDates(period);
      const r = await svc.getCharxlashRecords({ page: page + 1, limit: 20, startDate, endDate });
      setRecords(r.data.data || []);
      setTotal(r.data.pagination?.total ?? 0);
      setTotalFakt(r.data.totalFakt || 0);
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.message || 'Xatolik', { variant: 'error' });
    } finally { setLoading(false); }
  }, [page, period]);

  useEffect(() => { setPage(0); }, [period]);
  useEffect(() => { load(); }, [load]);

  const setE = (key) => (e) => { setEntry(f => ({ ...f, [key]: e.target.value })); setEntryError(null); };

  const validate = (form) => {
    if (!form.lineId) return 'Liniyani tanlang';
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
      await svc.createCharxlashRecord({
        date: entry.date,
        productionLineId: entry.lineId,
        employeeId: entry.employeeId || null,
        plannedQty: entry.reja !== '' ? parseInt(entry.reja) : null,
        producedQty: entry.fakt !== '' ? parseInt(entry.fakt) : null,
        brakQty: entry.brak !== '' ? parseInt(entry.brak) : 0,
      });
      enqueueSnackbar('Saqlandi!', { variant: 'success' });
      setEntry(f => ({ ...EMPTY_ENTRY, date: f.date, lineId: f.lineId }));
      load();
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.message || 'Xatolik', { variant: 'error' });
    } finally { setEntrySaving(false); }
  };

  const openEdit = (item) => {
    setEditForm({
      date: item.date ? item.date.split('T')[0] : todayStr(),
      lineId: item.productionLineId || '',
      employeeId: item.employeeId || '',
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
      await svc.updateCharxlashRecord(editDialog.item.id, {
        date: editForm.date,
        productionLineId: editForm.lineId,
        employeeId: editForm.employeeId || null,
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
      await svc.deleteCharxlashRecord(deleteDialog.item.id);
      enqueueSnackbar("O'chirildi", { variant: 'success' });
      setDeleteDialog({ open: false, item: null });
      load();
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.message || 'Xatolik', { variant: 'error' });
    } finally { setDeleteLoading(false); }
  };

  const empName = (r) => r.employee ? `${r.employee.firstName} ${r.employee.lastName}` : '—';
  const empById = (id) => employees.find(e => e.id === id) || null;

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <PrecisionManufacturing sx={{ fontSize: 30, color: TEAL }} />
          <Box>
            <Typography variant="h4">Charxlash</Typography>
            <Typography variant="body2" color="text.secondary">Charxlash bo'limi qaydlari</Typography>
          </Box>
        </Box>
        <Button startIcon={<Refresh />} onClick={load}>Yangilash</Button>
      </Box>

      <Box sx={{ mb: 2 }}>
        <Chip
          icon={<PrecisionManufacturing fontSize="small" />}
          label={`Jami fakt: ${totalFakt.toLocaleString()} dona`}
          sx={{ bgcolor: '#ECFEFF', color: TEAL, border: `1px solid #A5F3FC`, fontWeight: 600 }}
        />
      </Box>

      {/* Entry row */}
      <Card sx={{ mb: 1.5 }}>
        <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
          <Grid container spacing={1.5} alignItems="flex-end">
            <Grid item xs={6} sm={2}>
              <TextField size="small" fullWidth type="date" label="Sana"
                InputLabelProps={{ shrink: true }} value={entry.date} onChange={setE('date')} />
            </Grid>
            <Grid item xs={6} sm={2}>
              <FormControl size="small" fullWidth>
                <InputLabel>Liniya</InputLabel>
                <Select value={entry.lineId} label="Liniya" onChange={setE('lineId')}>
                  {lines.map(l => <MenuItem key={l.id} value={l.id}>{l.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={2}>
              <Autocomplete
                size="small"
                options={employees}
                getOptionLabel={(o) => `${o.firstName} ${o.lastName}`}
                value={empById(entry.employeeId)}
                onChange={(_, v) => { setEntry(f => ({ ...f, employeeId: v?.id || '' })); setEntryError(null); }}
                renderInput={(params) => <TextField {...params} label="Xodim" size="small" />}
                isOptionEqualToValue={(o, v) => o.id === v.id}
                noOptionsText="Topilmadi"
              />
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
                sx={{ bgcolor: TEAL, '&:hover': { bgcolor: TEAL_DARK }, height: 40, whiteSpace: 'nowrap' }}>
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
              ...(period === p ? { bgcolor: TEAL, '&:hover': { bgcolor: TEAL_DARK }, borderColor: TEAL } : {}),
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
                <TableCell>LINIYA</TableCell>
                <TableCell>XODIM</TableCell>
                <TableCell align="right">REJA (DONA)</TableCell>
                <TableCell align="right">FAKT (DONA)</TableCell>
                <TableCell align="right">BRAK (DONA)</TableCell>
                <TableCell align="center">AMALLAR</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <CircularProgress size={26} />
                  </TableCell>
                </TableRow>
              ) : records.map((r) => (
                <TableRow key={r.id} hover>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>
                    {r.date ? format(new Date(r.date), 'dd.MM.yyyy') : '—'}
                  </TableCell>
                  <TableCell>{r.productionLine?.name || '—'}</TableCell>
                  <TableCell>{empName(r)}</TableCell>
                  <TableCell align="right">{r.plannedQty ?? '—'}</TableCell>
                  <TableCell align="right">
                    <Chip label={r.producedQty ?? 0} size="small"
                      sx={{ bgcolor: '#ECFEFF', color: TEAL, fontWeight: 600 }} />
                  </TableCell>
                  <TableCell align="right">
                    {r.brakQty > 0
                      ? <Chip label={r.brakQty} size="small" color="error" variant="outlined" />
                      : <Typography variant="caption" color="text.secondary">0</Typography>}
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
                  <TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>
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
        <DialogTitle>Charxlash yozuvini tahrirlash</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={6}>
              <TextField size="small" fullWidth type="date" label="Sana"
                InputLabelProps={{ shrink: true }} value={editForm.date || ''}
                onChange={(e) => setEditForm(f => ({ ...f, date: e.target.value }))} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl size="small" fullWidth>
                <InputLabel>Liniya</InputLabel>
                <Select value={editForm.lineId || ''} label="Liniya"
                  onChange={(e) => setEditForm(f => ({ ...f, lineId: e.target.value }))}>
                  {lines.map(l => <MenuItem key={l.id} value={l.id}>{l.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Autocomplete size="small" options={employees}
                getOptionLabel={(o) => `${o.firstName} ${o.lastName}`}
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
            sx={{ bgcolor: TEAL, '&:hover': { bgcolor: TEAL_DARK } }}>
            {editSaving ? <CircularProgress size={18} color="inherit" /> : 'Saqlash'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, item: null })} maxWidth="xs" fullWidth>
        <DialogTitle>O'chirishni tasdiqlang</DialogTitle>
        <DialogContent>
          <Typography>
            {deleteDialog.item?.date ? <strong>{format(new Date(deleteDialog.item.date), 'dd.MM.yyyy')}</strong> : null}
            {' '}— {deleteDialog.item?.productionLine?.name} yozuvi o'chiriladi. Tasdiqlaysizmi?
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

export default Charxlash;
