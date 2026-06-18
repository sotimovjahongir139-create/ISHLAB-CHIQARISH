import api from './api';
export const getWasteRecords = (params) => api.get('/waste', { params });
export const createWasteRecord = (data) => api.post('/waste', data);
export const updateWasteRecord = (id, data) => api.put(`/waste/${id}`, data);
export const deleteWasteRecord = (id) => api.delete(`/waste/${id}`);
