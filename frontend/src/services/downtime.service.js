import api from './api';

export const getReasons = () => api.get('/downtime/reasons');
export const getActiveDowntimes = (params) => api.get('/downtime/active', { params });
export const getDowntimes = (params) => api.get('/downtime', { params });
export const createDowntime = (data) => api.post('/downtime', data);
export const resolveDowntime = (id, endTime) => api.put(`/downtime/${id}/resolve`, { endTime });
