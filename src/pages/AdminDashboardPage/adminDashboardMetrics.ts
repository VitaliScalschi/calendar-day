import { differenceInCalendarDays, format, parseISO } from 'date-fns';
import { ro } from 'date-fns/locale';
import type { GroupedDeadlineRow } from '../../shared/utils/mapGroupedDeadlinesToCalendarEvents';
import type { DashboardElectionBlock } from '../../features/elections/services/electionService';

/** `urmatoare` = termen cu început în viitorul apropiat (în următoarele 14 zile). */
export type LifecycleBucket = 'finalizate' | 'in_lucru' | 'urmatoare' | 'viitoare' | 'expirate';

/** Prag zile calendaristice: minIso > azi și minIso ≤ azi + prag → „Următoare”. */
export const URMATOARE_ZILE_MAX = 14;

function sliceIsoDay(value: string | null | undefined): string | null {
  const t = value?.trim().slice(0, 10) ?? '';
  return /^\d{4}-\d{2}-\d{2}$/.test(t) ? t : null;
}

/** Min/max zi calendaristică (yyyy-MM-dd) acoperită de termen. */
export function getDeadlineIsoBounds(row: GroupedDeadlineRow): { minIso: string | null; maxIso: string | null } {
  const type = (row.type || 'SINGLE').toUpperCase();

  const fromArray = (arr: string[] | null | undefined) => {
    const days = (arr ?? []).map((x) => sliceIsoDay(x)).filter((x): x is string => Boolean(x)).sort();
    if (days.length === 0) return { minIso: null as string | null, maxIso: null as string | null };
    return { minIso: days[0], maxIso: days[days.length - 1] };
  };

  if (type === 'RANGE') {
    const a = sliceIsoDay(row.startDate);
    const b = sliceIsoDay(row.endDate);
    if (a && b) return a <= b ? { minIso: a, maxIso: b } : { minIso: b, maxIso: a };
    return { minIso: a ?? b, maxIso: b ?? a };
  }

  const multi = fromArray(row.deadlines ?? undefined);
  if (multi.minIso && multi.maxIso) return multi;

  const single = sliceIsoDay(row.startDate) ?? sliceIsoDay(row.endDate);
  return { minIso: single, maxIso: single };
}

export function classifyLifecycle(
  row: GroupedDeadlineRow,
  electionIsActive: boolean,
  todayIso: string,
): LifecycleBucket {
  const { minIso, maxIso } = getDeadlineIsoBounds(row);
  if (!minIso || !maxIso) return 'viitoare';
  if (maxIso < todayIso) return electionIsActive ? 'expirate' : 'finalizate';
  if (minIso > todayIso) {
    try {
      const days = differenceInCalendarDays(parseISO(`${minIso}T12:00:00`), parseISO(`${todayIso}T12:00:00`));
      return days <= URMATOARE_ZILE_MAX ? 'urmatoare' : 'viitoare';
    } catch {
      return 'viitoare';
    }
  }
  if (minIso <= todayIso && todayIso <= maxIso) return 'in_lucru';
  return 'viitoare';
}

export type FlatDeadline = {
  id: string;
  electionId: string;
  electionTitle: string;
  electionIsActive: boolean;
  title: string;
  row: GroupedDeadlineRow;
  minIso: string;
  maxIso: string;
  lifecycle: LifecycleBucket;
};

function flattenBlocks(blocks: DashboardElectionBlock[], todayIso: string): FlatDeadline[] {
  const out: FlatDeadline[] = [];
  for (const b of blocks) {
    for (const row of b.deadlines) {
      const { minIso, maxIso } = getDeadlineIsoBounds(row);
      if (!minIso || !maxIso) continue;
      out.push({
        id: row.id,
        electionId: b.electionId,
        electionTitle: b.electionTitle,
        electionIsActive: b.electionIsActive,
        title: row.title,
        row,
        minIso,
        maxIso,
        lifecycle: classifyLifecycle(row, b.electionIsActive, todayIso),
      });
    }
  }
  return out;
}

