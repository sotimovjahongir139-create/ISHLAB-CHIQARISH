import { createBrowserRouter, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { CircularProgress, Box } from '@mui/material';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import ProtectedRoute from '../components/ProtectedRoute';

// Wraps lazy() so that a failed dynamic import (stale chunk after deployment)
// triggers a one-time page reload. The sessionStorage flag prevents an infinite
// reload loop if the chunk is genuinely missing (not just stale).
const safeImport = (importer) =>
  lazy(async () => {
    try {
      return await importer();
    } catch (err) {
      const isChunkError = /loading.*chunk|dynamically imported module|failed to fetch/i.test(
        err?.message || String(err)
      );
      if (isChunkError && !sessionStorage.getItem('chunk_reload_guard')) {
        sessionStorage.setItem('chunk_reload_guard', '1');
        window.location.reload();
        return new Promise(() => {}); // suspend until reload completes
      }
      throw err;
    }
  });

// Clear the reload guard once the app bootstraps successfully so that future
// chunk errors (e.g. after a second deployment) can still trigger a reload.
if (sessionStorage.getItem('chunk_reload_guard')) {
  sessionStorage.removeItem('chunk_reload_guard');
}

const Login         = safeImport(() => import('../pages/Login'));
const Dashboard     = safeImport(() => import('../pages/Dashboard'));
const Production    = safeImport(() => import('../pages/Production'));
const Quality       = safeImport(() => import('../pages/Quality'));
const Downtime      = safeImport(() => import('../pages/Downtime'));
const Materials     = safeImport(() => import('../pages/Materials'));
const Employees     = safeImport(() => import('../pages/Employees'));
const Equipment     = safeImport(() => import('../pages/Equipment'));
const Reports       = safeImport(() => import('../pages/Reports'));
const Settings      = safeImport(() => import('../pages/Settings'));
const Administration = safeImport(() => import('../pages/Administration'));
const Waste         = safeImport(() => import('../pages/Waste'));
const Paint         = safeImport(() => import('../pages/Paint'));
const Kesish        = safeImport(() => import('../pages/Kesish'));
const Charxlash     = safeImport(() => import('../pages/Charxlash'));
const EmpPerformance = safeImport(() => import('../pages/EmployeePerformance'));

const Loading = () => (
  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
    <CircularProgress />
  </Box>
);

const Wrap = ({ element }) => <Suspense fallback={<Loading />}>{element}</Suspense>;

const PrivateRoute = ({ element }) => {
  const { user, loading } = useAuth();
  if (loading) return <Loading />;
  if (!user) return <Navigate to="/login" replace />;
  return element;
};

const Guarded = ({ element, permission, roles }) => (
  <Wrap element={<ProtectedRoute element={element} permission={permission} roles={roles || []} />} />
);

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Wrap element={<Login />} />,
  },
  {
    path: '/',
    element: <PrivateRoute element={<Layout />} />,
    children: [
      { index: true, element: <Wrap element={<Dashboard />} /> },
      { path: 'production',     element: <Guarded element={<Production />}     permission="production:read" /> },
      { path: 'quality',        element: <Guarded element={<Quality />}         permission="quality:read" /> },
      { path: 'downtime',       element: <Guarded element={<Downtime />}        permission="downtime:read" /> },
      { path: 'materials',      element: <Guarded element={<Materials />}       permission="materials:read" /> },
      { path: 'employees',      element: <Guarded element={<Employees />}       permission="employees:read" /> },
      { path: 'equipment',      element: <Guarded element={<Equipment />}       permission="equipment:read" /> },
      { path: 'reports',        element: <Guarded element={<Reports />}         permission="reports:read" /> },
      { path: 'settings',       element: <Guarded element={<Settings />}        roles={['super_admin', 'admin']} /> },
      { path: 'administration', element: <Guarded element={<Administration />}  roles={['super_admin', 'admin']} /> },
      { path: 'waste',          element: <Guarded element={<Waste />}           permission="materials:read" /> },
      { path: 'paint',          element: <Guarded element={<Paint />}           permission="materials:read" /> },
      { path: 'kesish',          element: <Guarded element={<Kesish />}          permission="materials:read" /> },
      { path: 'charxlash',      element: <Guarded element={<Charxlash />}       permission="materials:read" /> },
      { path: 'emp-performance', element: <Guarded element={<EmpPerformance />} permission="employees:read" /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
]);
