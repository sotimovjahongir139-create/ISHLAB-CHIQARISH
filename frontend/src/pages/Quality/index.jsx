import {
  Box, Typography, Tabs, Tab, Card, CardContent, Button, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, TablePagination, CircularProgress, TextField,
  Dialog, DialogTitle, DialogContent, DialogActions,
  FormControl, InputLabel, Select, MenuItem, Grid,
  LinearProgress, IconButton, Tooltip, Alert,
} from '@mui/material';
import { Add, Refresh, Edit, VerifiedUser, Warning } from '@mui/icons-material';
import UzDatePicker from '../../components/UzDatePicker';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSnackbar } from 'notistack';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
  ResponsiveContainer, Legend, PieChart, Pie, Cell,
} from 'recharts';
import BrakDinamikasi from './BrakDinamikasi';
import * as svc from '../../services/quality.service';
import * as pSvc from '../../services/production.service';
import { DEFECT_STATUS, DEFECT_SEVERITY, CHART_COLORS } from '../../constants';
import { format } from 'date-fns';
import usePermission from '../../hooks/usePermission';

const EMPTY_DEFECT = { defectTypeId: '', productModelId: '', quantity: 1, description: '', severity: '' };
const EMPTY_INSPECTION = { inspectionDate: '', inspectedQty: '', passedQty: '', productModelId: '', notes: '' };

const STATUS_OPTS = ['OPEN', 'IN_REVIEW', 'RESOLVED', 'CLOSED'];
const STATUS_UZ = { OPEN: 'Ochiq', IN_REVIEW: "Ko'rilmoqda", RESOLVED: 'Hal qilindi', CLOSED: 'Yopildi' };

