export type AdminMenuItem =
  | 'Dashboard'
  | 'Programe'
  | 'Utilizatori'
  | 'Informații Utile'
  | 'Nomenclatoare - Scrutine'
  | 'Nomenclatoare - Responsabili'
  | 'Nomenclatoare - Grupuri țintă'
  | 'Nomenclatoare - Departamente'
  | 'Audit Logs';

export interface SidebarProps {
  activeItem: AdminMenuItem;
  onChange: (item: AdminMenuItem) => void;
  canManageUsers?: boolean;
}
