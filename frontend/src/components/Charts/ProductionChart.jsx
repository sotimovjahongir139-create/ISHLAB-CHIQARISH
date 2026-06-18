import { Card, CardContent, Typography, Box } from '@mui/material';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { format } from 'date-fns';

const ProductionChart = ({ data = [], title = "Ishlab chiqarish trendi", height = 280 }) => {
  const formatted = data.map((d) => ({
    ...d,
    date: format(new Date(d.date), 'dd-MMM'),
  }));

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2 }}>{title}</Typography>
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart data={formatted} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="produced" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1565C0" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#1565C0" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="good" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2E7D32" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#2E7D32" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip formatter={(v) => v.toLocaleString()} />
            <Legend />
            <Area type="monotone" dataKey="produced" stroke="#1565C0" fill="url(#produced)" name="Ishlab chiqarilgan" strokeWidth={2} />
            <Area type="monotone" dataKey="good" stroke="#2E7D32" fill="url(#good)" name="Yaroqli" strokeWidth={2} />
            <Area type="monotone" dataKey="defects" stroke="#C62828" fill="none" name="Nuqsonlar" strokeWidth={2} strokeDasharray="4 2" />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default ProductionChart;
