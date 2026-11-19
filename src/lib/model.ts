import type { MarketData } from './rates';
import { todayISO } from './rates/util';

export type Range = '1M' | '6M' | '1A';
export const RANGE_LABEL: Record<Range, string> = { '1M': '1 mês', '6M': '6 meses', '1A': '1 ano' };
const RANGE_MONTHS: Record<Range, number> = { '1M': 1, '6M': 6, '1A': 12 };

/** Valor de 1 X expresso em B, agora. */
export const pairValue = (d: MarketData, x: string, b: string) => d.live[b] / d.live[x];

/** Valor do fechamento anterior de X em B. */
export const prevOf = (d: MarketData, x: string, b: string) => {
  const k = d.dates.length - 1;
  return d.closes[b][k] / d.closes[x][k];
};

/** Últimos `count` pontos (os `count − 1` fechamentos mais recentes + hoje). */
export function series(d: MarketData, x: string, b: string, count: number): number[] {
  const n = d.dates.length;
  const out: number[] = [];
  for (let i = n - (count - 1); i < n; i++) {
    const k = Math.max(0, i);
    out.push(d.closes[b][k] / d.closes[x][k]);
  }
  out.push(pairValue(d, x, b));
  return out;
}

/** Datas correspondentes a `series(…, count)`; a última é hoje. */
export function seriesDates(d: MarketData, count: number): string[] {
  const n = d.dates.length;
  const out: string[] = [];
  for (let i = n - (count - 1); i < n; i++) out.push(d.dates[Math.max(0, i)]);
  out.push(todayISO());
  return out;
}

/** Quantos pontos (com hoje) cabem no período. */
export function rangeCount(d: MarketData, r: Range): number {
  const now = new Date();
  const cut = todayISO(new Date(now.getFullYear(), now.getMonth() - RANGE_MONTHS[r], now.getDate()));
  let k = d.dates.length;
  while (k > 0 && d.dates[k - 1] >= cut) k--;
  return Math.max(2, d.dates.length - k + 1);
}

export function scale(s: number[], w: number, h: number, pad: number) {
  let mn = Math.min(...s);
  let mx = Math.max(...s);
  if (mx - mn < mx * 1e-9) {
    mx *= 1 + 1e-6;
    mn *= 1 - 1e-6;
  }
  const step = w / (s.length - 1);
  const y = (v: number) => pad + (1 - (v - mn) / (mx - mn)) * (h - 2 * pad);
  return { pts: s.map((v, i) => [i * step, y(v)] as [number, number]), y };
}

export const pathD = (p: [number, number][]) =>
  p.map((q, i) => `${(i ? 'L' : 'M') + q[0].toFixed(1)} ${q[1].toFixed(1)}`).join(' ');

/** Volatilidade anualizada a partir de retornos logarítmicos diários. */
export function volatility(s: number[]): number {
  let sum = 0;
  let sum2 = 0;
  for (let i = 1; i < s.length; i++) {
    const r = Math.log(s[i] / s[i - 1]);
    sum += r;
    sum2 += r * r;
  }
  const n = s.length - 1;
  const m = sum / n;
  return Math.sqrt(Math.max(0, sum2 / n - m * m)) * Math.sqrt(252);
}
