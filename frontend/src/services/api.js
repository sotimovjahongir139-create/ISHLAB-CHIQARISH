import axios from 'axios';
import { API_BASE } from '../constants';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Singleton refresh promise — prevents race condition when multiple requests
// get 401 simultaneously (e.g. after token expiry). All callers await the same
// in-flight refresh instead of each firing their own.
let refreshPromise = null;

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(error);
      }

      if (!refreshPromise) {
        refreshPromise = axios
          .post(`${API_BASE}/auth/refresh`, { refreshToken })
          .then(({ data }) => {
            const newToken = data.data.accessToken;
            localStorage.setItem('accessToken', newToken);
            return newToken;
          })
          .catch((err) => {
            localStorage.clear();
            window.location.href = '/login';
            return Promise.reject(err);
          })
          .finally(() => {
            refreshPromise = null;
          });
      }

      try {
        const newToken = await refreshPromise;
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch {
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
