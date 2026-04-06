import { FilterType } from './index';

export interface Regulation {
  id: string;
  title: string;
  link: string;
}

export interface EventDeadlineProps {
  id: string;
  election_id: string;
  title?: string;
  deadline?: string;
  responsible?: string[];
  description?: string;
  regulations?: Regulation[];
  group?: string[];
  additional_info?: string;
  onClick?: () => void;
}

export interface EventDeadlinesProps {
  data: EventDeadlineProps[];
  searchQuery?: string;
  activeFilter?: FilterType;
  selectedDateKey?: string | null;
  selectedResponsible?: string;
}