function intersectsRange(minIso: string, maxIso: string, rangeStart: string, rangeEnd: string): boolean {
  return maxIso >= rangeStart && minIso <= rangeEnd;
}

export type DashboardAggregates = {
  total: number;
  finalizate: number;
  inLucru: number;
  urmatoare: number;
  viitoare: number;
  expirate: number;
  flat: FlatDeadline[];
};

/** Agregă termenele din `blocks` (de obicei un singur scrutin). Fără `range` — toate termenele din blocuri. */
export function aggregateDashboard(
  blocks: DashboardElectionBlock[],
  todayIso: string,
  range?: { start: string; end: string },
): DashboardAggregates {
  const flatAll = flattenBlocks(blocks, todayIso);
  const flat = range
    ? flatAll.filter((d) => intersectsRange(d.minIso, d.maxIso, range.start, range.end))
    : flatAll;

  let finalizate = 0;
  let inLucru = 0;
  let urmatoare = 0;
  let viitoare = 0;
  let expirate = 0;
  for (const d of flat) {
    switch (d.lifecycle) {
      case 'finalizate':
        finalizate += 1;
        break;
      case 'in_lucru':
        inLucru += 1;
        break;
      case 'urmatoare':
        urmatoare += 1;
        break;
      case 'viitoare':
        viitoare += 1;
        break;
      case 'expirate':
        expirate += 1;
        break;
      default:
        break;
    }
  }

  return {
    total: flat.length,
    finalizate,
    inLucru,
    urmatoare,
    viitoare,
    expirate,
    flat,
  };
}

export function relativeDayLabel(targetIso: string, todayIso: string): string {
  try {
    const t0 = parseISO(`${todayIso}T12:00:00`);
    const t1 = parseISO(`${targetIso}T12:00:00`);
    const n = differenceInCalendarDays(t1, t0);
    if (n === 0) return 'astăzi';
    if (n === 1) return 'în 1 zi';
    if (n > 1) return `în ${n} zile`;
    if (n === -1) return 'acum 1 zi';
    return `acum ${-n} zile`;
  } catch {
    return '';
  }
}

/** Dată afișată ca în mock (ex. 17.05.2026); interval scurt dacă e cazul. */
export function formatDeadlineTimelineDate(minIso: string, maxIso: string): string {
  try {
    if (minIso === maxIso) {
      return format(parseISO(`${minIso}T12:00:00`), 'dd.MM.yyyy', { locale: ro });
    }
    return `${format(parseISO(`${minIso}T12:00:00`), 'dd.MM.yyyy', { locale: ro })} – ${format(parseISO(`${maxIso}T12:00:00`), 'dd.MM.yyyy', { locale: ro })}`;
  } catch {
    return minIso;
  }
}

export function daysFromTodayTo(targetIso: string, todayIso: string): number | null {
  try {
    return differenceInCalendarDays(parseISO(`${targetIso}T12:00:00`), parseISO(`${todayIso}T12:00:00`));
  } catch {
    return null;
  }
}

/** Culori timeline „Termene apropiate”: roșu urgent, portocaliu aproape, albastru mediu, gri mai târziu. */
export type TimelineUrgency = 'critical' | 'soon' | 'normal' | 'later';

export function deadlineTimelineUrgency(
  daysUntilMin: number | null,
  lifecycle: LifecycleBucket,
): TimelineUrgency {
  if (lifecycle === 'expirate') return 'critical';
  if (lifecycle === 'urmatoare') return 'soon';
  if (daysUntilMin === null) return 'normal';
  if (daysUntilMin < 0) return 'critical';
  if (daysUntilMin <= 1) return 'critical';
  if (daysUntilMin <= 7) return 'soon';
  if (daysUntilMin <= 11) return 'normal';
  return 'later';
}
