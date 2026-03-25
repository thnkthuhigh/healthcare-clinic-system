export const CLINIC_LOCALE = 'vi-VN';
export const CLINIC_TIME_ZONE = 'Asia/Ho_Chi_Minh';

type DateInput = Date | string | number;

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function toDate(value: DateInput): Date {
  if (value instanceof Date) {
    return value;
  }

  if (typeof value === 'number') {
    return new Date(value);
  }

  if (DATE_ONLY_PATTERN.test(value)) {
    return new Date(`${value}T00:00:00+07:00`);
  }

  return new Date(value);
}

function getDatePart(parts: Intl.DateTimeFormatPart[], key: 'year' | 'month' | 'day'): string {
  return parts.find((part) => part.type === key)?.value ?? '';
}

function formatByOptions(value: DateInput, options: Intl.DateTimeFormatOptions): string {
  const parsed = toDate(value);

  if (Number.isNaN(parsed.getTime())) {
    return typeof value === 'string' ? value : '';
  }

  return new Intl.DateTimeFormat(CLINIC_LOCALE, {
    timeZone: CLINIC_TIME_ZONE,
    ...options,
  }).format(parsed);
}

export function toIsoDateUtc7(value: DateInput = new Date()): string {
  const parsed = toDate(value);

  if (Number.isNaN(parsed.getTime())) {
    return '';
  }

  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: CLINIC_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(parsed);

  return `${getDatePart(parts, 'year')}-${getDatePart(parts, 'month')}-${getDatePart(parts, 'day')}`;
}

export function startOfMonthIsoUtc7(value: DateInput = new Date()): string {
  const isoDate = toIsoDateUtc7(value);
  return isoDate ? `${isoDate.slice(0, 7)}-01` : '';
}

export function addDaysToIsoDate(isoDate: string, days: number): string {
  const [year, month, day] = isoDate.split('-').map(Number);

  if (!year || !month || !day) {
    return isoDate;
  }

  const next = new Date(Date.UTC(year, month - 1, day));
  next.setUTCDate(next.getUTCDate() + days);

  return `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, '0')}-${String(next.getUTCDate()).padStart(2, '0')}`;
}

export function formatDateUtc7(value: DateInput, options: Intl.DateTimeFormatOptions = {}): string {
  return formatByOptions(value, options);
}

export function formatTimeUtc7(value: DateInput, options: Intl.DateTimeFormatOptions = {}): string {
  return formatByOptions(value, options);
}

export function formatDateTimeUtc7(
  value: DateInput,
  options: Intl.DateTimeFormatOptions = {},
): string {
  return formatByOptions(value, options);
}
