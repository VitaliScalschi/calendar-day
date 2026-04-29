const RANGE_META_REGEX = /\[\[RANGE:(\d{4}-\d{2}-\d{2})\|(\d{4}-\d{2}-\d{2})\]\]/;

export function toRoDateLocal(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

export function normalizeDateLabel(value: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-');
    return `${day}.${month}.${year}`;
  }

  return value.replace(/\//g, '.');
}

export function formatDeadlineLabel(deadlineValue: string): string {
  const rangeMatch = deadlineValue.match(/^(\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4})\s*-\s*(\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4})$/);
  if (rangeMatch) {
    const [, start, end] = rangeMatch;
    return `${normalizeDateLabel(start)} - ${normalizeDateLabel(end)}`;
  }

  return normalizeDateLabel(deadlineValue);
}

export function extractRangeMeta(additionalInfo?: string | null): { start: string; end: string; cleanInfo: string } | null {
  if (!additionalInfo) return null;
  const match = additionalInfo.match(RANGE_META_REGEX);
  if (!match) return null;
  const [, start, end] = match;
  const cleanInfo = additionalInfo.replace(RANGE_META_REGEX, '').trim();
  return { start, end, cleanInfo };
}

export function withRangeMeta(additionalInfo: string | undefined, start: string, end: string): string {
  const base = (additionalInfo || '').replace(RANGE_META_REGEX, '').trim();
  const rangeMeta = `[[RANGE:${start}|${end}]]`;
  return base ? `${base} ${rangeMeta}` : rangeMeta;
}

export function toLegacyDeadlineValue(input: {
  type?: string;
  startDate?: string | null;
  endDate?: string | null;
  deadlines?: string[] | null;
}): string {
  const type = input.type || 'SINGLE';
  const list = (input.deadlines || []).filter(Boolean);
  if (type === 'RANGE' && input.startDate && input.endDate) {
    return `${input.startDate} - ${input.endDate}`;
  }
  if (list.length > 0) {
    return list[0];
  }
  if (input.startDate) return input.startDate;
  if (input.endDate) return input.endDate;
  return '';
}
