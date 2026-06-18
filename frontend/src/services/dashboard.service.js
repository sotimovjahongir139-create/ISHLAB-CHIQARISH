import api from './api';

export const getKPIs = (params) => api.get('/dashboard/kpis', { params });
export const getProductionTrend = (params) => api.get('/dashboard/production-trend', { params });
export const getDowntimeByReason = (params) => api.get('/dashboard/downtime-by-reason', { params });
export const getTopDefects = (params) => api.get('/dashboard/top-defects', { params });
export const getDepartmentComparison = (params) => api.get('/dashboard/department-comparison', { params });
export const getPlanVsFact = (params) => api.get('/dashboard/plan-vs-fact', { params });
