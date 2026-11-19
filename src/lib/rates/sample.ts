// Gerador determinístico do protótipo (mulberry32 + FNV), usado quando as APIs não respondem.
import { CURRENCIES, type Currency, GRID } from '../currencies';
import type { MarketData } from './types';
import { todayISO } from './util';

export function rng(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** `count` dias úteis anteriores a hoje, em ordem crescente. */
export function businessDays(count: number, from = new Date()): string[] {
  const out: string[] = [];
  const d = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  while (out.length < count) {
    d.setDate(d.getDate() - 1);
    const wd = d.getDay();
    if (wd !== 0 && wd !== 6) out.push(todayISO(d));
  }
  return out.reverse();
}

/** Fechamentos de exemplo que terminam em `end` (valor de hoje). */
export function sampleCloses(c: Currency, n: number, end = c.sample.rate): number[] {
  const { vol, drift } = c.sample;
  if (!vol && !drift) return new Array(n).fill(end);
  const rnd = rng(hash(`${c.code}longo`));
  const ph = rnd() * 40;
  const l = new Array<number>(n + 1);
  l[n] = end;
  for (let i = n - 1; i >= 0; i--) {
    const wave = vol * 0.3 * Math.sin((i + ph) / 26);
    l[i] = l[i + 1] / (1 + drift * 0.9 + wave + (rnd() - 0.5) * 2 * vol * 0.9);
  }
  return l.slice(0, n);
}

export function sampleMarket(sessions = 258): MarketData {
  const dates = businessDays(sessions);
  const closes: MarketData['closes'] = {};
  const live: MarketData['live'] = {};
  const sources: MarketData['sources'] = {};
  CURRENCIES.forEach((c) => {
    closes[c.code] = sampleCloses(c, sessions);
    live[c.code] = c.sample.rate;
    sources[c.code] = c.code === 'USD' ? 'fixo' : 'exemplo';
  });
  return { dates, closes, live, sources, sample: true, asOf: Date.now() };
}

/** Oscilação simulada (modo de exemplo): um par da grade a cada chamada. */
export function sampleTick(live: Record<string, number>) {
  const pool = GRID.filter((c) => c !== 'USD');
  const code = pool[Math.floor(Math.random() * pool.length)];
  const mag = code === 'BTC' ? 0.004 : 0.0009;
  return { [code]: { value: live[code] * (1 + (Math.random() - 0.5) * 2 * mag) } };
}
