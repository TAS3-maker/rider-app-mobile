import { apiFetch } from './client';

export const ridesApi = {
  create: (payload) => apiFetch('/rides', { method: 'POST', body: payload }),
  matches: (rideId) => apiFetch(`/rides/${rideId}/matches`),
  history: (page = 1, limit = 10) => apiFetch(`/rides/history?page=${page}&limit=${limit}`),
  get: (id) => apiFetch(`/rides/${id}`),
  update: (id, payload) => apiFetch(`/rides/${id}`, { method: 'PATCH', body: payload }),
  cancel: (id, reason) => apiFetch(`/rides/${id}/cancel`, { method: 'POST', body: { reason } }),
};

export const groupsApi = {
  browse: (params = {}) => {
    const q = new URLSearchParams({ page: params.page || 1, limit: params.limit || 10 });
    if (params.direction) q.set('direction', params.direction);
    if (params.airport) q.set('airport', params.airport);
    if (params.date) q.set('date', params.date);
    if (params.timeWindow) q.set('timeWindow', params.timeWindow);
    if (params.minBags != null) q.set('minBags', params.minBags);
    if (params.maxBags != null) q.set('maxBags', params.maxBags);
    return apiFetch(`/groups?${q.toString()}`);
  },
  get: (id) => apiFetch(`/groups/${id}`),
  create: (rideId, isPrivate = false) => apiFetch('/groups', { method: 'POST', body: { rideId, isPrivate } }),
  join: (id, rideId) => apiFetch(`/groups/${id}/join`, { method: 'POST', body: { rideId } }),
  leave: (id) => apiFetch(`/groups/${id}/leave`, { method: 'POST' }),
  setBooker: (id, userId) => apiFetch(`/groups/${id}/booker`, { method: 'POST', body: { userId } }),
  book: (id) => apiFetch(`/groups/${id}/book`, { method: 'POST' }),
  complete: (id) => apiFetch(`/groups/${id}/complete`, { method: 'POST' }),
  cancel: (id, reason) => apiFetch(`/groups/${id}/cancel`, { method: 'POST', body: { reason } }),
};

export const faresApi = {
  get: (groupId) => apiFetch(`/fares/${groupId}`),
  enter: (groupId, totalCost) => apiFetch(`/fares/${groupId}`, { method: 'POST', body: { totalCost } }),
  confirm: (groupId, userId) => apiFetch(`/fares/${groupId}/confirm`, { method: 'POST', body: userId ? { userId } : {} }),
};

export const refApi = {
  airports: () => apiFetch('/airports'),
  destinations: () => apiFetch('/destinations'),
};
