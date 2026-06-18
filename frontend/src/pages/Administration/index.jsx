import {
  Box, Typography, Tabs, Tab, Card, CardContent,
  Badge,
} from '@mui/material';
import {
  People, Security, Business, History, AdminPanelSettings,
} from '@mui/icons-material';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import usePermission from '../../hooks/usePermission';
import UsersTab from './UsersTab';
import RolesTab from './RolesTab';
import DepartmentsTab from './DepartmentsTab';
import AuditLogsTab from './AuditLogsTab';

const TABS = [
  { id: 'users', label: 'Foydalanuvchilar', icon: <People />, permission: 'users:read' },
  { id: 'roles', label: 'Rollar', icon: <Security />, permission: 'roles:read' },
  { id: 'departments', label: 'Bo\'limlar', icon: <Business />, permission: 'departments:read' },
  { id: 'audit', label: 'Audit jurnali', icon: <History />, role: 'super_admin' },
];

const Administration = () => {
  const { user } = useAuth();
  const { can, hasRole } = usePermission();
  const [tab, setTab] = useState(0);

  const visibleTabs = TABS.filter((t) => {
    if (t.role) return hasRole(t.role);
    if (t.permission) return can(t.permission);
    return true;
  });

  const current = visibleTabs[tab];

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <AdminPanelSettings sx={{ fontSize: 32, color: 'primary.main' }} />
          <Box>
            <Typography variant="h4">Boshqaruv paneli</Typography>
            <Typography variant="body2" color="text.secondary">
              Foydalanuvchilar, rollar, bo'limlar va faoliyat jurnali
            </Typography>
          </Box>
        </Box>
      </Box>

      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            sx={{ px: 2 }}
            variant="scrollable"
            scrollButtons="auto"
          >
            {visibleTabs.map((t) => (
              <Tab
                key={t.id}
                icon={t.icon}
                iconPosition="start"
                label={t.label}
                sx={{ textTransform: 'none', fontWeight: 600, minHeight: 56 }}
              />
            ))}
          </Tabs>
        </Box>

        <CardContent sx={{ pt: 2.5 }}>
          {current?.id === 'users' && <UsersTab />}
          {current?.id === 'roles' && <RolesTab />}
          {current?.id === 'departments' && <DepartmentsTab factoryId={user?.factoryId} />}
          {current?.id === 'audit' && <AuditLogsTab />}
        </CardContent>
      </Card>
    </Box>
  );
};

export default Administration;
