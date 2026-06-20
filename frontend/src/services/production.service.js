import api from './api';

export const getLines = (params) => api.get('/production/lines', { params });
export const createLine = (data) => api.post('/production/lines', data);
export const updateLine = (id, data) => api.put(`/production/lines/${id}`, data);
export const deleteLine = (id) => api.delete(`/production/lines/${id}`);
export const getProductCategories = () => api.get('/production/categories');
export const getProductModels = () => api.get('/production/models');
export const getAllProductModels = (params) => api.get('/production/models/all', { params });
export const createProductModel = (data) => api.post('/production/models', data);
export const updateProductModel = (id, data) => api.put(`/production/models/${id}`, data);
export const deleteProductModel = (id) => api.delete(`/production/models/${id}`);
export const getShifts = () => api.get('/production/shifts');
export const getPlans = (params) => api.get('/production/plans', { params });
export const createPlan = (data) => api.post('/production/plans', data);
export const updatePlan = (id, data) => api.put(`/production/plans/${id}`, data);
export const deletePlan = (id) => api.delete(`/production/plans/${id}`);
export const getFacts = (params) => api.get('/production/facts', { params });
export const createFact = (data) => api.post('/production/facts', data);
