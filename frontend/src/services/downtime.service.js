import api from './api';

export const getReasons = () => api.get('/downtime/reasons');
export const createReason = (data) => api.post('/downtime/reasons', data);
export const updateReason = (id, data) => api.put(`/downtime/reasons/${id}`, data);
export const deleteReason = (id) => api.delete(`/downtime/reasons/${id}`);
export const getActiveDowntimes = (params) => api.get('/downtime/active', { params });
export const getDowntimes = (params) => api.get('/downtime', { params });
export const createDowntime = (data) => api.post('/downtime', data);
export const resolveDowntime = (id, endTime) => api.put(`/downtime/${id}/resolve`, { endTime });
