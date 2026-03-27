export type AdminMenuItem = 'Dashboard' | 'Evenimente' | 'Categorii' | 'Utilizatori';

export interface SidebarProps {
  activeItem: AdminMenuItem;
  onChange: (item: AdminMenuItem) => void;
}
