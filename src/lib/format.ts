import type { Currency } from './currencies';

const cache: Record<number, Intl.NumberFormat> = {};
export const nf = (d: number) =>
  (cache[d] ??= new Intl.NumberFormat('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d }));

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
  if (!Number.isFinite(x) || Math.abs(x) < 0.005) return '0,00%';
  return `${(x > 0 ? '+' : '−') + nf(2).format(Math.abs(x))}%`;
}

export const dir = (p: number) => (p > 0.00005 ? 'up' : p < -0.00005 ? 'dn' : '');

export function parseAmt(s: string): number {
  const n = Number(String(s).replace(/\s/g, '').replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}

export const p2 = (n: number) => String(n).padStart(2, '0');

export const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
export const MONTHS_LONG = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
];
export const WEEKDAYS = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
];

/** Strips accents and case for search. */
export const fold = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

export const lede = (c: Currency) => (c.fem ? 'Uma ' : 'Um ') + c.name.charAt(0).toLowerCase() + c.name.slice(1);

/** 'yyyy-mm-dd' → local Date (midnight). */
export function parseISO(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export const dayMonth = (iso: string) => {
  const d = parseISO(iso);
  return `${p2(d.getDate())} ${MONTHS[d.getMonth()]}`;
};

export const longDay = (iso: string) => {
  const d = parseISO(iso);
  return `${p2(d.getDate())} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};

export const monthYear = (iso: string) => {
  const d = parseISO(iso);
  return `${MONTHS[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`;
};

export const clockStr = (d: Date) => `${p2(d.getHours())}:${p2(d.getMinutes())}:${p2(d.getSeconds())}`;
