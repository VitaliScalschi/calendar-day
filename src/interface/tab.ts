import { EventDeadlineProps } from './index';

export interface Tab {
  id: string;
  title: string;
  is_active?: boolean;
  eday: string;
  deadlines?: EventDeadlineProps[];
}

export interface TabComponentProps {
  data: Tab[];
  activeTabId: string | null;
  onTabChange: (tabId: string) => void;
  selectedDateKey?: string | null;
  onClearSelectedDate?: () => void;
}