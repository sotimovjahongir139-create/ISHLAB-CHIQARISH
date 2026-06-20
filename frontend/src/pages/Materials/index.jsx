import {
  Box, Typography, Card, CardContent, Button, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, TablePagination, CircularProgress, TextField,
  Dialog, DialogTitle, DialogContent, DialogActions,
  FormControl, InputLabel, Select, MenuItem, Grid,
  IconButton, Tooltip, LinearProgress, InputAdornment, Tabs, Tab,
} from '@mui/material';
import { Add, Refresh, Edit, SwapHoriz, Inventory, Search, Warning } from '@mui/icons-material';
import { useState, useEffect, useCallback } from 'react';
import { useSnackbar } from 'notistack';
import * as svc from '../../services/material.service';
import * as adminSvc from '../../services/admin.service';
import { TRANSACTION_TYPE } from '../../constants';
import { format } from 'date-fns';
import usePermission from '../../hooks/usePermission';

const DEFAULT_CATS = [
  { id: 'RAW_MATERIAL', label: 'Xomashyo' }, { id: 'COMPONENT', label: 'Komponent' },
  { id: 'PACKAGING', label: 'Qadoqlash' }, { id: 'CONSUMABLE', label: 'Sarflanadigan' },
  { id: 'SPARE_PART', label: 'Ehtiyot qism' }, { id: 'OTHER', label: 'Boshqa' },
];
const UNITS = ['dona', 'kg', 'l', 'm', 'm²', 'm³', 'sm', 'mm', 'g'];

const EMPTY_MAT = { name: '', code: '', unit: 'dona', category: '', minStock: '', maxStock: '', currentStock: '', unitCost: '', description: '' };
const EMPTY_TX = { type: 'IN', quantity: '', unitCost: '', transactionDate: '', reference: '', notes: '' };

const StockBar = ({ current, min, max }) => {
  if (!max) return <Typography variant="caption">{current?.toLocaleString() || 0}</Typography>;
  const pct = Math.min((current / max) * 100, 100);
  const color = current <= (min || 0) ? 'error' : current <= (max * 0.3) ? 'warning' : 'success';
  return (
    <Box sx={{ minWidth: 120 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.3 }}>
        <Typography variant="caption" fontWeight={700}>{current?.toLocaleString()}</Typography>
        <Typography variant="caption" color="text.secondary">/{max?.toLocaleString()}</Typography>
      </Box>
      <LinearProgress variant="determinate" value={pct} color={color} sx={{ height: 5, borderRadius: 3 }} />
    </Box>
  );
};

