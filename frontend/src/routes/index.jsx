import { createBrowserRouter, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { CircularProgress, Box } from '@mui/material';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import ProtectedRoute from '../components/ProtectedRoute';

const Login = lazy(() => import('../pages/Login'));
const Dashboard = lazy(() => import('../pages/Dashboard'));
const Production = lazy(() => import('../pages/Production'));
const Quality = lazy(() => import('../pages/Quality'));
const Downtime = lazy(() => import('../pages/Downtime'));
const Materials = lazy(() => import('../pages/Materials'));
const Employees = lazy(() => import('../pages/Employees'));
const Equipment = lazy(() => import('../pages/Equipment'));
const Reports = lazy(() => import('../pages/Reports'));
const Settings = lazy(() => import('../pages/Settings'));
const Administration = lazy(() => import('../pages/Administration'));
const Waste = lazy(() => import('../pages/Waste'));
const Paint = lazy(() => import('../pages/Paint'));

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
      {
        path: 'production',
        element: <Guarded element={<Production />} permission="production:read" />,
      },
      {
        path: 'quality',
        element: <Guarded element={<Quality />} permission="quality:read" />,
      },
      {
        path: 'downtime',
        element: <Guarded element={<Downtime />} permission="downtime:read" />,
      },
      {
        path: 'materials',
        element: <Guarded element={<Materials />} permission="materials:read" />,
      },
      {
        path: 'employees',
        element: <Guarded element={<Employees />} permission="employees:read" />,
      },
      {
        path: 'equipment',
        element: <Guarded element={<Equipment />} permission="equipment:read" />,
      },
      {
        path: 'reports',
        element: <Guarded element={<Reports />} permission="reports:read" />,
      },
      {
        path: 'settings',
        element: <Guarded element={<Settings />} roles={['super_admin', 'admin']} />,
      },
      {
        path: 'administration',
        element: <Guarded element={<Administration />} roles={['super_admin', 'admin']} />,
      },
      {
        path: 'waste',
        element: <Guarded element={<Waste />} permission="materials:read" />,
      },
      {
        path: 'paint',
        element: <Guarded element={<Paint />} permission="materials:read" />,
      },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
]);
