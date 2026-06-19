import {
  Box, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TablePagination, Chip, Typography,
  CircularProgress, TextField, InputAdornment, Grid,
  FormControl, InputLabel, Select, MenuItem, IconButton, Tooltip,
  Collapse, Paper,
} from '@mui/material';
import { Search, ExpandMore, ExpandLess } from '@mui/icons-material';
import UzDatePicker from '../../components/UzDatePicker';
import { useState, useEffect } from 'react';
import { useSnackbar } from 'notistack';
import * as svc from '../../services/admin.service';
import { format } from 'date-fns';

const ACTION_COLOR = {
  CREATE: 'success',
  UPDATE: 'warning',
  DELETE: 'error',
  LOGIN: 'info',
  LOGOUT: 'default',
  EXPORT: 'secondary',
};

const ACTION_LABEL = {
  CREATE: 'Yaratish',
  UPDATE: 'Yangilash',
  DELETE: 'O\'chirish',
  LOGIN: 'Kirish',
  LOGOUT: 'Chiqish',
  EXPORT: 'Eksport',
};

const ENTITY_LABELS = {
  users: 'Foydalanuvchilar',
  roles: 'Rollar',
  departments: 'Bo\'limlar',
  production_plan: 'Ishlab chiqarish rejasi',
  production_fact: 'Ishlab chiqarish natijasi',
  quality_inspections: 'Tekshiruvlar',
  defects: 'Nuqsonlar',
  downtime: 'Toshlanishlar',
  materials: 'Xomashyo',
  material_transactions: 'Xomashyo harakati',
  employees: 'Xodimlar',
  employee_attendance: 'Davomat',
  equipment: 'Uskunalar',
  maintenance: 'Texnik xizmat',
};

