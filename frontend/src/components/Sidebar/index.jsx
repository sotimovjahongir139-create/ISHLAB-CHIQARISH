import {
  Drawer, List, ListItemButton, ListItemIcon, ListItemText,
  Box, Typography, Divider, Avatar, Tooltip,
} from '@mui/material';
import {
  Dashboard, Factory, VerifiedUser, AccessTime,
  Inventory, People, Build, Assessment,
  AdminPanelSettings, Settings, DeleteSweep, ColorLens,
  ContentCut, PrecisionManufacturing, TrendingUp,
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
  { label: 'Xodimlar samaradorligi', icon: <TrendingUp />, path: '/emp-performance' },
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

  const visibleNav = hasRole('department')
    ? NAV.filter((item) => item.path === '/emp-performance')
    : NAV;

  return (
    <Drawer
      variant={variant}
      open={variant === 'temporary' ? open : true}
      onClose={onClose}
      sx={{
        width: SIDEBAR_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: SIDEBAR_WIDTH, boxSizing: 'border-box',
          bgcolor: '#090D18', color: '#E7ECF5',
          borderRight: '1px solid rgba(148,163,184,0.12)',
          backgroundImage: 'linear-gradient(180deg, rgba(34,211,238,0.05) 0%, transparent 220px)',
        },
      }}
    >
      {/* Logo */}
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box component="img" src="/logo.svg" alt="ARKON" sx={{ width: 38, height: 38, filter: 'drop-shadow(0 0 6px rgba(34,211,238,0.5))' }} />
        <Typography variant="body1" fontWeight={800} letterSpacing={2} sx={{ color: '#E7ECF5', fontSize: '1.1rem' }}>
          ARKON
        </Typography>
      </Box>

      <Divider sx={{ borderColor: 'rgba(148,163,184,0.12)' }} />

      {/* Nav */}
      <List sx={{ px: 1, py: 1, flexGrow: 1 }}>
        {visibleNav.map((item, i) => {
          if (item.divider) return <Divider key={i} sx={{ my: 1, borderColor: 'rgba(148,163,184,0.12)' }} />;
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
                color: active ? '#67E8F9' : '#8A97AC',
                bgcolor: active ? 'rgba(34,211,238,0.12) !important' : 'transparent',
                borderLeft: '3px solid',
                borderColor: active ? '#22D3EE' : 'transparent',
                boxShadow: active ? 'inset 0 0 0 1px rgba(34,211,238,0.2)' : 'none',
                transition: 'all 0.15s ease',
                '&:hover': {
                  bgcolor: active ? 'rgba(34,211,238,0.16) !important' : 'rgba(148,163,184,0.08) !important',
                  color: active ? '#67E8F9' : '#E7ECF5',
                  borderColor: active ? '#22D3EE' : 'transparent',
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 34, color: active ? '#22D3EE' : '#64748B' }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: active ? 500 : 400, letterSpacing: active ? 0.2 : 0 }} />
            </ListItemButton>
          );
        })}
      </List>

      <Divider sx={{ borderColor: 'rgba(148,163,184,0.12)' }} />

      {/* User */}
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Avatar sx={{ width: 34, height: 34, bgcolor: 'primary.main', color: '#04141A', fontSize: 14, boxShadow: '0 0 12px rgba(34,211,238,0.45)' }}>
          {user?.firstName?.[0]}{user?.lastName?.[0]}
        </Avatar>
        <Box sx={{ overflow: 'hidden' }}>
          <Typography variant="body2" fontWeight={600} noWrap sx={{ color: '#E7ECF5' }}>{user?.firstName} {user?.lastName}</Typography>
          <Typography variant="caption" sx={{ opacity: 0.7 }} noWrap>{user?.role?.displayName}</Typography>
        </Box>
      </Box>
    </Drawer>
  );
};

export default Sidebar;
