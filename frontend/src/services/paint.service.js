import api from './api';
export const getPaintRecords = (params) => api.get('/paint', { params });
export const createPaintRecord = (data) => api.post('/paint', data);
export const updatePaintRecord = (id, data) => api.put(`/paint/${id}`, data);
export const deletePaintRecord = (id) => api.delete(`/paint/${id}`);
