import api from './api';

export const login = (email, password) => api.post('/auth/login', { email, password });
export const logout = () => api.post('/auth/logout');
export const me = () => api.get('/auth/me');
export const register = (data) => api.post('/auth/register', data);
