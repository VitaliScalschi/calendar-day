import { useCallback, useMemo } from 'react';
import { getAdminToken, isAdminLoggedIn, logoutAdmin } from '../auth/adminAuth';

export function useAuth() {
  const token = getAdminToken();
  const isAuthenticated = useMemo(() => isAdminLoggedIn(), [token]);

  const logout = useCallback(() => {
    logoutAdmin();
  }, []);

  return { token, isAuthenticated, logout };
}
