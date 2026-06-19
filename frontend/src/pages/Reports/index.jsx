import {
  Box, Typography, Grid, Card, CardContent,
  Button, Chip, ToggleButtonGroup, ToggleButton,
  FormControl, InputLabel, Select, MenuItem, Divider,
} from '@mui/material';
import {
  FileDownload, DateRange,
  Factory, VerifiedUser, AccessTime,
  Inventory, People, Build,
} from '@mui/icons-material';
import { useState } from 'react';

const REPORT_DEFS = [
  { key: 'PRODUCTION', label: 'Ishlab chiqarish', icon: <Factory />, color: 'primary', hasPuTep: true },
  { key: 'QUALITY', label: 'Sifat nazorati', icon: <VerifiedUser />, color: 'success', hasPuTep: true },
  { key: 'DOWNTIME', label: "To'xtalishlar", icon: <AccessTime />, color: 'error', hasPuTep: false },
  { key: 'MATERIAL', label: 'Xomashyo', icon: <Inventory />, color: 'warning', hasPuTep: false },
  { key: 'EMPLOYEE', label: 'Xodimlar', icon: <People />, color: 'secondary', hasPuTep: false },
  { key: 'EQUIPMENT', label: 'Uskunalar', icon: <Build />, color: 'info', hasPuTep: false },
  { key: 'DAILY', label: 'Kunlik hisobot', icon: <DateRange />, color: 'primary', hasPuTep: true },
  { key: 'WEEKLY', label: 'Haftalik hisobot', icon: <DateRange />, color: 'secondary', hasPuTep: true },
  { key: 'MONTHLY', label: 'Oylik hisobot', icon: <DateRange />, color: 'info', hasPuTep: true },
  { key: 'SHIFT', label: 'Smena hisoboti', icon: <Factory />, color: 'warning', hasPuTep: true },
];

const PERIOD_OPTIONS = [
  { label: 'Bugun', value: 'today' },
  { label: 'Bu hafta', value: 'week' },
  { label: 'Bu oy', value: 'month' },
  { label: 'Maxsus', value: 'custom' },
];

const ReportCard = ({ def }) => {
  const [category, setCategory] = useState('PU');
  const [period, setPeriod] = useState('month');

  const handleGenerate = (fmt) => {
    // TODO: implement report generation with period + category + format
  };

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
          <Box sx={{
            width: 42, height: 42, borderRadius: 2,
            bgcolor: `${def.color}.main`, display: 'flex',
            alignItems: 'center', justifyContent: 'center', color: '#fff',
            flexShrink: 0,
          }}>
            {def.icon}
          </Box>
          <Typography variant="body1" fontWeight={600}>{def.label}</Typography>
        </Box>

        {/* PU / TEP filter */}
        {def.hasPuTep && (
          <Box sx={{ mb: 1.5 }}>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
              Bo'lim
            </Typography>
            <ToggleButtonGroup
              size="small"
              exclusive
              value={category}
              onChange={(_, v) => v && setCategory(v)}
              fullWidth
            >
              <ToggleButton value="PU" sx={{ fontSize: 12, py: 0.4 }}>PU (Haqiqiy)</ToggleButton>
              <ToggleButton value="TEP" sx={{ fontSize: 12, py: 0.4 }}>TEP (Reja)</ToggleButton>
            </ToggleButtonGroup>
          </Box>
        )}

        {/* Period filter */}
        <FormControl size="small" fullWidth>
          <InputLabel>Davr</InputLabel>
          <Select value={period} label="Davr" onChange={(e) => setPeriod(e.target.value)}>
            {PERIOD_OPTIONS.map((o) => (
              <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </CardContent>

      <Divider />
      <Box sx={{ p: 1.5, display: 'flex', gap: 1 }}>
        <Button
          size="small"
          variant="outlined"
          startIcon={<FileDownload fontSize="small" />}
          onClick={() => handleGenerate('excel')}
          fullWidth
        >
          Excel
        </Button>
        <Button
          size="small"
          variant="outlined"
          color="error"
          startIcon={<FileDownload fontSize="small" />}
          onClick={() => handleGenerate('pdf')}
          fullWidth
        >
          PDF
        </Button>
      </Box>
    </Card>
  );
};

const Reports = () => (
  <Box>
    <Box sx={{ mb: 3 }}>
      <Typography variant="h4">Hisobotlar markazi</Typography>
      <Typography variant="body2" color="text.secondary">
        Excel va PDF formatlarida hisobotlar yaratish — PU (haqiqiy) yoki TEP (reja) bo'yicha
      </Typography>
    </Box>

    <Grid container spacing={2.5}>
      {REPORT_DEFS.map((def) => (
        <Grid item xs={12} sm={6} md={4} lg={3} key={def.key}>
          <ReportCard def={def} />
        </Grid>
      ))}
    </Grid>
  </Box>
);

export default Reports;
