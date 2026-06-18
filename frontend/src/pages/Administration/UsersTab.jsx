import {
  Box, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TablePagination, Chip, Avatar, IconButton,
  TextField, InputAdornment, Tooltip, Switch,
  Dialog, DialogTitle, DialogContent, DialogActions,
  FormControl, InputLabel, Select, MenuItem, Grid,
  CircularProgress, Typography, Divider, Alert,
} from '@mui/material';
import {
  Add, Search, Edit, Delete, Lock, LockOpen,
  Password, Visibility, VisibilityOff,
} from '@mui/icons-material';
import { useState, useEffect } from 'react';
import { useSnackbar } from 'notistack';
import * as svc from '../../services/admin.service';
import { getRoles } from '../../services/admin.service';
import { EMPLOYEE_STATUS } from '../../constants';
import { format } from 'date-fns';
import usePermission from '../../hooks/usePermission';

const EMPTY_FORM = {
  email: '', username: '', password: '', firstName: '',
  lastName: '', phone: '', roleId: '', departmentId: '', factoryId: '',
};

const UsersTab = () => {
  const { enqueueSnackbar } = useSnackbar();
  const { can } = usePermission();

  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');

  const [dialog, setDialog] = useState({ open: false, mode: 'create', user: null });
  const [form, setForm] = useState(EMPTY_FORM);
  const [showPass, setShowPass] = useState(false);
  const [saving, setSaving] = useState(false);

  const [deleteDialog, setDeleteDialog] = useState({ open: false, user: null });
  const [resetDialog, setResetDialog] = useState({ open: false, user: null, newPass: '' });

  const load = async () => {
    setLoading(true);
    try {
      const r = await svc.getUsers({ page: page + 1, limit: 15, search: search || undefined });
      setUsers(r.data.data);
      setTotal(r.data.pagination.total);
    } catch { enqueueSnackbar('Foydalanuvchilarni yuklashda xatolik', { variant: 'error' }); }
    finally { setLoading(false); }
  };

  const loadRoles = async () => {
    const r = await getRoles();
    setRoles(r.data.data);
  };

  useEffect(() => { loadRoles(); }, []);
  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t); }, [search, page]);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setDialog({ open: true, mode: 'create', user: null });
  };

  const openEdit = (user) => {
    setForm({
      email: user.email,
      username: user.username,
      password: '',
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone || '',
      roleId: user.roleId,
      departmentId: user.departmentId || '',
      factoryId: user.factoryId || '',
    });
    setDialog({ open: true, mode: 'edit', user });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (dialog.mode === 'create') {
        await svc.createUser(form);
        enqueueSnackbar('Foydalanuvchi yaratildi', { variant: 'success' });
      } else {
        const payload = { ...form };
        if (!payload.password) delete payload.password;
        await svc.updateUser(dialog.user.id, payload);
        enqueueSnackbar('Yangilandi', { variant: 'success' });
      }
      setDialog({ open: false, mode: 'create', user: null });
      load();
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Xatolik', { variant: 'error' });
    } finally { setSaving(false); }
  };

  const handleToggle = async (user) => {
    try {
      await svc.toggleActive(user.id);
      enqueueSnackbar(user.isActive ? 'Bloklandi' : 'Faollashtirildi', { variant: 'success' });
      load();
    } catch (err) { enqueueSnackbar(err.response?.data?.message || 'Xatolik', { variant: 'error' }); }
  };

  const handleDelete = async () => {
    try {
      await svc.deleteUser(deleteDialog.user.id);
      enqueueSnackbar('O\'chirildi', { variant: 'success' });
      setDeleteDialog({ open: false, user: null });
      load();
    } catch (err) { enqueueSnackbar(err.response?.data?.message || 'Xatolik', { variant: 'error' }); }
  };

  const handleResetPassword = async () => {
    if (resetDialog.newPass.length < 8) {
      enqueueSnackbar('Parol kamida 8 belgi', { variant: 'warning' });
      return;
    }
    try {
      await svc.resetPassword(resetDialog.user.id, resetDialog.newPass);
      enqueueSnackbar('Parol tiklandi', { variant: 'success' });
      setResetDialog({ open: false, user: null, newPass: '' });
    } catch (err) { enqueueSnackbar(err.response?.data?.message || 'Xatolik', { variant: 'error' }); }
  };

  const F = (key) => ({ value: form[key], onChange: (e) => setForm((f) => ({ ...f, [key]: e.target.value })) });

  return (
    <Box>
      {/* Toolbar */}
      <Box sx={{ display: 'flex', gap: 1.5, mb: 2, alignItems: 'center' }}>
        <TextField
          placeholder="Email, ism, username bo'yicha qidirish..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="small"
          sx={{ width: 340 }}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }}
        />
        <Box sx={{ flexGrow: 1 }} />
        {can('users:create') && (
          <Button variant="contained" startIcon={<Add />} onClick={openCreate}>
            Foydalanuvchi qo'shish
          </Button>
        )}
      </Box>

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Foydalanuvchi</TableCell>
              <TableCell>Username</TableCell>
              <TableCell>Rol</TableCell>
              <TableCell>Bo'lim</TableCell>
              <TableCell>Oxirgi kirish</TableCell>
              <TableCell align="center">Holat</TableCell>
              <TableCell align="right">Amallar</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4 }}><CircularProgress size={28} /></TableCell></TableRow>
            ) : users.map((u) => (
              <TableRow key={u.id} hover>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar sx={{ width: 32, height: 32, bgcolor: u.isActive ? 'primary.main' : 'grey.400', fontSize: 12 }}>
                      {u.firstName[0]}{u.lastName[0]}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" fontWeight={600}>{u.lastName} {u.firstName}</Typography>
                      <Typography variant="caption" color="text.secondary">{u.email}</Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell sx={{ fontFamily: 'monospace', fontSize: 13 }}>{u.username}</TableCell>
                <TableCell>
                  <Chip label={u.role?.displayName} size="small" color="primary" variant="outlined" />
                </TableCell>
                <TableCell>{u.department?.name || '—'}</TableCell>
                <TableCell>
                  <Typography variant="caption" color="text.secondary">
                    {u.lastLoginAt ? format(new Date(u.lastLoginAt), 'dd.MM.yyyy HH:mm') : 'Hech qachon'}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Chip
                    label={u.isActive ? 'Faol' : 'Bloklangan'}
                    size="small"
                    color={u.isActive ? 'success' : 'error'}
                  />
                </TableCell>
                <TableCell align="right">
                  <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                    {can('users:update') && (
                      <>
                        <Tooltip title={u.isActive ? 'Bloklash' : 'Faollashtirish'}>
                          <IconButton size="small" onClick={() => handleToggle(u)}>
                            {u.isActive ? <Lock fontSize="small" /> : <LockOpen fontSize="small" />}
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Parol tiklash">
                          <IconButton size="small" onClick={() => setResetDialog({ open: true, user: u, newPass: '' })}>
                            <Password fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Tahrirlash">
                          <IconButton size="small" onClick={() => openEdit(u)}>
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}
                    {can('users:delete') && (
                      <Tooltip title="O'chirish">
                        <IconButton size="small" color="error" onClick={() => setDeleteDialog({ open: true, user: u })}>
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
      <Dialog open={dialog.open} onClose={() => setDialog({ open: false, mode: 'create', user: null })} maxWidth="sm" fullWidth>
        <DialogTitle>{dialog.mode === 'create' ? 'Yangi foydalanuvchi' : 'Foydalanuvchini tahrirlash'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={6}>
              <TextField label="Ism *" fullWidth size="small" {...F('firstName')} />
            </Grid>
            <Grid item xs={6}>
              <TextField label="Familiya *" fullWidth size="small" {...F('lastName')} />
            </Grid>
            <Grid item xs={6}>
              <TextField label="Email *" type="email" fullWidth size="small" {...F('email')} />
            </Grid>
            <Grid item xs={6}>
              <TextField label="Username *" fullWidth size="small" {...F('username')} />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label={dialog.mode === 'create' ? 'Parol *' : 'Yangi parol (ixtiyoriy)'}
                type={showPass ? 'text' : 'password'}
                fullWidth size="small"
                {...F('password')}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setShowPass((s) => !s)}>
                        {showPass ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField label="Telefon" fullWidth size="small" {...F('phone')} />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Rol *</InputLabel>
                <Select value={form.roleId} label="Rol *" onChange={(e) => setForm((f) => ({ ...f, roleId: e.target.value }))}>
                  {roles.map((r) => <MenuItem key={r.id} value={r.id}>{r.displayName}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialog({ open: false, mode: 'create', user: null })}>Bekor</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? <CircularProgress size={18} color="inherit" /> : 'Saqlash'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, user: null })} maxWidth="xs" fullWidth>
        <DialogTitle>O'chirishni tasdiqlang</DialogTitle>
        <DialogContent>
          <Alert severity="warning">
            <strong>{deleteDialog.user?.firstName} {deleteDialog.user?.lastName}</strong> foydalanuvchisi o'chiriladi. Bu amal qaytarilmaydi.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, user: null })}>Bekor</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>O'chirish</Button>
        </DialogActions>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={resetDialog.open} onClose={() => setResetDialog({ open: false, user: null, newPass: '' })} maxWidth="xs" fullWidth>
        <DialogTitle>Parol tiklash</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Typography variant="body2" sx={{ mb: 2 }}>
            <strong>{resetDialog.user?.firstName} {resetDialog.user?.lastName}</strong> uchun yangi parol:
          </Typography>
          <TextField
            label="Yangi parol"
            type={showPass ? 'text' : 'password'}
            fullWidth
            value={resetDialog.newPass}
            onChange={(e) => setResetDialog((d) => ({ ...d, newPass: e.target.value }))}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setShowPass((s) => !s)}>
                    {showPass ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResetDialog({ open: false, user: null, newPass: '' })}>Bekor</Button>
          <Button variant="contained" onClick={handleResetPassword}>Tiklash</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UsersTab;
