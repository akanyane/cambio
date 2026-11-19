// Binance: public market data (endpoint without geo restrictions), REST + WebSocket.
// https://developers.binance.com/docs/binance-spot-api-docs
import type { Observation } from './types';
import { getJSON, isoInTz } from './util';

const API = 'https://data-api.binance.vision/api/v3';
const WS = 'wss://data-stream.binance.vision/stream';

/** Crypto assets quoted against USDT. */
export const BINANCE_SYMBOLS: Record<string, string> = { BTC: 'BTCUSDT', ETH: 'ETHUSDT', SOL: 'SOLUSDT' };
export const CRYPTO_CODES = Object.keys(BINANCE_SYMBOLS);
const CODE_OF = Object.fromEntries(Object.entries(BINANCE_SYMBOLS).map(([c, s]) => [s, c]));

/** Daily closes in USD (USDT). */
export async function fetchCryptoDaily(code: string, limit = 400): Promise<Observation[]> {
  const k = await getJSON<[number, string, string, string, string][]>(
    `${API}/klines?symbol=${BINANCE_SYMBOLS[code]}&interval=1d&limit=${limit}`,
  );
  // k[i][0] = open time (UTC), k[i][4] = close
  return k.map((r) => ({ date: isoInTz(r[0], 'UTC'), value: Number(r[4]) }));
}

/** Current USD price of every crypto asset, in one request. */
export async function fetchCryptoPrices(): Promise<Record<string, number>> {
  const symbols = encodeURIComponent(JSON.stringify(Object.values(BINANCE_SYMBOLS)));
  const j = await getJSON<{ symbol: string; price: string }[]>(`${API}/ticker/price?symbols=${symbols}`);
  const out: Record<string, number> = {};
  for (const t of j) {
    const code = CODE_OF[t.symbol];
    const p = Number(t.price);
    if (code && p > 0) out[code] = p;
  }
  return out;
}

/** Live prices over one combined WebSocket stream, with reconnection. Returns the unsubscribe function. */
export function subscribeCrypto(onPrice: (code: string, usd: number) => void): () => void {
  const url = `${WS}?streams=${Object.values(BINANCE_SYMBOLS)
    .map((s) => `${s.toLowerCase()}@miniTicker`)
    .join('/')}`;
  let ws: WebSocket | null = null;
  let closed = false;
  let retry = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const open = () => {
    if (closed || typeof WebSocket === 'undefined') return;
    ws = new WebSocket(url);
    ws.onopen = () => {
      retry = 0;
    };
    ws.onmessage = (ev) => {
      try {
        const m = JSON.parse(ev.data as string) as { data?: { s?: string; c?: string } };
        const code = CODE_OF[m.data?.s ?? ''];
        const p = Number(m.data?.c);
        if (code && p > 0) onPrice(code, p);
      } catch {
        /* invalid message */
      }
    };
    ws.onclose = () => {
      if (closed) return;
      timer = setTimeout(open, Math.min(30000, 1000 * 2 ** retry++));
    };
    ws.onerror = () => ws?.close();
  };
  open();

  return () => {
    closed = true;
    clearTimeout(timer);
    ws?.close();
  };
}
