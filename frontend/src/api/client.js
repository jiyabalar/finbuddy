import axios from 'axios';

export const TOKEN_KEY = 'finbuddy_token';
export const getToken = () => localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
export const setToken = (token, remember = true) => {
  clearToken();
  (remember ? localStorage : sessionStorage).setItem(TOKEN_KEY, token);
};
export const clearToken = () => { localStorage.removeItem(TOKEN_KEY); sessionStorage.removeItem(TOKEN_KEY); };

const api = axios.create({ baseURL: `${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api`, timeout: 15000 });

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use((r) => r, (err) => {
  const url = err.config?.url || '';
  if (err.response?.status === 401 && !url.includes('/auth/login')) {
    clearToken();
    window.dispatchEvent(new Event('finbuddy:logout'));
  }
  return Promise.reject(err);
});

/** Turns any axios error into a friendly message (never leaks server internals). */
export const errorMessage = (err, fallback = 'Something went wrong. Please try again.') => {
  if (err?.code === 'ERR_NETWORK') return 'Cannot reach the server. Is the backend running?';
  const data = err?.response?.data;
  if (data?.details?.length) return data.details.map((d) => d.message).join(' · ');
  return data?.error || fallback;
};

export default api;
