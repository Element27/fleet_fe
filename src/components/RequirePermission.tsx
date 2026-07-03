import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useCan } from '../lib/permissions';

interface Props {
  action: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export default function RequirePermission({ action, children, fallback = null }: Props) {
  const allowed = useCan(action);
  if (!allowed) return fallback;
  return <>{children}</>;
}

export function RequirePermissionRoute({ action, children }: Props) {
  const allowed = useCan(action);
  if (!allowed) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}
