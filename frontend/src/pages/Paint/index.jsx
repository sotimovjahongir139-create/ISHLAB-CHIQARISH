import {
  Box, Typography, Card, CardContent, Button, ButtonGroup, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, TablePagination, CircularProgress, TextField,
  Dialog, DialogTitle, DialogContent, DialogActions,
  FormControl, InputLabel, Select, MenuItem, Grid, IconButton, Tooltip,
} from '@mui/material';
import { Refresh, Delete, Save, ColorLens } from '@mui/icons-material';

const pad = (n) => String(n).padStart(2, '0');
const fmtDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const getPeriodDates = (period) => {
  const now = new Date();
  if (period === 'kunlik') {
    const y = new Date(now); y.setDate(now.getDate() - 1); y.setHours(0, 0, 0, 0);
    return { dateFrom: fmtDate(y), dateTo: fmtDate(y) };
  }
  if (period === 'haftalik') {
    const d = now.getDay();
    const mon = new Date(now); mon.setDate(now.getDate() - (d === 0 ? 6 : d - 1));
    const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
    return { dateFrom: fmtDate(mon), dateTo: fmtDate(sun) };
  }
  if (period === 'oylik') {
    return {
      dateFrom: fmtDate(new Date(now.getFullYear(), now.getMonth(), 1)),
      dateTo: fmtDate(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
    };
  }
  if (period === 'otgan_oy') {
    return {
      dateFrom: fmtDate(new Date(now.getFullYear(), now.getMonth() - 1, 1)),
      dateTo: fmtDate(new Date(now.getFullYear(), now.getMonth(), 0)),
    };
  }
  return {};
};
const PERIODS = [
  { key: 'kunlik', label: 'Kunlik' },
  { key: 'haftalik', label: 'Haftalik' },
  { key: 'oylik', label: 'Oylik' },
  { key: 'otgan_oy', label: "O'tgan oy" },
];
import { useState, useEffect, useCallback } from 'react';
import { useSnackbar } from 'notistack';
import * as svc from '../../services/paint.service';
import * as pSvc from '../../services/production.service';
import { format } from 'date-fns';

const localDateStr = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const todayStr = () => localDateStr(new Date());
const EMPTY_ENTRY = { date: todayStr(), lineId: '', reja: '', fakt: '' };

const Paint = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [records, setRecords] = useState([]);
  const [lines, setLines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [totalQty, setTotalQty] = useState(0);
  const [entry, setEntry] = useState(EMPTY_ENTRY);
  const [entryError, setEntryError] = useState(null);
  const [entrySaving, setEntrySaving] = useState(false);
  const [period, setPeriod] = useState('oylik');
  const [deleteDialog, setDeleteDialog] = useState({ open: false, item: null });

  const loadLookups = useCallback(async () => {
    try {
      const lR = await pSvc.getLines();
      setLines(lR.data.data || []);
    } catch {}
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: page + 1, limit: 20 };
      const { dateFrom, dateTo } = getPeriodDates(period);
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;
      const r = await svc.getPaintRecords(params);
      setRecords(r.data.data);
      setTotal(r.data.pagination.total);
      setTotalQty(r.data.totalQty || 0);
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.message || err?.message || 'Xatolik yuz berdi', { variant: 'error' });
    } finally { setLoading(false); }
  }, [page, period]);

  useEffect(() => { loadLookups(); }, []);
  useEffect(() => { load(); }, [page, period]);

  const setE = (key) => (e) => { setEntry((f) => ({ ...f, [key]: e.target.value })); setEntryError(null); };

  const handleSave = async () => {
    if (!entry.date || !entry.lineId || !entry.reja || !entry.fakt) {
      setEntryError("Barcha maydonlarni to'ldiring!");
      return;
    }
    setEntryError(null);
    setEntrySaving(true);
    try {
      await svc.createPaintRecord({
        date: entry.date,
        departmentId: entry.lineId,
        quantity: parseFloat(entry.fakt),
        planned: parseFloat(entry.reja),
        lineId: entry.lineId,
        notes: `Reja: ${entry.reja}`,
      });
      enqueueSnackbar("Ma'lumot saqlandi!", { variant: 'success' });
      setEntry((f) => ({ ...EMPTY_ENTRY, date: f.date }));
      await load();
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.message || 'Xatolik', { variant: 'error' });
    } finally { setEntrySaving(false); }
  };

  const handleDelete = async () => {
    try {
      await svc.deletePaintRecord(deleteDialog.item.id);
      enqueueSnackbar("O'chirildi", { variant: 'success' });
      setDeleteDialog({ open: false, item: null });
      load();
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.message || err?.message || 'Xatolik yuz berdi', { variant: 'error' });
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <ColorLens sx={{ fontSize: 30, color: 'secondary.main' }} />
          <Box>
            <Typography variant="h4">Kraska</Typography>
            <Typography variant="body2" color="text.secondary">Kraska sarfi hisobi</Typography>
          </Box>
        </Box>
        <Button startIcon={<Refresh />} onClick={load}>Yangilash</Button>
      </Box>

      <Box sx={{ mb: 2 }}>
        <Chip
          icon={<ColorLens fontSize="small" />}
          label={`Jami: ${typeof totalQty === 'number' ? totalQty.toFixed(2) : totalQty} kg`}
          color="secondary"
          variant="outlined"
        />
      </Box>

      {/* Entry row */}
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
          <Grid container spacing={1.5} alignItems="center">
            <Grid item xs={6} sm={2}>
              <TextField
                size="small" fullWidth type="date" label="Sana"
                InputLabelProps={{ shrink: true }}
                value={entry.date}
                onChange={setE('date')}
              />
            </Grid>
            <Grid item xs={6} sm={2}>
              <FormControl size="small" fullWidth>
                <InputLabel>Liniya</InputLabel>
                <Select value={entry.lineId} label="Liniya" onChange={setE('lineId')}>
                  {lines.map((l) => <MenuItem key={l.id} value={l.id}>{l.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} sm={2}>
              <TextField
                size="small" fullWidth type="number" label="Reja (dona)"
                inputProps={{ min: 0 }}
                value={entry.reja}
                onChange={setE('reja')}
              />
            </Grid>
            <Grid item xs={6} sm={2}>
              <TextField
                size="small" fullWidth type="number" label="Fakt (dona)"
                inputProps={{ min: 0 }}
                value={entry.fakt}
                onChange={setE('fakt')}
              />
            </Grid>
            <Grid item xs={6} sm="auto" sx={{ display: 'flex', alignItems: 'center' }}>
              <Button
                variant="contained"
                size="small"
                startIcon={entrySaving ? <CircularProgress size={14} color="inherit" /> : <Save fontSize="small" />}
                onClick={handleSave}
                disabled={entrySaving}
                sx={{ bgcolor: '#2563eb', '&:hover': { bgcolor: '#1d4ed8' }, height: 40, whiteSpace: 'nowrap', borderRadius: 1 }}
              >
                Saqlash
              </Button>
            </Grid>
          </Grid>
          {entryError && (
            <Typography variant="caption" color="error" sx={{ mt: 0.75, display: 'block' }}>
              {entryError}
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* Period filter buttons */}
      <Box sx={{ mb: 1.5 }}>
        <ButtonGroup size="small">
          {PERIODS.map((p) => (
            <Button
              key={p.key}
              variant={period === p.key ? 'contained' : 'outlined'}
              onClick={() => { setPeriod(p.key); setPage(0); }}
            >
              {p.label}
            </Button>
          ))}
        </ButtonGroup>
      </Box>

      <Card>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Sana</TableCell>
                <TableCell>Liniya</TableCell>
                <TableCell align="right">Reja (dona)</TableCell>
                <TableCell align="right">Fakt (dona)</TableCell>
                <TableCell align="center">Amallar</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4 }}><CircularProgress size={26} /></TableCell></TableRow>
              ) : records.map((r) => (
                <TableRow key={r.id} hover>
                  <TableCell>{r.date ? format(new Date(r.date), 'd MMM yyyy') : '—'}</TableCell>
                  <TableCell>
                    {r.productionLine?.name || r.department?.name || lines.find((l) => String(l.id) === String(r.lineId || r.departmentId))?.name || '—'}
                  </TableCell>
                  <TableCell align="right">{r.planned != null ? r.planned : '—'}</TableCell>
                  <TableCell align="right">
                    <Chip label={r.quantity} size="small" color="secondary" variant="outlined" />
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="O'chirish">
                      <IconButton size="small" color="error" onClick={() => setDeleteDialog({ open: true, item: r })}>
                        <Delete fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {!loading && records.length === 0 && (
                <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>Ma'lumot topilmadi</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination component="div" count={total} page={page} rowsPerPage={20} rowsPerPageOptions={[20]}
          onPageChange={(_, p) => setPage(p)} labelDisplayedRows={({ from, to, count }) => `${from}–${to} / ${count}`} />
      </Card>

      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, item: null })} maxWidth="xs" fullWidth>
        <DialogTitle>O'chirishni tasdiqlang</DialogTitle>
        <DialogContent>
          <Typography>«{deleteDialog.item?.paintName}» — {deleteDialog.item?.quantity} dona o'chirilsinmi?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, item: null })}>Bekor</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>O'chirish</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Paint;
