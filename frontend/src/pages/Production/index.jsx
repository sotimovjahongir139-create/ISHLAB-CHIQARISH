import {
  Box, Typography, Grid, Card, CardContent, Button, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, TablePagination, TextField, ToggleButtonGroup, ToggleButton,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Select, MenuItem, FormControl, InputLabel, CircularProgress,
  InputAdornment, IconButton, Tooltip, LinearProgress,
} from '@mui/material';
import {
  Add, Refresh, Edit, Delete, FilterList, Factory,
  CheckCircle, Warning, PlayArrow,
} from '@mui/icons-material';
import UzDatePicker from '../../components/UzDatePicker';
import { useState, useEffect, useCallback } from 'react';
import { useSnackbar } from 'notistack';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import * as svc from '../../services/production.service';
import { PLAN_STATUS } from '../../constants';
import { format } from 'date-fns';
import usePermission from '../../hooks/usePermission';

const EMPTY_PLAN = { planDate: '', plannedQty: '', productionLineId: '', productModelId: '', shiftId: '', planType: 'TEP', notes: '' };
const EMPTY_FACT = { factDate: '', producedQty: '', defectQty: '', productionLineId: '', productModelId: '', shiftId: '', planId: '', startTime: '', endTime: '', notes: '' };

const STATUS_LABELS = {
  DRAFT: 'Qoralama', CONFIRMED: 'Tasdiqlangan', IN_PROGRESS: 'Jarayonda',
  COMPLETED: 'Bajarildi', CANCELLED: 'Bekor',
};

