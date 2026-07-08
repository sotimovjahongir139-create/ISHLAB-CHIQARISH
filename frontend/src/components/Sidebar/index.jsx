import {
  Drawer, List, ListItemButton, ListItemIcon, ListItemText,
  Box, Typography, Divider, Avatar, Tooltip,
} from '@mui/material';
import {
  Dashboard, Factory, VerifiedUser, AccessTime,
  Inventory, People, Build, Assessment,
  AdminPanelSettings, Settings, DeleteSweep, ColorLens,
  ContentCut, PrecisionManufacturing,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { SIDEBAR_WIDTH } from '../../constants';

const NAV = [
  { label: 'Bosh sahifa', icon: <Dashboard />, path: '/' },
  { label: 'Ishlab chiqarish', icon: <Factory />, path: '/production' },
  { label: 'Sifat nazorati', icon: <VerifiedUser />, path: '/quality' },
  { label: "To'xtalishlar", icon: <AccessTime />, path: '/downtime' },
  { label: 'Xomashyo', icon: <Inventory />, path: '/materials' },
  { label: 'Atxot', icon: <DeleteSweep />, path: '/waste' },
  { label: 'Kraska', icon: <ColorLens />, path: '/paint' },
  { label: 'Kesish', icon: <ContentCut />, path: '/kesish' },
  { label: 'Charxlash', icon: <PrecisionManufacturing />, path: '/charxlash' },
  { label: 'Xodimlar', icon: <People />, path: '/employees' },
  { label: 'Uskunalar', icon: <Build />, path: '/equipment' },
  { label: 'Hisobotlar', icon: <Assessment />, path: '/reports' },
  { divider: true },
  { label: 'Boshqaruv', icon: <AdminPanelSettings />, path: '/administration', roles: ['super_admin', 'admin'] },
  { label: 'Sozlamalar', icon: <Settings />, path: '/settings' },
];

const Sidebar = ({ open, onClose, variant = 'permanent' }) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user, hasRole } = useAuth();

  const handleNav = (path) => { navigate(path); if (variant === 'temporary') onClose?.(); };

  return (
    <Drawer
      variant={variant}
      open={variant === 'temporary' ? open : true}
      onClose={onClose}
      sx={{
        width: SIDEBAR_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': { width: SIDEBAR_WIDTH, boxSizing: 'border-box', bgcolor: '#FFFFFF', color: '#1E293B', borderRight: '1px solid #E2E8F0' },
      }}
    >
      {/* Logo */}
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box component="img" src="/logo.svg" alt="ARKON" sx={{ width: 38, height: 38 }} />
        <Typography variant="body1" fontWeight={800} letterSpacing={2} sx={{ color: '#1E293B', fontSize: '1.1rem' }}>
          ARKON
        </Typography>
      </Box>

      <Divider sx={{ borderColor: '#E2E8F0' }} />

      {/* Nav */}
      <List sx={{ px: 1, py: 1, flexGrow: 1 }}>
        {NAV.map((item, i) => {
          if (item.divider) return <Divider key={i} sx={{ my: 1, borderColor: '#E2E8F0' }} />;
          if (item.roles && !hasRole(...item.roles)) return null;

          const active = item.path === '/'
            ? pathname === '/'
            : pathname.startsWith(item.path);

          return (
            <ListItemButton
              key={item.path}
              selected={active}
              onClick={() => handleNav(item.path)}
              sx={{
                borderRadius: 1.5, mb: 0.5, py: 0.85,
                pl: 1.5,
                color: active ? '#fff' : '#475569',
                bgcolor: active ? '#2563EB !important' : 'transparent',
                borderLeft: '3px solid',
                borderColor: active ? '#2563EB' : 'transparent',
                transition: 'all 0.15s ease',
                '&:hover': {
                  bgcolor: active ? '#2563EB !important' : 'rgba(37,99,235,0.08) !important',
                  color: active ? '#fff' : '#1E293B',
                  borderColor: active ? '#2563EB' : 'transparent',
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 34, color: active ? '#fff' : '#64748B' }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: active ? 500 : 400, letterSpacing: active ? 0.2 : 0 }} />
            </ListItemButton>
          );
        })}
      </List>

      <Divider sx={{ borderColor: '#E2E8F0' }} />

      {/* User */}
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Avatar sx={{ width: 34, height: 34, bgcolor: 'primary.main', fontSize: 14 }}>
          {user?.firstName?.[0]}{user?.lastName?.[0]}
        </Avatar>
        <Box sx={{ overflow: 'hidden' }}>
          <Typography variant="body2" fontWeight={600} noWrap>{user?.firstName} {user?.lastName}</Typography>
          <Typography variant="caption" sx={{ opacity: 0.6 }} noWrap>{user?.role?.displayName}</Typography>
        </Box>
      </Box>
    </Drawer>
  );
};

export default Sidebar;
