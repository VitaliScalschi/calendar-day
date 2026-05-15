import { parseDateKey } from '../../shared/utils/deadlineTodayKind';

export function parseApiErrorMessage(message: string): string {
  try {
    const parsed = JSON.parse(message) as { message?: string };
    return parsed?.message || message;
  } catch {
    return message;
  }
}

export function toSqlDateLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function normalizeUniqueSingleDates(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b));
}

export function normalizeSearch(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function toDateKey(value?: string | null): string | null {
  if (!value) return null;
  const normalized = value.trim().replace(/\./g, '/');
  return parseDateKey(normalized);
}
