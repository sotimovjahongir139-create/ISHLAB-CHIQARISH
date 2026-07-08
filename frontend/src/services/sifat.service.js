import api from './api';

export const getBrakDinamikasi = (params) => api.get('/sifat/brak-dinamikasi', { params });
export const getWeeklySummary = () => api.get('/sifat/weekly-summary');