import { afterEach, describe, expect, mock, test } from 'bun:test';
import { market } from '../test-utils';
import { fetchAwesomeDaily, fetchAwesomeLive } from './awesome';
import { fetchCryptoDaily, fetchCryptoPrices } from './binance';
import { applyLive, loadMarket } from './index';
import { isoMinusDays } from './util';

const realFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = realFetch;
});

function stubFetch(handler: (url: string) => unknown) {
  globalThis.fetch = mock(async (input: string | URL | Request) => {
    const body = handler(String(input));
    if (body instanceof Error) throw body;
    return new Response(JSON.stringify(body), { status: 200 });
  }) as unknown as typeof fetch;
}

describe('applyLive', () => {
  test('updates live quotes', () => {
    const d = market();
    const next = applyLive(d, { BRL: { value: 5.6 } });
    expect(next.live.BRL).toBe(5.6);
    expect(d.live.BRL).toBe(5.5); // not mutated
  });

  test('replaces the last close with the source previous close when within 5%', () => {
    const next = applyLive(market(), { BRL: { value: 5.6, prevClose: 5.45 } });
    expect(next.closes.BRL).toEqual([5, 5.2, 5.45]);
  });

  test('ignores a previous close that is too far off', () => {
    const next = applyLive(market(), { BRL: { value: 5.6, prevClose: 6.5 } });
    expect(next.closes.BRL).toEqual([5, 5.2, 5.4]);
  });

  test('ignores invalid quotes and returns the same object when nothing changes', () => {
    const d = market();
    expect(applyLive(d, { BRL: { value: 0 }, EUR: { value: Number.NaN } })).toBe(d);
    expect(applyLive(d, { BRL: { value: 5.5 } })).toBe(d);
  });
});

describe('AwesomeAPI parsing', () => {
  test('live: previous close is bid − varBid', async () => {
    stubFetch(() => ({ USDBRL: { bid: '5.50', varBid: '0.05', timestamp: '0' } }));
    const out = await fetchAwesomeLive(['BRL', 'ARS']);
    expect(out.BRL.value).toBe(5.5);
    expect(out.BRL.prevClose).toBeCloseTo(5.45, 10);
    expect(out.ARS).toBeUndefined();
  });

  test('metals are quoted as XXX-USD and converted to units per USD', async () => {
    let url = '';
    stubFetch((u) => {
      url = u;
      return { XAUUSD: { bid: '4000', varBid: '-100', timestamp: '0' } };
    });
    const out = await fetchAwesomeLive(['XAU']);
    expect(url).toContain('/last/XAU-USD');
    expect(out.XAU.value).toBe(1 / 4000);
    expect(out.XAU.prevClose).toBe(1 / 4100);
  });

  test('daily: keeps the latest quote per São Paulo day', async () => {
    const ts = (iso: string) => String(Date.parse(iso) / 1000);
    stubFetch(() => [
      { bid: '1400', varBid: '0', timestamp: ts('2026-01-09T15:00:00-03:00') },
      { bid: '1410', varBid: '0', timestamp: ts('2026-01-09T23:30:00-03:00') }, // already Jan 10 in UTC
      { bid: '1420', varBid: '0', timestamp: ts('2026-01-10T10:00:00-03:00') },
    ]);
    const out = await fetchAwesomeDaily('ARS');
    expect(out.sort((a, b) => a.date.localeCompare(b.date))).toEqual([
      { date: '2026-01-09', value: 1410 },
      { date: '2026-01-10', value: 1420 },
    ]);
  });
});

describe('Binance', () => {
  test('prices for every crypto asset come from one request', async () => {
    let url = '';
    stubFetch((u) => {
      url = u;
      return [
        { symbol: 'BTCUSDT', price: '90000' },
        { symbol: 'ETHUSDT', price: '1800' },
        { symbol: 'SOLUSDT', price: '0' },
      ];
    });
    const out = await fetchCryptoPrices();
    expect(decodeURIComponent(url)).toContain('symbols=["BTCUSDT","ETHUSDT","SOLUSDT"]');
    expect(out).toEqual({ BTC: 90000, ETH: 1800 });
  });

  test('daily klines map to UTC dates and closes', async () => {
    stubFetch(() => [[Date.UTC(2026, 0, 9), '1', '2', '0.5', '1.5']]);
    expect(await fetchCryptoDaily('ETH')).toEqual([{ date: '2026-01-09', value: 1.5 }]);
  });
});

test('loadMarket falls back to sample data when every API fails', async () => {
  stubFetch(() => new Error('offline'));
  const m = await loadMarket();
  expect(m.sample).toBe(true);
  expect(m.live.USD).toBe(1);
});

test('loadMarket uses a stale cached history when the network is down', async () => {
  const store = new Map<string, string>();
  const ls = globalThis as unknown as { localStorage?: Pick<Storage, 'getItem' | 'setItem'> };
  const prev = ls.localStorage;
  ls.localStorage = { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => void store.set(k, v) };
  try {
    const { CODES } = await import('../currencies');
    const dates = Array.from({ length: 40 }, (_, i) => isoMinusDays('2025-02-10', 40 - i));
    const closes = Object.fromEntries(CODES.map((c) => [c, dates.map(() => (c === 'BRL' ? 5 : 1))]));
    store.set('cambio:history:v2', JSON.stringify({ dates, closes, sources: {}, day: '2025-02-10', at: 0 }));
    stubFetch(() => new Error('offline'));
    const m = await loadMarket();
    expect(m.sample).toBe(false);
    expect(m.live.BRL).toBe(5);
  } finally {
    ls.localStorage = prev;
  }
});
