import { useState, useEffect, useCallback } from 'react';
import { store } from '../data/store';

export function useStore() {
  const [tick, setTick] = useState(0);
  useEffect(() => store.subscribe(() => setTick(t => t + 1)), []);
  const notifications = store.getAllNotifications();
  return {
    vehicles: store.getVehicles(),
    notifications,
    users: store.getUsers(),
    auditLog: store.getAuditLog(),
    unreadCount: notifications.filter(n => !n.read).length,
    loading: store.loading,
    error: store.error,
    initialized: store.initialized,
    refresh: useCallback(() => store.refresh(), []),
  };
}
