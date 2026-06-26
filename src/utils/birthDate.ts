const BIRTH_DATE_DISPLAY_PATTERN = /^(\d{2})\.(\d{2})\.(\d{4})$/;

function padBirthDatePart(value: number): string {
  return String(value).padStart(2, '0');
}

function isValidCalendarDate(year: number, month: number, day: number): boolean {
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return false;
  }
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day;
}

function formatBirthDateDisplay(isoDate: string | undefined): string {
  if (!isoDate) {
    return '';
  }
  const [year, month, day] = isoDate.split('-').map(Number);
  if (!year || !month || !day) {
    return '';
  }
  return `${padBirthDatePart(day)}.${padBirthDatePart(month)}.${year}`;
}

function parseBirthDateDisplay(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  const match = trimmed.match(BIRTH_DATE_DISPLAY_PATTERN);
  if (!match) {
    return null;
  }
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const currentYear = new Date().getFullYear();
  if (year < 1920 || year > currentYear) {
    return null;
  }
  if (!isValidCalendarDate(year, month, day)) {
    return null;
  }
  const today = new Date();
  const birth = new Date(Date.UTC(year, month - 1, day));
  if (birth.getTime() > Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())) {
    return null;
  }
  return `${year}-${padBirthDatePart(month)}-${padBirthDatePart(day)}`;
}

function maskBirthDateInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) {
    return digits;
  }
  if (digits.length <= 4) {
    return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  }
  return `${digits.slice(0, 2)}.${digits.slice(2, 4)}.${digits.slice(4)}`;
}

function isBirthdayToday(isoDate: string | undefined): boolean {
  if (!isoDate) {
    return false;
  }
  const [, month, day] = isoDate.split('-').map(Number);
  if (!month || !day) {
    return false;
  }
  const today = new Date();
  return today.getMonth() + 1 === month && today.getDate() === day;
}

export {
  formatBirthDateDisplay,
  parseBirthDateDisplay,
  maskBirthDateInput,
  isBirthdayToday,
};
