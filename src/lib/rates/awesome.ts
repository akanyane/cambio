// AwesomeAPI — cotações quase em tempo real (atualiza a cada ~30 s) e histórico diário, sem chave.
// https://docs.awesomeapi.com.br/api-de-moedas
import type { LiveUpdate, Observation } from './types';
import { getJSON, isoInTz } from './util';

const API = 'https://economia.awesomeapi.com.br/json';

interface Quote {
  bid: string;
  varBid: string;
  timestamp: string;
}

/** Cotação atual de USD em cada moeda. */
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

/** Histórico diário (até 360 registros) de USD em `code`, um valor por dia. */
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
