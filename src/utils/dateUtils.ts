/**
 * Convertește data din format DD/MM/YYYY sau DD.MM.YYYY la Date object
 */
export function parseDate(dateStr: string): Date {
  const [day, month, year] = dateStr.split(/[/.]/).map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Convertește data din format DD/MM/YYYY sau DD.MM.YYYY la format YYYY-MM-DD (pentru SQL)
 */
export function convertToSQLDate(dateStr: string): string {
  const [day, month, year] = dateStr.split(/[/.]/);
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

/**
 * Convertește data din format YYYY-MM-DD la format DD.MM.YYYY
 */
export function convertFromSQLDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-');
  return `${day}.${month}.${year}`;
}

/**
 * Formatează data pentru afișare
 */
export function formatDate(date: Date, format: 'short' | 'long' = 'short'): string {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();

  if (format === 'long') {
    const monthNames = [
      'ianuarie', 'februarie', 'martie', 'aprilie', 'mai', 'iunie',
      'iulie', 'august', 'septembrie', 'octombrie', 'noiembrie', 'decembrie'
    ];
    return `${day} ${monthNames[date.getMonth()].toUpperCase()} ${year}`;
  }

  return `${day}.${month}.${year}`;
}

/**
 * Calculează zilele rămase până la o dată
 * Acceptă fie Date object, fie string în format DD/MM/YYYY, DD.MM.YYYY sau ISO datetime (YYYY-MM-DDTHH:mm:ss)
 */
export function calculateDaysRemaining(targetDate: Date | string): number {
  let date: Date;
  
  if (typeof targetDate === 'string') {
    const raw = targetDate.trim();

    // Dacă string-ul conține un range (ex: "13/04/2026 - 17/04/2026", "13.04.2026 - 17.04.2026" sau "01 - 14/04/2026"),
    // calculăm zilele rămase până la "capătul" intervalului.
    const ddmmDates = raw.match(/\d{1,2}[/.]\d{1,2}[/.]\d{4}/g);
    const isoDates = raw.match(/\d{4}-\d{2}-\d{2}/g);
    const processed = (ddmmDates && ddmmDates.length >= 2)
      ? ddmmDates[ddmmDates.length - 1]
      : (isoDates && isoDates.length >= 2)
        ? isoDates[isoDates.length - 1]
        : raw;

    if (processed.includes('T') || /^\d{4}-\d{2}-\d{2}/.test(processed)) {
      date = new Date(processed);
    } else {
      date = parseDate(processed);
    }
  } else {
    date = targetDate;
  }
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  
  const diffTime = date.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}

/**
 * Validează formatul datei DD/MM/YYYY sau DD.MM.YYYY
 */
export function isValidDate(dateStr: string): boolean {
  const regex = /^(\d{2})[/.](\d{2})[/.](\d{4})$/;
  const match = dateStr.match(regex);
  
  if (!match) return false;
  
  const [, day, month, year] = match.map(Number);
  const date = new Date(year, month - 1, day);
  
  return (
    date.getDate() === day &&
    date.getMonth() === month - 1 &&
    date.getFullYear() === year
  );
}

/**
 * Formatează o dată ISO datetime într-un format lizibil (DD.MM.YYYY)
 * Acceptă și format DD/MM/YYYY sau DD.MM.YYYY
 * Nu afișează ora, doar data
 */
export function formatDateTime(dateStr: string): string {
  if (!dateStr) return 'Data necunoscută';
  
  // Dacă este deja în format DD/MM/YYYY sau DD.MM.YYYY, normalizează la DD.MM.YYYY
  if (/^\d{2}[/.]\d{2}[/.]\d{4}/.test(dateStr)) {
    return dateStr.replace(/\//g, '.');
  }
  
  // Încearcă să parseze ca ISO datetime
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return dateStr; // Dacă nu poate fi parsată, returnează originalul
    }
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}.${month}.${year}`;
  } catch {
    return dateStr;
  }
}

const ROMANIAN_MONTH_NAMES = [
  'ianuarie',
  'februarie',
  'martie',
  'aprilie',
  'mai',
  'iunie',
  'iulie',
  'august',
  'septembrie',
  'octombrie',
  'noiembrie',
  'decembrie',
] as const;

/**
 * Data zilei alegerilor pentru footer (ex: "17 Mai 2026").
 * Acceptă YYYY-MM-DD, ISO datetime, DD/MM/YYYY, DD.MM.YYYY.
 */
export function formatElectionDayFooterLabel(eday: string | undefined | null): string | null {
  if (!eday?.trim()) return null;
  const v = eday.trim();

  let date: Date;
  if (/^\d{4}-\d{2}-\d{2}/.test(v)) {
    const [y, m, d] = v.slice(0, 10).split('-').map(Number);
    date = new Date(y, m - 1, d);
  } else if (/^\d{1,2}[/.]\d{1,2}[/.]\d{4}/.test(v)) {
    const [day, month, year] = v.split(/[/.]/).map(Number);
    date = new Date(year, month - 1, day);
  } else {
    date = new Date(v);
  }

  if (isNaN(date.getTime())) return null;

  const day = date.getDate();
  const monthName = ROMANIAN_MONTH_NAMES[date.getMonth()];
  const monthLabel = monthName.charAt(0).toUpperCase() + monthName.slice(1);
  return `${day} ${monthLabel} ${date.getFullYear()}`;
}
