import type { NavigateFunction } from 'react-router-dom';
import type { AdminMenuItem } from '../../components/AdminPanel/components/Sidebar/AdminSidebar.interface';

export function getAdminSidebarItemFromPath(pathname: string): AdminMenuItem {
  if (pathname.startsWith('/admin/dashboard')) return 'Dashboard';
  if (pathname.startsWith('/admin/users')) return 'Utilizatori';
  if (pathname.startsWith('/admin/useful-info')) return 'Informații Utile';
  if (pathname.startsWith('/admin/nomenclatoare/scrutine')) return 'Nomenclatoare - Scrutine';
  if (pathname.startsWith('/admin/nomenclatoare/responsabili')) return 'Nomenclatoare - Responsabili';
  if (pathname.startsWith('/admin/nomenclatoare/grupuri-tinta')) return 'Nomenclatoare - Grupuri țintă';
  if (pathname.startsWith('/admin/audit-logs')) return 'Audit Logs';
  return 'Programe';
}

export function navigateForAdminSidebarItem(
  navigate: NavigateFunction,
  item: AdminMenuItem,
  canManageUsers: boolean,
): void {
  if (item === 'Dashboard') {
    navigate('/admin/dashboard');
    return;
  }
  if (item === 'Utilizatori') {
    if (!canManageUsers) {
      navigate('/admin/events');
      return;
    }
    navigate('/admin/users');
    return;
  }
  if (item === 'Informații Utile') {
    navigate('/admin/useful-info');
    return;
  }
  if (item === 'Audit Logs') {
    if (!canManageUsers) {
      navigate('/admin/events');
      return;
    }
    navigate('/admin/audit-logs');
    return;
  }
  if (item === 'Nomenclatoare - Scrutine') {
    if (!canManageUsers) {
      navigate('/admin/events');
      return;
    }
    navigate('/admin/nomenclatoare/scrutine');
    return;
  }
  if (item === 'Nomenclatoare - Responsabili') {
    if (!canManageUsers) {
      navigate('/admin/events');
      return;
    }
    navigate('/admin/nomenclatoare/responsabili');
    return;
  }
  if (item === 'Nomenclatoare - Grupuri țintă') {
    if (!canManageUsers) {
      navigate('/admin/events');
      return;
    }
    navigate('/admin/nomenclatoare/grupuri-tinta');
    return;
  }
  navigate('/admin/events');
}
