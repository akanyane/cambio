import { describe, expect, test } from 'bun:test';
import type { Alert } from '../components/types';
import { alertInfo, checkAlerts } from './alerts';
import { market } from './test-utils';

// in BRL: 1 USD = 5.5, 1 EUR = 5.5 / 0.85 ≈ 6.4706
const d = market();

describe('checkAlerts', () => {
  test('fires an "above" alert once the target is crossed', () => {
    const alerts: Record<string, Alert> = { USD: { base: 'BRL', dir: 'above', target: 5.4, fired: false } };
    const { next, fired } = checkAlerts(d, alerts);
    expect(fired).toHaveLength(1);
    expect(fired[0].code).toBe('USD');
    expect(fired[0].text).toContain('USD/BRL passou de R$ 5,4000');
    expect(next?.USD.fired).toBe(true);
    expect(alerts.USD.fired).toBe(false); // input is not mutated
  });

  test('fires a "below" alert', () => {
    const { fired } = checkAlerts(d, { EUR: { base: 'BRL', dir: 'below', target: 6.5, fired: false } });
    expect(fired[0].text).toContain('caiu abaixo de');
  });

  test('ignores alerts that are not crossed or already fired', () => {
    const { next, fired } = checkAlerts(d, {
      USD: { base: 'BRL', dir: 'above', target: 6, fired: false },
      EUR: { base: 'BRL', dir: 'below', target: 7, fired: true },
    });
    expect(fired).toEqual([]);
    expect(next).toBeNull();
  });

  test('skips currencies without a quote', () => {
    const { fired } = checkAlerts(d, { JPY: { base: 'BRL', dir: 'above', target: 0, fired: false } });
    expect(fired).toEqual([]);
  });
});

describe('alertInfo', () => {
  test('shows the distance to the target', () => {
    const info = alertInfo(d, { USD: { base: 'BRL', dir: 'above', target: 6.05, fired: false } }, 'USD', 'BRL');
    expect(info).toEqual({ cls: '', text: 'Alerta acima de 6,0500 · faltam 10,00%' });
  });
  test('marks fired alerts', () => {
    const info = alertInfo(d, { USD: { base: 'BRL', dir: 'below', target: 6, fired: true } }, 'USD', 'BRL');
    expect(info?.cls).toBe('fired');
  });
  test('hides alerts set in another base', () => {
    expect(alertInfo(d, { USD: { base: 'EUR', dir: 'above', target: 1, fired: false } }, 'USD', 'BRL')).toBeNull();
  });
});
