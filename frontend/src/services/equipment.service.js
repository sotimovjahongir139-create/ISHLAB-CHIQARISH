import api from './api';

export const getEquipment = (params) => api.get('/equipment', { params });
export const createEquipment = (data) => api.post('/equipment', data);
export const updateEquipment = (id, data) => api.put(`/equipment/${id}`, data);
export const deleteEquipment = (id) => api.delete(`/equipment/${id}`);
export const updateStatus = (id, status) => api.put(`/equipment/${id}/status`, { status });
export const getMaintenances = (id, params) => api.get(`/equipment/${id}/maintenances`, { params });
export const createMaintenance = (id, data) => api.post(`/equipment/${id}/maintenances`, data);
export const completeMaintenance = (id, mId, data) => api.put(`/equipment/${id}/maintenances/${mId}/complete`, data);
