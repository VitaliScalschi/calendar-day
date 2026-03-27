import { EventDeadlineProps } from './index';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  deadline: EventDeadlineProps | null;
}