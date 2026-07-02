import {
  Box, Typography, Card, CardContent, Button, Grid,
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, TablePagination, CircularProgress, TextField,
  Dialog, DialogTitle, DialogContent, DialogActions,
  FormControl, InputLabel, Select, MenuItem, IconButton, Tooltip,
} from '@mui/material';
import { Refresh, Edit, Delete, Save, Inventory } from '@mui/icons-material';
import { useState, useEffect, useCallback } from 'react';
import { useSnackbar } from 'notistack';
import * as svc from '../../services/material.service';
import { format } from 'date-fns';

const BOLIM_OPTIONS = [
  "PU xomashyo",
  "TEP xomashyo",
  "TPU xomashyo",
  "PXV xomashyo",
  "Kraska",
];

const CATEGORIES = [
  { id: 'RAW_MATERIAL', label: 'Xomashyo' },
  { id: 'COMPONENT', label: 'Komponent' },
  { id: 'PACKAGING', label: 'Qadoqlash' },
  { id: 'CONSUMABLE', label: 'Sarflanadigan' },
  { id: 'SPARE_PART', label: 'Ehtiyot qism' },
  { id: 'OTHER', label: 'Boshqa' },
];
const CAT_LABEL = Object.fromEntries(CATEGORIES.map((c) => [c.id, c.label]));

const todayStr = () => new Date().toISOString().split('T')[0];

const getPeriodDates = (period) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (period === 'kunlik') {
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const d = yesterday.toISOString().split('T')[0];
    return { dateFrom: d, dateTo: d };
  }
  if (period === 'haftalik') {
    const dow = today.getDay();
    const diff = dow === 0 ? 6 : dow - 1;
    const monday = new Date(today);
    monday.setDate(today.getDate() - diff);
    return { dateFrom: monday.toISOString().split('T')[0], dateTo: today.toISOString().split('T')[0] };
  }
  const first = new Date(today.getFullYear(), today.getMonth(), 1);
  return { dateFrom: first.toISOString().split('T')[0], dateTo: today.toISOString().split('T')[0] };
};

const EMPTY_ENTRY = { date: todayStr(), bolim: '', category: 'RAW_MATERIAL', fakt: '' };

