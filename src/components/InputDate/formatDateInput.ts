export function formatIsoToDisplay(value: string): string {
  if (!value) return '';
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return value;
  return `${match[3]}/${match[2]}/${match[1]}`;
}

export function parseDisplayToIso(value: string): string | null {
  const normalized = value.trim().replace(/\./g, '/').replace(/-/g, '/');
  const match = normalized.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return null;

  const day = match[1].padStart(2, '0');
  const month = match[2].padStart(2, '0');
  const year = match[3];
  const isoValue = `${year}-${month}-${day}`;
  const parsed = new Date(`${isoValue}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return null;
  if (
    parsed.getFullYear() !== Number(year) ||
    parsed.getMonth() + 1 !== Number(month) ||
    parsed.getDate() !== Number(day)
  ) {
    return null;
  }
  return isoValue;
}

export function openNativeDatePicker(input: HTMLInputElement) {
  if ('showPicker' in input && typeof input.showPicker === 'function') {
    input.showPicker();
  } else {
    input.focus();
  }
}
