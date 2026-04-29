export type AdminMenuItem = 'Programe' | 'Utilizatori' | 'Informații Utile' ;

export interface SidebarProps {
  activeItem: AdminMenuItem;
  onChange: (item: AdminMenuItem) => void;
}
