export type EventTypeFilter = 'Toate' | 'Alegeri Locale' | 'Referendum';

export interface AdminEventItem {
  id: string;
  title: string;
  /** Denumiri tipuri de scrutin (din nomenclator), separate prin virgulă. */
  scrutinyTypesLabel: string;
  date: string;
  status: 'Activ' | 'Inactiv';
}

export interface EventsTableProps {
  events: AdminEventItem[];
  search: string;
  onSearch: (value: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onManageEvents?: (id: string) => void;
  onAddEventClick?: () => void;
  page: number;
  totalPages: number;
  onPageChange: (value: number) => void;
  totalCount: number;
}
