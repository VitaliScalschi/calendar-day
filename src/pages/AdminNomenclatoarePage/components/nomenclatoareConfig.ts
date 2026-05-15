import type { AdminMenuItem } from '../../../components/AdminPanel/components/Sidebar/AdminSidebar.interface';

export type NomenclatorRouteConfig = {
  activeItem: AdminMenuItem;
  title: string;
};

/** Mapare URL → titlu și item activ în sidebar (toate tab-urile nomenclatoare). */
export function getNomenclatorConfig(pathname: string): NomenclatorRouteConfig {
  if (pathname.startsWith('/admin/nomenclatoare/responsabili')) {
    return { activeItem: 'Nomenclatoare - Responsabili', title: 'Nomenclatoare - Responsabili' };
  }
  if (pathname.startsWith('/admin/nomenclatoare/grupuri-tinta')) {
    return { activeItem: 'Nomenclatoare - Grupuri țintă', title: 'Nomenclatoare - Grupuri țintă' };
  }
  if (pathname.startsWith('/admin/nomenclatoare/departamente')) {
    return { activeItem: 'Nomenclatoare - Departamente', title: 'Nomenclatoare - Departamente' };
  }
  return { activeItem: 'Nomenclatoare - Scrutine', title: 'Nomenclatoare - Scrutine' };
}
