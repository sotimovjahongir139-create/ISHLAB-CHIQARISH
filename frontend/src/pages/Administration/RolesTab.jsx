import {
  Box, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, IconButton, Tooltip, Typography,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, CircularProgress, Alert, Grid,
  Accordion, AccordionSummary, AccordionDetails,
  FormControlLabel, Checkbox, Divider,
} from '@mui/material';
import { Add, Edit, Delete, Security, ExpandMore, People } from '@mui/icons-material';
import { useState, useEffect } from 'react';
import { useSnackbar } from 'notistack';
import * as svc from '../../services/admin.service';
import usePermission from '../../hooks/usePermission';

const MODULE_LABELS = {
  users: 'Foydalanuvchilar',
  roles: 'Rollar',
  departments: 'Bo\'limlar',
  production: 'Ishlab chiqarish',
  quality: 'Sifat nazorati',
  downtime: "To'xtalishlar",
  materials: 'Xomashyo',
  employees: 'Xodimlar',
  equipment: 'Uskunalar',
  audit: 'Audit jurnali',
  reports: 'Hisobotlar',
  settings: 'Sozlamalar',
};

const ACTION_LABELS = {
  read: 'Ko\'rish',
  create: 'Yaratish',
  update: 'Tahrirlash',
  delete: 'O\'chirish',
  export: 'Eksport',
};

const ACTION_COLORS = {
  read: 'info',
  create: 'success',
  update: 'warning',
  delete: 'error',
  export: 'secondary',
};

