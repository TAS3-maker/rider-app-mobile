import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authApi } from '@/api/auth';
import { setToken, clearToken, getToken } from '@/api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const token = await getToken();
        if (token) {
          const { user: me } = await authApi.me();
          setUser(me);
        }
      } catch (e) {
        await clearToken();
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await authApi.login(email, password);
    await setToken(res.accessToken);
    setUser(res.user);
    return res.user;
  }, []);

  // register returns { user, devVerificationCode } — verification happens next.
  const register = useCallback((payload) => authApi.register(payload), []);

  const verifyEmail = useCallback(async (email, code) => {
    const res = await authApi.verifyEmail(email, code);
    await setToken(res.accessToken);
    setUser(res.user);
    return res.user;
  }, []);

  const logout = useCallback(async () => {
    await clearToken();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, setUser, loading, login, register, verifyEmail, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
