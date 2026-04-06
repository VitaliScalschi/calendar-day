import { ElectionItem } from './index';

export interface UseInfoProps {
  activeElection: ElectionItem | null;
  selectedDateKey: string | null;
  onSelectDateKey: (key: string | null) => void;
}