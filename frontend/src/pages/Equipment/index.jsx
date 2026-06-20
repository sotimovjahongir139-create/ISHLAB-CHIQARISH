import {
  Box, Typography, Card, CardContent, Button, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, TablePagination, CircularProgress, TextField,
  Dialog, DialogTitle, DialogContent, DialogActions,
  FormControl, InputLabel, Select, MenuItem, Grid,
  IconButton, Tooltip, Tabs, Tab, InputAdornment,
} from '@mui/material';
import { Add, Refresh, Edit, Delete, Build, Search, CheckCircle, Schedule } from '@mui/icons-material';
import UzDatePicker from '../../components/UzDatePicker';
import { useState, useEffect, useCallback } from 'react';
import { useSnackbar } from 'notistack';
import * as svc from '../../services/equipment.service';
import * as pSvc from '../../services/production.service';
import { EQUIPMENT_STATUS } from '../../constants';
import { format } from 'date-fns';
import usePermission from '../../hooks/usePermission';

const EQUIP_TYPES = ['MACHINE', 'CONVEYOR', 'ROBOT', 'TOOL', 'VEHICLE', 'ELECTRICAL', 'HVAC', 'OTHER'];
const MAINT_TYPES = { PREVENTIVE: 'Profilaktika', CORRECTIVE: 'Tuzatish', EMERGENCY: 'Shoshilinch' };
const MAINT_STATUS = { SCHEDULED: 'Rejalashtirilgan', IN_PROGRESS: 'Jarayonda', COMPLETED: 'Bajarildi', CANCELLED: 'Bekor' };

const EMPTY_EQ = { name: '', code: '', type: 'MACHINE', brand: '', model: '', serialNumber: '', location: '', description: '', productionLineId: '' };
const EMPTY_MAINT = { type: 'PREVENTIVE', scheduledDate: '', description: '' };
const EMPTY_COMPLETE = { completedDate: '', durationHours: '', cost: '', workDone: '', nextScheduled: '' };

