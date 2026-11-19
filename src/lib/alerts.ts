import type { Alert } from '../components/types';
import { BY } from './currencies';
import { fmt, nf } from './format';
import { t } from './i18n';
import type { MarketData } from './rates';

/** Status line for the alert on `code` in the current base (or null). */
export function alertInfo(data: MarketData, alerts: Record<string, Alert>, code: string, base: string) {
  const a = alerts[code];
  if (!a || a.base !== base) return null;
  const v = data.live[a.base] / data.live[code];
  const T = t();
  const word = T.alertWord[a.dir];
  if (a.fired) return { cls: 'fired', text: T.alertFired(word, `${BY[a.base].sym} ${fmt(a.target)}`) };
  const dist = Math.abs(a.target / v - 1) * 100;
  return { cls: '', text: T.alertPending(word, fmt(a.target), nf(2).format(dist)) };
}

/** Checks alerts against current quotes; returns the ones that fired. */
export function checkAlerts(data: MarketData, alerts: Record<string, Alert>) {
  const fired: { code: string; text: string }[] = [];
  let next: Record<string, Alert> | null = null;
  for (const [code, a] of Object.entries(alerts)) {
    if (a.fired || !data.live[code] || !data.live[a.base]) continue;
    const v = data.live[a.base] / data.live[code];
    if ((a.dir === 'above' && v >= a.target) || (a.dir === 'below' && v <= a.target)) {
      next ??= { ...alerts };
      next[code] = { ...a, fired: true };
      const sym = BY[a.base].sym;
      fired.push({
        code,
        text: t().alertCrossed(`${code}/${a.base}`, a.dir, `${sym} ${fmt(a.target)}`, `${sym} ${fmt(v)}`),
      });
    }
  }
  return { next, fired };
}
