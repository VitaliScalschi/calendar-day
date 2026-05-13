/** Local calendar day key YYYY-MM-DD (no TZ shift). */
export function getTodayDateKey(): string {
  const t = new Date();
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
}

export function parseDateKey(value?: string): string | null {
  if (!value) return null;
  const v = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  if (/^\d{4}-\d{2}-\d{2}T/.test(v)) return v.slice(0, 10);
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(v)) {
    const [day, month, year] = v.split('/');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  return null;
}

/** Range in YYYY-MM-DD from deadline display string (same rules as timeline / filters). */
export function getDeadlineRangeFromString(value?: string): { start: string; end: string } | null {
  if (!value) return null;
  const v = value.trim();

  const fullRangeMatch = v.match(
    /^(\d{1,2}[/.]\d{1,2}[/.]\d{4}|\d{4}-\d{2}-\d{2})\s*-\s*(\d{1,2}[/.]\d{1,2}[/.]\d{4}|\d{4}-\d{2}-\d{2})$/,
  );
  if (fullRangeMatch) {
    const [, startRaw, endRaw] = fullRangeMatch;
    const start = parseDateKey(startRaw);
    const end = parseDateKey(endRaw);
    if (start && end) return { start, end };
  }

  const shortRangeMatch = v.match(/^(\d{1,2})\s*-\s*(\d{1,2}[/.]\d{1,2}[/.]\d{4})$/);
  if (shortRangeMatch) {
    const [, startDay, end] = shortRangeMatch;
    const [, endMonth, endYear] = end.split(/[/.]/);
    const startStr = `${startDay.padStart(2, '0')}/${endMonth}/${endYear}`;
    const start = parseDateKey(startStr);
    const endKey = parseDateKey(end);
    if (start && endKey) return { start, end: endKey };
  }

  return null;
}

export type DeadlineTodayVisualKind = 'future' | 'spans_today' | 'exact_today' | 'expired';

export interface DeadlineTodayVisual {
  kind: DeadlineTodayVisualKind;
  startKey: string | null;
  endKey: string | null;
}

export interface DeadlineStatusPresentation {
  label: string;
  iconClass: string;
}

/** Mapare comună status -> etichetă + iconiță, folosită de TimelineEvent și Modal. */
export const DEADLINE_STATUS_INFO: Record<DeadlineTodayVisualKind, DeadlineStatusPresentation> = {
  exact_today: { label: 'URMEAZĂ', iconClass: 'fa-solid fa-circle-info' },
  spans_today: { label: 'ÎN DESFĂȘURARE', iconClass: 'bi bi-clipboard2-check' },
  future: { label: 'VIITOR', iconClass: 'fa-solid fa-bullhorn' },
  expired: { label: 'EXPIRAT', iconClass: 'bi bi-calendar2-x' },
};

/** Single-day deadline that falls on today (not a multi-day window). */
export function getDeadlineTodayVisual(deadline?: string): DeadlineTodayVisual {
  const todayKey = getTodayDateKey();
  if (!deadline?.trim()) {
    return { kind: 'future', startKey: null, endKey: null };
  }

  const trimmed = deadline.trim();
  const range = getDeadlineRangeFromString(trimmed);
  const startKey = range ? range.start : parseDateKey(trimmed);
  const endKey = range ? range.end : parseDateKey(trimmed);

  if (!startKey || !endKey) {
    return { kind: 'future', startKey, endKey };
  }

  if (endKey < todayKey) {
    return { kind: 'expired', startKey, endKey };
  }
  if (startKey > todayKey) {
    return { kind: 'future', startKey, endKey };
  }
  if (startKey === endKey) {
    return { kind: 'exact_today', startKey, endKey };
  }
  return { kind: 'spans_today', startKey, endKey };
}

export function diffCalendarDays(fromKey: string, toKey: string): number {
  const [fy, fm, fd] = fromKey.split('-').map(Number);
  const [ty, tm, td] = toKey.split('-').map(Number);
  const fromT = new Date(fy, fm - 1, fd).getTime();
  const toT = new Date(ty, tm - 1, td).getTime();
  return Math.round((toT - fromT) / (1000 * 60 * 60 * 24));
}
