import { Navigate } from 'react-router-dom';
import { Box, Typography, Button } from '@mui/material';
import { Lock } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import usePermission from '../hooks/usePermission';

/**
 * Wraps a route element with role/permission checks.
 *
 * <ProtectedRoute roles={['super_admin','admin']} element={<Admin />} />
 * <ProtectedRoute permission="users:read" element={<Users />} />
 */
const ProtectedRoute = ({ element, roles = [], permission = null, redirectTo = '/' }) => {
  const { user, loading } = useAuth();
  const { hasRole, can } = usePermission();

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;

  const roleOk = roles.length === 0 || hasRole(...roles);
  const permOk = !permission || can(permission);

  if (!roleOk || !permOk) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 2 }}>
        <Lock sx={{ fontSize: 64, color: 'text.disabled' }} />
        <Typography variant="h5" fontWeight={700}>Ruxsat yo'q</Typography>
        <Typography color="text.secondary">Bu sahifani ko'rish uchun huquqingiz yetarli emas</Typography>
        <Button variant="contained" onClick={() => window.history.back()}>Orqaga</Button>
      </Box>
    );
  }

  return element;
};

export default ProtectedRoute;
