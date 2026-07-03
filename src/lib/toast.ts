import { useState, useEffect, useCallback } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  title: string;
  message?: string;
  type: ToastType;
  duration?: number;
}

type Listener = (toasts: Toast[]) => void;

let _toasts: Toast[] = [];
let _listeners: Listener[] = [];

function notify() {
  _listeners.forEach(fn => fn([..._toasts]));
}

export const toast = {
  show: (t: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).slice(2);
    const item: Toast = { id, duration: 5000, ...t };
    _toasts = [..._toasts, item];
    notify();
    if (item.duration && item.duration > 0) {
      setTimeout(() => toast.dismiss(id), item.duration);
    }
    return id;
  },
  success: (title: string, message?: string) => toast.show({ type: 'success', title, message }),
  error: (title: string, message?: string) => toast.show({ type: 'error', title, message }),
  info: (title: string, message?: string) => toast.show({ type: 'info', title, message }),
  warning: (title: string, message?: string) => toast.show({ type: 'warning', title, message }),
  dismiss: (id: string) => {
    _toasts = _toasts.filter(t => t.id !== id);
    notify();
  },
};

export function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  useEffect(() => {
    _listeners.push(setToasts);
    return () => { _listeners = _listeners.filter(fn => fn !== setToasts); };
  }, []);
  const dismiss = useCallback((id: string) => toast.dismiss(id), []);
  return { toasts, dismiss };
}
