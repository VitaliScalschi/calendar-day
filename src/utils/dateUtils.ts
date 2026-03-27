/**
 * Convertește data din format DD/MM/YYYY la Date object
 */
export function parseDate(dateStr: string): Date {
  const [day, month, year] = dateStr.split('/').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Convertește data din format DD/MM/YYYY la format YYYY-MM-DD (pentru SQL)
 */
export function convertToSQLDate(dateStr: string): string {
  const [day, month, year] = dateStr.split('/');
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

/**
 * Convertește data din format YYYY-MM-DD la format DD/MM/YYYY
 */
export function convertFromSQLDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
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

  return `${day}/${month}/${year}`;
}

/**
 * Calculează zilele rămase până la o dată
 * Acceptă fie Date object, fie string în format DD/MM/YYYY sau ISO datetime (YYYY-MM-DDTHH:mm:ss)
 */
export function calculateDaysRemaining(targetDate: Date | string): number {
  let date: Date;
  
  if (typeof targetDate === 'string') {
    if (targetDate.includes('T') || /^\d{4}-\d{2}-\d{2}/.test(targetDate)) {
      date = new Date(targetDate);
    } else {
      date = parseDate(targetDate);
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
 * Validează formatul datei DD/MM/YYYY
 */
export function isValidDate(dateStr: string): boolean {
  const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
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
 * Formatează o dată ISO datetime într-un format lizibil (DD/MM/YYYY)
 * Acceptă și format DD/MM/YYYY și le returnează așa cum sunt
 * Nu afișează ora, doar data
 */
export function formatDateTime(dateStr: string): string {
  if (!dateStr) return 'Data necunoscută';
  
  // Dacă este deja în format DD/MM/YYYY, returnează-l așa
  if (/^\d{2}\/\d{2}\/\d{4}/.test(dateStr)) {
    return dateStr;
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
    
    return `${day}/${month}/${year}`;
  } catch {
    return dateStr;
  }
}
