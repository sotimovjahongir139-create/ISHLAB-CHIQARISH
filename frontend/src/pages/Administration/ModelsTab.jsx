import {
  Box, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TablePagination, Chip, IconButton, Tooltip,
  TextField, InputAdornment, Typography, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, Alert,
  FormControl, InputLabel, Select, MenuItem, Switch, FormControlLabel,
} from '@mui/material';
import { Add, Search, Edit, Delete, Category } from '@mui/icons-material';
import { useState, useEffect } from 'react';
import { useSnackbar } from 'notistack';
import * as svc from '../../services/production.service';
import usePermission from '../../hooks/usePermission';

const EMPTY = { name: '', code: '', description: '', unit: 'dona', categoryId: '', isActive: true };

const ModelsTab = () => {
  const { enqueueSnackbar } = useSnackbar();
  const { can } = usePermission();

  const [rows, setRows] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');

  const [dialog, setDialog] = useState({ open: false, mode: 'create', item: null });
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, item: null });

  const load = async () => {
    setLoading(true);
    try {
      const r = await svc.getAllProductModels({ page: page + 1, limit: 15, search: search || undefined });
      setRows(r.data.data);
      setTotal(r.data.pagination?.total ?? r.data.total ?? 0);
    } catch { enqueueSnackbar('Xatolik', { variant: 'error' }); }
    finally { setLoading(false); }
  };

  const loadCategories = async () => {
    try {
      const r = await svc.getProductCategories();
      setCategories(r.data.data || []);
    } catch {}
  };

  useEffect(() => { loadCategories(); }, []);
  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t); }, [search, page]);

  const openCreate = () => {
    setForm({ ...EMPTY, categoryId: categories[0]?.id || '' });
    setDialog({ open: true, mode: 'create', item: null });
  };

  const openEdit = (item) => {
    setForm({
      name: item.name,
      code: item.code,
      description: item.description || '',
      unit: item.unit || 'dona',
      categoryId: item.categoryId || item.category?.id || '',
      isActive: item.isActive,
    });
    setDialog({ open: true, mode: 'edit', item });
  };

  const handleSave = async () => {
    if (!form.name || !form.code || !form.categoryId) {
      enqueueSnackbar('Nomi, kodi va kategoriya majburiy', { variant: 'warning' });
      return;
    }
    setSaving(true);
    try {
      if (dialog.mode === 'create') {
        await svc.createProductModel(form);
        enqueueSnackbar('Model qo\'shildi', { variant: 'success' });
      } else {
        await svc.updateProductModel(dialog.item.id, {
          name: form.name,
          description: form.description,
          unit: form.unit,
          categoryId: form.categoryId,
          isActive: form.isActive,
        });
        enqueueSnackbar('Model yangilandi', { variant: 'success' });
      }
      setDialog({ open: false, mode: 'create', item: null });
      load();
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Xatolik', { variant: 'error' });
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try {
      await svc.deleteProductModel(deleteDialog.item.id);
      enqueueSnackbar('Model o\'chirildi', { variant: 'success' });
      setDeleteDialog({ open: false, item: null });
      load();
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Xatolik', { variant: 'error' });
    }
  };

  const F = (key) => ({ value: form[key], onChange: (e) => setForm((f) => ({ ...f, [key]: e.target.value })) });

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 1.5, mb: 2, alignItems: 'center' }}>
        <TextField
          placeholder="Nomi yoki kodi..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="small"
          sx={{ width: 300 }}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }}
        />
        <Box sx={{ flexGrow: 1 }} />
        {can('production:create') && (
          <Button variant="contained" startIcon={<Add />} onClick={openCreate}>
            Model qo'shish
          </Button>
        )}
      </Box>

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Model</TableCell>
              <TableCell>Kodi</TableCell>
              <TableCell>Kategoriya</TableCell>
              <TableCell>Birligi</TableCell>
              <TableCell>Holat</TableCell>
              <TableCell align="right">Amallar</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4 }}><CircularProgress size={28} /></TableCell></TableRow>
            ) : rows.length === 0 ? (
              <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>Ma'lumot yo'q</TableCell></TableRow>
            ) : rows.map((row) => (
              <TableRow key={row.id} hover>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Category fontSize="small" color="action" />
                    <Box>
                      <Typography variant="body2" fontWeight={600}>{row.name}</Typography>
                      {row.description && <Typography variant="caption" color="text.secondary">{row.description}</Typography>}
                    </Box>
                  </Box>
                </TableCell>
                <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600 }}>{row.code}</TableCell>
                <TableCell>{row.category?.name || '—'}</TableCell>
                <TableCell>{row.unit}</TableCell>
                <TableCell>
                  <Chip
                    label={row.isActive ? 'Faol' : 'Nofaol'}
                    size="small"
                    color={row.isActive ? 'success' : 'default'}
                  />
                </TableCell>
                <TableCell align="right">
                  <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                    {can('production:update') && (
                      <Tooltip title="Tahrirlash">
                        <IconButton size="small" onClick={() => openEdit(row)}>
                          <Edit fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    {can('production:delete') && (
                      <Tooltip title="O'chirish">
                        <IconButton size="small" color="error" onClick={() => setDeleteDialog({ open: true, item: row })}>
                          <Delete fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            ))}
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

      {/* Create / Edit Dialog */}
      <Dialog open={dialog.open} onClose={() => setDialog({ open: false, mode: 'create', item: null })} maxWidth="xs" fullWidth>
        <DialogTitle>{dialog.mode === 'create' ? 'Yangi model' : 'Modelni tahrirlash'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField label="Nomi *" fullWidth size="small" {...F('name')} />
          {dialog.mode === 'create' && (
            <TextField
              label="Kodi * (masalan: MDL-01)"
              fullWidth size="small"
              value={form.code}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
            />
          )}
          <FormControl fullWidth size="small">
            <InputLabel>Kategoriya *</InputLabel>
            <Select value={form.categoryId} label="Kategoriya *" onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}>
              {categories.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField label="Birligi (masalan: dona, metr)" fullWidth size="small" {...F('unit')} />
          <TextField label="Tavsif" fullWidth size="small" multiline rows={2} {...F('description')} />
          {dialog.mode === 'edit' && (
            <FormControlLabel
              control={<Switch checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} />}
              label={form.isActive ? 'Faol' : 'Nofaol'}
            />
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialog({ open: false, mode: 'create', item: null })}>Bekor</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving || !form.name || !form.code || !form.categoryId}>
            {saving ? <CircularProgress size={18} color="inherit" /> : 'Saqlash'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, item: null })} maxWidth="xs" fullWidth>
        <DialogTitle>Modelni o'chirish</DialogTitle>
        <DialogContent>
          <Alert severity="warning">
            <strong>{deleteDialog.item?.name}</strong> modeli o'chiriladi. Agar bu model ishlatilgan bo'lsa — faqat nofaol qilinadi.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, item: null })}>Bekor</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>O'chirish</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ModelsTab;
