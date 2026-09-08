// Lightweight fetch-based API client for the RidePact mobile app.
// Mirrors admin-web's axios client: same /api base + Bearer token behavior.
import { storage } from '@/src/utils/storage';

const BASE = `${process.env.EXPO_PUBLIC_BACKEND_URL}/api`;
export const TOKEN_KEY = 'ridepact_token';

export async function getToken() {
  return storage.secureGet(TOKEN_KEY, null);
}
export async function setToken(token) {
  return storage.secureSet(TOKEN_KEY, token);
}
export async function clearToken() {
  return storage.secureRemove(TOKEN_KEY);
}

export async function apiFetch(path, { method = 'GET', body, auth = true, headers = {} } = {}) {
  const finalHeaders = { 'Content-Type': 'application/json', ...headers };
  if (auth) {
    const token = await getToken();
    if (token) finalHeaders.Authorization = `Bearer ${token}`;
  }
  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers: finalHeaders,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (e) {
    throw new Error('Network error — please check your connection');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || 'Request failed');
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}
