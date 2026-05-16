import type { EventInput } from '@fullcalendar/core';
import type { EventDeadlineProps } from '../../interface';
import {
  eventInputToDeadlineProps,
  formatCalendarDayLabel,
  isEventExpired,
} from './calendarEventUtils';
import './CalendarDayEventsModal.css';

type CalendarDayEventsModalProps = {
  isOpen: boolean;
  date: Date | null;
  events: EventInput[];
  onClose: () => void;
  onSelectEvent: (deadline: EventDeadlineProps) => void;
};

function CalendarDayEventsModal({
  isOpen,
  date,
  events,
  onClose,
  onSelectEvent,
}: CalendarDayEventsModalProps) {
  if (!isOpen || !date) return null;

  const dayLabel = formatCalendarDayLabel(date);
  const count = events.length;

  return (
    <div
      className="calendar-day-events-overlay d-flex align-items-end align-items-md-center justify-content-center position-fixed p-0 p-md-3"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="calendar-day-events card border-0 shadow-lg bg-white w-100"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="calendar-day-events-title"
      >
        <div className="calendar-day-events__header d-flex justify-content-between align-items-start gap-2 px-3 py-3">
          <div>
            <h2 id="calendar-day-events-title" className="calendar-day-events__title h5 mb-1">
              Evenimente
            </h2>
            <p className="calendar-day-events__subtitle mb-0">
              {dayLabel}
              <span className="calendar-day-events__count">
                {' '}
                · {count} {count === 1 ? 'eveniment' : 'evenimente'}
              </span>
            </p>
          </div>
          <button
            type="button"
            className="btn-close"
            onClick={onClose}
            aria-label="Închide lista de evenimente"
          />
        </div>

        <ul className="calendar-day-events__list list-unstyled mb-0">
          {events.map((event) => {
            const ext = (event.extendedProps ?? {}) as Record<string, unknown>;
            const title = String(ext.deadlineTitle ?? event.title ?? 'Termen');
            const expired = isEventExpired(event);

            return (
              <li key={String(event.id)}>
                <button
                  type="button"
                  className={`calendar-day-events__item${expired ? ' calendar-day-events__item--expired' : ''}`}
                  onClick={() => onSelectEvent(eventInputToDeadlineProps(event))}
                >
                  <span
                    className={`calendar-day-events__dot${expired ? ' calendar-day-events__dot--expired' : ''}`}
                    aria-hidden
                  />
                  <span className="calendar-day-events__item-text">{title}</span>
                  <i className="bi bi-chevron-right calendar-day-events__chevron" aria-hidden />
                </button>
              </li>
            );
          })}
        </ul>

        <div className="calendar-day-events__footer px-3 py-3 border-top">
          <button type="button" className="btn btn-outline-secondary w-100" onClick={onClose}>
            Închide
          </button>
        </div>
      </div>
    </div>
  );
}

export default CalendarDayEventsModal;
