// All system permissions — name format: module:action
const PERMISSIONS = {
  // Users
  USERS_READ:   'users:read',
  USERS_CREATE: 'users:create',
  USERS_UPDATE: 'users:update',
  USERS_DELETE: 'users:delete',

  // Roles
  ROLES_READ:   'roles:read',
  ROLES_CREATE: 'roles:create',
  ROLES_UPDATE: 'roles:update',
  ROLES_DELETE: 'roles:delete',

  // Departments
  DEPARTMENTS_READ:   'departments:read',
  DEPARTMENTS_CREATE: 'departments:create',
  DEPARTMENTS_UPDATE: 'departments:update',
  DEPARTMENTS_DELETE: 'departments:delete',

  // Production
  PRODUCTION_READ:   'production:read',
  PRODUCTION_CREATE: 'production:create',
  PRODUCTION_UPDATE: 'production:update',
  PRODUCTION_DELETE: 'production:delete',
  PRODUCTION_EXPORT: 'production:export',

  // Quality
  QUALITY_READ:   'quality:read',
  QUALITY_CREATE: 'quality:create',
  QUALITY_UPDATE: 'quality:update',
  QUALITY_DELETE: 'quality:delete',
  QUALITY_EXPORT: 'quality:export',

  // Downtime
  DOWNTIME_READ:   'downtime:read',
  DOWNTIME_CREATE: 'downtime:create',
  DOWNTIME_UPDATE: 'downtime:update',
  DOWNTIME_DELETE: 'downtime:delete',
  DOWNTIME_EXPORT: 'downtime:export',

  // Materials
  MATERIALS_READ:   'materials:read',
  MATERIALS_CREATE: 'materials:create',
  MATERIALS_UPDATE: 'materials:update',
  MATERIALS_DELETE: 'materials:delete',
  MATERIALS_EXPORT: 'materials:export',

  // Employees
  EMPLOYEES_READ:   'employees:read',
  EMPLOYEES_CREATE: 'employees:create',
  EMPLOYEES_UPDATE: 'employees:update',
  EMPLOYEES_DELETE: 'employees:delete',
  EMPLOYEES_EXPORT: 'employees:export',

  // Equipment
  EQUIPMENT_READ:   'equipment:read',
  EQUIPMENT_CREATE: 'equipment:create',
  EQUIPMENT_UPDATE: 'equipment:update',
  EQUIPMENT_DELETE: 'equipment:delete',
  EQUIPMENT_EXPORT: 'equipment:export',

  // Audit logs
  AUDIT_READ: 'audit:read',

  // Reports
  REPORTS_READ:   'reports:read',
  REPORTS_CREATE: 'reports:create',
  REPORTS_EXPORT: 'reports:export',

  // Settings
  SETTINGS_READ:   'settings:read',
  SETTINGS_UPDATE: 'settings:update',
};

// All permissions as flat list for seeding
const ALL_PERMISSIONS = Object.entries(PERMISSIONS).map(([key, name]) => {
  const [module, action] = name.split(':');
  return {
    name,
    displayName: `${module.charAt(0).toUpperCase() + module.slice(1)}: ${action.charAt(0).toUpperCase() + action.slice(1)}`,
    module,
    action,
  };
});

// Default permissions per role (except super_admin who gets all)
const ROLE_DEFAULTS = {
  admin: Object.values(PERMISSIONS),
  production_manager: [
    PERMISSIONS.PRODUCTION_READ, PERMISSIONS.PRODUCTION_CREATE, PERMISSIONS.PRODUCTION_UPDATE, PERMISSIONS.PRODUCTION_EXPORT,
    PERMISSIONS.QUALITY_READ, PERMISSIONS.QUALITY_CREATE, PERMISSIONS.QUALITY_UPDATE,
    PERMISSIONS.DOWNTIME_READ, PERMISSIONS.DOWNTIME_CREATE, PERMISSIONS.DOWNTIME_UPDATE,
    PERMISSIONS.MATERIALS_READ, PERMISSIONS.MATERIALS_CREATE, PERMISSIONS.MATERIALS_UPDATE,
    PERMISSIONS.EMPLOYEES_READ,
    PERMISSIONS.EQUIPMENT_READ, PERMISSIONS.EQUIPMENT_UPDATE,
    PERMISSIONS.REPORTS_READ,
  ],
  quality_inspector: [
    PERMISSIONS.QUALITY_READ, PERMISSIONS.QUALITY_CREATE, PERMISSIONS.QUALITY_UPDATE, PERMISSIONS.QUALITY_EXPORT,
    PERMISSIONS.PRODUCTION_READ,
    PERMISSIONS.REPORTS_READ,
  ],
  operator: [
    PERMISSIONS.PRODUCTION_READ, PERMISSIONS.PRODUCTION_CREATE,
    PERMISSIONS.DOWNTIME_READ, PERMISSIONS.DOWNTIME_CREATE,
    PERMISSIONS.QUALITY_READ,
    PERMISSIONS.MATERIALS_READ,
  ],
};

module.exports = { PERMISSIONS, ALL_PERMISSIONS, ROLE_DEFAULTS };
