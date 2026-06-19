import {
  Box, Typography, Card, CardContent, Button, Chip, Avatar,
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, TablePagination, CircularProgress, TextField,
  Dialog, DialogTitle, DialogContent, DialogActions,
  FormControl, InputLabel, Select, MenuItem, Grid,
  IconButton, Tooltip, Tabs, Tab, InputAdornment,
} from '@mui/material';
import { Add, Refresh, Edit, Delete, People, Search, EventNote, AccessTime } from '@mui/icons-material';
import UzDatePicker from '../../components/UzDatePicker';
import { useState, useEffect, useCallback } from 'react';
import { useSnackbar } from 'notistack';
import * as svc from '../../services/employee.service';
import * as whSvc from '../../services/workhour.service';
import { EMPLOYEE_STATUS } from '../../constants';
import { format } from 'date-fns';
import usePermission from '../../hooks/usePermission';

const GENDERS = [{ value: 'MALE', label: 'Erkak' }, { value: 'FEMALE', label: 'Ayol' }];
const STATUS_OPTS = ['ACTIVE', 'ON_LEAVE', 'TERMINATED', 'SUSPENDED'];

const EMPTY_EMP = { firstName: '', lastName: '', middleName: '', birthDate: '', gender: 'MALE', phone: '', address: '', position: '', hireDate: '', salary: '', departmentId: '', status: 'ACTIVE' };
const EMPTY_ATT = { employeeId: '', date: '', status: 'PRESENT', checkIn: '', checkOut: '', notes: '' };
const ATT_STATUS = { PRESENT: 'Keldi', ABSENT: 'Kelmadi', LATE: 'Kech keldi', ON_LEAVE: "Ta'tilda", HALF_DAY: 'Yarim kun' };
const EMPTY_WH = { employeeId: '', date: '', hoursWorked: '', departmentId: '', notes: '' };

