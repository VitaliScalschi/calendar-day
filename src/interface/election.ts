import { EventDeadlineProps } from './index';

export interface ElectionItem {
  id: string;
  title: string;
  is_active?: boolean;
  eday: string;
  hasDocument?: boolean;
  /** Id-uri din nomenclatorul `election_types`. */
  electionTypeIds?: number[];
  deadlines?: EventDeadlineProps[];
}

export interface MainProps {
  data: ElectionItem[];
  activeElectionId: string | null;
  onElectionChange: (electionId: string) => void;
  targetGroupOptions: Array<{ key: string; label: string }>;
}
