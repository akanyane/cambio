/**
 * `rates` layer: merges every source into a single shape.
 *
 *  - Fiat history (17 currencies): Frankfurter / ECB, which defines the session calendar.
 *  - ARS, CLP, COP history:        AwesomeAPI (daily).
 *  - BTC history:                  Binance (daily klines).
 *  - Live fiat (20 currencies):    AwesomeAPI /last, polled periodically.
 *  - Live BTC:                     Binance WebSocket (see binance.ts).
 *  - Fallback:                     Frankfurter /latest and, finally, the sample generator.
 */
import { BY, CODES } from '../currencies';
import { fetchAwesomeDaily, fetchAwesomeLive } from './awesome';
import { fetchBtcDaily, fetchBtcPrice } from './binance';
import { FRANKFURTER_CODES, fetchFrankfurterLatest, fetchFrankfurterSeries } from './frankfurter';
import { sampleCloses, sampleMarket } from './sample';
import type { LiveUpdate, MarketData, Observation } from './types';
import { align, isoMinusDays, todayISO } from './util';

export { subscribeBtc } from './binance';
export { sampleTick } from './sample';
export type { LiveUpdate, MarketData } from './types';

const AWESOME_HIST = ['ARS', 'CLP', 'COP'];
const LIVE_FIAT = CODES.filter((c) => c !== 'USD' && c !== 'BTC');
const CACHE_KEY = 'cambio:history:v1';
const CACHE_TTL = 6 * 3600 * 1000;

type History = Pick<MarketData, 'dates' | 'closes' | 'sources'>;

function readCache(today: string): History | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const c = JSON.parse(raw) as History & { day: string; at: number };
    if (c.day !== today || Date.now() - c.at > CACHE_TTL) return null;
    if (!CODES.every((k) => Array.isArray(c.closes[k]) && c.closes[k].length === c.dates.length)) return null;
    return { dates: c.dates, closes: c.closes, sources: c.sources };
  } catch {
    return null;
  }
}

function writeCache(today: string, h: History) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ ...h, day: today, at: Date.now() }));
  } catch {
    /* storage unavailable */
  }
}

async function loadHistory(today: string): Promise<History | null> {
  const cached = readCache(today);
  if (cached) return cached;

  const start = isoMinusDays(today, 380);
  const [fr, btc, ...aw] = await Promise.allSettled([
    fetchFrankfurterSeries(start),
    fetchBtcDaily(400),
    ...AWESOME_HIST.map((c) => fetchAwesomeDaily(c)),
  ]);
  if (fr.status !== 'fulfilled') return null;

  const dates = fr.value.dates.filter((d) => d < today);
  if (dates.length < 30) return null;

  const closes: History['closes'] = { USD: dates.map(() => 1) };
  const sources: History['sources'] = { USD: 'fixed' };
  const put = (code: string, obs: Observation[] | null, src: History['sources'][string]) => {
    const a = obs ? align(dates, obs) : null;
    if (a) {
      closes[code] = a;
      sources[code] = src;
    }
  };

  for (const c of FRANKFURTER_CODES) put(c, fr.value.series[c], 'ECB');
  if (btc.status === 'fulfilled')
    put(
      'BTC',
      btc.value.map((o) => ({ date: o.date, value: 1 / o.value })),
      'Binance',
    );
  AWESOME_HIST.forEach((c, i) => {
    const r = aw[i];
    if (r.status === 'fulfilled') put(c, r.value, 'AwesomeAPI');
  });

  const h: History = { dates, closes, sources };
  if (CODES.every((c) => closes[c])) writeCache(today, h);
  return h;
}

/** Current quotes for every currency the live sources can deliver. */
export async function fetchLive(): Promise<LiveUpdate> {
  const [aw, btc] = await Promise.allSettled([fetchAwesomeLive(LIVE_FIAT), fetchBtcPrice()]);
  const out: LiveUpdate = aw.status === 'fulfilled' ? { ...aw.value } : {};
  if (btc.status === 'fulfilled' && btc.value > 0) out.BTC = { value: 1 / btc.value };

  const missing = FRANKFURTER_CODES.filter((c) => !out[c]);
  if (missing.length) {
    try {
      const l = await fetchFrankfurterLatest(missing);
      missing.forEach((c) => {
        if (l.rates[c]) out[c] = { value: l.rates[c] };
      });
    } catch {
      /* keep the last close */
    }
  }
  return out;
}

/** Applies live quotes; the live source's previous close overrides the last close. */
export function applyLive(d: MarketData, upd: LiveUpdate): MarketData {
  const live = { ...d.live };
  let closes = d.closes;
  let changed = false;
  for (const [code, q] of Object.entries(upd)) {
    if (!(q.value > 0) || !Number.isFinite(q.value)) continue;
    if (live[code] !== q.value) {
      live[code] = q.value;
      changed = true;
    }
    const arr = closes[code];
    if (q.prevClose && arr?.length) {
      const last = arr[arr.length - 1];
      if (q.prevClose !== last && Math.abs(q.prevClose / last - 1) < 0.05) {
        if (closes === d.closes) closes = { ...closes };
        closes[code] = arr.slice(0, -1).concat(q.prevClose);
        changed = true;
      }
    }
  }
  return changed ? { ...d, live, closes, asOf: Date.now() } : d;
}

/** Loads history + live quotes. Never rejects: falls back to sample data if the APIs are down. */
export async function loadMarket(): Promise<MarketData> {
  const today = todayISO();
  const [hist, live] = await Promise.all([
    loadHistory(today).catch(() => null),
    fetchLive().catch(() => ({}) as LiveUpdate),
  ]);
  if (!hist) return sampleMarket();

  const n = hist.dates.length;
  const closes = { ...hist.closes };
  const sources = { ...hist.sources };
  const base: Record<string, number> = {};
  CODES.forEach((c) => {
    if (!closes[c]) {
      // currency without real history: sample series ending at the current quote, if any
      const end = live[c]?.value ?? BY[c].sample.rate;
      closes[c] = sampleCloses(BY[c], n, end);
      sources[c] = 'sample';
    }
    base[c] = closes[c][n - 1];
  });

  return applyLive({ dates: hist.dates, closes, sources, live: base, sample: false, asOf: Date.now() }, live);
}
