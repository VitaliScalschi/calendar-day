import { FilterType } from './index';

export interface Regulation {
  id: string;
  title: string;
  link: string;
}

export interface EventDeadlineProps {
  id: string;
  election_id: string;
  name?: string;
  deadline?: string;
  responsible?: string;
  description?: string;
  regulations?: Regulation[];
  onClick?: () => void;
}

export interface EventDeadlinesProps {
  data: EventDeadlineProps[];
  searchQuery?: string;
  activeFilter?: FilterType;
  selectedDateKey?: string | null;
  selectedResponsible?: string;
}