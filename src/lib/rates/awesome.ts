// AwesomeAPI: near-real-time quotes (refreshed every ~30 s) and daily history, no API key.
// https://docs.awesomeapi.com.br/api-de-moedas
import type { LiveUpdate, Observation } from './types';
import { getJSON, isoInTz } from './util';

const API = 'https://economia.awesomeapi.com.br/json';

/** Assets AwesomeAPI only quotes as XXX-USD (price of one unit in dollars). */
const INVERTED = new Set(['XAU', 'XAG']);
const pair = (c: string) => (INVERTED.has(c) ? `${c}-USD` : `USD-${c}`);
/** Units of `c` per 1 USD from an AwesomeAPI bid. */
const perUsd = (c: string, bid: number) => (INVERTED.has(c) ? 1 / bid : bid);

interface Quote {
  bid: string;
  varBid: string;
  timestamp: string;
}

/** Current quote of each currency, as units per 1 USD. */
export async function fetchAwesomeLive(codes: string[]): Promise<LiveUpdate> {
  const j = await getJSON<Record<string, Quote>>(`${API}/last/${codes.map(pair).join(',')}`);
  const out: LiveUpdate = {};
  codes.forEach((c) => {
    const q = j[pair(c).replace('-', '')];
    if (!q) return;
    const bid = Number(q.bid);
    const prev = bid - Number(q.varBid);
    if (bid > 0) out[c] = { value: perUsd(c, bid), prevClose: prev > 0 ? perUsd(c, prev) : undefined };
  });
  return out;
}

/** Daily history (up to 360 records) as units of `code` per 1 USD, one value per day. */
export async function fetchAwesomeDaily(code: string, days = 360): Promise<Observation[]> {
  const j = await getJSON<Quote[]>(`${API}/daily/${pair(code)}/${days}`);
  const byDay = new Map<string, { ts: number; value: number }>();
  j.forEach((q) => {
    const ts = Number(q.timestamp) * 1000;
    const date = isoInTz(ts, 'America/Sao_Paulo');
    const cur = byDay.get(date);
    if (!cur || ts > cur.ts) byDay.set(date, { ts, value: perUsd(code, Number(q.bid)) });
  });
  return [...byDay.entries()].map(([date, v]) => ({ date, value: v.value }));
}
