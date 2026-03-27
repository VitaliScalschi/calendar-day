import { StatusDeadline } from '../enum/index';

export interface StatusBadgeProps {
  status?: StatusDeadline;
  label?: string;
  daysRemaining?: number | null;
}