const ExpandableRow = ({ log }) => {
  const [open, setOpen] = useState(false);
  const hasDetails = log.oldValues || log.newValues;

  return (
    <>
      <TableRow hover sx={{ '& > *': { borderBottom: open ? 'unset' : undefined } }}>
        <TableCell>
          <Typography variant="caption" color="text.secondary" fontFamily="monospace">
            {format(new Date(log.createdAt), 'dd.MM.yyyy HH:mm:ss')}
          </Typography>
        </TableCell>
        <TableCell>
          {log.user ? (
            <Box>
              <Typography variant="body2" fontWeight={600}>{log.user.firstName} {log.user.lastName}</Typography>
              <Typography variant="caption" color="text.secondary">{log.user.email}</Typography>
            </Box>
          ) : (
            <Typography variant="caption" color="text.disabled">Tizim</Typography>
          )}
        </TableCell>
        <TableCell>
          <Chip
            label={ACTION_LABEL[log.action] || log.action}
            size="small"
            color={ACTION_COLOR[log.action] || 'default'}
          />
        </TableCell>
        <TableCell>
          <Typography variant="body2">{ENTITY_LABELS[log.entity] || log.entity}</Typography>
          {log.entityId && (
            <Typography variant="caption" color="text.secondary" fontFamily="monospace">{log.entityId.slice(0, 8)}…</Typography>
          )}
        </TableCell>
        <TableCell>
          <Typography variant="caption" color="text.secondary">{log.ipAddress || '—'}</Typography>
        </TableCell>
        <TableCell align="center">
          {hasDetails ? (
            <IconButton size="small" onClick={() => setOpen((o) => !o)}>
              {open ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
            </IconButton>
          ) : null}
        </TableCell>
      </TableRow>

      {hasDetails && (
        <TableRow>
          <TableCell colSpan={6} sx={{ py: 0 }}>
            <Collapse in={open} timeout="auto">
              <Box sx={{ p: 2 }}>
                <Grid container spacing={2}>
                  {log.oldValues && (
                    <Grid item xs={12} md={6}>
                      <Typography variant="caption" color="error" fontWeight={700} sx={{ mb: 0.5, display: 'block' }}>Oldingi qiymat:</Typography>
                      <Paper variant="outlined" sx={{ p: 1.5, bgcolor: 'grey.50' }}>
                        <pre style={{ margin: 0, fontSize: 12, overflow: 'auto', maxHeight: 150 }}>
                          {JSON.stringify(log.oldValues, null, 2)}
                        </pre>
                      </Paper>
                    </Grid>
                  )}
                  {log.newValues && (
                    <Grid item xs={12} md={6}>
                      <Typography variant="caption" color="success.main" fontWeight={700} sx={{ mb: 0.5, display: 'block' }}>Yangi qiymat:</Typography>
                      <Paper variant="outlined" sx={{ p: 1.5, bgcolor: 'grey.50' }}>
                        <pre style={{ margin: 0, fontSize: 12, overflow: 'auto', maxHeight: 150 }}>
                          {JSON.stringify(log.newValues, null, 2)}
                        </pre>
                      </Paper>
                    </Grid>
                  )}
                </Grid>
              </Box>
            </Collapse>
          </TableCell>
        </TableRow>
      )}
    </>
  );
};

const AuditLogsTab = () => {
  const { enqueueSnackbar } = useSnackbar();

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);

  const [filters, setFilters] = useState({
    action: '', entity: '', dateFrom: '', dateTo: '', search: '',
  });

  const load = async () => {
    setLoading(true);
    try {
      const params = { page: page + 1, limit: 20 };
      if (filters.action) params.action = filters.action;
      if (filters.entity) params.entity = filters.entity;
      if (filters.dateFrom) params.dateFrom = filters.dateFrom;
      if (filters.dateTo) params.dateTo = filters.dateTo;
      if (filters.search) params.search = filters.search;

      const r = await svc.getAuditLogs(params);
      setLogs(r.data.data);
      setTotal(r.data.pagination.total);
    } catch { enqueueSnackbar('Xatolik', { variant: 'error' }); }
    finally { setLoading(false); }
  };

  useEffect(() => { const t = setTimeout(load, 400); return () => clearTimeout(t); }, [filters, page]);

  const setFilter = (key) => (e) => {
    setFilters((f) => ({ ...f, [key]: e.target.value }));
    setPage(0);
  };

  return (
    <Box>
      {/* Filters */}
      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        <Grid item xs={12} sm={4}>
          <TextField
            placeholder="Entity ID yoki nomi..."
            value={filters.search}
            onChange={setFilter('search')}
            size="small"
            fullWidth
            InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }}
          />
        </Grid>
        <Grid item xs={6} sm={2}>
          <FormControl size="small" fullWidth>
            <InputLabel>Amal</InputLabel>
            <Select value={filters.action} label="Amal" onChange={setFilter('action')}>
              <MenuItem value="">Barchasi</MenuItem>
              {Object.entries(ACTION_LABEL).map(([k, v]) => <MenuItem key={k} value={k}>{v}</MenuItem>)}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={6} sm={2}>
          <FormControl size="small" fullWidth>
            <InputLabel>Jadval</InputLabel>
            <Select value={filters.entity} label="Jadval" onChange={setFilter('entity')}>
              <MenuItem value="">Barchasi</MenuItem>
              {Object.entries(ENTITY_LABELS).map(([k, v]) => <MenuItem key={k} value={k}>{v}</MenuItem>)}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={6} sm={2}>
          <UzDatePicker label="Dan" value={filters.dateFrom} onChange={setFilter('dateFrom')} />
        </Grid>
        <Grid item xs={6} sm={2}>
          <UzDatePicker label="Gacha" value={filters.dateTo} onChange={setFilter('dateTo')} />
        </Grid>
      </Grid>

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Sana/Vaqt</TableCell>
              <TableCell>Foydalanuvchi</TableCell>
              <TableCell>Amal</TableCell>
              <TableCell>Ob'ekt</TableCell>
              <TableCell>IP manzil</TableCell>
              <TableCell align="center">Tafsilot</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4 }}><CircularProgress size={28} /></TableCell></TableRow>
            ) : logs.length === 0 ? (
              <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>Ma'lumot topilmadi</TableCell></TableRow>
            ) : logs.map((log) => (
              <ExpandableRow key={log.id} log={log} />
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={total}
        page={page}
        rowsPerPage={20}
        rowsPerPageOptions={[20]}
        onPageChange={(_, p) => setPage(p)}
        labelDisplayedRows={({ from, to, count }) => `${from}–${to} / ${count} ta yozuv`}
      />
    </Box>
  );
};

export default AuditLogsTab;
