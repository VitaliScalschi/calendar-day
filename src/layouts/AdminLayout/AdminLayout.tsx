import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { isAdminLoggedIn } from '../../shared/auth/adminAuth';
import { toAdminGateSearch } from '../../shared/admin/adminGateSearch';

/**
 * Layout fără `path`: toate rutele copil trebuie să aibă path absolut `/admin/...`.
 * Verifică sesiunea o singură dată; copiii nu mai repetă `isAdminLoggedIn()`.
 */
function AdminLayout() {
  const location = useLocation();

  if (!isAdminLoggedIn()) {
    return <Navigate to={`/admin${toAdminGateSearch(location.pathname)}`} replace />;
  }

  return <Outlet />;
}

export default AdminLayout;
