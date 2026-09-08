import { apiFetch } from './client';

export const chatApi = {
  history: (groupId, page = 1, limit = 20) => apiFetch(`/chat/${groupId}/messages?page=${page}&limit=${limit}`),
  send: (groupId, text) => apiFetch(`/chat/${groupId}/messages`, { method: 'POST', body: { text } }),
};

export const notificationsApi = {
  list: (page = 1, limit = 20) => apiFetch(`/notifications?page=${page}&limit=${limit}`),
  unreadCount: () => apiFetch('/notifications/unread-count'),
  read: (id) => apiFetch(`/notifications/${id}/read`, { method: 'POST' }),
  readAll: () => apiFetch('/notifications/read-all', { method: 'POST' }),
};

export const ratingsApi = {
  pending: (groupId) => apiFetch(`/ratings/pending?groupId=${groupId}`),
  submit: (payload) => apiFetch('/ratings', { method: 'POST', body: payload }),
};

export const calendarApi = {
  list: (page = 1, limit = 20) => apiFetch(`/calendar?page=${page}&limit=${limit}`),
};
