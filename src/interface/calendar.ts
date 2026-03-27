import { EventDeadlineProps } from './index';

export interface CalendarProps {
  eday?: string;
  deadlines?: EventDeadlineProps[];
  selectedDateKey?: string | null;
  onSelectDateKey?: (key: string | null) => void;
}