import { addDays, format, parseISO } from 'date-fns';
import { ro } from 'date-fns/locale';
import type { EventInput } from '@fullcalendar/core';
import type { EventDeadlineProps, Regulation } from '../../interface';

export const CALENDAR_MOBILE_BREAKPOINT_PX = 768;

/** Număr maxim de evenimente vizibile fără scroll în listă (modal / popover +N). */
export const CALENDAR_EVENTS_LIST_MAX_VISIBLE = 10;

export function eventInputToIsoDate(value: EventInput['start']): string {
  if (value == null) return '';
  if (typeof value === 'string') return value.slice(0, 10);
  if (value instanceof Date) return format(value, 'yyyy-MM-dd');
  return '';
}

/** Eveniment all-day: `end` FullCalendar e exclusiv. */
export function eventOverlapsIsoDate(event: EventInput, dateIso: string): boolean {
  const start = eventInputToIsoDate(event.start);
  if (!start) return false;

  const endRaw = event.end != null ? eventInputToIsoDate(event.end) : '';
  if (!endRaw || endRaw === start) {
    return start === dateIso;
  }

  return dateIso >= start && dateIso < endRaw;
}

export function getEventsForIsoDate(events: EventInput[], dateIso: string): EventInput[] {
  return events.filter((e) => eventOverlapsIsoDate(e, dateIso));
}

export function countEventsForIsoDate(events: EventInput[], dateIso: string): number {
  return getEventsForIsoDate(events, dateIso).length;
}

export function eventInputToDeadlineProps(event: EventInput): EventDeadlineProps {
  const ext = (event.extendedProps ?? {}) as Record<string, unknown>;
  const electionId = String(ext.electionId ?? '');
  const scrutiny = String(ext.electionTitle ?? '').trim();
  const termen = String(ext.deadlineTitle ?? event.title ?? '').trim();
  const description = String(ext.description ?? '').trim() || undefined;
  const additionalInfo = String(ext.additionalInfo ?? '').trim() || undefined;

  const responsible = Array.isArray(ext.responsible)
    ? ext.responsible.map((item) => String(item ?? '').trim()).filter(Boolean)
    : undefined;
  const group = Array.isArray(ext.group)
    ? ext.group.map((item) => String(item ?? '').trim()).filter(Boolean)
    : undefined;
  const regulations = Array.isArray(ext.regulations)
    ? (ext.regulations as Regulation[])
    : undefined;
  const extraDates = Array.isArray(ext.extraDates)
    ? ext.extraDates.map((item) => String(item ?? '').trim()).filter(Boolean)
    : undefined;

  const start = eventInputToIsoDate(event.start);
  let deadline = start;
  const endExclusive = event.end != null ? eventInputToIsoDate(event.end) : '';
  if (endExclusive && endExclusive !== start && start) {
    try {
      const inclusiveEnd = format(addDays(parseISO(endExclusive), -1), 'yyyy-MM-dd');
      deadline = `${start} - ${inclusiveEnd}`;
    } catch {
      deadline = start;
    }
  }

  const title =
    scrutiny && termen ? `${scrutiny} · ${termen}` : termen || scrutiny || 'Termen';

  return {
    id: String(event.id ?? ''),
    election_id: electionId || '—',
    title,
    deadline: deadline || undefined,
    description,
    additional_info: additionalInfo,
    responsible: responsible?.length ? responsible : undefined,
    group: group?.length ? group : undefined,
    regulations: regulations?.length ? regulations : undefined,
    extraDates: extraDates?.length ? extraDates : undefined,
  };
}

export function formatCalendarDayLabel(date: Date): string {
  return format(date, 'd MMMM yyyy', { locale: ro });
}

export function isEventExpired(event: EventInput): boolean {
  return (event.classNames ?? []).includes('calendar-event-expired');
}
