export const API_BASE = '/api/v1';

export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  PRODUCTION_MANAGER: 'production_manager',
  QUALITY_INSPECTOR: 'quality_inspector',
  OPERATOR: 'operator',
};

export const PLAN_STATUS = {
  DRAFT: { label: 'Qoralama', color: 'default' },
  CONFIRMED: { label: 'Tasdiqlangan', color: 'info' },
  IN_PROGRESS: { label: 'Jarayonda', color: 'warning' },
  COMPLETED: { label: 'Bajarildi', color: 'success' },
  CANCELLED: { label: 'Bekor qilindi', color: 'error' },
};

export const DEFECT_STATUS = {
  OPEN: { label: 'Ochiq', color: 'error' },
  IN_REVIEW: { label: 'Ko\'rib chiqilmoqda', color: 'warning' },
  RESOLVED: { label: 'Hal qilindi', color: 'success' },
  CLOSED: { label: 'Yopildi', color: 'default' },
};

export const DEFECT_SEVERITY = {
  MINOR: { label: 'Kichik', color: 'warning' },
  MAJOR: { label: 'Muhim', color: 'error' },
  CRITICAL: { label: 'Kritik', color: 'error' },
};

export const DOWNTIME_STATUS = {
  ACTIVE: { label: 'Faol', color: 'error' },
  RESOLVED: { label: 'Yopildi', color: 'success' },
  CANCELLED: { label: 'Bekor qilindi', color: 'default' },
};

export const DOWNTIME_CATEGORY = {
  PLANNED: 'Rejalashtirilgan',
  UNPLANNED: 'Rejalashtirilmagan',
  BREAKDOWN: 'Buzilish',
  MAINTENANCE: 'Texnik xizmat',
  CHANGEOVER: 'Model almashtirish',
  WAITING_MATERIAL: 'Xomashyo kutish',
  OPERATOR: 'Operator',
  OTHER: 'Boshqa',
};

export const EQUIPMENT_STATUS = {
  OPERATIONAL: { label: 'Ishlamoqda', color: 'success' },
  MAINTENANCE: { label: 'Texnik xizmatda', color: 'warning' },
  BREAKDOWN: { label: 'Buzilgan', color: 'error' },
  RETIRED: { label: 'Hisobdan chiqarilgan', color: 'default' },
  STANDBY: { label: 'Kutish rejimida', color: 'info' },
};

export const EMPLOYEE_STATUS = {
  ACTIVE: { label: 'Faol', color: 'success' },
  ON_LEAVE: { label: 'Ta\'tilda', color: 'warning' },
  TERMINATED: { label: 'Ishdan bo\'shatilgan', color: 'error' },
  SUSPENDED: { label: 'To\'xtatilgan', color: 'default' },
};

export const TRANSACTION_TYPE = {
  IN: { label: 'Kirim', color: 'success' },
  OUT: { label: 'Chiqim', color: 'error' },
  ADJUSTMENT: { label: 'Tuzatish', color: 'warning' },
  RETURN: { label: 'Qaytarish', color: 'info' },
  TRANSFER: { label: 'Ko\'chirish', color: 'default' },
};

export const CHART_COLORS = ['#1565C0', '#0097A7', '#2E7D32', '#E65100', '#C62828', '#6A1B9A', '#F57C00'];

export const SIDEBAR_WIDTH = 260;
