import { useCallback, useEffect, useRef, useState } from 'react';
import { applyLive, fetchLive, loadMarket, type MarketData, sampleTick, subscribeBtc } from './rates';

const LIVE_POLL_MS = 60_000;
const BTC_THROTTLE_MS = 2_500;
const SAMPLE_TICK_MS = 3_200;

/** State persisted in localStorage (per browser). */
export function usePersistent<T>(key: string, initial: T | (() => T)) {
  const k = `cambio:${key}`;
  const [v, setV] = useState<T>(() => {
    try {
      const s = localStorage.getItem(k);
      if (s != null) return JSON.parse(s) as T;
    } catch {
      /* ignore */
    }
    return typeof initial === 'function' ? (initial as () => T)() : initial;
  });
  useEffect(() => {
    try {
      localStorage.setItem(k, JSON.stringify(v));
    } catch {
      /* ignore */
    }
  }, [k, v]);
  return [v, setV] as const;
}

/** Market data: initial load + live updates (polling, WebSocket or simulation). */
export function useMarket() {
  const [data, setData] = useState<MarketData | null>(null);
  const ready = data !== null;
  const sample = data?.sample ?? false;

  useEffect(() => {
    let alive = true;
    loadMarket().then((d) => {
      if (alive) setData(d);
    });
    return () => {
      alive = false;
    };
  }, []);

  const refresh = useCallback(() => {
    fetchLive()
      .then((u) => setData((d) => (d ? applyLive(d, u) : d)))
      .catch(() => {
        /* retry on the next cycle */
      });
  }, []);

  // fiat polling, paused while the tab is hidden
  useEffect(() => {
    if (!ready || sample) return;
    let iv: ReturnType<typeof setInterval> | undefined;
    const start = () => {
      clearInterval(iv);
      iv = setInterval(refresh, LIVE_POLL_MS);
    };
    const onVis = () => {
      if (document.hidden) clearInterval(iv);
      else {
        refresh();
        start();
      }
    };
    start();
    document.addEventListener('visibilitychange', onVis);
    return () => {
      clearInterval(iv);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [ready, sample, refresh]);

  // live BTC from Binance
  const lastBtc = useRef(0);
  useEffect(() => {
    if (!ready || sample) return;
    return subscribeBtc((usd) => {
      const now = Date.now();
      if (now - lastBtc.current < BTC_THROTTLE_MS || document.hidden) return;
      lastBtc.current = now;
      setData((d) => (d ? applyLive(d, { BTC: { value: 1 / usd } }) : d));
    });
  }, [ready, sample]);

  // sample mode: simulated ticks, as in the prototype
  useEffect(() => {
    if (!ready || !sample) return;
    const iv = setInterval(() => setData((d) => (d ? applyLive(d, sampleTick(d.live)) : d)), SAMPLE_TICK_MS);
    return () => clearInterval(iv);
  }, [ready, sample]);

  return data;
}

/** Clock that updates every second. */
export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const iv = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(iv);
  }, [intervalMs]);
  return now;
}

export function usePrefersReducedMotion() {
  const [r, setR] = useState(
    () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  useEffect(() => {
    const m = matchMedia('(prefers-reduced-motion: reduce)');
    const on = () => setR(m.matches);
    m.addEventListener('change', on);
    return () => m.removeEventListener('change', on);
  }, []);
  return r;
}