const Production = () => {
  const { enqueueSnackbar } = useSnackbar();
  const { can } = usePermission();
  const [tab, setTab] = useState(0);

  // Lookup data
  const [lines, setLines] = useState([]);
  const [models, setModels] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [plans, setPlans] = useState([]);
  const [facts, setFacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);

  // Filters
  const [filters, setFilters] = useState({ lineId: '', modelId: '', shiftId: '', status: '', dateFrom: '', dateTo: '' });

  // Dialogs
  const [planDialog, setPlanDialog] = useState({ open: false, mode: 'create', item: null });
  const [factDialog, setFactDialog] = useState({ open: false });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, item: null });
  const [planForm, setPlanForm] = useState(EMPTY_PLAN);
  const [factForm, setFactForm] = useState(EMPTY_FACT);
  const [saving, setSaving] = useState(false);

  const loadLookups = useCallback(async () => {
    try {
      const [lR, mR, sR] = await Promise.all([svc.getLines(), svc.getProductModels(), svc.getShifts()]);
      setLines(lR.data.data);
      setModels(mR.data.data);
      setShifts(sR.data.data);
    } catch {}
  }, []);

  const loadPlans = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: page + 1, limit: 15 };
      if (filters.lineId) params.lineId = filters.lineId;
      if (filters.modelId) params.modelId = filters.modelId;
      if (filters.shiftId) params.shiftId = filters.shiftId;
      if (filters.status) params.status = filters.status;
      if (filters.dateFrom) params.dateFrom = filters.dateFrom;
      if (filters.dateTo) params.dateTo = filters.dateTo;
      const r = await svc.getPlans(params);
      setPlans(r.data.data);
      setTotal(r.data.pagination.total);
    } catch { enqueueSnackbar('Xatolik', { variant: 'error' }); }
    finally { setLoading(false); }
  }, [page, filters]);

  const loadFacts = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: page + 1, limit: 15 };
      if (filters.lineId) params.lineId = filters.lineId;
      if (filters.modelId) params.modelId = filters.modelId;
      if (filters.shiftId) params.shiftId = filters.shiftId;
      if (filters.dateFrom) params.dateFrom = filters.dateFrom;
      if (filters.dateTo) params.dateTo = filters.dateTo;
      const r = await svc.getFacts(params);
      setFacts(r.data.data);
      setTotal(r.data.pagination.total);
    } catch { enqueueSnackbar('Xatolik', { variant: 'error' }); }
    finally { setLoading(false); }
  }, [page, filters]);

  useEffect(() => { loadLookups(); }, []);
  useEffect(() => {
    if (tab === 0) loadPlans();
    else loadFacts();
  }, [tab, page, filters]);

  const setFilter = (key) => (e) => {
    setFilters((f) => ({ ...f, [key]: e.target.value }));
    setPage(0);
  };

  const openCreatePlan = () => {
    setPlanForm({ ...EMPTY_PLAN, planDate: format(new Date(), 'yyyy-MM-dd'), planType: tab === 1 ? 'PU' : 'TEP' });
    setPlanDialog({ open: true, mode: 'create', item: null });
  };

  const openEditPlan = (p) => {
    setPlanForm({
      planDate: format(new Date(p.planDate), 'yyyy-MM-dd'),
      plannedQty: p.plannedQty,
      productionLineId: p.productionLineId,
      productModelId: p.productModelId,
      shiftId: p.shiftId || '',
      planType: p.planType || 'TEP',
      notes: p.notes || '',
    });
    setPlanDialog({ open: true, mode: 'edit', item: p });
  };

  const handleSavePlan = async () => {
    setSaving(true);
    try {
      const body = { ...planForm, plannedQty: parseInt(planForm.plannedQty) };
      if (planDialog.mode === 'create') {
        await svc.createPlan(body);
        enqueueSnackbar('Reja yaratildi', { variant: 'success' });
      } else {
        await svc.updatePlan(planDialog.item.id, body);
        enqueueSnackbar('Reja yangilandi', { variant: 'success' });
      }
      setPlanDialog({ open: false, mode: 'create', item: null });
      loadPlans();
    } catch (err) { enqueueSnackbar(err.response?.data?.message || 'Xatolik', { variant: 'error' }); }
    finally { setSaving(false); }
  };

  const handleDeletePlan = async () => {
    try {
      await svc.deletePlan(deleteDialog.item.id);
      enqueueSnackbar('Reja o\'chirildi', { variant: 'success' });
      setDeleteDialog({ open: false, item: null });
      loadPlans();
    } catch (err) { enqueueSnackbar(err.response?.data?.message || 'Xatolik', { variant: 'error' }); }
  };

  const handleSaveFact = async () => {
    setSaving(true);
    try {
      const body = {
        ...factForm,
        producedQty: parseInt(factForm.producedQty),
        defectQty: parseInt(factForm.defectQty || 0),
        planId: factForm.planId || undefined,
      };
      await svc.createFact(body);
      enqueueSnackbar('Natija kiritildi', { variant: 'success' });
      setFactDialog({ open: false });
      loadFacts();
    } catch (err) { enqueueSnackbar(err.response?.data?.message || 'Xatolik', { variant: 'error' }); }
    finally { setSaving(false); }
  };

  const Pf = (key) => ({ value: planForm[key], onChange: (e) => setPlanForm((f) => ({ ...f, [key]: e.target.value })) });
  const Ff = (key) => ({ value: factForm[key], onChange: (e) => setFactForm((f) => ({ ...f, [key]: e.target.value })) });

  // Chart data — efficiency per line from facts
  const chartData = lines.map((line) => {
    const lineFacts = facts.filter((f) => f.productionLineId === line.id);
    const avgEff = lineFacts.length
      ? Math.round(lineFacts.reduce((a, f) => a + (f.efficiency || 0), 0) / lineFacts.length * 10) / 10
      : 0;
    return { name: line.name, samaradorlik: avgEff };
  }).filter((d) => d.samaradorlik > 0);

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Factory sx={{ fontSize: 30, color: 'primary.main' }} />
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Typography variant="h4">Ishlab chiqarish</Typography>
              <ToggleButtonGroup
                size="small"
                exclusive
                value={tab}
                onChange={(_, v) => { if (v !== null) { setTab(v); setPage(0); } }}
                sx={{ height: 28 }}
              >
                <ToggleButton value={1} sx={{ px: 1.5, py: 0, fontSize: 12, fontWeight: 700 }}>PU</ToggleButton>
                <ToggleButton value={0} sx={{ px: 1.5, py: 0, fontSize: 12, fontWeight: 700 }}>TEP</ToggleButton>
              </ToggleButtonGroup>
            </Box>
            <Typography variant="body2" color="text.secondary">
              {tab === 0 ? 'Rejalar (TEP)' : 'Haqiqiy natijalar (PU)'}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button startIcon={<Refresh />} onClick={() => tab === 0 ? loadPlans() : loadFacts()}>Yangilash</Button>
          {can('production:create') && (
            <Button variant="outlined" startIcon={<Add />} onClick={openCreatePlan}>Reja qo'shish</Button>
          )}
          {can('production:create') && (
            <Button variant="contained" startIcon={<Add />} onClick={() => { setFactForm({ ...EMPTY_FACT, factDate: format(new Date(), 'yyyy-MM-dd') }); setFactDialog({ open: true }); }}>
              Fakt qo'shish
            </Button>
          )}
        </Box>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
          <Grid container spacing={1.5} alignItems="center">
            <Grid item xs={6} sm={3} md={2}>
              <FormControl size="small" fullWidth>
                <InputLabel>Liniya</InputLabel>
                <Select value={filters.lineId} label="Liniya" onChange={setFilter('lineId')}>
                  <MenuItem value="">Barchasi</MenuItem>
                  {lines.map((l) => <MenuItem key={l.id} value={l.id}>{l.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} sm={3} md={2}>
              <FormControl size="small" fullWidth>
                <InputLabel>Model</InputLabel>
                <Select value={filters.modelId} label="Model" onChange={setFilter('modelId')}>
                  <MenuItem value="">Barchasi</MenuItem>
                  {models.map((m) => <MenuItem key={m.id} value={m.id}>{m.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} sm={3} md={2}>
              <FormControl size="small" fullWidth>
                <InputLabel>Smena</InputLabel>
                <Select value={filters.shiftId} label="Smena" onChange={setFilter('shiftId')}>
                  <MenuItem value="">Barchasi</MenuItem>
                  {shifts.map((s) => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            {tab === 0 && (
              <Grid item xs={6} sm={3} md={2}>
                <FormControl size="small" fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select value={filters.status} label="Status" onChange={setFilter('status')}>
                    <MenuItem value="">Barchasi</MenuItem>
                    {Object.entries(STATUS_LABELS).map(([k, v]) => <MenuItem key={k} value={k}>{v}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
            )}
            <Grid item xs={6} sm={3} md={2}>
              <UzDatePicker label="Dan" value={filters.dateFrom} onChange={setFilter('dateFrom')} />
            </Grid>
            <Grid item xs={6} sm={3} md={2}>
              <UzDatePicker label="Gacha" value={filters.dateTo} onChange={setFilter('dateTo')} />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Efficiency chart (facts tab) */}
      {tab === 1 && chartData.length > 0 && (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="subtitle2" sx={{ mb: 1.5 }}>Liniyalar bo'yicha samaradorlik</Typography>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 20, top: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
                <RTooltip formatter={(v) => [`${v}%`, 'Samaradorlik']} />
                <Bar dataKey="samaradorlik" fill="#1565C0" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
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
                    <TableCell>Bo'lim</TableCell>
                    <TableCell>Sana</TableCell>
                    <TableCell>Liniya</TableCell>
                    <TableCell>Model</TableCell>
                    <TableCell>Smena</TableCell>
                    <TableCell align="right">Reja (dona)</TableCell>
                    <TableCell>Status</TableCell>
                    {can('production:update') && <TableCell align="right">Amallar</TableCell>}
                  </>
                ) : (
                  <>
                    <TableCell>Sana</TableCell>
                    <TableCell>Liniya</TableCell>
                    <TableCell>Model</TableCell>
                    <TableCell>Smena</TableCell>
                    <TableCell align="right">Ishlab chiqarilgan</TableCell>
                    <TableCell align="right">Yaroqli</TableCell>
                    <TableCell align="right">Nuqson</TableCell>
                    <TableCell>Samaradorlik</TableCell>
                  </>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={8} align="center" sx={{ py: 4 }}><CircularProgress size={26} /></TableCell></TableRow>
              ) : tab === 0 ? (
                plans.map((p) => (
                  <TableRow key={p.id} hover>
                    <TableCell>
                      <Chip label={p.planType || 'TEP'} size="small" color={p.planType === 'PU' ? 'primary' : 'secondary'} variant="outlined" />
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{format(new Date(p.planDate), 'dd.MM.yyyy')}</TableCell>
                    <TableCell>{p.productionLine?.name}</TableCell>
                    <TableCell>{p.productModel?.name}</TableCell>
                    <TableCell>{p.shift?.name || '—'}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>{p.plannedQty.toLocaleString()}</TableCell>
                    <TableCell>
                      <Chip label={PLAN_STATUS[p.status]?.label || p.status} color={PLAN_STATUS[p.status]?.color || 'default'} size="small" />
                    </TableCell>
                    {can('production:update') && (
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                          <Tooltip title="Tahrirlash">
                            <IconButton size="small" onClick={() => openEditPlan(p)} disabled={['COMPLETED', 'CANCELLED'].includes(p.status)}>
                              <Edit fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          {can('production:delete') && (
                            <Tooltip title="O'chirish">
                              <IconButton size="small" color="error" onClick={() => setDeleteDialog({ open: true, item: p })} disabled={p.status !== 'DRAFT'}>
                                <Delete fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              ) : (
                facts.map((f) => (
                  <TableRow key={f.id} hover>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{format(new Date(f.factDate), 'dd.MM.yyyy')}</TableCell>
                    <TableCell>{f.productionLine?.name}</TableCell>
                    <TableCell>{f.productModel?.name}</TableCell>
                    <TableCell>{f.shift?.name || '—'}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>{f.producedQty.toLocaleString()}</TableCell>
                    <TableCell align="right" sx={{ color: 'success.main', fontWeight: 600 }}>{f.goodQty.toLocaleString()}</TableCell>
                    <TableCell align="right">
                      {f.defectQty > 0 ? (
                        <Chip label={f.defectQty} size="small" color="error" />
                      ) : (
                        <Chip label="0" size="small" color="success" variant="outlined" />
                      )}
                    </TableCell>
                    <TableCell sx={{ minWidth: 130 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={Math.min(f.efficiency || 0, 100)}
                          color={f.efficiency >= 90 ? 'success' : f.efficiency >= 75 ? 'warning' : 'error'}
                          sx={{ flexGrow: 1, height: 6, borderRadius: 3 }}
                        />
                        <Typography variant="caption" fontWeight={700}>{f.efficiency?.toFixed(1) || 0}%</Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
              {!loading && (tab === 0 ? plans : facts).length === 0 && (
                <TableRow><TableCell colSpan={8} align="center" sx={{ py: 4, color: 'text.secondary' }}>Ma'lumot topilmadi</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div" count={total} page={page} rowsPerPage={15} rowsPerPageOptions={[15]}
          onPageChange={(_, p) => setPage(p)}
          labelDisplayedRows={({ from, to, count }) => `${from}–${to} / ${count} ta`}
        />
      </Card>

      {/* Plan create/edit dialog */}
      <Dialog open={planDialog.open} onClose={() => setPlanDialog({ open: false, mode: 'create', item: null })} maxWidth="sm" fullWidth>
        <DialogTitle>
          {planDialog.mode === 'create' ? `Yangi reja (${planForm.planType})` : 'Rejani tahrirlash'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Bo'lim *</InputLabel>
                <Select value={planForm.planType} label="Bo'lim *" onChange={(e) => setPlanForm((f) => ({ ...f, planType: e.target.value }))}>
                  <MenuItem value="TEP">TEP</MenuItem>
                  <MenuItem value="PU">PU</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <UzDatePicker label="Sana *" required {...Pf('planDate')} />
            </Grid>
            <Grid item xs={6}>
              <TextField label="Reja miqdori (dona) *" type="number" size="small" fullWidth {...Pf('plannedQty')} />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Ishlab chiqarish liniyasi *</InputLabel>
                <Select value={planForm.productionLineId} label="Ishlab chiqarish liniyasi *" onChange={(e) => setPlanForm((f) => ({ ...f, productionLineId: e.target.value }))}>
                  {lines.map((l) => <MenuItem key={l.id} value={l.id}>{l.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Mahsulot modeli</InputLabel>
                <Select value={planForm.productModelId} label="Mahsulot modeli" onChange={(e) => setPlanForm((f) => ({ ...f, productModelId: e.target.value }))}>
                  <MenuItem value="">—</MenuItem>
                  {models.map((m) => <MenuItem key={m.id} value={m.id}>{m.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Smena</InputLabel>
                <Select value={planForm.shiftId} label="Smena" onChange={(e) => setPlanForm((f) => ({ ...f, shiftId: e.target.value }))}>
                  <MenuItem value="">—</MenuItem>
                  {shifts.map((s) => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField label="Izoh" size="small" fullWidth multiline rows={2} {...Pf('notes')} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setPlanDialog({ open: false, mode: 'create', item: null })}>Bekor</Button>
          <Button variant="contained" onClick={handleSavePlan} disabled={saving || !planForm.planDate || !planForm.plannedQty || !planForm.productionLineId}>
            {saving ? <CircularProgress size={18} color="inherit" /> : 'Saqlash'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Fact create dialog */}
      <Dialog open={factDialog.open} onClose={() => setFactDialog({ open: false })} maxWidth="sm" fullWidth>
        <DialogTitle>Natija kiritish (PU)</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={6}>
              <UzDatePicker label="Sana *" required {...Ff('factDate')} />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Liniya *</InputLabel>
                <Select value={factForm.productionLineId} label="Liniya *" onChange={(e) => setFactForm((f) => ({ ...f, productionLineId: e.target.value }))}>
                  {lines.map((l) => <MenuItem key={l.id} value={l.id}>{l.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <TextField label="Ishlab chiqarildi (dona) *" type="number" size="small" fullWidth {...Ff('producedQty')} />
            </Grid>
            <Grid item xs={6}>
              <TextField label="Nuqsonli (dona)" type="number" size="small" fullWidth {...Ff('defectQty')} />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Model</InputLabel>
                <Select value={factForm.productModelId} label="Model" onChange={(e) => setFactForm((f) => ({ ...f, productModelId: e.target.value }))}>
                  <MenuItem value="">—</MenuItem>
                  {models.map((m) => <MenuItem key={m.id} value={m.id}>{m.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Smena</InputLabel>
                <Select value={factForm.shiftId} label="Smena" onChange={(e) => setFactForm((f) => ({ ...f, shiftId: e.target.value }))}>
                  <MenuItem value="">—</MenuItem>
                  {shifts.map((s) => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth size="small">
                <InputLabel>Reja (ixtiyoriy)</InputLabel>
                <Select value={factForm.planId} label="Reja (ixtiyoriy)" onChange={(e) => setFactForm((f) => ({ ...f, planId: e.target.value }))}>
                  <MenuItem value="">—</MenuItem>
                  {plans.filter((p) => ['CONFIRMED', 'IN_PROGRESS'].includes(p.status)).map((p) => (
                    <MenuItem key={p.id} value={p.id}>{format(new Date(p.planDate), 'dd.MM.yyyy')} — {p.productionLine?.name} ({p.plannedQty} dona)</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField label="Izoh" size="small" fullWidth multiline rows={2} {...Ff('notes')} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setFactDialog({ open: false })}>Bekor</Button>
          <Button variant="contained" onClick={handleSaveFact} disabled={saving || !factForm.factDate || !factForm.producedQty || !factForm.productionLineId}>
            {saving ? <CircularProgress size={18} color="inherit" /> : 'Kiritish'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, item: null })} maxWidth="xs" fullWidth>
        <DialogTitle>Rejani o'chirish</DialogTitle>
        <DialogContent>
          <Typography>
            <strong>{deleteDialog.item && format(new Date(deleteDialog.item.planDate), 'dd.MM.yyyy')}</strong> sanasidagi reja o'chiriladi. Tasdiqlaysizmi?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, item: null })}>Bekor</Button>
          <Button variant="contained" color="error" onClick={handleDeletePlan}>O'chirish</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Production;
