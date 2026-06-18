import api from './api';
export const getWorkHours = (params) => api.get('/workhours', { params });
export const createWorkHour = (data) => api.post('/workhours', data);
export const deleteWorkHour = (id) => api.delete(`/workhours/${id}`);
export const getDeptStats = (departmentId) => api.get(`/workhours/dept/${departmentId}/stats`);
