import api from './api';

export const getLines = (params) => api.get('/production/lines', { params });
export const getProductModels = () => api.get('/production/models');
export const getShifts = () => api.get('/production/shifts');
export const getPlans = (params) => api.get('/production/plans', { params });
export const createPlan = (data) => api.post('/production/plans', data);
export const updatePlan = (id, data) => api.put(`/production/plans/${id}`, data);
export const deletePlan = (id) => api.delete(`/production/plans/${id}`);
export const getFacts = (params) => api.get('/production/facts', { params });
export const createFact = (data) => api.post('/production/facts', data);
