import { ReactNode } from 'react';

export type FilterType = 'all' | 'in_progress' | 'today' | 'expired';

export interface ElectionFilterOption {
  id: string;
  label: string;
  hasDocument?: boolean;
}

export interface EventFilterProps {
  electionOptions: ElectionFilterOption[];
  /** Din `/api/audiences` (key + denumire afișată). */
  targetGroupOptions: Array<{ key: string; label: string }>;
  selectedElectionId: string | null;
  onElectionChange: (electionId: string) => void;
  selectedTargetGroups: string[];
  onTargetGroupToggle: (group: string) => void;
  onTargetGroupsClear: () => void;
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  filterCounts?: Partial<Record<FilterType, number>>;
  responsibleOptions: string[];
  selectedResponsible: string[];
  onResponsibleChange: (responsible: string[]) => void;
  dateRangeStart: string;
  dateRangeEnd: string;
  onDateRangeStartChange: (value: string) => void;
  onDateRangeEndChange: (value: string) => void;
  onDateRangeReset: () => void;
  calendarSlot?: ReactNode;
  searchSlot?: ReactNode;
}