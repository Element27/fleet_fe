import { useEffect } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useAuth } from '../hooks/useAuth';
import { store } from '../data/store';

export function Layout() {
  const { user, isLoaded } = useAuth();
  useEffect(() => {
    if (user && !store.initialized) { store.refresh(); }
  }, [user]);
  if (!isLoaded) return null;
  if (!user) return <Navigate to="/auth" replace />;
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-surface">
        <Outlet />
      </main>
    </div>
  );
}
