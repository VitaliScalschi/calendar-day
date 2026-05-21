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

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidNotificationEmail(value: string) {
  return EMAIL_PATTERN.test(value.trim());
}

export function normalizeUniqueEmails(values: string[]) {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of values) {
    const email = raw.trim().toLowerCase();
    if (!email || seen.has(email)) continue;
    seen.add(email);
    result.push(email);
  }
  return result.sort((a, b) => a.localeCompare(b));
}

export function parseNotificationEmailsFromApi(event: {
  notificationEmails?: string[];
  notificationEmail?: string | null;
}) {
  if (Array.isArray(event.notificationEmails) && event.notificationEmails.length > 0) {
    return normalizeUniqueEmails(event.notificationEmails);
  }
  if (event.notificationEmail?.includes(';')) {
    return normalizeUniqueEmails(event.notificationEmail.split(';'));
  }
  if (event.notificationEmail?.trim()) {
    return normalizeUniqueEmails([event.notificationEmail]);
  }
  return [];
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