const Materials = () => {
  const { enqueueSnackbar } = useSnackbar();
  const { can } = usePermission();
  const [tab, setTab] = useState(0);
  const [categories, setCategories] = useState(DEFAULT_CATS);

  const [materials, setMaterials] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');

  const [selectedMat, setSelectedMat] = useState(null);

  const [matDialog, setMatDialog] = useState({ open: false, mode: 'create', item: null });
  const [txDialog, setTxDialog] = useState({ open: false, mat: null });
  const [matForm, setMatForm] = useState(EMPTY_MAT);
  const [txForm, setTxForm] = useState(EMPTY_TX);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: page + 1, limit: 15 };
      if (search) params.search = search;
      if (catFilter) params.category = catFilter;
      const r = await svc.getMaterials(params);
      setMaterials(r.data.data);
      setTotal(r.data.pagination.total);
    } catch (err) { enqueueSnackbar(err?.response?.data?.message || err?.message || 'Xatolik yuz berdi', { variant: 'error' }); }
    finally { setLoading(false); }
  }, [page, search, catFilter]);

  const loadTx = useCallback(async () => {
    if (!selectedMat) return;
    setLoading(true);
    try {
      const r = await svc.getTransactions(selectedMat.id, { page: page + 1, limit: 15 });
      setTransactions(r.data.data);
      setTotal(r.data.pagination.total);
    } catch {}
    finally { setLoading(false); }
  }, [selectedMat, page]);

  useEffect(() => {
    adminSvc.getLookup('material_categories').then((r) => {
      const items = r.data.data;
      if (items && items.length > 0) setCategories(items);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (tab === 0) { setPage(0); load(); }
    else if (tab === 1) { setPage(0); loadTx(); }
  }, [tab, search, catFilter]);

  useEffect(() => {
    if (tab === 0) load();
    else loadTx();
  }, [page]);

  const openCreate = () => {
    setMatForm(EMPTY_MAT);
    setMatDialog({ open: true, mode: 'create', item: null });
  };

  const openEdit = (m) => {
    setMatForm({ name: m.name, code: m.code, unit: m.unit, category: m.category, minStock: m.minStock ?? '', maxStock: m.maxStock ?? '', currentStock: m.currentStock, unitCost: m.unitCost ?? '', description: m.description || '' });
    setMatDialog({ open: true, mode: 'edit', item: m });
  };

  const openTransactions = (m) => {
    setSelectedMat(m);
    setTab(1);
    setPage(0);
  };

  const handleSaveMat = async () => {
    setSaving(true);
    try {
      const body = {
        ...matForm,
        minStock: matForm.minStock !== '' ? parseFloat(matForm.minStock) : null,
        maxStock: matForm.maxStock !== '' ? parseFloat(matForm.maxStock) : null,
        currentStock: parseFloat(matForm.currentStock || 0),
        unitCost: matForm.unitCost !== '' ? parseFloat(matForm.unitCost) : null,
      };
      if (matDialog.mode === 'create') {
        await svc.createMaterial(body);
        enqueueSnackbar('Xomashyo qo\'shildi', { variant: 'success' });
      } else {
        await svc.updateMaterial(matDialog.item.id, body);
        enqueueSnackbar('Yangilandi', { variant: 'success' });
      }
      setMatDialog({ open: false, mode: 'create', item: null });
      load();
    } catch (err) { enqueueSnackbar(err.response?.data?.message || 'Xatolik', { variant: 'error' }); }
    finally { setSaving(false); }
  };

  const handleSaveTx = async () => {
    setSaving(true);
    try {
      await svc.addTransaction(txDialog.mat.id, {
        ...txForm,
        quantity: parseFloat(txForm.quantity),
        unitCost: txForm.unitCost !== '' ? parseFloat(txForm.unitCost) : undefined,
        transactionDate: txForm.transactionDate || new Date().toISOString(),
      });
      enqueueSnackbar('Harakat qayd etildi', { variant: 'success' });
      setTxDialog({ open: false, mat: null });
      load();
      if (selectedMat?.id === txDialog.mat.id) loadTx();
    } catch (err) { enqueueSnackbar(err.response?.data?.message || 'Xatolik', { variant: 'error' }); }
    finally { setSaving(false); }
  };

  const Mf = (key) => ({ value: matForm[key], onChange: (e) => setMatForm((f) => ({ ...f, [key]: e.target.value })) });
  const Tf = (key) => ({ value: txForm[key], onChange: (e) => setTxForm((f) => ({ ...f, [key]: e.target.value })) });

  const lowStock = materials.filter((m) => m.minStock != null && m.currentStock <= m.minStock);

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Inventory sx={{ fontSize: 30, color: 'primary.main' }} />
          <Box>
            <Typography variant="h4">Xomashyo</Typography>
            <Typography variant="body2" color="text.secondary">Zaxira boshqaruvi va harakatlar</Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button startIcon={<Refresh />} onClick={() => tab === 0 ? load() : loadTx()}>Yangilash</Button>
          {tab === 0 && can('materials:create') && (
            <Button variant="contained" startIcon={<Add />} onClick={openCreate}>Xomashyo qo'shish</Button>
          )}
        </Box>
      </Box>

      {lowStock.length > 0 && (
        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
          {lowStock.slice(0, 3).map((m) => (
            <Chip key={m.id} icon={<Warning fontSize="small" />} label={`${m.name}: ${m.currentStock} ${m.unit}`} color="warning" size="small" />
          ))}
          {lowStock.length > 3 && <Chip label={`+${lowStock.length - 3} ta kam zaxira`} color="warning" size="small" />}
        </Box>
      )}

      <Tabs value={tab} onChange={(_, v) => { setTab(v); setPage(0); }} sx={{ mb: 2 }}>
        <Tab label="Xomashyolar" />
        <Tab label={selectedMat ? `Harakatlar: ${selectedMat.name}` : 'Harakatlar'} disabled={!selectedMat} />
      </Tabs>

      {tab === 0 && (
        <Card sx={{ mb: 2 }}>
          <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
            <Grid container spacing={1.5} alignItems="center">
              <Grid item xs={12} sm={5}>
                <TextField
                  placeholder="Nomi yoki kodi..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                  size="small"
                  fullWidth
                  InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }}
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <FormControl size="small" fullWidth>
                  <InputLabel>Kategoriya</InputLabel>
                  <Select value={catFilter} label="Kategoriya" onChange={(e) => { setCatFilter(e.target.value); setPage(0); }}>
                    <MenuItem value="">Barchasi</MenuItem>
                    {categories.map((c) => <MenuItem key={c.id} value={c.id}>{c.label}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      <Card>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                {tab === 0 ? (
                  <>
                    <TableCell>Xomashyo</TableCell>
                    <TableCell>Kodi</TableCell>
                    <TableCell>Kategoriya</TableCell>
                    <TableCell>Ombor</TableCell>
                    <TableCell>Zaxira</TableCell>
                    <TableCell align="right">Narx</TableCell>
                    <TableCell align="right">Amallar</TableCell>
                  </>
                ) : (
                  <>
                    <TableCell>Sana</TableCell>
                    <TableCell>Turi</TableCell>
                    <TableCell align="right">Miqdor</TableCell>
                    <TableCell align="right">Narx/birlik</TableCell>
                    <TableCell align="right">Oldingi</TableCell>
                    <TableCell align="right">Keyingi</TableCell>
                    <TableCell>Izoh</TableCell>
                  </>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4 }}><CircularProgress size={26} /></TableCell></TableRow>
              ) : tab === 0 ? (
                materials.map((m) => {
                  const isLow = m.minStock != null && m.currentStock <= m.minStock;
                  return (
                    <TableRow key={m.id} hover sx={{ bgcolor: isLow ? 'error.50' : 'inherit' }}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          {isLow && <Warning fontSize="small" color="error" />}
                          <Typography variant="body2" fontWeight={600}>{m.name}</Typography>
                        </Box>
                        {m.description && <Typography variant="caption" color="text.secondary">{m.description}</Typography>}
                      </TableCell>
                      <TableCell sx={{ fontFamily: 'monospace' }}>{m.code}</TableCell>
                      <TableCell><Chip label={categories.find((c) => c.id === m.category)?.label || m.category} size="small" variant="outlined" /></TableCell>
                      <TableCell>{m.warehouse?.name || '—'}</TableCell>
                      <TableCell><StockBar current={m.currentStock} min={m.minStock} max={m.maxStock} /> <Typography variant="caption" color="text.secondary">{m.unit}</Typography></TableCell>
                      <TableCell align="right">
                        {m.unitCost ? <Typography variant="body2">{m.unitCost.toLocaleString()} so'm</Typography> : '—'}
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                          {can('materials:update') && (
                            <>
                              <Tooltip title="Harakat qo'shish">
                                <IconButton size="small" color="primary" onClick={() => { setTxDialog({ open: true, mat: m }); setTxForm({ ...EMPTY_TX, transactionDate: format(new Date(), "yyyy-MM-dd'T'HH:mm") }); }}>
                                  <SwapHoriz fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Tahrirlash">
                                <IconButton size="small" onClick={() => openEdit(m)}><Edit fontSize="small" /></IconButton>
                              </Tooltip>
                            </>
                          )}
                          <Tooltip title="Harakatlarni ko'rish">
                            <IconButton size="small" onClick={() => openTransactions(m)}><SwapHoriz fontSize="small" color="action" /></IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                transactions.map((tx) => (
                  <TableRow key={tx.id} hover>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{format(new Date(tx.transactionDate || tx.createdAt), 'dd.MM.yyyy HH:mm')}</TableCell>
                    <TableCell>
                      <Chip
                        label={TRANSACTION_TYPE[tx.type]?.label || tx.type}
                        color={TRANSACTION_TYPE[tx.type]?.color || 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>{tx.quantity.toLocaleString()}</TableCell>
                    <TableCell align="right">{tx.unitCost ? tx.unitCost.toLocaleString() : '—'}</TableCell>
                    <TableCell align="right" sx={{ color: 'text.secondary' }}>{tx.stockBefore?.toLocaleString()}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>{tx.stockAfter?.toLocaleString()}</TableCell>
                    <TableCell><Typography variant="caption">{tx.notes || tx.reference || '—'}</Typography></TableCell>
                  </TableRow>
                ))
              )}
              {!loading && (tab === 0 ? materials : transactions).length === 0 && (
                <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>Ma'lumot topilmadi</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination component="div" count={total} page={page} rowsPerPage={15} rowsPerPageOptions={[15]}
          onPageChange={(_, p) => setPage(p)} labelDisplayedRows={({ from, to, count }) => `${from}–${to} / ${count}`} />
      </Card>

      {/* Create/Edit material dialog */}
      <Dialog open={matDialog.open} onClose={() => setMatDialog({ open: false, mode: 'create', item: null })} maxWidth="sm" fullWidth>
        <DialogTitle>{matDialog.mode === 'create' ? 'Yangi xomashyo' : 'Xomashyoni tahrirlash'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={8}><TextField label="Nomi *" size="small" fullWidth {...Mf('name')} /></Grid>
            <Grid item xs={4}><TextField label="Kodi *" size="small" fullWidth {...Mf('code')} /></Grid>
            <Grid item xs={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Kategoriya *</InputLabel>
                <Select value={matForm.category} label="Kategoriya *" onChange={(e) => setMatForm((f) => ({ ...f, category: e.target.value }))}>
                  {categories.map((c) => <MenuItem key={c.id} value={c.id}>{c.label}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Birlik *</InputLabel>
                <Select value={matForm.unit} label="Birlik *" onChange={(e) => setMatForm((f) => ({ ...f, unit: e.target.value }))}>
                  {UNITS.map((u) => <MenuItem key={u} value={u}>{u}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={4}><TextField label="Min zaxira" type="number" size="small" fullWidth {...Mf('minStock')} /></Grid>
            <Grid item xs={4}><TextField label="Max zaxira" type="number" size="small" fullWidth {...Mf('maxStock')} /></Grid>
            <Grid item xs={4}><TextField label="Joriy zaxira" type="number" size="small" fullWidth {...Mf('currentStock')} /></Grid>
            <Grid item xs={12}><TextField label="Tavsif" size="small" fullWidth multiline rows={2} {...Mf('description')} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setMatDialog({ open: false, mode: 'create', item: null })}>Bekor</Button>
          <Button variant="contained" onClick={handleSaveMat} disabled={saving || !matForm.name || !matForm.code}>
            {saving ? <CircularProgress size={18} color="inherit" /> : 'Saqlash'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Transaction dialog */}
      <Dialog open={txDialog.open} onClose={() => setTxDialog({ open: false, mat: null })} maxWidth="sm" fullWidth>
        <DialogTitle>Xomashyo harakati — {txDialog.mat?.name}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <FormControl fullWidth size="small">
                <InputLabel>Harakat turi *</InputLabel>
                <Select value={txForm.type} label="Harakat turi *" onChange={(e) => setTxForm((f) => ({ ...f, type: e.target.value }))}>
                  {Object.entries(TRANSACTION_TYPE).map(([k, v]) => <MenuItem key={k} value={k}>{v.label}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}><TextField label="Miqdor *" type="number" size="small" fullWidth {...Tf('quantity')} /></Grid>
            <Grid item xs={6}><TextField label="Narx/birlik (so'm)" type="number" size="small" fullWidth {...Tf('unitCost')} /></Grid>
            <Grid item xs={12}><TextField label="Sana" type="datetime-local" size="small" fullWidth InputLabelProps={{ shrink: true }} {...Tf('transactionDate')} /></Grid>
            <Grid item xs={12}><TextField label="Havola (hujjat raqami)" size="small" fullWidth {...Tf('reference')} /></Grid>
            <Grid item xs={12}><TextField label="Izoh" size="small" fullWidth multiline rows={2} {...Tf('notes')} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setTxDialog({ open: false, mat: null })}>Bekor</Button>
          <Button variant="contained" onClick={handleSaveTx} disabled={saving || !txForm.quantity}>
            {saving ? <CircularProgress size={18} color="inherit" /> : 'Kiritish'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Materials;
