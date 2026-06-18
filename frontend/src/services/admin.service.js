import api from './api';

// ── Users ──────────────────────────────────────────────────────────────────
export const getUsers = (params) => api.get('/admin/users', { params });
export const getUser = (id) => api.get(`/admin/users/${id}`);
export const createUser = (data) => api.post('/admin/users', data);
export const updateUser = (id, data) => api.put(`/admin/users/${id}`, data);
export const toggleActive = (id) => api.patch(`/admin/users/${id}/toggle-active`);
export const deleteUser = (id) => api.delete(`/admin/users/${id}`);
export const resetPassword = (id, newPassword) => api.post(`/admin/users/${id}/reset-password`, { newPassword });

// ── Roles ──────────────────────────────────────────────────────────────────
export const getRoles = () => api.get('/admin/roles');
export const getRole = (id) => api.get(`/admin/roles/${id}`);
export const createRole = (data) => api.post('/admin/roles', data);
export const updateRole = (id, data) => api.put(`/admin/roles/${id}`, data);
export const deleteRole = (id) => api.delete(`/admin/roles/${id}`);
export const setRolePermissions = (id, permissionIds) => api.put(`/admin/roles/${id}/permissions`, { permissionIds });

// ── Permissions ────────────────────────────────────────────────────────────
export const getAllPermissions = () => api.get('/admin/permissions');

// ── Departments ────────────────────────────────────────────────────────────
export const getDepartments = (params) => api.get('/admin/departments', { params });
export const createDepartment = (data) => api.post('/admin/departments', data);
export const updateDepartment = (id, data) => api.put(`/admin/departments/${id}`, data);
export const deleteDepartment = (id) => api.delete(`/admin/departments/${id}`);

// ── Audit Logs ─────────────────────────────────────────────────────────────
export const getAuditLogs = (params) => api.get('/admin/audit-logs', { params });
export const getActivityStats = (days) => api.get('/admin/audit-logs/stats', { params: { days } });
