// Binance: public market data (endpoint without geo restrictions), REST + WebSocket.
// https://developers.binance.com/docs/binance-spot-api-docs
import type { Observation } from './types';
import { getJSON, isoInTz } from './util';

const API = 'https://data-api.binance.vision/api/v3';
const WS = 'wss://data-stream.binance.vision/ws/btcusdt@miniTicker';

/** Daily BTC closes in USD (USDT). */
export async function fetchBtcDaily(limit = 400): Promise<Observation[]> {
  const k = await getJSON<[number, string, string, string, string][]>(
    `${API}/klines?symbol=BTCUSDT&interval=1d&limit=${limit}`,
  );
  // k[i][0] = open time (UTC), k[i][4] = close
  return k.map((r) => ({ date: isoInTz(r[0], 'UTC'), value: Number(r[4]) }));
}

export async function fetchBtcPrice(): Promise<number> {
  const j = await getJSON<{ price: string }>(`${API}/ticker/price?symbol=BTCUSDT`);
  return Number(j.price);
}

/** Live price over WebSocket, with reconnection. Returns the unsubscribe function. */
export function subscribeBtc(onPrice: (usd: number) => void): () => void {
  let ws: WebSocket | null = null;
  let closed = false;
  let retry = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const open = () => {
    if (closed || typeof WebSocket === 'undefined') return;
    ws = new WebSocket(WS);
    ws.onopen = () => {
      retry = 0;
    };
    ws.onmessage = (ev) => {
      try {
        const m = JSON.parse(ev.data as string) as { c?: string };
        const p = Number(m.c);
        if (p > 0) onPrice(p);
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
