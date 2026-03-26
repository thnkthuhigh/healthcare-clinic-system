export function centsToVnd(cents: number): number {
  return Math.round((Number.isFinite(cents) ? cents : 0) / 100);
}

export function vndToCents(vnd: number): number {
  return Math.round((Number.isFinite(vnd) ? vnd : 0) * 100);
}

export function formatVnd(amountVnd: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(Math.round(Number.isFinite(amountVnd) ? amountVnd : 0));
}

export function formatVndFromCents(cents: number): string {
  return formatVnd(centsToVnd(cents));
}
