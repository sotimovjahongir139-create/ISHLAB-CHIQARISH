import api from './api';

export const getMaterials = (params) => api.get('/materials', { params });
export const createMaterial = (data) => api.post('/materials', data);
export const updateMaterial = (id, data) => api.put(`/materials/${id}`, data);
export const deleteMaterial = (id) => api.delete(`/materials/${id}`);
export const addTransaction = (id, data) => api.post(`/materials/${id}/transactions`, data);
export const getTransactions = (id, params) => api.get(`/materials/${id}/transactions`, { params });
