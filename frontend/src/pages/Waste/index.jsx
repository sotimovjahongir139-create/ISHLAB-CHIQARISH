import {
  Box, Typography, Card, CardContent, Button, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, TablePagination, CircularProgress, TextField,
  Dialog, DialogTitle, DialogContent, DialogActions,
  FormControl, InputLabel, Select, MenuItem, Grid, IconButton, Tooltip,
} from '@mui/material';
import { Add, Refresh, Delete, Edit, DeleteSweep } from '@mui/icons-material';
import { useState, useEffect, useCallback } from 'react';
import { useSnackbar } from 'notistack';
import * as svc from '../../services/waste.service';
import * as empSvc from '../../services/employee.service';
import { format } from 'date-fns';

const EMPTY = { name: '', quantity: '', date: '', departmentId: '', notes: '' };

const Waste = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [records, setRecords] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [totalQty, setTotalQty] = useState(0);
  const [filters, setFilters] = useState({ departmentId: '', dateFrom: '', dateTo: '' });
  const [dialog, setDialog] = useState({ open: false, mode: 'create', item: null });
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, item: null });

  const loadDepts = useCallback(async () => {
    try { const r = await empSvc.getDepartments(); setDepartments(r.data.data); } catch {}
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: page + 1, limit: 20 };
      if (filters.departmentId) params.departmentId = filters.departmentId;
      if (filters.dateFrom) params.dateFrom = filters.dateFrom;
      if (filters.dateTo) params.dateTo = filters.dateTo;
      const r = await svc.getWasteRecords(params);
      setRecords(r.data.data);
      setTotal(r.data.pagination.total);
      setTotalQty(r.data.totalQty || 0);
    } catch { enqueueSnackbar('Xatolik', { variant: 'error' }); }
    finally { setLoading(false); }
  }, [page, filters]);

  useEffect(() => { loadDepts(); }, []);
  useEffect(() => { load(); }, [page, filters]);

  const setFilter = (key) => (e) => { setFilters((f) => ({ ...f, [key]: e.target.value })); setPage(0); };
  const F = (key) => ({ value: form[key], onChange: (e) => setForm((f) => ({ ...f, [key]: e.target.value })) });

  const openCreate = () => { setForm(EMPTY); setDialog({ open: true, mode: 'create', item: null }); };
  const openEdit = (item) => {
    setForm({ name: item.name, quantity: item.quantity, date: item.date?.split('T')[0], departmentId: item.departmentId, notes: item.notes || '' });
    setDialog({ open: true, mode: 'edit', item });
  };

  const handleSave = async () => {
    if (!form.name || !form.quantity || !form.date || !form.departmentId) {
      enqueueSnackbar('Barcha majburiy maydonlarni to\'ldiring', { variant: 'warning' }); return;
    }
    setSaving(true);
    try {
      if (dialog.mode === 'create') {
        await svc.createWasteRecord(form);
        enqueueSnackbar('Atxot qo\'shildi', { variant: 'success' });
      } else {
        await svc.updateWasteRecord(dialog.item.id, form);
        enqueueSnackbar('Yangilandi', { variant: 'success' });
      }
      setDialog({ open: false, mode: 'create', item: null });
      load();
    } catch (err) { enqueueSnackbar(err.response?.data?.message || 'Xatolik', { variant: 'error' }); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try {
      await svc.deleteWasteRecord(deleteDialog.item.id);
      enqueueSnackbar('O\'chirildi', { variant: 'success' });
      setDeleteDialog({ open: false, item: null });
      load();
    } catch { enqueueSnackbar('Xatolik', { variant: 'error' }); }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <DeleteSweep sx={{ fontSize: 30, color: 'error.main' }} />
          <Box>
            <Typography variant="h4">Atxot</Typography>
            <Typography variant="body2" color="text.secondary">Chiqindi materiallar hisobi</Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button startIcon={<Refresh />} onClick={load}>Yangilash</Button>
          <Button variant="contained" color="error" startIcon={<Add />} onClick={openCreate}>
            Atxot qo'shish
          </Button>
        </Box>
      </Box>

      <Box sx={{ mb: 2 }}>
        <Chip
          icon={<DeleteSweep fontSize="small" />}
          label={`Jami: ${totalQty.toFixed(2)} kg`}
          color="error"
          variant="outlined"
        />
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
          <Grid container spacing={1.5} alignItems="center">
            <Grid item xs={6} sm={3}>
              <FormControl size="small" fullWidth>
                <InputLabel>Bo'lim</InputLabel>
                <Select value={filters.departmentId} label="Bo'lim" onChange={setFilter('departmentId')}>
                  <MenuItem value="">Barchasi</MenuItem>
                  {departments.map((d) => <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField label="Dan" type="date" size="small" fullWidth InputLabelProps={{ shrink: true }} value={filters.dateFrom} onChange={setFilter('dateFrom')} />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField label="Gacha" type="date" size="small" fullWidth InputLabelProps={{ shrink: true }} value={filters.dateTo} onChange={setFilter('dateTo')} />
            </Grid>
            {(filters.departmentId || filters.dateFrom || filters.dateTo) && (
              <Grid item xs={6} sm={3}>
                <Button size="small" onClick={() => { setFilters({ departmentId: '', dateFrom: '', dateTo: '' }); setPage(0); }}>Tozalash</Button>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>

      <Card>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Nomi</TableCell>
                <TableCell align="right">Miqdor (kg)</TableCell>
                <TableCell>Sana</TableCell>
                <TableCell>Bo'lim</TableCell>
                <TableCell>Izoh</TableCell>
                <TableCell align="center">Amallar</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4 }}><CircularProgress size={26} /></TableCell></TableRow>
              ) : records.map((r) => (
                <TableRow key={r.id} hover>
                  <TableCell><Typography variant="body2" fontWeight={600}>{r.name}</Typography></TableCell>
                  <TableCell align="right">
                    <Chip label={`${r.quantity} kg`} size="small" color="error" variant="outlined" />
                  </TableCell>
                  <TableCell>{r.date ? format(new Date(r.date), 'd MMM yyyy') : '—'}</TableCell>
                  <TableCell>{r.department?.name}</TableCell>
                  <TableCell><Typography variant="caption" color="text.secondary">{r.notes || '—'}</Typography></TableCell>
                  <TableCell align="center">
                    <Tooltip title="Tahrirlash">
                      <IconButton size="small" onClick={() => openEdit(r)}><Edit fontSize="small" /></IconButton>
                    </Tooltip>
                    <Tooltip title="O'chirish">
                      <IconButton size="small" color="error" onClick={() => setDeleteDialog({ open: true, item: r })}><Delete fontSize="small" /></IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {!loading && records.length === 0 && (
                <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>Ma'lumot topilmadi</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination component="div" count={total} page={page} rowsPerPage={20} rowsPerPageOptions={[20]}
          onPageChange={(_, p) => setPage(p)} labelDisplayedRows={({ from, to, count }) => `${from}–${to} / ${count}`} />
      </Card>

      {/* Create/Edit dialog */}
      <Dialog open={dialog.open} onClose={() => setDialog({ open: false, mode: 'create', item: null })} maxWidth="sm" fullWidth>
        <DialogTitle>{dialog.mode === 'create' ? 'Atxot qo\'shish' : 'Tahrirlash'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField label="Nomi *" size="small" fullWidth {...F('name')} />
            </Grid>
            <Grid item xs={6}>
              <TextField label="Miqdor (kg) *" type="number" size="small" fullWidth inputProps={{ min: 0, step: 0.01 }} {...F('quantity')} />
            </Grid>
            <Grid item xs={6}>
              <TextField label="Sana *" type="date" size="small" fullWidth InputLabelProps={{ shrink: true }} {...F('date')} />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth size="small">
                <InputLabel>Bo'lim *</InputLabel>
                <Select value={form.departmentId} label="Bo'lim *" onChange={(e) => setForm((f) => ({ ...f, departmentId: e.target.value }))}>
                  {departments.map((d) => <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField label="Izoh" size="small" fullWidth multiline rows={2} {...F('notes')} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialog({ open: false, mode: 'create', item: null })}>Bekor</Button>
          <Button variant="contained" color="error" onClick={handleSave} disabled={saving}>
            {saving ? <CircularProgress size={18} color="inherit" /> : dialog.mode === 'create' ? 'Qo\'shish' : 'Saqlash'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, item: null })} maxWidth="xs" fullWidth>
        <DialogTitle>O'chirishni tasdiqlang</DialogTitle>
        <DialogContent>
          <Typography>«{deleteDialog.item?.name}» — {deleteDialog.item?.quantity} kg o'chirilsinmi?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, item: null })}>Bekor</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>O'chirish</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Waste;
