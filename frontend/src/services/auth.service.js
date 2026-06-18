import api from './api';

export const login = (email, password) => api.post('/auth/login', { email, password });
export const logout = (refreshToken) => api.post('/auth/logout', { refreshToken });
export const getMe = () => api.get('/auth/me');
export const changePassword = (data) => api.put('/auth/change-password', data);
