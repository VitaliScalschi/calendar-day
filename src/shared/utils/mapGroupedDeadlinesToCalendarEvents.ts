import { addDays, format, parseISO } from 'date-fns';
import type { EventInput } from '@fullcalendar/core';

export type GroupedDeadlineRow = {
  id: string;
  title: string;
  type?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  deadlines?: string[] | null;
  description?: string | null;
  additionalInfo?: string | null;
  responsible?: string[] | null;
  group?: string[] | null;
};

export type GroupedElectionBlock = {
  electionId: string;
  electionTitle: string;
  deadlines: GroupedDeadlineRow[];
};

function isoDay(value: string | null | undefined): string | null {
  if (!value?.trim()) return null;
  const t = value.trim().slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t;
  return null;
}

/** Culori aliniate cu tema Bootstrap „primary” (listă + fallback când CSS nu acoperă). */
const calendarPrimaryEventColors = {
  backgroundColor: '#cfe2ff',
  borderColor: '#0d6efd',
  textColor: '#052c65',
} as const;

const calendarExpiredEventColors = {
  backgroundColor: '#f8d7da',
  borderColor: '#dc3545',
  textColor: '#842029',
} as const;

function getTodayIso(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

/**
 * Transformă răspunsul grouped-by-election în evenimente FullCalendar.
 * Titlul evenimentului rămâne scurt pentru API FC; denumirea scrutinului e în extendedProps + eventContent.
 */
export function mapGroupedDeadlinesToCalendarEvents(groups: GroupedElectionBlock[]): EventInput[] {
  const out: EventInput[] = [];
  const todayIso = getTodayIso();

  for (const block of groups) {
    const { electionId, electionTitle } = block;

    for (const d of block.deadlines) {
      const type = (d.type || 'SINGLE').toUpperCase();
      const rawDates = (d.deadlines ?? []).map((x) => isoDay(x)).filter((x): x is string => Boolean(x));
      const startIso = isoDay(d.startDate);
      const endIso = isoDay(d.endDate);

      const baseExtended = {
        electionId,
        electionTitle,
        deadlineTitle: d.title,
        description: d.description ?? undefined,
        additionalInfo: d.additionalInfo ?? undefined,
        responsible: d.responsible ?? undefined,
        group: d.group ?? undefined,
      };

      if (type === 'RANGE' && startIso && endIso) {
        let endExclusive: string;
        try {
          endExclusive = format(addDays(parseISO(endIso), 1), 'yyyy-MM-dd');
        } catch {
          continue;
        }
        const isExpired = endIso < todayIso;
        const colors = isExpired ? calendarExpiredEventColors : calendarPrimaryEventColors;
        out.push({
          id: d.id,
          title: d.title,
          start: startIso,
          end: endExclusive,
          allDay: true,
          backgroundColor: colors.backgroundColor,
          borderColor: colors.borderColor,
          textColor: colors.textColor,
          classNames: isExpired ? ['calendar-event-expired'] : undefined,
          extendedProps: baseExtended,
        });
        continue;
      }

      const dayStarts =
        rawDates.length > 0
          ? rawDates
          : startIso
            ? [startIso]
            : endIso
              ? [endIso]
              : [];

      for (let i = 0; i < dayStarts.length; i += 1) {
        const start = dayStarts[i];
        const isExpired = start < todayIso;
        const colors = isExpired ? calendarExpiredEventColors : calendarPrimaryEventColors;
        out.push({
          id: dayStarts.length > 1 ? `${d.id}_${start}_${i}` : d.id,
          title: d.title,
          start,
          allDay: true,
          backgroundColor: colors.backgroundColor,
          borderColor: colors.borderColor,
          textColor: colors.textColor,
          classNames: isExpired ? ['calendar-event-expired'] : undefined,
          extendedProps: baseExtended,
        });
      }
    }
  }

  return out;
}
