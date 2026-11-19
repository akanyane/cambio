import { getLocale, intlTag, t } from './i18n';

const cache: Record<string, Intl.NumberFormat> = {};
/** Number formatter with exactly `d` decimals in the current locale. */
export const nf = (d: number) =>
  (cache[`${getLocale()}:${d}`] ??= new Intl.NumberFormat(intlTag(), {
    minimumFractionDigits: d,
    maximumFractionDigits: d,
  }));

/** ≥ 100 → 2 decimals; 0.01–100 → 4; smaller → 6 or 8. */
export function fmt(v: number): string {
  const a = Math.abs(v);
  const d = a >= 100 ? 2 : a >= 0.01 ? 4 : a >= 0.0001 ? 6 : 8;
  return nf(d).format(v);
}

export const money = (v: number) => (Math.abs(v) >= 1 ? nf(2).format(v) : fmt(v));

export const fmtSigned = (v: number) => (v > 0 ? '+' : v < 0 ? '−' : '') + fmt(Math.abs(v));

export function pct(p: number): string {
  const x = p * 100;
  if (!Number.isFinite(x) || Math.abs(x) < 0.005) return `${nf(2).format(0)}%`;
  return `${(x > 0 ? '+' : '−') + nf(2).format(Math.abs(x))}%`;
}

export const dir = (p: number) => (p > 0.00005 ? 'up' : p < -0.00005 ? 'dn' : '');

/** Parses a typed amount in the current locale ("1.234,56" in pt, "1,234.56" in en). */
export function parseAmt(s: string): number {
  const clean = String(s).replace(/\s/g, '');
  const norm = getLocale() === 'pt' ? clean.replace(/\./g, '').replace(',', '.') : clean.replace(/,/g, '');
  const n = Number(norm);
  return Number.isFinite(n) ? n : 0;
}

export const p2 = (n: number) => String(n).padStart(2, '0');

/** Strips accents and case for search. */
export const fold = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

/** 'yyyy-mm-dd' → local Date (midnight). */
export function parseISO(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export const dayMonth = (iso: string) => {
  const d = parseISO(iso);
  return t().dayMonth(p2(d.getDate()), t().months[d.getMonth()]);
};

export const longDay = (iso: string) => `${dayMonth(iso)} ${parseISO(iso).getFullYear()}`;

export const monthYear = (iso: string) => {
  const d = parseISO(iso);
  return `${t().months[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`;
};

export const clockStr = (d: Date) => `${p2(d.getHours())}:${p2(d.getMinutes())}:${p2(d.getSeconds())}`;
