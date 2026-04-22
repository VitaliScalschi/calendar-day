export type AdminMenuItem = 'Evenimente' | 'Utilizatori' | 'Informații Utile' ;

export interface SidebarProps {
  activeItem: AdminMenuItem;
  onChange: (item: AdminMenuItem) => void;
}
