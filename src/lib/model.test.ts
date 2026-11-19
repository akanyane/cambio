import { describe, expect, test } from 'bun:test';
import { pairValue, pathD, prevOf, rangeCount, scale, series, seriesDates, volatility } from './model';
import { todayISO } from './rates/util';
import { market } from './test-utils';

describe('pair math (units per USD)', () => {
  const d = market();
  test('pairValue is base / quote', () => {
    expect(pairValue(d, 'USD', 'BRL')).toBe(5.5);
    expect(pairValue(d, 'EUR', 'BRL')).toBeCloseTo(5.5 / 0.85, 12);
    expect(pairValue(d, 'BRL', 'BRL')).toBe(1);
  });
  test('prevOf uses the last close', () => {
    expect(prevOf(d, 'EUR', 'BRL')).toBeCloseTo(5.4 / 0.8, 12);
  });
});

describe('series', () => {
  const d = market();
  test('ends with the live value and has `count` points', () => {
    const s = series(d, 'USD', 'BRL', 3);
    expect(s).toEqual([5.2, 5.4, 5.5]);
  });
  test('pads with the first close when asking for more than available', () => {
    expect(series(d, 'USD', 'BRL', 6)).toEqual([5, 5, 5, 5.2, 5.4, 5.5]);
  });
  test('seriesDates lines up and ends today', () => {
    const dates = seriesDates(d, 3);
    expect(dates).toEqual(['2026-01-06', '2026-01-07', todayISO()]);
  });
});

test('rangeCount counts sessions inside the range plus today', () => {
  const now = new Date();
  const day = (offset: number) => todayISO(new Date(now.getFullYear(), now.getMonth(), now.getDate() - offset));
  const dates = [day(200), day(100), day(20), day(10), day(1)];
  const d = market({ dates });
  expect(rangeCount(d, '1M')).toBe(4); // 20, 10, 1 days ago + today
  expect(rangeCount(d, '6M')).toBe(5);
  expect(rangeCount(d, '1A')).toBe(6);
  expect(rangeCount(market({ dates: [day(400)] }), '1M')).toBe(2); // never fewer than 2
});

describe('scale', () => {
  test('maps min to the bottom and max to the top', () => {
    const { pts, y } = scale([1, 3, 2], 200, 100, 10);
    expect(pts.map((p) => p[0])).toEqual([0, 100, 200]);
    expect(y(1)).toBe(90);
    expect(y(3)).toBe(10);
  });
  test('handles a flat series without dividing by zero', () => {
    const { pts } = scale([2, 2, 2], 100, 50, 5);
    for (const [, py] of pts) expect(Number.isFinite(py)).toBe(true);
  });
});

test('pathD builds an SVG path', () => {
  expect(
    pathD([
      [0, 1],
      [2.25, 3.333],
    ]),
  ).toBe('M0.0 1.0 L2.3 3.3');
});

describe('volatility', () => {
  test('is zero for a constant series', () => {
    expect(volatility([5, 5, 5, 5])).toBe(0);
  });
  test('annualizes the standard deviation of log returns', () => {
    const r = Math.log(1.01);
    // alternating +1% / −1% → mean 0, stdev = ln(1.01)
    const s = [100, 101, 100, 101, 100];
    expect(volatility(s)).toBeCloseTo(r * Math.sqrt(252), 6);
  });
});
