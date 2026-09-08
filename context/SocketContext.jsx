import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { getToken } from '@/api/client';
import { notificationsApi } from '@/api/social';
import { useAuth } from '@/context/AuthContext';

const SocketContext = createContext(null);
const BASE = process.env.EXPO_PUBLIC_BACKEND_URL;

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshUnread = useCallback(async () => {
    try {
      const r = await notificationsApi.unreadCount();
      setUnreadCount(r.unread || 0);
    } catch (e) {
      // ignore
    }
  }, []);

  useEffect(() => {
    let active = true;
    if (!user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setUnreadCount(0);
      return;
    }
    (async () => {
      const token = await getToken();
      if (!active || !token) return;
      const socket = io(BASE, {
        path: '/api/socket.io',
        transports: ['polling', 'websocket'],
        auth: { token },
      });
      socketRef.current = socket;
      socket.on('connect', () => setConnected(true));
      socket.on('disconnect', () => setConnected(false));
      socket.on('notification', () => setUnreadCount((c) => c + 1));
      refreshUnread();
    })();
    return () => {
      active = false;
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [user, refreshUnread]);

  const value = {
    socket: socketRef.current,
    getSocket: () => socketRef.current,
    connected,
    unreadCount,
    setUnreadCount,
    refreshUnread,
  };
  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export function useSocket() {
  return useContext(SocketContext);
}
