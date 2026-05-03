import type { EventDeadlineProps } from '../../interface/index';

function parseToIsoDateKey(value: string): string | null {
  const v = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  if (/^\d{4}-\d{2}-\d{2}T/.test(v)) return v.slice(0, 10);
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(v)) {
    const [day, month, year] = v.split('/');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  return null;
}

/** Termen tip RANGE (un singur card cu interval), nu MULTIPLE cu zile discrete. */
function looksLikeRangeDeadlineString(deadline?: string): boolean {
  if (!deadline?.trim() || !deadline.includes('-')) return false;
  const v = deadline.trim();
  if (/^\d{4}-\d{2}-\d{2}\s+-\s+\d{4}-\d{2}-\d{2}$/.test(v)) return true;
  if (/^\d{1,2}\/\d{1,2}\/\d{4}\s+-\s+\d{1,2}\/\d{1,2}\/\d{4}$/.test(v)) return true;
  const short = v.match(/^(\d{1,2})\s+-\s+(\d{1,2}\/\d{1,2}\/\d{4})$/);
  return Boolean(short);
}

/**
 * Pentru acțiuni cu mai multe zile (lista `deadlines` cu 2+ date), afișăm câte un card per dată.
 * RANGE rămâne un singur card. Filtrele după zi lucrează pe fiecare card în parte.
 */
export function expandMultiDateDeadlinesForDisplay(deadlines: EventDeadlineProps[]): EventDeadlineProps[] {
  const out: EventDeadlineProps[] = [];

  for (const d of deadlines) {
    const rawDates = (d.deadlines ?? []).filter((x) => Boolean(x?.trim()));
    if (rawDates.length <= 1 || looksLikeRangeDeadlineString(d.deadline)) {
      out.push(d);
      continue;
    }

    const seen = new Set<string>();
    for (const dateVal of rawDates) {
      const key = parseToIsoDateKey(dateVal);
      if (key) {
        if (seen.has(key)) continue;
        seen.add(key);
      }
      out.push({
        ...d,
        id: key ? `${d.id}__${key}` : `${d.id}__${encodeURIComponent(dateVal)}`,
        deadline: dateVal.trim(),
        deadlines: [dateVal.trim()],
      });
    }
  }

  return out;
}
