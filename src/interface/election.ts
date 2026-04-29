import { EventDeadlineProps } from './index';

export interface ElectionItem {
  id: string;
  title: string;
  is_active?: boolean;
  eday: string;
  hasDocument?: boolean;
  deadlines?: EventDeadlineProps[];
}

export interface MainProps {
  data: ElectionItem[];
  activeElectionId: string | null;
  onElectionChange: (electionId: string) => void;
}