const Quality = () => {
  const { enqueueSnackbar } = useSnackbar();
  const { can } = usePermission();
  const [tab, setTab] = useState(0);

  const [defects, setDefects] = useState([]);
  const [inspections, setInspections] = useState([]);
  const [defectTypes, setDefectTypes] = useState([]);
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);

  const [filters, setFilters] = useState({ status: '', defectTypeId: '', dateFrom: '', dateTo: '' });

  const [defectDialog, setDefectDialog] = useState({ open: false });
  const [inspDialog, setInspDialog] = useState({ open: false });
  const [statusDialog, setStatusDialog] = useState({ open: false, item: null, status: '', actionTaken: '' });
  const [defForm, setDefForm] = useState(EMPTY_DEFECT);
  const [inspForm, setInspForm] = useState(EMPTY_INSPECTION);
  const [saving, setSaving] = useState(false);

  const loadLookups = useCallback(async () => {
    try {
      const [dtR, mR] = await Promise.all([svc.getDefectTypes(), pSvc.getProductModels()]);
      setDefectTypes(dtR.data.data);
      setModels(mR.data.data);
    } catch {}
  }, []);

  const loadDefects = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: page + 1, limit: 15 };
      if (filters.status) params.status = filters.status;
      if (filters.defectTypeId) params.defectTypeId = filters.defectTypeId;
      if (filters.dateFrom) params.dateFrom = filters.dateFrom;
      if (filters.dateTo) params.dateTo = filters.dateTo;
      const r = await svc.getDefects(params);
      setDefects(r.data.data);
      setTotal(r.data.pagination.total);
    } catch (err) { enqueueSnackbar(err?.response?.data?.message || err?.message || 'Xatolik yuz berdi', { variant: 'error' }); }
    finally { setLoading(false); }
  }, [page, filters]);

  const loadInspections = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: page + 1, limit: 15 };
      if (filters.dateFrom) params.dateFrom = filters.dateFrom;
      if (filters.dateTo) params.dateTo = filters.dateTo;
      const r = await svc.getInspections(params);
      setInspections(r.data.data);
      setTotal(r.data.pagination.total);
    } catch (err) { enqueueSnackbar(err?.response?.data?.message || err?.message || 'Xatolik yuz berdi', { variant: 'error' }); }
    finally { setLoading(false); }
  }, [page, filters]);

  useEffect(() => { loadLookups(); }, []);
  useEffect(() => {
    if (tab === 0) loadDefects();
    else loadInspections();
  }, [tab, page, filters]);

  const setFilter = (key) => (e) => { setFilters((f) => ({ ...f, [key]: e.target.value })); setPage(0); };

  const handleCreateDefect = async () => {
    setSaving(true);
    try {
      await svc.createDefect({ ...defForm, quantity: parseInt(defForm.quantity) });
      enqueueSnackbar('Nuqson qayd etildi', { variant: 'success' });
      setDefectDialog({ open: false });
      loadDefects();
    } catch (err) { enqueueSnackbar(err.response?.data?.message || 'Xatolik', { variant: 'error' }); }
    finally { setSaving(false); }
  };

  const handleCreateInspection = async () => {
    setSaving(true);
    try {
      await svc.createInspection({
        ...inspForm,
        inspectedQty: parseInt(inspForm.inspectedQty),
        passedQty: parseInt(inspForm.passedQty),
      });
      enqueueSnackbar('Tekshiruv yaratildi', { variant: 'success' });
      setInspDialog({ open: false });
      loadInspections();
    } catch (err) { enqueueSnackbar(err.response?.data?.message || 'Xatolik', { variant: 'error' }); }
    finally { setSaving(false); }
  };

  const handleUpdateStatus = async () => {
    setSaving(true);
    try {
      await svc.updateDefectStatus(statusDialog.item.id, { status: statusDialog.status, actionTaken: statusDialog.actionTaken });
      enqueueSnackbar('Status yangilandi', { variant: 'success' });
      setStatusDialog({ open: false, item: null, status: '', actionTaken: '' });
      loadDefects();
    } catch (err) { enqueueSnackbar(err.response?.data?.message || 'Xatolik', { variant: 'error' }); }
    finally { setSaving(false); }
  };

  // Chart: defects by type
  const defByType = defectTypes.map((dt) => ({
    name: dt.name,
    count: defects.filter((d) => d.defectTypeId === dt.id).reduce((a, d) => a + d.quantity, 0),
  })).filter((d) => d.count > 0);

  // Chart: inspection pass rate
  const inspChart = inspections.slice(0, 10).map((ins) => ({
    date: format(new Date(ins.inspectionDate), 'dd MMM'),
    passRate: ins.passRate,
  }));

  const Df = (key) => ({ value: defForm[key], onChange: (e) => setDefForm((f) => ({ ...f, [key]: e.target.value })) });
  const If = (key) => ({ value: inspForm[key], onChange: (e) => setInspForm((f) => ({ ...f, [key]: e.target.value })) });

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <VerifiedUser sx={{ fontSize: 30, color: 'primary.main' }} />
          <Box>
            <Typography variant="h4">Sifat nazorati</Typography>
            <Typography variant="body2" color="text.secondary">Nuqsonlar va tekshiruvlar</Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button startIcon={<Refresh />} onClick={() => tab === 0 ? loadDefects() : loadInspections()}>Yangilash</Button>
          {tab === 0 && can('quality:create') && (
            <Button variant="contained" startIcon={<Add />} onClick={() => { setDefForm(EMPTY_DEFECT); setDefectDialog({ open: true }); }}>Nuqson qo'shish</Button>
          )}
          {tab === 1 && can('quality:create') && (
            <Button variant="contained" startIcon={<Add />} onClick={() => { setInspForm({ ...EMPTY_INSPECTION, inspectionDate: format(new Date(), 'yyyy-MM-dd') }); setInspDialog({ open: true }); }}>Tekshiruv yaratish</Button>
          )}
        </Box>
      </Box>

      <BrakDinamikasi />

      {/* Filters */}
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
          <Grid container spacing={1.5}>
            {tab === 0 && (
              <>
                <Grid item xs={6} sm={3} md={2}>
                  <FormControl size="small" fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select value={filters.status} label="Status" onChange={setFilter('status')}>
                      <MenuItem value="">Barchasi</MenuItem>
                      {STATUS_OPTS.map((s) => <MenuItem key={s} value={s}>{STATUS_UZ[s]}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={6} sm={3} md={2}>
                  <FormControl size="small" fullWidth>
                    <InputLabel>Nuqson turi</InputLabel>
                    <Select value={filters.defectTypeId} label="Nuqson turi" onChange={setFilter('defectTypeId')}>
                      <MenuItem value="">Barchasi</MenuItem>
                      {defectTypes.map((dt) => <MenuItem key={dt.id} value={dt.id}>{dt.name}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
              </>
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

      {/* Charts */}
      {tab === 0 && defByType.length > 0 && (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="subtitle2" sx={{ mb: 1.5 }}>Nuqson turlariga ko'ra</Typography>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={defByType} layout="vertical" margin={{ left: 0, right: 20, top: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={100} />
                <RTooltip />
                <Bar dataKey="count" name="Soni" fill="#C62828" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {tab === 1 && inspChart.length > 0 && (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="subtitle2" sx={{ mb: 1.5 }}>O'tish foizi dinamikasi</Typography>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={inspChart} margin={{ left: 0, right: 20, top: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis domain={[80, 100]} tick={{ fontSize: 11 }} unit="%" />
                <RTooltip formatter={(v) => [`${v}%`, "O'tish foizi"]} />
                <Bar dataKey="passRate" name="O'tish %" fill="#2E7D32" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <Tabs value={tab} onChange={(_, v) => { setTab(v); setPage(0); }} sx={{ mb: 2 }}>
        <Tab label="Nuqsonlar" />
        <Tab label="Tekshiruvlar" />
      </Tabs>

      <Card>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                {tab === 0 ? (
                  <>
                    <TableCell>Sana</TableCell>
                    <TableCell>Nuqson turi</TableCell>
                    <TableCell>Model</TableCell>
                    <TableCell align="right">Miqdor</TableCell>
                    <TableCell>Darajasi</TableCell>
                    <TableCell>Holat</TableCell>
                    {can('quality:update') && <TableCell align="right">Amallar</TableCell>}
                  </>
                ) : (
                  <>
                    <TableCell>Sana</TableCell>
                    <TableCell>Model</TableCell>
                    <TableCell align="right">Tekshirildi</TableCell>
                    <TableCell align="right">O'tdi</TableCell>
                    <TableCell align="right">O'tmadi</TableCell>
                    <TableCell>O'tish foizi</TableCell>
                    <TableCell>Holat</TableCell>
                  </>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4 }}><CircularProgress size={26} /></TableCell></TableRow>
              ) : tab === 0 ? (
                defects.map((d) => (
                  <TableRow key={d.id} hover>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{format(new Date(d.createdAt), 'dd.MM.yyyy HH:mm')}</TableCell>
                    <TableCell>{d.defectType?.name}</TableCell>
                    <TableCell>{d.productModel?.name || '—'}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>{d.quantity}</TableCell>
                    <TableCell>
                      <Chip label={DEFECT_SEVERITY[d.defectType?.severity]?.label || d.defectType?.severity} color={DEFECT_SEVERITY[d.defectType?.severity]?.color || 'default'} size="small" />
                    </TableCell>
                    <TableCell>
                      <Chip label={DEFECT_STATUS[d.status]?.label || d.status} color={DEFECT_STATUS[d.status]?.color || 'default'} size="small" />
                    </TableCell>
                    {can('quality:update') && (
                      <TableCell align="right">
                        <Tooltip title="Status o'zgartirish">
                          <IconButton size="small" onClick={() => setStatusDialog({ open: true, item: d, status: d.status, actionTaken: d.actionTaken || '' })}>
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              ) : (
                inspections.map((ins) => (
                  <TableRow key={ins.id} hover>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{format(new Date(ins.inspectionDate), 'dd.MM.yyyy')}</TableCell>
                    <TableCell>{ins.productModel?.name}</TableCell>
                    <TableCell align="right">{ins.inspectedQty}</TableCell>
                    <TableCell align="right" sx={{ color: 'success.main', fontWeight: 600 }}>{ins.passedQty}</TableCell>
                    <TableCell align="right" sx={{ color: 'error.main', fontWeight: 600 }}>{ins.failedQty}</TableCell>
                    <TableCell sx={{ minWidth: 130 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LinearProgress
                          variant="determinate" value={ins.passRate || 0}
                          color={ins.passRate >= 98 ? 'success' : ins.passRate >= 95 ? 'warning' : 'error'}
                          sx={{ flexGrow: 1, height: 6, borderRadius: 3 }}
                        />
                        <Typography variant="caption" fontWeight={700}>{ins.passRate?.toFixed(1)}%</Typography>
                      </Box>
                    </TableCell>
                    <TableCell><Chip label={STATUS_UZ[ins.status] || ins.status} size="small" /></TableCell>
                  </TableRow>
                ))
              )}
              {!loading && (tab === 0 ? defects : inspections).length === 0 && (
                <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>Ma'lumot topilmadi</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination component="div" count={total} page={page} rowsPerPage={15} rowsPerPageOptions={[15]}
          onPageChange={(_, p) => setPage(p)} labelDisplayedRows={({ from, to, count }) => `${from}–${to} / ${count}`} />
      </Card>

      {/* Create defect dialog */}
      <Dialog open={defectDialog.open} onClose={() => setDefectDialog({ open: false })} maxWidth="sm" fullWidth>
        <DialogTitle>Nuqson qayd etish</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <FormControl fullWidth size="small">
                <InputLabel>Nuqson turi *</InputLabel>
                <Select value={defForm.defectTypeId} label="Nuqson turi *" onChange={(e) => setDefForm((f) => ({ ...f, defectTypeId: e.target.value }))}>
                  {defectTypes.map((dt) => (
                    <MenuItem key={dt.id} value={dt.id}>
                      {dt.name} — {DEFECT_SEVERITY[dt.severity]?.label || dt.severity}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <TextField label="Miqdor *" type="number" size="small" fullWidth {...Df('quantity')} />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Model</InputLabel>
                <Select value={defForm.productModelId} label="Model" onChange={(e) => setDefForm((f) => ({ ...f, productModelId: e.target.value }))}>
                  <MenuItem value="">—</MenuItem>
                  {models.map((m) => <MenuItem key={m.id} value={m.id}>{m.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField label="Tavsif" size="small" fullWidth multiline rows={2} {...Df('description')} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDefectDialog({ open: false })}>Bekor</Button>
          <Button variant="contained" onClick={handleCreateDefect} disabled={saving || !defForm.defectTypeId || !defForm.quantity}>
            {saving ? <CircularProgress size={18} color="inherit" /> : 'Saqlash'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create inspection dialog */}
      <Dialog open={inspDialog.open} onClose={() => setInspDialog({ open: false })} maxWidth="sm" fullWidth>
        <DialogTitle>Tekshiruv yaratish</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={6}>
              <UzDatePicker label="Sana *" required {...If('inspectionDate')} />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Model *</InputLabel>
                <Select value={inspForm.productModelId} label="Model *" onChange={(e) => setInspForm((f) => ({ ...f, productModelId: e.target.value }))}>
                  {models.map((m) => <MenuItem key={m.id} value={m.id}>{m.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <TextField label="Tekshirildi (dona) *" type="number" size="small" fullWidth {...If('inspectedQty')} />
            </Grid>
            <Grid item xs={6}>
              <TextField label="O'tdi (dona) *" type="number" size="small" fullWidth {...If('passedQty')} />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Izoh" size="small" fullWidth multiline rows={2} {...If('notes')} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setInspDialog({ open: false })}>Bekor</Button>
          <Button variant="contained" onClick={handleCreateInspection} disabled={saving || !inspForm.inspectionDate || !inspForm.inspectedQty || !inspForm.passedQty}>
            {saving ? <CircularProgress size={18} color="inherit" /> : 'Saqlash'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Status update dialog */}
      <Dialog open={statusDialog.open} onClose={() => setStatusDialog({ open: false, item: null, status: '', actionTaken: '' })} maxWidth="xs" fullWidth>
        <DialogTitle>Nuqson statusini o'zgartirish</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Status</InputLabel>
            <Select value={statusDialog.status} label="Status" onChange={(e) => setStatusDialog((d) => ({ ...d, status: e.target.value }))}>
              {STATUS_OPTS.map((s) => <MenuItem key={s} value={s}>{STATUS_UZ[s]}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField
            label="Ko'rilgan chora"
            size="small"
            fullWidth
            multiline
            rows={3}
            value={statusDialog.actionTaken}
            onChange={(e) => setStatusDialog((d) => ({ ...d, actionTaken: e.target.value }))}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setStatusDialog({ open: false, item: null, status: '', actionTaken: '' })}>Bekor</Button>
          <Button variant="contained" onClick={handleUpdateStatus} disabled={saving}>
            {saving ? <CircularProgress size={18} color="inherit" /> : 'Saqlash'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Quality;
