import api from './api';
export const getKesishRecords = (params) => api.get('/kesish', { params });
export const createKesishRecord = (data) => api.post('/kesish', data);
export const updateKesishRecord = (id, data) => api.patch(`/kesish/${id}`, data);
export const deleteKesishRecord = (id) => api.delete(`/kesish/${id}`);
export const getKesishStats = (params) => api.get('/kesish/stats', { params });
