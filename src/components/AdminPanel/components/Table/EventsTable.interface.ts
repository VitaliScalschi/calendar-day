export type EventTypeFilter = 'Toate' | 'Alegeri Locale' | 'Referendum';

export interface AdminEventItem {
  id: string;
  title: string;
  date: string;
  type: 'Alegeri Locale' | 'Referendum';
  responsible: string;
  status: 'În desfășurare' | 'Expirat';
}

export interface EventsTableProps {
  events: AdminEventItem[];
  search: string;
  onSearch: (value: string) => void;
  filter: EventTypeFilter;
  onFilterChange: (value: EventTypeFilter) => void;
  page: number;
  totalPages: number;
  onPageChange: (value: number) => void;
  totalCount: number;
}
