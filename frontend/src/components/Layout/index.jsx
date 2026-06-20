import { Box, Toolbar, useMediaQuery, useTheme } from '@mui/material';
import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { keyframes } from '@emotion/react';
import Sidebar from '../Sidebar';
import Navbar from '../Navbar';
import { SIDEBAR_WIDTH } from '../../constants';

const pageIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const Layout = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {isMobile ? (
        <Sidebar variant="temporary" open={mobileOpen} onClose={() => setMobileOpen(false)} />
      ) : (
        <Sidebar />
      )}

      <Box component="main" sx={{ flexGrow: 1, width: { md: `calc(100% - ${SIDEBAR_WIDTH}px)` }, height: '100vh', overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
        <Navbar onMenuClick={() => setMobileOpen(true)} />
        <Toolbar />
        <Box
          key={location.pathname}
          sx={{ p: { xs: 2, md: 3 }, flex: 1, animation: `${pageIn} 240ms cubic-bezier(0.22, 0.61, 0.36, 1)` }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default Layout;
