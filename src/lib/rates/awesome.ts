// AwesomeAPI: near-real-time quotes (refreshed every ~30 s) and daily history, no API key.
// https://docs.awesomeapi.com.br/api-de-moedas
import type { LiveUpdate, Observation } from './types';
import { getJSON, isoInTz } from './util';

const API = 'https://economia.awesomeapi.com.br/json';

interface Quote {
  bid: string;
  varBid: string;
  timestamp: string;
}

/** Current USD quote in each currency. */
export async function fetchAwesomeLive(codes: string[]): Promise<LiveUpdate> {
  const pairs = codes.map((c) => `USD-${c}`).join(',');
  const j = await getJSON<Record<string, Quote>>(`${API}/last/${pairs}`);
  const out: LiveUpdate = {};
  codes.forEach((c) => {
    const q = j[`USD${c}`];
    if (!q) return;
    const value = Number(q.bid);
    const prev = value - Number(q.varBid);
    if (value > 0) out[c] = { value, prevClose: prev > 0 ? prev : undefined };
  });
  return out;
}

/** Daily history (up to 360 records) of USD in `code`, one value per day. */
export async function fetchAwesomeDaily(code: string, days = 360): Promise<Observation[]> {
  const j = await getJSON<Quote[]>(`${API}/daily/USD-${code}/${days}`);
  const byDay = new Map<string, { ts: number; value: number }>();
  j.forEach((q) => {
    const ts = Number(q.timestamp) * 1000;
    const date = isoInTz(ts, 'America/Sao_Paulo');
    const cur = byDay.get(date);
    if (!cur || ts > cur.ts) byDay.set(date, { ts, value: Number(q.bid) });
  });
  return [...byDay.entries()].map(([date, v]) => ({ date, value: v.value }));
}
