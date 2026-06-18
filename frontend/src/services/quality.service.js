import api from './api';

export const getDefectTypes = () => api.get('/quality/defect-types');
export const getDefects = (params) => api.get('/quality/defects', { params });
export const createDefect = (data) => api.post('/quality/defects', data);
export const updateDefectStatus = (id, data) => api.put(`/quality/defects/${id}/status`, data);
export const getInspections = (params) => api.get('/quality/inspections', { params });
export const createInspection = (data) => api.post('/quality/inspections', data);
