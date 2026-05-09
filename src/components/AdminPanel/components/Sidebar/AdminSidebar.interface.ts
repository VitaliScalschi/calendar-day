export type AdminMenuItem =
  | 'Programe'
  | 'Utilizatori'
  | 'Informații Utile'
  | 'Nomenclatoare - Scrutine'
  | 'Nomenclatoare - Responsabili'
  | 'Nomenclatoare - Grupuri țintă'
  | 'Audit Logs';

export interface SidebarProps {
  activeItem: AdminMenuItem;
  onChange: (item: AdminMenuItem) => void;
  canManageUsers?: boolean;
}
