import { ReactNode } from 'react';

export type FilterType = 'all' | 'in_progress' | 'today' | 'expired';

export interface ElectionFilterOption {
  id: string;
  label: string;
}

export interface EventFilterProps {
  electionOptions: ElectionFilterOption[];
  selectedElectionId: string | null;
  onElectionChange: (electionId: string) => void;
  selectedTargetGroups: string[];
  onTargetGroupToggle: (group: string) => void;
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  filterCounts?: Partial<Record<FilterType, number>>;
  responsibleOptions: string[];
  selectedResponsible: string;
  onResponsibleChange: (responsible: string) => void;
  calendarSlot?: ReactNode;
  searchSlot?: ReactNode;
}