const RolesTab = () => {
  const { enqueueSnackbar } = useSnackbar();
  const { can } = usePermission();

  const [roles, setRoles] = useState([]);
  const [allPermissions, setAllPermissions] = useState({});
  const [loading, setLoading] = useState(false);

  const [createDialog, setCreateDialog] = useState(false);
  const [permDialog, setPermDialog] = useState({ open: false, role: null });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, role: null });

  const [createForm, setCreateForm] = useState({ name: '', displayName: '', description: '' });
  const [selectedPerms, setSelectedPerms] = useState(new Set());
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [rolesRes, permsRes] = await Promise.all([svc.getRoles(), svc.getAllPermissions()]);
      setRoles(rolesRes.data.data);
      setAllPermissions(permsRes.data.data);
    } catch (err) { enqueueSnackbar(err?.response?.data?.message || err?.message || 'Xatolik yuz berdi', { variant: 'error' }); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openPermDialog = (role) => {
    const current = new Set(role.permissions.map((rp) => rp.permission.id));
    setSelectedPerms(current);
    setPermDialog({ open: true, role });
  };

  const togglePerm = (permId) => {
    setSelectedPerms((prev) => {
      const next = new Set(prev);
      next.has(permId) ? next.delete(permId) : next.add(permId);
      return next;
    });
  };

  const toggleModule = (modulePerms, check) => {
    setSelectedPerms((prev) => {
      const next = new Set(prev);
      modulePerms.forEach((p) => check ? next.add(p.id) : next.delete(p.id));
      return next;
    });
  };

  const handleSavePermissions = async () => {
    setSaving(true);
    try {
      await svc.setRolePermissions(permDialog.role.id, [...selectedPerms]);
      enqueueSnackbar('Ruxsatlar saqlandi', { variant: 'success' });
      setPermDialog({ open: false, role: null });
      load();
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Xatolik', { variant: 'error' });
    } finally { setSaving(false); }
  };

  const handleCreateRole = async () => {
    setSaving(true);
    try {
      await svc.createRole(createForm);
      enqueueSnackbar('Rol yaratildi', { variant: 'success' });
      setCreateDialog(false);
      setCreateForm({ name: '', displayName: '', description: '' });
      load();
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Xatolik', { variant: 'error' });
    } finally { setSaving(false); }
  };

  const handleDeleteRole = async () => {
    try {
      await svc.deleteRole(deleteDialog.role.id);
      enqueueSnackbar('Rol o\'chirildi', { variant: 'success' });
      setDeleteDialog({ open: false, role: null });
      load();
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Xatolik', { variant: 'error' });
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        {can('roles:create') && (
          <Button variant="contained" startIcon={<Add />} onClick={() => setCreateDialog(true)}>
            Yangi rol
          </Button>
        )}
      </Box>

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Rol nomi</TableCell>
              <TableCell>Ko'rsatiladigan nom</TableCell>
              <TableCell align="center">Foydalanuvchilar</TableCell>
              <TableCell align="center">Ruxsatlar</TableCell>
              <TableCell>Tavsif</TableCell>
              <TableCell align="right">Amallar</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4 }}><CircularProgress size={28} /></TableCell></TableRow>
            ) : roles.map((role) => (
              <TableRow key={role.id} hover>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Security fontSize="small" color="primary" />
                    <Typography variant="body2" fontFamily="monospace" fontWeight={600}>{role.name}</Typography>
                    {role.isSystem && <Chip label="Tizim" size="small" variant="outlined" />}
                  </Box>
                </TableCell>
                <TableCell fontWeight={600}>{role.displayName}</TableCell>
                <TableCell align="center">
                  <Chip icon={<People fontSize="small" />} label={role._count?.users || 0} size="small" />
                </TableCell>
                <TableCell align="center">
                  <Chip label={role.permissions?.length || 0} size="small" color="primary" />
                </TableCell>
                <TableCell>
                  <Typography variant="caption" color="text.secondary">{role.description || '—'}</Typography>
                </TableCell>
                <TableCell align="right">
                  <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                    {can('roles:update') && (
                      <Tooltip title="Ruxsatlarni boshqarish">
                        <IconButton size="small" color="primary" onClick={() => openPermDialog(role)}>
                          <Security fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    {can('roles:delete') && !role.isSystem && (
                      <Tooltip title="O'chirish">
                        <IconButton size="small" color="error" onClick={() => setDeleteDialog({ open: true, role })}>
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

      {/* Create Role Dialog */}
      <Dialog open={createDialog} onClose={() => setCreateDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Yangi rol yaratish</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField
            label="Rol kodi (masalan: warehouse_manager)"
            size="small"
            value={createForm.name}
            onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value.toLowerCase().replace(/[^a-z_]/g, '') }))}
            helperText="Faqat kichik harf va _ belgisi"
          />
          <TextField
            label="Ko'rsatiladigan nom (masalan: Ombor menedjeri)"
            size="small"
            value={createForm.displayName}
            onChange={(e) => setCreateForm((f) => ({ ...f, displayName: e.target.value }))}
          />
          <TextField
            label="Tavsif (ixtiyoriy)"
            size="small"
            multiline
            rows={2}
            value={createForm.description}
            onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setCreateDialog(false)}>Bekor</Button>
          <Button variant="contained" onClick={handleCreateRole} disabled={saving || !createForm.name || !createForm.displayName}>
            {saving ? <CircularProgress size={18} color="inherit" /> : 'Yaratish'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Permissions Matrix Dialog */}
      <Dialog open={permDialog.open} onClose={() => setPermDialog({ open: false, role: null })} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Security color="primary" />
          {permDialog.role?.displayName} — Ruxsatlar
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0 }}>
          {Object.entries(allPermissions).map(([module, perms]) => {
            const allChecked = perms.every((p) => selectedPerms.has(p.id));
            const someChecked = perms.some((p) => selectedPerms.has(p.id));

            return (
              <Accordion key={module} disableGutters elevation={0} sx={{ '&:not(:last-child)': { borderBottom: '1px solid', borderColor: 'divider' } }}>
                <AccordionSummary expandIcon={<ExpandMore />} sx={{ px: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={allChecked}
                          indeterminate={someChecked && !allChecked}
                          onChange={(e) => toggleModule(perms, e.target.checked)}
                          onClick={(e) => e.stopPropagation()}
                          size="small"
                        />
                      }
                      label={<Typography fontWeight={600}>{MODULE_LABELS[module] || module}</Typography>}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <Chip label={`${perms.filter((p) => selectedPerms.has(p.id)).length}/${perms.length}`} size="small" />
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ px: 4, pb: 2 }}>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {perms.map((p) => (
                      <FormControlLabel
                        key={p.id}
                        control={
                          <Checkbox
                            checked={selectedPerms.has(p.id)}
                            onChange={() => togglePerm(p.id)}
                            size="small"
                          />
                        }
                        label={
                          <Chip
                            label={ACTION_LABELS[p.action] || p.action}
                            size="small"
                            color={ACTION_COLORS[p.action] || 'default'}
                            variant={selectedPerms.has(p.id) ? 'filled' : 'outlined'}
                          />
                        }
                        sx={{ mr: 0 }}
                      />
                    ))}
                  </Box>
                </AccordionDetails>
              </Accordion>
            );
          })}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1 }}>
            {selectedPerms.size} ta ruxsat tanlandi
          </Typography>
          <Button onClick={() => setPermDialog({ open: false, role: null })}>Bekor</Button>
          <Button variant="contained" onClick={handleSavePermissions} disabled={saving}>
            {saving ? <CircularProgress size={18} color="inherit" /> : 'Saqlash'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, role: null })} maxWidth="xs" fullWidth>
        <DialogTitle>Rolni o'chirish</DialogTitle>
        <DialogContent>
          <Alert severity="error">
            <strong>{deleteDialog.role?.displayName}</strong> roli o'chiriladi. Foydalanuvchilari bo'lsa o'chirilmaydi.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, role: null })}>Bekor</Button>
          <Button variant="contained" color="error" onClick={handleDeleteRole}>O'chirish</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RolesTab;
