import api from './api';
export const getCharxlashRecords = (params) => api.get('/charxlash', { params });
export const createCharxlashRecord = (data) => api.post('/charxlash', data);
export const updateCharxlashRecord = (id, data) => api.patch(`/charxlash/${id}`, data);
export const deleteCharxlashRecord = (id) => api.delete(`/charxlash/${id}`);
export const getCharxlashStats = (params) => api.get('/charxlash/stats', { params });
