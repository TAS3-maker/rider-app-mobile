import { apiFetch } from './client';

export const authApi = {
  register: (payload) => apiFetch('/auth/register', { method: 'POST', body: payload, auth: false }),
  verifyEmail: (email, code) =>
    apiFetch('/auth/verify-email', { method: 'POST', body: { email, code }, auth: false }),
  login: (email, password) =>
    apiFetch('/auth/login', { method: 'POST', body: { email, password }, auth: false }),
  logout: () => apiFetch('/auth/logout', { method: 'POST', auth: false }),
  me: () => apiFetch('/auth/me'),
  forgotPassword: (email) =>
    apiFetch('/auth/forgot-password', { method: 'POST', body: { email }, auth: false }),
  resetPassword: (email, token, newPassword) =>
    apiFetch('/auth/reset-password', { method: 'POST', body: { email, token, newPassword }, auth: false }),
};

export const usersApi = {
  updateProfile: (payload) => apiFetch('/users/me', { method: 'PATCH', body: payload }),
};
