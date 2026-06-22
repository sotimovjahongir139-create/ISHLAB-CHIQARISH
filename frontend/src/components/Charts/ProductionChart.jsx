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
              <linearGradient id="pc-produced" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563EB" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="pc-good" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#16A34A" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#16A34A" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
            <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#64748B' }} />
            <YAxis tick={{ fontSize: 12, fill: '#64748B' }} />
            <Tooltip
              contentStyle={{ background: '#0D1B2A', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, color: '#E0E8F0' }}
              formatter={(v) => v.toLocaleString()}
            />
            <Legend />
            <Area type="monotone" dataKey="produced" stroke="#2563EB" fill="url(#pc-produced)" name="Ishlab chiqarilgan" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />
            <Area type="monotone" dataKey="good" stroke="#16A34A" fill="url(#pc-good)" name="Yaroqli" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
            <Area type="monotone" dataKey="defects" stroke="#EF4444" fill="none" name="Nuqsonlar" strokeWidth={2} strokeDasharray="5 3" dot={{ r: 2.5, fill: '#EF4444', strokeWidth: 0 }} activeDot={{ r: 5 }} />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default ProductionChart;
