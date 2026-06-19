import {
  Box, Typography, Grid, Card, CardContent,
  List, ListItem, ListItemText, ListItemSecondaryAction,
  Switch, Divider, Button, TextField,
  Tabs, Tab, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  FormControl, InputLabel, Select, MenuItem, Chip, CircularProgress,
  Tooltip,
} from '@mui/material';
import { Add, Edit, Delete, Refresh } from '@mui/icons-material';
import { useState, useEffect, useCallback } from 'react';
import { useSnackbar } from 'notistack';
import * as prodSvc from '../../services/production.service';
import * as dtSvc from '../../services/downtime.service';
import * as adminSvc from '../../services/admin.service';

const CATEGORY_LABELS = { PLANNED: 'Rejalashtirilgan', UNPLANNED: 'Rejalashtirilmagan' };

// ── Generic CRUD List Card ─────────────────────────────────────────────────
const CrudCard = ({ title, rows, columns, renderRow, onAdd, onEdit, onDelete, loading }) => (
  <Card>
    <CardContent sx={{ pb: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
        <Typography variant="h6">{title}</Typography>
        <Button size="small" variant="contained" startIcon={<Add />} onClick={onAdd}>Qo'shish</Button>
      </Box>
      {loading ? <Box sx={{ py: 3, textAlign: 'center' }}><CircularProgress size={24} /></Box> : (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                {columns.map((c) => <TableCell key={c}>{c}</TableCell>)}
                <TableCell align="right">Amallar</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow><TableCell colSpan={columns.length + 1} align="center" sx={{ py: 3, color: 'text.secondary' }}>Ma'lumot yo'q</TableCell></TableRow>
              ) : rows.map((row) => (
                <TableRow key={row.id} hover>
                  {renderRow(row)}
                  <TableCell align="right">
                    <Tooltip title="Tahrirlash"><IconButton size="small" onClick={() => onEdit(row)}><Edit fontSize="small" /></IconButton></Tooltip>
                    <Tooltip title="O'chirish"><IconButton size="small" color="error" onClick={() => onDelete(row)}><Delete fontSize="small" /></IconButton></Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </CardContent>
  </Card>
);

// ── Liniyalar tab ──────────────────────────────────────────────────────────
const EMPTY_LINE = { name: '', code: '', description: '', capacity: '' };
const LinesTab = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [lines, setLines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialog, setDialog] = useState({ open: false, mode: 'create', item: null });
  const [form, setForm] = useState(EMPTY_LINE);
  const [saving, setSaving] = useState(false);
  const [delDialog, setDelDialog] = useState({ open: false, item: null });

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await prodSvc.getLines(); setLines(r.data.data); }
    catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm(EMPTY_LINE); setDialog({ open: true, mode: 'create', item: null }); };
  const openEdit = (item) => {
    setForm({ name: item.name, code: item.code, description: item.description || '', capacity: item.capacity || '' });
    setDialog({ open: true, mode: 'edit', item });
  };

  const handleSave = async () => {
    if (!form.name || !form.code) { enqueueSnackbar('Nomi va kodi majburiy', { variant: 'warning' }); return; }
    setSaving(true);
    try {
      if (dialog.mode === 'create') { await prodSvc.createLine(form); enqueueSnackbar('Liniya qo\'shildi', { variant: 'success' }); }
      else { await prodSvc.updateLine(dialog.item.id, form); enqueueSnackbar('Yangilandi', { variant: 'success' }); }
      setDialog({ open: false, mode: 'create', item: null });
      load();
    } catch (err) { enqueueSnackbar(err.response?.data?.message || 'Xatolik', { variant: 'error' }); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try { await prodSvc.deleteLine(delDialog.item.id); enqueueSnackbar('O\'chirildi', { variant: 'success' }); setDelDialog({ open: false, item: null }); load(); }
    catch (err) { enqueueSnackbar(err.response?.data?.message || 'Xatolik', { variant: 'error' }); }
  };

  const F = (k) => ({ value: form[k], onChange: (e) => setForm((f) => ({ ...f, [k]: e.target.value })) });

  return (
    <>
      <CrudCard
        title="Ishlab chiqarish liniyalari"
        rows={lines}
        columns={['Nomi', 'Kodi', 'Quvvat (soat/dona)']}
        renderRow={(r) => (<><TableCell>{r.name}</TableCell><TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>{r.code}</TableCell><TableCell>{r.capacity || '—'}</TableCell></>)}
        onAdd={openCreate}
        onEdit={openEdit}
        onDelete={(r) => setDelDialog({ open: true, item: r })}
        loading={loading}
      />

      <Dialog open={dialog.open} onClose={() => setDialog({ open: false, mode: 'create', item: null })} maxWidth="xs" fullWidth>
        <DialogTitle>{dialog.mode === 'create' ? 'Yangi liniya' : 'Liniyani tahrirlash'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={8}><TextField label="Nomi *" size="small" fullWidth {...F('name')} /></Grid>
            <Grid item xs={4}><TextField label="Kodi *" size="small" fullWidth {...F('code')} /></Grid>
            <Grid item xs={12}><TextField label="Quvvat (dona/soat)" type="number" size="small" fullWidth {...F('capacity')} /></Grid>
            <Grid item xs={12}><TextField label="Tavsif" size="small" fullWidth multiline rows={2} {...F('description')} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialog({ open: false, mode: 'create', item: null })}>Bekor</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? <CircularProgress size={18} color="inherit" /> : 'Saqlash'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={delDialog.open} onClose={() => setDelDialog({ open: false, item: null })} maxWidth="xs" fullWidth>
        <DialogTitle>O'chirishni tasdiqlang</DialogTitle>
        <DialogContent><Typography><strong>{delDialog.item?.name}</strong> liniyasi o'chirilsinmi?</Typography></DialogContent>
        <DialogActions>
          <Button onClick={() => setDelDialog({ open: false, item: null })}>Bekor</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>O'chirish</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

// ── Sabablar tab ───────────────────────────────────────────────────────────
const EMPTY_REASON = { name: '', code: '', category: 'UNPLANNED', description: '' };
const ReasonsTab = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [reasons, setReasons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialog, setDialog] = useState({ open: false, mode: 'create', item: null });
  const [form, setForm] = useState(EMPTY_REASON);
  const [saving, setSaving] = useState(false);
  const [delDialog, setDelDialog] = useState({ open: false, item: null });

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await dtSvc.getReasons(); setReasons(r.data.data); }
    catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm(EMPTY_REASON); setDialog({ open: true, mode: 'create', item: null }); };
  const openEdit = (item) => {
    setForm({ name: item.name, code: item.code, category: item.category, description: item.description || '' });
    setDialog({ open: true, mode: 'edit', item });
  };

  const handleSave = async () => {
    if (!form.name || !form.code) { enqueueSnackbar('Nomi va kodi majburiy', { variant: 'warning' }); return; }
    setSaving(true);
    try {
      if (dialog.mode === 'create') { await dtSvc.createReason(form); enqueueSnackbar('Sabab qo\'shildi', { variant: 'success' }); }
      else { await dtSvc.updateReason(dialog.item.id, form); enqueueSnackbar('Yangilandi', { variant: 'success' }); }
      setDialog({ open: false, mode: 'create', item: null });
      load();
    } catch (err) { enqueueSnackbar(err.response?.data?.message || 'Xatolik', { variant: 'error' }); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try { await dtSvc.deleteReason(delDialog.item.id); enqueueSnackbar('O\'chirildi', { variant: 'success' }); setDelDialog({ open: false, item: null }); load(); }
    catch (err) { enqueueSnackbar(err.response?.data?.message || 'Xatolik', { variant: 'error' }); }
  };

  const F = (k) => ({ value: form[k], onChange: (e) => setForm((f) => ({ ...f, [k]: e.target.value })) });

  return (
    <>
      <CrudCard
        title="To'xtalish sabablari"
        rows={reasons}
        columns={['Nomi', 'Kodi', 'Kategoriya']}
        renderRow={(r) => (<><TableCell>{r.name}</TableCell><TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>{r.code}</TableCell><TableCell><Chip label={CATEGORY_LABELS[r.category] || r.category} size="small" color={r.category === 'PLANNED' ? 'info' : 'warning'} /></TableCell></>)}
        onAdd={openCreate}
        onEdit={openEdit}
        onDelete={(r) => setDelDialog({ open: true, item: r })}
        loading={loading}
      />

      <Dialog open={dialog.open} onClose={() => setDialog({ open: false, mode: 'create', item: null })} maxWidth="xs" fullWidth>
        <DialogTitle>{dialog.mode === 'create' ? 'Yangi sabab' : 'Sababni tahrirlash'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={8}><TextField label="Nomi *" size="small" fullWidth {...F('name')} /></Grid>
            <Grid item xs={4}><TextField label="Kodi *" size="small" fullWidth {...F('code')} /></Grid>
            <Grid item xs={12}>
              <FormControl fullWidth size="small">
                <InputLabel>Kategoriya</InputLabel>
                <Select value={form.category} label="Kategoriya" onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
                  <MenuItem value="PLANNED">Rejalashtirilgan</MenuItem>
                  <MenuItem value="UNPLANNED">Rejalashtirilmagan</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}><TextField label="Tavsif" size="small" fullWidth multiline rows={2} {...F('description')} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialog({ open: false, mode: 'create', item: null })}>Bekor</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? <CircularProgress size={18} color="inherit" /> : 'Saqlash'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={delDialog.open} onClose={() => setDelDialog({ open: false, item: null })} maxWidth="xs" fullWidth>
        <DialogTitle>O'chirishni tasdiqlang</DialogTitle>
        <DialogContent><Typography><strong>{delDialog.item?.name}</strong> sababi o'chirilsinmi?</Typography></DialogContent>
        <DialogActions>
          <Button onClick={() => setDelDialog({ open: false, item: null })}>Bekor</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>O'chirish</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

// ── Bo'limlar tab ──────────────────────────────────────────────────────────
const EMPTY_DEPT = { name: '', code: '', description: '' };
const DeptsTab = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [depts, setDepts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialog, setDialog] = useState({ open: false, mode: 'create', item: null });
  const [form, setForm] = useState(EMPTY_DEPT);
  const [saving, setSaving] = useState(false);
  const [delDialog, setDelDialog] = useState({ open: false, item: null });
  const [factoryId, setFactoryId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await adminSvc.getDepartments(); setDepts(r.data.data); }
    catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm(EMPTY_DEPT); setDialog({ open: true, mode: 'create', item: null }); };
  const openEdit = (item) => {
    setForm({ name: item.name, code: item.code, description: item.description || '' });
    setDialog({ open: true, mode: 'edit', item });
  };

  const handleSave = async () => {
    if (!form.name || !form.code) { enqueueSnackbar('Nomi va kodi majburiy', { variant: 'warning' }); return; }
    setSaving(true);
    try {
      if (dialog.mode === 'create') {
        const r = await adminSvc.getDepartments();
        const fId = r.data.data?.[0]?.factoryId;
        await adminSvc.createDepartment({ ...form, factoryId: fId });
        enqueueSnackbar('Bo\'lim qo\'shildi', { variant: 'success' });
      } else {
        await adminSvc.updateDepartment(dialog.item.id, form);
        enqueueSnackbar('Yangilandi', { variant: 'success' });
      }
      setDialog({ open: false, mode: 'create', item: null });
      load();
    } catch (err) { enqueueSnackbar(err.response?.data?.message || 'Xatolik', { variant: 'error' }); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try { await adminSvc.deleteDepartment(delDialog.item.id); enqueueSnackbar('O\'chirildi', { variant: 'success' }); setDelDialog({ open: false, item: null }); load(); }
    catch (err) { enqueueSnackbar(err.response?.data?.message || 'Xatolik', { variant: 'error' }); }
  };

  const F = (k) => ({ value: form[k], onChange: (e) => setForm((f) => ({ ...f, [k]: e.target.value })) });

  return (
    <>
      <CrudCard
        title="Bo'limlar"
        rows={depts}
        columns={['Nomi', 'Kodi']}
        renderRow={(r) => (<><TableCell>{r.name}</TableCell><TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>{r.code}</TableCell></>)}
        onAdd={openCreate}
        onEdit={openEdit}
        onDelete={(r) => setDelDialog({ open: true, item: r })}
        loading={loading}
      />

      <Dialog open={dialog.open} onClose={() => setDialog({ open: false, mode: 'create', item: null })} maxWidth="xs" fullWidth>
        <DialogTitle>{dialog.mode === 'create' ? 'Yangi bo\'lim' : 'Bo\'limni tahrirlash'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={8}><TextField label="Nomi *" size="small" fullWidth {...F('name')} /></Grid>
            <Grid item xs={4}><TextField label="Kodi *" size="small" fullWidth {...F('code')} /></Grid>
            <Grid item xs={12}><TextField label="Tavsif" size="small" fullWidth multiline rows={2} {...F('description')} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialog({ open: false, mode: 'create', item: null })}>Bekor</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? <CircularProgress size={18} color="inherit" /> : 'Saqlash'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={delDialog.open} onClose={() => setDelDialog({ open: false, item: null })} maxWidth="xs" fullWidth>
        <DialogTitle>O'chirishni tasdiqlang</DialogTitle>
        <DialogContent><Typography><strong>{delDialog.item?.name}</strong> bo'limi o'chirilsinmi?</Typography></DialogContent>
        <DialogActions>
          <Button onClick={() => setDelDialog({ open: false, item: null })}>Bekor</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>O'chirish</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

// ── Material Kategoriyalari tab ────────────────────────────────────────────
const DEFAULT_CATS = [
  { id: 'RAW_MATERIAL', label: 'Xomashyo' },
  { id: 'COMPONENT', label: 'Komponent' },
  { id: 'PACKAGING', label: 'Qadoqlash' },
  { id: 'CONSUMABLE', label: 'Sarflanadigan' },
  { id: 'SPARE_PART', label: 'Ehtiyot qism' },
  { id: 'OTHER', label: 'Boshqa' },
];

const CatsTab = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialog, setDialog] = useState({ open: false, mode: 'create', idx: null });
  const [form, setForm] = useState({ id: '', label: '' });
  const [saving, setSaving] = useState(false);
  const [delIdx, setDelIdx] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await adminSvc.getLookup('material_categories');
      const items = r.data.data;
      setCats(items.length > 0 ? items : DEFAULT_CATS);
    } catch { setCats(DEFAULT_CATS); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, []);

  const save = async (updatedCats) => {
    setSaving(true);
    try {
      await adminSvc.setLookup('material_categories', updatedCats);
      setCats(updatedCats);
      enqueueSnackbar('Saqlandi', { variant: 'success' });
    } catch { enqueueSnackbar('Xatolik', { variant: 'error' }); }
    finally { setSaving(false); }
  };

  const handleSaveItem = async () => {
    if (!form.id || !form.label) { enqueueSnackbar('Kodi va nomi majburiy', { variant: 'warning' }); return; }
    const updated = dialog.mode === 'create'
      ? [...cats, { id: form.id.toUpperCase().replace(/\s/g, '_'), label: form.label }]
      : cats.map((c, i) => i === dialog.idx ? { id: form.id, label: form.label } : c);
    await save(updated);
    setDialog({ open: false, mode: 'create', idx: null });
  };

  const handleDelete = async () => {
    const updated = cats.filter((_, i) => i !== delIdx);
    await save(updated);
    setDelIdx(null);
  };

  return (
    <>
      <Card>
        <CardContent sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
            <Typography variant="h6">Material kategoriyalari</Typography>
            <Button size="small" variant="contained" startIcon={<Add />} onClick={() => { setForm({ id: '', label: '' }); setDialog({ open: true, mode: 'create', idx: null }); }}>Qo'shish</Button>
          </Box>
          {loading ? <Box sx={{ py: 3, textAlign: 'center' }}><CircularProgress size={24} /></Box> : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow><TableCell>Kodi</TableCell><TableCell>Nomi</TableCell><TableCell align="right">Amallar</TableCell></TableRow>
                </TableHead>
                <TableBody>
                  {cats.map((c, i) => (
                    <TableRow key={i} hover>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>{c.id}</TableCell>
                      <TableCell>{c.label}</TableCell>
                      <TableCell align="right">
                        <Tooltip title="Tahrirlash"><IconButton size="small" onClick={() => { setForm({ id: c.id, label: c.label }); setDialog({ open: true, mode: 'edit', idx: i }); }}><Edit fontSize="small" /></IconButton></Tooltip>
                        <Tooltip title="O'chirish"><IconButton size="small" color="error" onClick={() => setDelIdx(i)}><Delete fontSize="small" /></IconButton></Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                  {cats.length === 0 && <TableRow><TableCell colSpan={3} align="center" sx={{ py: 3, color: 'text.secondary' }}>Kategoriya yo'q</TableCell></TableRow>}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialog.open} onClose={() => setDialog({ open: false, mode: 'create', idx: null })} maxWidth="xs" fullWidth>
        <DialogTitle>{dialog.mode === 'create' ? 'Yangi kategoriya' : 'Kategoriyani tahrirlash'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}><TextField label="Kodi *" size="small" fullWidth value={form.id} onChange={(e) => setForm((f) => ({ ...f, id: e.target.value }))} helperText="Masalan: RAW_MATERIAL (lotin katta harflar)" /></Grid>
            <Grid item xs={12}><TextField label="Nomi *" size="small" fullWidth value={form.label} onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialog({ open: false, mode: 'create', idx: null })}>Bekor</Button>
          <Button variant="contained" onClick={handleSaveItem} disabled={saving}>
            {saving ? <CircularProgress size={18} color="inherit" /> : 'Saqlash'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={delIdx !== null} onClose={() => setDelIdx(null)} maxWidth="xs" fullWidth>
        <DialogTitle>O'chirishni tasdiqlang</DialogTitle>
        <DialogContent><Typography><strong>{delIdx !== null ? cats[delIdx]?.label : ''}</strong> kategoriyasi o'chirilsinmi?</Typography></DialogContent>
        <DialogActions>
          <Button onClick={() => setDelIdx(null)}>Bekor</Button>
          <Button variant="contained" color="error" onClick={handleDelete} disabled={saving}>O'chirish</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

// ── Main Settings page ─────────────────────────────────────────────────────
const Settings = () => {
  const [mainTab, setMainTab] = useState(0);
  const [lugTab, setLugTab] = useState(0);

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>Sozlamalar</Typography>
      <Tabs value={mainTab} onChange={(_, v) => setMainTab(v)} sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
        <Tab label="Umumiy" />
        <Tab label="Lug'atlar" />
      </Tabs>

      {mainTab === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>Umumiy sozlamalar</Typography>
                <List disablePadding>
                  <ListItem disablePadding sx={{ py: 1.5 }}>
                    <ListItemText primary="Til" secondary="Interfeys tili" />
                    <ListItemSecondaryAction>
                      <Typography variant="body2" color="primary">O'zbek (Lotin)</Typography>
                    </ListItemSecondaryAction>
                  </ListItem>
                  <Divider />
                  <ListItem disablePadding sx={{ py: 1.5 }}>
                    <ListItemText primary="Vaqt mintaqasi" secondary="Joriy vaqt mintaqasi" />
                    <ListItemSecondaryAction>
                      <Typography variant="body2" color="primary">Asia/Tashkent</Typography>
                    </ListItemSecondaryAction>
                  </ListItem>
                  <Divider />
                  <ListItem disablePadding sx={{ py: 1.5 }}>
                    <ListItemText primary="Bildirishnomalar" secondary="Push bildirishnomalarni yoqish" />
                    <ListItemSecondaryAction><Switch defaultChecked /></ListItemSecondaryAction>
                  </ListItem>
                  <Divider />
                  <ListItem disablePadding sx={{ py: 1.5 }}>
                    <ListItemText primary="To'xtalish ogohlantirishi" secondary="Faol to'xtalishlar haqida ogohlantirish" />
                    <ListItemSecondaryAction><Switch defaultChecked /></ListItemSecondaryAction>
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>KPI Maqsadlar</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField label="OEE Maqsad (%)" defaultValue="85" type="number" size="small" fullWidth />
                  <TextField label="Sifat o'tish foizi (%)" defaultValue="98" type="number" size="small" fullWidth />
                  <TextField label="Samaradorlik maqsad (%)" defaultValue="90" type="number" size="small" fullWidth />
                  <Button variant="contained">Saqlash</Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {mainTab === 1 && (
        <Box>
          <Tabs value={lugTab} onChange={(_, v) => setLugTab(v)} sx={{ mb: 2.5, borderBottom: 1, borderColor: 'divider' }}>
            <Tab label="Liniyalar" />
            <Tab label="To'xtalish sabablari" />
            <Tab label="Bo'limlar" />
            <Tab label="Material kategoriyalari" />
          </Tabs>
          {lugTab === 0 && <LinesTab />}
          {lugTab === 1 && <ReasonsTab />}
          {lugTab === 2 && <DeptsTab />}
          {lugTab === 3 && <CatsTab />}
        </Box>
      )}
    </Box>
  );
};

export default Settings;
