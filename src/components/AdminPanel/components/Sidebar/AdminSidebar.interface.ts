export type AdminMenuItem = 'Evenimente' | 'Utilizatori';

export interface SidebarProps {
  activeItem: AdminMenuItem;
  onChange: (item: AdminMenuItem) => void;
}