const Employees = () => {
  const { enqueueSnackbar } = useSnackbar();
  const { can } = usePermission();
  const [tab, setTab] = useState(0);

  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedEmp, setSelectedEmp] = useState(null);

  const [workHours, setWorkHours] = useState([]);
  const [whTotal, setWhTotal] = useState(0);
  const [totalHours, setTotalHours] = useState(0);
  const [whDialog, setWhDialog] = useState({ open: false });
  const [whForm, setWhForm] = useState(EMPTY_WH);
  const [whDeleteDialog, setWhDeleteDialog] = useState({ open: false, item: null });

  const [empDialog, setEmpDialog] = useState({ open: false, mode: 'create', item: null });
  const [attDialog, setAttDialog] = useState({ open: false });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, item: null });
  const [empForm, setEmpForm] = useState(EMPTY_EMP);
  const [attForm, setAttForm] = useState(EMPTY_ATT);
  const [saving, setSaving] = useState(false);

  const loadDepts = useCallback(async () => {
    try {
      const r = await svc.getDepartments();
      setDepartments(r.data.data);
    } catch {}
  }, []);

  const loadEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: page + 1, limit: 15 };
      if (search) params.search = search;
      if (deptFilter) params.departmentId = deptFilter;
      if (statusFilter) params.status = statusFilter;
      const r = await svc.getEmployees(params);
      setEmployees(r.data.data);
      setTotal(r.data.pagination.total);
    } catch { enqueueSnackbar('Xatolik', { variant: 'error' }); }
    finally { setLoading(false); }
  }, [page, search, deptFilter, statusFilter]);

  const loadAttendance = useCallback(async () => {
    if (!selectedEmp) return;
    setLoading(true);
    try {
      const r = await svc.getAttendance(selectedEmp.id, { page: page + 1, limit: 20 });
      setAttendance(r.data.data);
      setTotal(r.data.pagination.total);
    } catch {}
    finally { setLoading(false); }
  }, [selectedEmp, page]);

  const loadWorkHours = useCallback(async () => {
    if (!selectedEmp) return;
    setLoading(true);
    try {
      const r = await whSvc.getWorkHours({ employeeId: selectedEmp.id, page: page + 1, limit: 20 });
      setWorkHours(r.data.data);
      setWhTotal(r.data.pagination.total);
      setTotalHours(r.data.totalHours || 0);
    } catch {}
    finally { setLoading(false); }
  }, [selectedEmp, page]);

  useEffect(() => { loadDepts(); }, []);
  useEffect(() => {
    if (tab === 0) loadEmployees();
    else if (tab === 1) loadAttendance();
    else if (tab === 2) loadWorkHours();
  }, [tab, page, search, deptFilter, statusFilter, selectedEmp]);

  const openCreate = () => {
    setEmpForm({ ...EMPTY_EMP, hireDate: format(new Date(), 'yyyy-MM-dd') });
    setEmpDialog({ open: true, mode: 'create', item: null });
  };

  const openEdit = (e) => {
    setEmpForm({
      firstName: e.firstName, lastName: e.lastName, middleName: e.middleName || '',
      birthDate: e.birthDate ? format(new Date(e.birthDate), 'yyyy-MM-dd') : '',
      gender: e.gender || 'MALE', phone: e.phone || '', address: e.address || '',
      position: e.position || '', hireDate: format(new Date(e.hireDate), 'yyyy-MM-dd'),
      salary: e.salary ?? '', departmentId: e.departmentId || '', status: e.status,
    });
    setEmpDialog({ open: true, mode: 'edit', item: e });
  };

  const openAttendance = (emp) => {
    setSelectedEmp(emp);
    setTab(1);
    setPage(0);
  };

  const openWorkHours = (emp) => {
    setSelectedEmp(emp);
    setTab(2);
    setPage(0);
  };

  const handleSaveWh = async () => {
    if (!whForm.hoursWorked || !whForm.date || !whForm.departmentId) {
      enqueueSnackbar('Sana, soat va bo\'limni to\'ldiring', { variant: 'warning' }); return;
    }
    setSaving(true);
    try {
      await whSvc.createWorkHour({ ...whForm, employeeId: selectedEmp.id });
      enqueueSnackbar('Ish soati qo\'shildi', { variant: 'success' });
      setWhDialog({ open: false });
      loadWorkHours();
    } catch (err) { enqueueSnackbar(err.response?.data?.message || 'Xatolik', { variant: 'error' }); }
    finally { setSaving(false); }
  };

  const handleDeleteWh = async () => {
    try {
      await whSvc.deleteWorkHour(whDeleteDialog.item.id);
      enqueueSnackbar('O\'chirildi', { variant: 'success' });
      setWhDeleteDialog({ open: false, item: null });
      loadWorkHours();
    } catch { enqueueSnackbar('Xatolik', { variant: 'error' }); }
  };

  const handleSaveEmp = async () => {
    setSaving(true);
    try {
      const body = { ...empForm, salary: empForm.salary !== '' ? parseFloat(empForm.salary) : null };
      if (empDialog.mode === 'create') {
        await svc.createEmployee(body);
        enqueueSnackbar('Xodim qo\'shildi', { variant: 'success' });
      } else {
        await svc.updateEmployee(empDialog.item.id, body);
        enqueueSnackbar('Yangilandi', { variant: 'success' });
      }
      setEmpDialog({ open: false, mode: 'create', item: null });
      loadEmployees();
    } catch (err) { enqueueSnackbar(err.response?.data?.message || 'Xatolik', { variant: 'error' }); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try {
      await svc.deleteEmployee(deleteDialog.item.id);
      enqueueSnackbar('Xodim o\'chirildi', { variant: 'success' });
      setDeleteDialog({ open: false, item: null });
      loadEmployees();
    } catch (err) { enqueueSnackbar(err.response?.data?.message || 'Xatolik', { variant: 'error' }); }
  };

  const handleSaveAtt = async () => {
    setSaving(true);
    try {
      await svc.recordAttendance({
        ...attForm,
        employeeId: selectedEmp.id,
        checkIn: attForm.checkIn || undefined,
        checkOut: attForm.checkOut || undefined,
      });
      enqueueSnackbar('Davomat qayd etildi', { variant: 'success' });
      setAttDialog({ open: false });
      loadAttendance();
    } catch (err) { enqueueSnackbar(err.response?.data?.message || 'Xatolik', { variant: 'error' }); }
    finally { setSaving(false); }
  };

  const Ef = (key) => ({ value: empForm[key], onChange: (e) => setEmpForm((f) => ({ ...f, [key]: e.target.value })) });
  const Af = (key) => ({ value: attForm[key], onChange: (e) => setAttForm((f) => ({ ...f, [key]: e.target.value })) });

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <People sx={{ fontSize: 30, color: 'primary.main' }} />
          <Box>
            <Typography variant="h4">Xodimlar</Typography>
            <Typography variant="body2" color="text.secondary">Xodimlar ro'yxati va davomat</Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button startIcon={<Refresh />} onClick={() => tab === 0 ? loadEmployees() : loadAttendance()}>Yangilash</Button>
          {tab === 0 && can('employees:create') && (
            <Button variant="contained" startIcon={<Add />} onClick={openCreate}>Xodim qo'shish</Button>
          )}
          {tab === 1 && selectedEmp && can('employees:update') && (
            <Button variant="contained" startIcon={<Add />} onClick={() => { setAttForm({ ...EMPTY_ATT, date: format(new Date(), 'yyyy-MM-dd') }); setAttDialog({ open: true }); }}>Davomat qayd etish</Button>
          )}
          {tab === 2 && selectedEmp && (
            <Button variant="contained" color="warning" startIcon={<Add />} onClick={() => { setWhForm({ ...EMPTY_WH, date: format(new Date(), 'yyyy-MM-dd'), departmentId: selectedEmp.departmentId || '' }); setWhDialog({ open: true }); }}>Ish soati qo'shish</Button>
          )}
        </Box>
      </Box>

      {tab === 0 && (
        <Card sx={{ mb: 2 }}>
          <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
            <Grid container spacing={1.5}>
              <Grid item xs={12} sm={5}>
                <TextField
                  placeholder="Ism, familiya, lavozim..."
                  value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                  size="small" fullWidth
                  InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }}
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <FormControl size="small" fullWidth>
                  <InputLabel>Bo'lim</InputLabel>
                  <Select value={deptFilter} label="Bo'lim" onChange={(e) => { setDeptFilter(e.target.value); setPage(0); }}>
                    <MenuItem value="">Barchasi</MenuItem>
                    {departments.map((d) => <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6} sm={3}>
                <FormControl size="small" fullWidth>
                  <InputLabel>Holat</InputLabel>
                  <Select value={statusFilter} label="Holat" onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}>
                    <MenuItem value="">Barchasi</MenuItem>
                    {STATUS_OPTS.map((s) => <MenuItem key={s} value={s}>{EMPLOYEE_STATUS[s]?.label || s}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Tabs value={tab} onChange={(_, v) => { setTab(v); setPage(0); }}>
          <Tab label="Xodimlar ro'yxati" />
          <Tab label={selectedEmp ? `Davomat: ${selectedEmp.firstName} ${selectedEmp.lastName}` : 'Davomat'} disabled={!selectedEmp} />
          <Tab icon={<AccessTime fontSize="small" />} iconPosition="start" label={selectedEmp ? `Ish soatlari: ${selectedEmp.firstName}` : 'Ish soatlari'} disabled={!selectedEmp} />
        </Tabs>
        {tab === 2 && <Chip icon={<AccessTime fontSize="small" />} label={`Jami: ${totalHours} soat`} color="warning" variant="outlined" />}
      </Box>

      <Card>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                {tab === 0 ? (
                  <>
                    <TableCell>Xodim</TableCell>
                    <TableCell>Raqam</TableCell>
                    <TableCell>Bo'lim</TableCell>
                    <TableCell>Lavozim</TableCell>
                    <TableCell>Ish boshlagan</TableCell>
                    <TableCell>Holat</TableCell>
                    <TableCell align="right">Amallar</TableCell>
                  </>
                ) : tab === 1 ? (
                  <>
                    <TableCell>Sana</TableCell>
                    <TableCell>Holat</TableCell>
                    <TableCell>Kirish</TableCell>
                    <TableCell>Chiqish</TableCell>
                    <TableCell>Izoh</TableCell>
                  </>
                ) : (
                  <>
                    <TableCell>Sana</TableCell>
                    <TableCell align="right">Soat</TableCell>
                    <TableCell>Bo'lim</TableCell>
                    <TableCell>Izoh</TableCell>
                    <TableCell align="center">Amallar</TableCell>
                  </>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4 }}><CircularProgress size={26} /></TableCell></TableRow>
              ) : tab === 0 ? (
                employees.map((emp) => (
                  <TableRow key={emp.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: 12 }}>
                          {emp.firstName[0]}{emp.lastName[0]}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={600}>{emp.lastName} {emp.firstName}</Typography>
                          {emp.phone && <Typography variant="caption" color="text.secondary">{emp.phone}</Typography>}
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>{emp.employeeNumber}</TableCell>
                    <TableCell>{emp.department?.name || '—'}</TableCell>
                    <TableCell>{emp.position || '—'}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{format(new Date(emp.hireDate), 'dd.MM.yyyy')}</TableCell>
                    <TableCell>
                      <Chip label={EMPLOYEE_STATUS[emp.status]?.label || emp.status} color={EMPLOYEE_STATUS[emp.status]?.color || 'default'} size="small" />
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                        <Tooltip title="Davomat">
                          <IconButton size="small" onClick={() => openAttendance(emp)}>
                            <EventNote fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Ish soatlari">
                          <IconButton size="small" color="warning" onClick={() => openWorkHours(emp)}>
                            <AccessTime fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {can('employees:update') && (
                          <Tooltip title="Tahrirlash">
                            <IconButton size="small" onClick={() => openEdit(emp)}><Edit fontSize="small" /></IconButton>
                          </Tooltip>
                        )}
                        {can('employees:delete') && (
                          <Tooltip title="O'chirish">
                            <IconButton size="small" color="error" onClick={() => setDeleteDialog({ open: true, item: emp })}><Delete fontSize="small" /></IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              ) : tab === 1 ? (
                attendance.map((a) => (
                  <TableRow key={a.id} hover>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{format(new Date(a.date), 'dd.MM.yyyy')}</TableCell>
                    <TableCell>
                      <Chip
                        label={ATT_STATUS[a.status] || a.status}
                        color={a.status === 'PRESENT' ? 'success' : a.status === 'ABSENT' ? 'error' : a.status === 'LATE' ? 'warning' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{a.checkIn ? format(new Date(a.checkIn), 'HH:mm') : '—'}</TableCell>
                    <TableCell>{a.checkOut ? format(new Date(a.checkOut), 'HH:mm') : '—'}</TableCell>
                    <TableCell><Typography variant="caption">{a.notes || '—'}</Typography></TableCell>
                  </TableRow>
                ))
              ) : (
                workHours.map((wh) => (
                  <TableRow key={wh.id} hover>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{format(new Date(wh.date), 'dd.MM.yyyy')}</TableCell>
                    <TableCell align="right">
                      <Chip label={`${wh.hoursWorked} soat`} size="small" color="warning" variant="outlined" />
                    </TableCell>
                    <TableCell>{wh.department?.name || '—'}</TableCell>
                    <TableCell><Typography variant="caption" color="text.secondary">{wh.notes || '—'}</Typography></TableCell>
                    <TableCell align="center">
                      <Tooltip title="O'chirish">
                        <IconButton size="small" color="error" onClick={() => setWhDeleteDialog({ open: true, item: wh })}><Delete fontSize="small" /></IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
              {!loading && (tab === 0 ? employees : tab === 1 ? attendance : workHours).length === 0 && (
                <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>Ma'lumot topilmadi</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination component="div" count={tab === 2 ? whTotal : total} page={page} rowsPerPage={15} rowsPerPageOptions={[15]}
          onPageChange={(_, p) => setPage(p)} labelDisplayedRows={({ from, to, count }) => `${from}–${to} / ${count}`} />
      </Card>

      {/* Create/Edit employee dialog */}
      <Dialog open={empDialog.open} onClose={() => setEmpDialog({ open: false, mode: 'create', item: null })} maxWidth="sm" fullWidth>
        <DialogTitle>{empDialog.mode === 'create' ? 'Yangi xodim' : 'Xodimni tahrirlash'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={6}><TextField label="Ism *" size="small" fullWidth {...Ef('firstName')} /></Grid>
            <Grid item xs={6}><TextField label="Familiya *" size="small" fullWidth {...Ef('lastName')} /></Grid>
            <Grid item xs={6}><UzDatePicker label="Tug'ilgan sana" {...Ef('birthDate')} /></Grid>
            <Grid item xs={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Jins</InputLabel>
                <Select value={empForm.gender} label="Jins" onChange={(e) => setEmpForm((f) => ({ ...f, gender: e.target.value }))}>
                  {GENDERS.map((g) => <MenuItem key={g.value} value={g.value}>{g.label}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}><TextField label="Telefon" size="small" fullWidth {...Ef('phone')} /></Grid>
            <Grid item xs={6}><TextField label="Lavozim *" size="small" fullWidth {...Ef('position')} /></Grid>
            <Grid item xs={6}><UzDatePicker label="Ish boshlagan sana *" required {...Ef('hireDate')} /></Grid>
            <Grid item xs={12}>
              <FormControl fullWidth size="small">
                <InputLabel>Bo'lim</InputLabel>
                <Select value={empForm.departmentId} label="Bo'lim" onChange={(e) => setEmpForm((f) => ({ ...f, departmentId: e.target.value }))}>
                  <MenuItem value="">—</MenuItem>
                  {departments.map((d) => <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            {empDialog.mode === 'edit' && (
              <Grid item xs={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Holat</InputLabel>
                  <Select value={empForm.status} label="Holat" onChange={(e) => setEmpForm((f) => ({ ...f, status: e.target.value }))}>
                    {STATUS_OPTS.map((s) => <MenuItem key={s} value={s}>{EMPLOYEE_STATUS[s]?.label || s}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEmpDialog({ open: false, mode: 'create', item: null })}>Bekor</Button>
          <Button variant="contained" onClick={handleSaveEmp} disabled={saving || !empForm.firstName || !empForm.lastName || !empForm.hireDate}>
            {saving ? <CircularProgress size={18} color="inherit" /> : 'Saqlash'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Attendance dialog */}
      <Dialog open={attDialog.open} onClose={() => setAttDialog({ open: false })} maxWidth="xs" fullWidth>
        <DialogTitle>Davomat qayd etish — {selectedEmp?.firstName} {selectedEmp?.lastName}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}><UzDatePicker label="Sana *" required {...Af('date')} /></Grid>
            <Grid item xs={12}>
              <FormControl fullWidth size="small">
                <InputLabel>Holat *</InputLabel>
                <Select value={attForm.status} label="Holat *" onChange={(e) => setAttForm((f) => ({ ...f, status: e.target.value }))}>
                  {Object.entries(ATT_STATUS).map(([k, v]) => <MenuItem key={k} value={k}>{v}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}><TextField label="Kirish vaqti" type="time" size="small" fullWidth InputLabelProps={{ shrink: true }} {...Af('checkIn')} /></Grid>
            <Grid item xs={6}><TextField label="Chiqish vaqti" type="time" size="small" fullWidth InputLabelProps={{ shrink: true }} {...Af('checkOut')} /></Grid>
            <Grid item xs={12}><TextField label="Izoh" size="small" fullWidth multiline rows={2} {...Af('notes')} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setAttDialog({ open: false })}>Bekor</Button>
          <Button variant="contained" onClick={handleSaveAtt} disabled={saving || !attForm.date}>
            {saving ? <CircularProgress size={18} color="inherit" /> : 'Qayd etish'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Work hours dialog */}
      <Dialog open={whDialog.open} onClose={() => setWhDialog({ open: false })} maxWidth="xs" fullWidth>
        <DialogTitle>Ish soati qo'shish — {selectedEmp?.firstName} {selectedEmp?.lastName}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={6}>
              <UzDatePicker label="Sana *" required value={whForm.date} onChange={(e) => setWhForm((f) => ({ ...f, date: e.target.value }))} />
            </Grid>
            <Grid item xs={6}>
              <TextField label="Soat *" type="number" size="small" fullWidth inputProps={{ min: 0.5, max: 24, step: 0.5 }}
                value={whForm.hoursWorked} onChange={(e) => setWhForm((f) => ({ ...f, hoursWorked: e.target.value }))} />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth size="small">
                <InputLabel>Bo'lim *</InputLabel>
                <Select value={whForm.departmentId} label="Bo'lim *" onChange={(e) => setWhForm((f) => ({ ...f, departmentId: e.target.value }))}>
                  {departments.map((d) => <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField label="Izoh" size="small" fullWidth multiline rows={2}
                value={whForm.notes} onChange={(e) => setWhForm((f) => ({ ...f, notes: e.target.value }))} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setWhDialog({ open: false })}>Bekor</Button>
          <Button variant="contained" color="warning" onClick={handleSaveWh} disabled={saving}>
            {saving ? <CircularProgress size={18} color="inherit" /> : 'Qo\'shish'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Work hours delete confirm */}
      <Dialog open={whDeleteDialog.open} onClose={() => setWhDeleteDialog({ open: false, item: null })} maxWidth="xs" fullWidth>
        <DialogTitle>O'chirishni tasdiqlang</DialogTitle>
        <DialogContent>
          <Typography>{whDeleteDialog.item?.date ? format(new Date(whDeleteDialog.item.date), 'dd.MM.yyyy') : ''} — {whDeleteDialog.item?.hoursWorked} soat o'chirilsinmi?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setWhDeleteDialog({ open: false, item: null })}>Bekor</Button>
          <Button variant="contained" color="error" onClick={handleDeleteWh}>O'chirish</Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, item: null })} maxWidth="xs" fullWidth>
        <DialogTitle>Xodimni o'chirish</DialogTitle>
        <DialogContent>
          <Typography><strong>{deleteDialog.item?.lastName} {deleteDialog.item?.firstName}</strong> o'chiriladi. Tasdiqlaysizmi?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, item: null })}>Bekor</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>O'chirish</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Employees;
