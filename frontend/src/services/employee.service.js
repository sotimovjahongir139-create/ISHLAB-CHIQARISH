import api from './api';

export const getEmployees = (params) => api.get('/employees', { params });
export const getEmployee = (id) => api.get(`/employees/${id}`);
export const createEmployee = (data) => api.post('/employees', data);
export const updateEmployee = (id, data) => api.put(`/employees/${id}`, data);
export const deleteEmployee = (id) => api.delete(`/employees/${id}`);
export const recordAttendance = (data) => api.post('/employees/attendance', data);
export const getAttendance = (id, params) => api.get(`/employees/${id}/attendance`, { params });
export const getDepartments = () => api.get('/employees/departments');
