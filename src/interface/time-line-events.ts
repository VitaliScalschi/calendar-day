import { EventDeadlineProps } from './index';

export type EventStatus = 'upcoming' | 'in_progress' | 'urgent' | 'expired';

export interface TimelineEventProps extends EventDeadlineProps {
  onClick?: () => void;
}