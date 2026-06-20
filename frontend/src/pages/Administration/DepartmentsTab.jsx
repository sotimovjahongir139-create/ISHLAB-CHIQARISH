import {
  Box, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TablePagination, Chip, IconButton, Tooltip,
  TextField, InputAdornment, Typography, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, Alert, Grid,
} from '@mui/material';
import { Add, Search, Edit, Delete, Business, People } from '@mui/icons-material';
import { useState, useEffect } from 'react';
import { useSnackbar } from 'notistack';
import * as svc from '../../services/admin.service';
import usePermission from '../../hooks/usePermission';

const EMPTY = { name: '', code: '', description: '', factoryId: '' };

const DepartmentsTab = ({ factoryId }) => {
  const { enqueueSnackbar } = useSnackbar();
  const { can } = usePermission();

  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');

  const [dialog, setDialog] = useState({ open: false, mode: 'create', dept: null });
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, dept: null });

  const load = async () => {
    setLoading(true);
    try {
      const r = await svc.getDepartments({ page: page + 1, limit: 15, search: search || undefined, factoryId });
      setDepartments(r.data.data);
      setTotal(r.data.pagination.total);
    } catch (err) { enqueueSnackbar(err?.response?.data?.message || err?.message || 'Xatolik yuz berdi', { variant: 'error' }); }
    finally { setLoading(false); }
  };

  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t); }, [search, page]);

  const openCreate = () => {
    setForm({ ...EMPTY, factoryId: factoryId || '' });
    setDialog({ open: true, mode: 'create', dept: null });
  };

  const openEdit = (dept) => {
    setForm({ name: dept.name, code: dept.code, description: dept.description || '', factoryId: dept.factoryId });
    setDialog({ open: true, mode: 'edit', dept });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (dialog.mode === 'create') {
        await svc.createDepartment(form);
        enqueueSnackbar('Bo\'lim yaratildi', { variant: 'success' });
      } else {
        await svc.updateDepartment(dialog.dept.id, { name: form.name, description: form.description });
        enqueueSnackbar('Yangilandi', { variant: 'success' });
      }
      setDialog({ open: false, mode: 'create', dept: null });
      load();
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Xatolik', { variant: 'error' });
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try {
      await svc.deleteDepartment(deleteDialog.dept.id);
      enqueueSnackbar('Bo\'lim o\'chirildi', { variant: 'success' });
      setDeleteDialog({ open: false, dept: null });
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
        {can('departments:create') && (
          <Button variant="contained" startIcon={<Add />} onClick={openCreate}>
            Bo'lim qo'shish
          </Button>
        )}
      </Box>

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Bo'lim</TableCell>
              <TableCell>Kodi</TableCell>
              <TableCell>Zavod</TableCell>
              <TableCell align="center">Xodimlar</TableCell>
              <TableCell align="center">Foydalanuvchilar</TableCell>
              <TableCell>Holat</TableCell>
              <TableCell align="right">Amallar</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4 }}><CircularProgress size={28} /></TableCell></TableRow>
            ) : departments.map((d) => (
              <TableRow key={d.id} hover>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Business fontSize="small" color="action" />
                    <Typography variant="body2" fontWeight={600}>{d.name}</Typography>
                  </Box>
                </TableCell>
                <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600 }}>{d.code}</TableCell>
                <TableCell>{d.factory?.name}</TableCell>
                <TableCell align="center">
                  <Chip icon={<People fontSize="small" />} label={d._count?.employees || 0} size="small" />
                </TableCell>
                <TableCell align="center">
                  <Chip label={d._count?.users || 0} size="small" variant="outlined" />
                </TableCell>
                <TableCell>
                  <Chip label={d.isActive ? 'Faol' : 'Nofaol'} size="small" color={d.isActive ? 'success' : 'default'} />
                </TableCell>
                <TableCell align="right">
                  <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                    {can('departments:update') && (
                      <Tooltip title="Tahrirlash">
                        <IconButton size="small" onClick={() => openEdit(d)}>
                          <Edit fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    {can('departments:delete') && (
                      <Tooltip title="O'chirish">
                        <IconButton size="small" color="error" onClick={() => setDeleteDialog({ open: true, dept: d })}>
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
      <Dialog open={dialog.open} onClose={() => setDialog({ open: false, mode: 'create', dept: null })} maxWidth="xs" fullWidth>
        <DialogTitle>{dialog.mode === 'create' ? 'Yangi bo\'lim' : 'Bo\'limni tahrirlash'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField label="Nomi *" fullWidth size="small" {...F('name')} />
          {dialog.mode === 'create' && (
            <TextField
              label="Kodi * (masalan: PROD-02)"
              fullWidth size="small"
              {...F('code')}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
            />
          )}
          <TextField label="Tavsif" fullWidth size="small" multiline rows={2} {...F('description')} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialog({ open: false, mode: 'create', dept: null })}>Bekor</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving || !form.name}>
            {saving ? <CircularProgress size={18} color="inherit" /> : 'Saqlash'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, dept: null })} maxWidth="xs" fullWidth>
        <DialogTitle>Bo'limni o'chirish</DialogTitle>
        <DialogContent>
          <Alert severity="warning">
            <strong>{deleteDialog.dept?.name}</strong> bo'limi o'chiriladi. Xodimlari bo'lsa o'chirilmaydi.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, dept: null })}>Bekor</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>O'chirish</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DepartmentsTab;
