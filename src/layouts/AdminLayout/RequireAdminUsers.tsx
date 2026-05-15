import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { canAccessUsersPage } from '../../shared/auth/adminAuth';

/** Rute rezervate rolurilor Administrator / Admin / SuperAdmin (nomenclatoare, utilizatori, audit). */
export function RequireAdminUsers({ children }: { children: ReactNode }) {
  if (!canAccessUsersPage()) {
    return <Navigate to="/admin/events" replace />;
  }
  return <>{children}</>;
}
