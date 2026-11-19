import type { Observation } from './types';

/** Data local em yyyy-mm-dd. */
export const todayISO = (d = new Date()) => d.toLocaleDateString('sv-SE');

export function isoMinusDays(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d - days));
  return dt.toISOString().slice(0, 10);
}

/** Data de um timestamp num fuso, em yyyy-mm-dd. */
export const isoInTz = (ms: number, timeZone: string) => new Date(ms).toLocaleDateString('sv-SE', { timeZone });

export async function getJSON<T>(url: string, timeoutMs = 12000): Promise<T> {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const r = await fetch(url, { signal: ctl.signal });
    if (!r.ok) throw new Error(`HTTP ${r.status} em ${url}`);
    return (await r.json()) as T;
  } finally {
    clearTimeout(t);
  }
}

/**
 * Alinha observações irregulares ao calendário de sessões, repetindo o último valor conhecido.
 * Antes da primeira observação usa a primeira disponível.
 */
export function align(dates: string[], obs: Observation[]): number[] | null {
  const sorted = obs
    .filter((o) => o.value > 0 && Number.isFinite(o.value))
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  if (!sorted.length) return null;
  let j = 0;
  let last = sorted[0].value;
  return dates.map((d) => {
    while (j < sorted.length && sorted[j].date <= d) last = sorted[j++].value;
    return last;
  });
}