const Equipment = () => {
  const { enqueueSnackbar } = useSnackbar();
  const { can } = usePermission();
  const [tab, setTab] = useState(0);

  const [equipment, setEquipment] = useState([]);
  const [maintenances, setMaintenances] = useState([]);
  const [lines, setLines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedEq, setSelectedEq] = useState(null);

  const [eqDialog, setEqDialog] = useState({ open: false, mode: 'create', item: null });
  const [maintDialog, setMaintDialog] = useState({ open: false });
  const [statusDialog, setStatusDialog] = useState({ open: false, item: null, status: '' });
  const [completeDialog, setCompleteDialog] = useState({ open: false, equipId: null, maintId: null });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, item: null });
  const [eqForm, setEqForm] = useState(EMPTY_EQ);
  const [maintForm, setMaintForm] = useState(EMPTY_MAINT);
  const [completeForm, setCompleteForm] = useState(EMPTY_COMPLETE);
  const [saving, setSaving] = useState(false);

  const loadLines = useCallback(async () => {
    try {
      const r = await pSvc.getLines();
      setLines(r.data.data);
    } catch {}
  }, []);

  const loadEquipment = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: page + 1, limit: 15 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const r = await svc.getEquipment(params);
      setEquipment(r.data.data);
      setTotal(r.data.pagination.total);
    } catch (err) { enqueueSnackbar(err?.response?.data?.message || err?.message || 'Xatolik yuz berdi', { variant: 'error' }); }
    finally { setLoading(false); }
  }, [page, search, statusFilter]);

  const loadMaintenances = useCallback(async () => {
    if (!selectedEq) return;
    setLoading(true);
    try {
      const r = await svc.getMaintenances(selectedEq.id, { page: page + 1, limit: 15 });
      setMaintenances(r.data.data);
      setTotal(r.data.pagination.total);
    } catch {}
    finally { setLoading(false); }
  }, [selectedEq, page]);

  useEffect(() => { loadLines(); }, []);
  useEffect(() => {
    if (tab === 0) loadEquipment();
    else loadMaintenances();
  }, [tab, page, search, statusFilter, selectedEq]);

  const openCreate = () => {
    setEqForm(EMPTY_EQ);
    setEqDialog({ open: true, mode: 'create', item: null });
  };

  const openEdit = (e) => {
    setEqForm({ name: e.name, code: e.code, type: e.type, brand: e.brand || '', model: e.model || '', serialNumber: e.serialNumber || '', location: e.location || '', description: e.description || '', productionLineId: e.productionLineId || '' });
    setEqDialog({ open: true, mode: 'edit', item: e });
  };

  const openMaintenance = (eq) => {
    setSelectedEq(eq);
    setTab(1);
    setPage(0);
  };

  const handleSaveEq = async () => {
    setSaving(true);
    try {
      if (eqDialog.mode === 'create') {
        await svc.createEquipment(eqForm);
        enqueueSnackbar('Uskuna qo\'shildi', { variant: 'success' });
      } else {
        await svc.updateEquipment(eqDialog.item.id, eqForm);
        enqueueSnackbar('Yangilandi', { variant: 'success' });
      }
      setEqDialog({ open: false, mode: 'create', item: null });
      loadEquipment();
    } catch (err) { enqueueSnackbar(err.response?.data?.message || 'Xatolik', { variant: 'error' }); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try {
      await svc.deleteEquipment(deleteDialog.item.id);
      enqueueSnackbar('O\'chirildi', { variant: 'success' });
      setDeleteDialog({ open: false, item: null });
      loadEquipment();
    } catch (err) { enqueueSnackbar(err.response?.data?.message || 'Xatolik', { variant: 'error' }); }
  };

  const handleStatusUpdate = async () => {
    setSaving(true);
    try {
      await svc.updateStatus(statusDialog.item.id, statusDialog.status);
      enqueueSnackbar('Status yangilandi', { variant: 'success' });
      setStatusDialog({ open: false, item: null, status: '' });
      loadEquipment();
    } catch (err) { enqueueSnackbar(err.response?.data?.message || 'Xatolik', { variant: 'error' }); }
    finally { setSaving(false); }
  };

  const handleCreateMaint = async () => {
    setSaving(true);
    try {
      await svc.createMaintenance(selectedEq.id, maintForm);
      enqueueSnackbar('Texnik xizmat rejalashtirildi', { variant: 'success' });
      setMaintDialog({ open: false });
      loadMaintenances();
    } catch (err) { enqueueSnackbar(err.response?.data?.message || 'Xatolik', { variant: 'error' }); }
    finally { setSaving(false); }
  };

  const handleComplete = async () => {
    setSaving(true);
    try {
      await svc.completeMaintenance(completeDialog.equipId, completeDialog.maintId, {
        ...completeForm,
        durationHours: completeForm.durationHours ? parseFloat(completeForm.durationHours) : undefined,
        cost: completeForm.cost ? parseFloat(completeForm.cost) : undefined,
      });
      enqueueSnackbar('Texnik xizmat yakunlandi', { variant: 'success' });
      setCompleteDialog({ open: false, equipId: null, maintId: null });
      loadMaintenances();
    } catch (err) { enqueueSnackbar(err.response?.data?.message || 'Xatolik', { variant: 'error' }); }
    finally { setSaving(false); }
  };

  const Eqf = (key) => ({ value: eqForm[key], onChange: (e) => setEqForm((f) => ({ ...f, [key]: e.target.value })) });
  const Mf = (key) => ({ value: maintForm[key], onChange: (e) => setMaintForm((f) => ({ ...f, [key]: e.target.value })) });
  const Cf = (key) => ({ value: completeForm[key], onChange: (e) => setCompleteForm((f) => ({ ...f, [key]: e.target.value })) });

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Build sx={{ fontSize: 30, color: 'primary.main' }} />
          <Box>
            <Typography variant="h4">Uskunalar</Typography>
            <Typography variant="body2" color="text.secondary">Uskuna parki va texnik xizmat</Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button startIcon={<Refresh />} onClick={() => tab === 0 ? loadEquipment() : loadMaintenances()}>Yangilash</Button>
          {tab === 0 && can('equipment:create') && (
            <Button variant="contained" startIcon={<Add />} onClick={openCreate}>Uskuna qo'shish</Button>
          )}
          {tab === 1 && selectedEq && can('equipment:update') && (
            <Button variant="contained" startIcon={<Add />} onClick={() => { setMaintForm({ ...EMPTY_MAINT, scheduledDate: format(new Date(), 'yyyy-MM-dd') }); setMaintDialog({ open: true }); }}>
              Texnik xizmat rejalashtirish
            </Button>
          )}
        </Box>
      </Box>

      {tab === 0 && (
        <Card sx={{ mb: 2 }}>
          <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
            <Grid container spacing={1.5}>
              <Grid item xs={12} sm={5}>
                <TextField
                  placeholder="Nomi yoki kodi..."
                  value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                  size="small" fullWidth
                  InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }}
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <FormControl size="small" fullWidth>
                  <InputLabel>Holat</InputLabel>
                  <Select value={statusFilter} label="Holat" onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}>
                    <MenuItem value="">Barchasi</MenuItem>
                    {Object.entries(EQUIPMENT_STATUS).map(([k, v]) => <MenuItem key={k} value={k}>{v.label}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      <Tabs value={tab} onChange={(_, v) => { setTab(v); setPage(0); }} sx={{ mb: 2 }}>
        <Tab label="Uskunalar ro'yxati" />
        <Tab label={selectedEq ? `Texnik xizmat: ${selectedEq.name}` : 'Texnik xizmat'} disabled={!selectedEq} />
      </Tabs>

      <Card>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                {tab === 0 ? (
                  <>
                    <TableCell>Uskuna</TableCell>
                    <TableCell>Kodi</TableCell>
                    <TableCell>Turi</TableCell>
                    <TableCell>Liniya</TableCell>
                    <TableCell>Joylashuv</TableCell>
                    <TableCell>Holat</TableCell>
                    <TableCell align="right">Amallar</TableCell>
                  </>
                ) : (
                  <>
                    <TableCell>Turi</TableCell>
                    <TableCell>Rejalashtirilgan</TableCell>
                    <TableCell>Yakunlangan</TableCell>
                    <TableCell>Davomiyligi</TableCell>
                    <TableCell>Xarajat</TableCell>
                    <TableCell>Holat</TableCell>
                    {can('equipment:update') && <TableCell align="center">Amallar</TableCell>}
                  </>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4 }}><CircularProgress size={26} /></TableCell></TableRow>
              ) : tab === 0 ? (
                equipment.map((eq) => (
                  <TableRow key={eq.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>{eq.name}</Typography>
                      {eq.brand && <Typography variant="caption" color="text.secondary">{eq.brand} {eq.model}</Typography>}
                    </TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>{eq.code}</TableCell>
                    <TableCell><Chip label={eq.type} size="small" variant="outlined" /></TableCell>
                    <TableCell>{eq.productionLine?.name || '—'}</TableCell>
                    <TableCell>{eq.location || '—'}</TableCell>
                    <TableCell>
                      <Chip label={EQUIPMENT_STATUS[eq.status]?.label || eq.status} color={EQUIPMENT_STATUS[eq.status]?.color || 'default'} size="small" />
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                        <Tooltip title="Texnik xizmat">
                          <IconButton size="small" onClick={() => openMaintenance(eq)}>
                            <Schedule fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {can('equipment:update') && (
                          <>
                            <Tooltip title="Status o'zgartirish">
                              <IconButton size="small" color="primary" onClick={() => setStatusDialog({ open: true, item: eq, status: eq.status })}>
                                <Build fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Tahrirlash">
                              <IconButton size="small" onClick={() => openEdit(eq)}><Edit fontSize="small" /></IconButton>
                            </Tooltip>
                          </>
                        )}
                        {can('equipment:delete') && (
                          <Tooltip title="O'chirish">
                            <IconButton size="small" color="error" onClick={() => setDeleteDialog({ open: true, item: eq })}><Delete fontSize="small" /></IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                maintenances.map((m) => (
                  <TableRow key={m.id} hover>
                    <TableCell><Chip label={MAINT_TYPES[m.type] || m.type} size="small" color={m.type === 'EMERGENCY' ? 'error' : m.type === 'CORRECTIVE' ? 'warning' : 'info'} /></TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{format(new Date(m.scheduledDate), 'dd.MM.yyyy')}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{m.completedDate ? format(new Date(m.completedDate), 'dd.MM.yyyy') : '—'}</TableCell>
                    <TableCell>{m.durationHours ? `${m.durationHours}s` : '—'}</TableCell>
                    <TableCell>{m.cost ? `${m.cost.toLocaleString()} so'm` : '—'}</TableCell>
                    <TableCell><Chip label={MAINT_STATUS[m.status] || m.status} size="small" color={m.status === 'COMPLETED' ? 'success' : m.status === 'SCHEDULED' ? 'info' : 'warning'} /></TableCell>
                    {can('equipment:update') && (
                      <TableCell align="center">
                        {['SCHEDULED', 'IN_PROGRESS'].includes(m.status) && (
                          <Tooltip title="Yakunlash">
                            <IconButton size="small" color="success" onClick={() => { setCompleteDialog({ open: true, equipId: selectedEq.id, maintId: m.id }); setCompleteForm({ ...EMPTY_COMPLETE, completedDate: format(new Date(), 'yyyy-MM-dd') }); }}>
                              <CheckCircle fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
              {!loading && (tab === 0 ? equipment : maintenances).length === 0 && (
                <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>Ma'lumot topilmadi</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination component="div" count={total} page={page} rowsPerPage={15} rowsPerPageOptions={[15]}
          onPageChange={(_, p) => setPage(p)} labelDisplayedRows={({ from, to, count }) => `${from}–${to} / ${count}`} />
      </Card>

      {/* Create/Edit equipment dialog */}
      <Dialog open={eqDialog.open} onClose={() => setEqDialog({ open: false, mode: 'create', item: null })} maxWidth="sm" fullWidth>
        <DialogTitle>{eqDialog.mode === 'create' ? 'Yangi uskuna' : 'Uskunani tahrirlash'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={8}><TextField label="Nomi *" size="small" fullWidth {...Eqf('name')} /></Grid>
            <Grid item xs={4}><TextField label="Kodi *" size="small" fullWidth {...Eqf('code')} /></Grid>
            <Grid item xs={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Turi *</InputLabel>
                <Select value={eqForm.type} label="Turi *" onChange={(e) => setEqForm((f) => ({ ...f, type: e.target.value }))}>
                  {EQUIP_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Liniya</InputLabel>
                <Select value={eqForm.productionLineId} label="Liniya" onChange={(e) => setEqForm((f) => ({ ...f, productionLineId: e.target.value }))}>
                  <MenuItem value="">—</MenuItem>
                  {lines.map((l) => <MenuItem key={l.id} value={l.id}>{l.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}><TextField label="Brand" size="small" fullWidth {...Eqf('brand')} /></Grid>
            <Grid item xs={6}><TextField label="Model" size="small" fullWidth {...Eqf('model')} /></Grid>
            <Grid item xs={6}><TextField label="Seriya raqami" size="small" fullWidth {...Eqf('serialNumber')} /></Grid>
            <Grid item xs={6}><TextField label="Joylashuv" size="small" fullWidth {...Eqf('location')} /></Grid>
            <Grid item xs={12}><TextField label="Tavsif" size="small" fullWidth multiline rows={2} {...Eqf('description')} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEqDialog({ open: false, mode: 'create', item: null })}>Bekor</Button>
          <Button variant="contained" onClick={handleSaveEq} disabled={saving || !eqForm.name || !eqForm.code}>
            {saving ? <CircularProgress size={18} color="inherit" /> : 'Saqlash'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Status dialog */}
      <Dialog open={statusDialog.open} onClose={() => setStatusDialog({ open: false, item: null, status: '' })} maxWidth="xs" fullWidth>
        <DialogTitle>Holat o'zgartirish — {statusDialog.item?.name}</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Holat</InputLabel>
            <Select value={statusDialog.status} label="Holat" onChange={(e) => setStatusDialog((d) => ({ ...d, status: e.target.value }))}>
              {Object.entries(EQUIPMENT_STATUS).map(([k, v]) => <MenuItem key={k} value={k}>{v.label}</MenuItem>)}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialog({ open: false, item: null, status: '' })}>Bekor</Button>
          <Button variant="contained" onClick={handleStatusUpdate} disabled={saving}>
            {saving ? <CircularProgress size={18} color="inherit" /> : 'Saqlash'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Schedule maintenance dialog */}
      <Dialog open={maintDialog.open} onClose={() => setMaintDialog({ open: false })} maxWidth="sm" fullWidth>
        <DialogTitle>Texnik xizmat rejalashtirish — {selectedEq?.name}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Turi *</InputLabel>
                <Select value={maintForm.type} label="Turi *" onChange={(e) => setMaintForm((f) => ({ ...f, type: e.target.value }))}>
                  {Object.entries(MAINT_TYPES).map(([k, v]) => <MenuItem key={k} value={k}>{v}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}><UzDatePicker label="Sana *" required {...Mf('scheduledDate')} /></Grid>
            <Grid item xs={12}><TextField label="Tavsif" size="small" fullWidth multiline rows={3} {...Mf('description')} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setMaintDialog({ open: false })}>Bekor</Button>
          <Button variant="contained" onClick={handleCreateMaint} disabled={saving || !maintForm.scheduledDate}>
            {saving ? <CircularProgress size={18} color="inherit" /> : 'Rejalashtirish'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Complete maintenance dialog */}
      <Dialog open={completeDialog.open} onClose={() => setCompleteDialog({ open: false, equipId: null, maintId: null })} maxWidth="sm" fullWidth>
        <DialogTitle>Texnik xizmatni yakunlash</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={6}><UzDatePicker label="Yakunlangan sana *" required {...Cf('completedDate')} /></Grid>
            <Grid item xs={6}><TextField label="Davomiyligi (soat)" type="number" size="small" fullWidth {...Cf('durationHours')} /></Grid>
            <Grid item xs={6}><TextField label="Xarajat (so'm)" type="number" size="small" fullWidth {...Cf('cost')} /></Grid>
            <Grid item xs={6}><UzDatePicker label="Keyingi xizmat sanasi" {...Cf('nextScheduled')} /></Grid>
            <Grid item xs={12}><TextField label="Bajarilgan ishlar" size="small" fullWidth multiline rows={3} {...Cf('workDone')} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setCompleteDialog({ open: false, equipId: null, maintId: null })}>Bekor</Button>
          <Button variant="contained" color="success" onClick={handleComplete} disabled={saving || !completeForm.completedDate}>
            {saving ? <CircularProgress size={18} color="inherit" /> : 'Yakunlash'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, item: null })} maxWidth="xs" fullWidth>
        <DialogTitle>Uskunani o'chirish</DialogTitle>
        <DialogContent>
          <Typography><strong>{deleteDialog.item?.name}</strong> o'chiriladi. Tasdiqlaysizmi?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, item: null })}>Bekor</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>O'chirish</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Equipment;
