import { Tab } from './index';

export interface UseInfoProps {
  activeTab: Tab | null;
  selectedDateKey: string | null;
  onSelectDateKey: (key: string | null) => void;
}