const Materials = () => {
  const { enqueueSnackbar } = useSnackbar();

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [period, setPeriod] = useState('kunlik');

  const [entry, setEntry] = useState(EMPTY_ENTRY);
  const [entryError, setEntryError] = useState(null);
  const [entrySaving, setEntrySaving] = useState(false);

  const [editDialog, setEditDialog] = useState({ open: false, item: null });
  const [editForm, setEditForm] = useState({});
  const [editSaving, setEditSaving] = useState(false);

  const [deleteDialog, setDeleteDialog] = useState({ open: false, item: null });
  const [deleteLoading, setDeleteLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { dateFrom, dateTo } = getPeriodDates(period);
      const r = await svc.getMaterials({ page: page + 1, limit: 20, dateFrom, dateTo });
      const body = r.data;
      setRecords(body.data);
      setTotal(body.pagination?.total ?? body.total ?? 0);
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.message || 'Xatolik', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [page, period]);

  useEffect(() => { setPage(0); }, [period]);
  useEffect(() => { load(); }, [load]);

  const setE = (key) => (e) => {
    setEntry((f) => ({ ...f, [key]: e.target.value }));
    setEntryError(null);
  };

  const handleSave = async () => {
    if (!entry.date || !entry.bolim || !entry.category || entry.fakt === '') {
      setEntryError("Barcha maydonlarni to'ldiring!");
      return;
    }
    setEntrySaving(true);
    try {
      await svc.createMaterial({
        name: entry.bolim,
        code: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        category: entry.category,
        currentStock: parseFloat(entry.fakt),
        recordDate: entry.date,
      });
      enqueueSnackbar('Saqlandi!', { variant: 'success' });
      setEntry((f) => ({ ...EMPTY_ENTRY, date: f.date, bolim: f.bolim, category: f.category }));
      load();
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.message || 'Xatolik', { variant: 'error' });
    } finally {
      setEntrySaving(false);
    }
  };

  const openEdit = (item) => {
    setEditForm({
      date: item.recordDate ? item.recordDate.split('T')[0] : todayStr(),
      bolim: item.name || '',
      category: item.category || 'RAW_MATERIAL',
      fakt: item.currentStock ?? '',
    });
    setEditDialog({ open: true, item });
  };

  const handleEditSave = async () => {
    setEditSaving(true);
    try {
      await svc.updateMaterial(editDialog.item.id, {
        name: editForm.bolim,
        category: editForm.category,
        currentStock: editForm.fakt !== '' ? parseFloat(editForm.fakt) : 0,
        recordDate: editForm.date || null,
      });
      enqueueSnackbar('Yangilandi', { variant: 'success' });
      setEditDialog({ open: false, item: null });
      load();
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.message || 'Xatolik', { variant: 'error' });
    } finally {
      setEditSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await svc.deleteMaterial(deleteDialog.item.id);
      enqueueSnackbar("O'chirildi", { variant: 'success' });
      setDeleteDialog({ open: false, item: null });
      load();
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.message || 'Xatolik', { variant: 'error' });
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Inventory sx={{ fontSize: 30, color: 'primary.main' }} />
          <Box>
            <Typography variant="h4">Xomashyo</Typography>
            <Typography variant="body2" color="text.secondary">Xomashyo sarfi kunlik qayd</Typography>
          </Box>
        </Box>
        <Button startIcon={<Refresh />} onClick={load}>Yangilash</Button>
      </Box>

      {/* Quick-entry row */}
      <Card sx={{ mb: 1.5 }}>
        <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
          <Grid container spacing={1.5} alignItems="flex-end">
            <Grid item xs={6} sm={2}>
              <TextField
                size="small" fullWidth type="date" label="Sana"
                InputLabelProps={{ shrink: true }}
                value={entry.date}
                onChange={setE('date')}
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <FormControl size="small" fullWidth>
                <InputLabel>Bo'lim</InputLabel>
                <Select value={entry.bolim} label="Bo'lim" onChange={setE('bolim')}>
                  {BOLIM_OPTIONS.map((b) => <MenuItem key={b} value={b}>{b}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} sm={3}>
              <FormControl size="small" fullWidth>
                <InputLabel>Kategoriya</InputLabel>
                <Select value={entry.category} label="Kategoriya" onChange={setE('category')}>
                  {CATEGORIES.map((c) => <MenuItem key={c.id} value={c.id}>{c.label}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} sm={2}>
              <TextField
                size="small" fullWidth label="Fakt" type="number"
                inputProps={{ min: 0, step: 0.01 }}
                value={entry.fakt}
                onChange={setE('fakt')}
              />
            </Grid>
            <Grid item xs={12} sm="auto">
              <Button
                variant="contained" size="small"
                startIcon={entrySaving ? <CircularProgress size={14} color="inherit" /> : <Save fontSize="small" />}
                onClick={handleSave}
                disabled={entrySaving}
                sx={{ height: 40, whiteSpace: 'nowrap', bgcolor: '#2563eb', '&:hover': { bgcolor: '#1d4ed8' } }}
              >
                Saqlash
              </Button>
            </Grid>
          </Grid>
          {entryError && (
            <Typography variant="caption" color="error" sx={{ mt: 0.75, display: 'block' }}>
              {entryError}
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* Period buttons */}
      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        {[['kunlik', 'Kunlik'], ['haftalik', 'Haftalik'], ['oylik', 'Oylik']].map(([p, label]) => (
          <Button
            key={p} size="small"
            variant={period === p ? 'contained' : 'outlined'}
            onClick={() => setPeriod(p)}
            sx={{ textTransform: 'none', minWidth: 80 }}
          >
            {label}
          </Button>
        ))}
      </Box>

      {/* History table */}
      <Card>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>SANA</TableCell>
                <TableCell>BO'LIM</TableCell>
                <TableCell>KATEGORIYA</TableCell>
                <TableCell align="right">FAKT</TableCell>
                <TableCell align="center">AMALLAR</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                    <CircularProgress size={26} />
                  </TableCell>
                </TableRow>
              ) : records.map((r) => (
                <TableRow key={r.id} hover>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>
                    {r.recordDate
                      ? format(new Date(r.recordDate), 'dd.MM.yyyy')
                      : format(new Date(r.createdAt), 'dd.MM.yyyy')}
                  </TableCell>
                  <TableCell>{r.name}</TableCell>
                  <TableCell>{CAT_LABEL[r.category] || r.category || '—'}</TableCell>
                  <TableCell align="right">{r.currentStock ?? '—'}</TableCell>
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
                  <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
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
          rowsPerPage={20}
          rowsPerPageOptions={[20]}
          onPageChange={(_, p) => setPage(p)}
          labelDisplayedRows={({ from, to, count }) => `${from}–${to} / ${count}`}
        />
      </Card>

      {/* Edit dialog */}
      <Dialog open={editDialog.open} onClose={() => setEditDialog({ open: false, item: null })} maxWidth="sm" fullWidth>
        <DialogTitle>Xomashyo tahrirlash</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                size="small" fullWidth type="date" label="Sana"
                InputLabelProps={{ shrink: true }}
                value={editForm.date || ''}
                onChange={(e) => setEditForm((f) => ({ ...f, date: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl size="small" fullWidth>
                <InputLabel>Bo'lim</InputLabel>
                <Select
                  value={editForm.bolim || ''}
                  label="Bo'lim"
                  onChange={(e) => setEditForm((f) => ({ ...f, bolim: e.target.value }))}
                >
                  {BOLIM_OPTIONS.map((b) => <MenuItem key={b} value={b}>{b}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl size="small" fullWidth>
                <InputLabel>Kategoriya</InputLabel>
                <Select
                  value={editForm.category || ''}
                  label="Kategoriya"
                  onChange={(e) => setEditForm((f) => ({ ...f, category: e.target.value }))}
                >
                  {CATEGORIES.map((c) => <MenuItem key={c.id} value={c.id}>{c.label}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                size="small" fullWidth label="Fakt" type="number"
                inputProps={{ min: 0, step: 0.01 }}
                value={editForm.fakt ?? ''}
                onChange={(e) => setEditForm((f) => ({ ...f, fakt: e.target.value }))}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEditDialog({ open: false, item: null })}>Bekor</Button>
          <Button
            variant="contained"
            onClick={handleEditSave}
            disabled={editSaving || !editForm.bolim}
          >
            {editSaving ? <CircularProgress size={18} color="inherit" /> : 'Saqlash'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, item: null })} maxWidth="xs" fullWidth>
        <DialogTitle>O'chirishni tasdiqlang</DialogTitle>
        <DialogContent>
          <Typography>
            <strong>{deleteDialog.item?.name}</strong> yozuvi o'chiriladi. Tasdiqlaysizmi?
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

export default Materials;
