import api from './api';
export const getEmpPerfRecords = (params) => api.get('/employee-performance', { params });
export const createEmpPerfRecord = (data) => api.post('/employee-performance', data);
export const updateEmpPerfRecord = (id, data) => api.patch(`/employee-performance/${id}`, data);
export const deleteEmpPerfRecord = (id) => api.delete(`/employee-performance/${id}`);
export const getEmpPerfStats = (params) => api.get('/employee-performance/stats', { params });
