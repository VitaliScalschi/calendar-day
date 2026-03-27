import { ReactNode } from 'react';

export type FilterType = 'all' | 'in_progress' | 'expired';

export interface EventFilterProps {
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  responsibleOptions: string[];
  selectedResponsible: string;
  onResponsibleChange: (responsible: string) => void;
  hasActiveFilters: boolean;
  onResetFilters: () => void;
  searchSlot?: ReactNode;
}