import { Card, CardContent, Box, Typography, Skeleton } from '@mui/material';
import { TrendingUp, TrendingDown, TrendingFlat } from '@mui/icons-material';

const KPICard = ({ title, value, unit, trend, trendValue, icon, color = 'primary', loading = false }) => {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : TrendingFlat;
  const trendColor = trend === 'up' ? 'success.main' : trend === 'down' ? 'error.main' : 'text.secondary';

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1.5 }}>
          <Typography variant="body2" color="text.secondary" fontWeight={500}>{title}</Typography>
          <Box sx={{
            width: 40, height: 40, borderRadius: 2,
            bgcolor: `${color}.light`, opacity: 0.15,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Box sx={{ color: `${color}.main`, opacity: 10, display: 'flex' }}>{icon}</Box>
          </Box>
        </Box>

        {loading ? (
          <Skeleton width={80} height={40} />
        ) : (
          <Typography variant="h4" fontWeight={700} sx={{ mb: 0.5 }}>
            {value !== null && value !== undefined ? value.toLocaleString() : '—'}
            {unit && <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>{unit}</Typography>}
          </Typography>
        )}

        {trendValue !== undefined && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
            <TrendIcon sx={{ fontSize: 16, color: trendColor }} />
            <Typography variant="caption" sx={{ color: trendColor, fontWeight: 600 }}>
              {trendValue > 0 ? '+' : ''}{trendValue}%
            </Typography>
            <Typography variant="caption" color="text.secondary">o'tgan haftaga nisbatan</Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default KPICard;
