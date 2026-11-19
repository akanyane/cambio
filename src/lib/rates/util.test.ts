import { describe, expect, test } from 'bun:test';
import { align, isoInTz, isoMinusDays, todayISO } from './util';

test('todayISO formats a local date', () => {
  expect(todayISO(new Date(2026, 0, 9))).toBe('2026-01-09');
});

test('isoMinusDays crosses month and year boundaries', () => {
  expect(isoMinusDays('2026-03-01', 1)).toBe('2026-02-28');
  expect(isoMinusDays('2026-01-01', 1)).toBe('2025-12-31');
  expect(isoMinusDays('2026-01-10', 380)).toBe('2024-12-26');
});

test('isoInTz resolves the date in the given time zone', () => {
  const ms = Date.UTC(2026, 0, 10, 1, 0); // 01:00 UTC = 22:00 the day before in São Paulo
  expect(isoInTz(ms, 'America/Sao_Paulo')).toBe('2026-01-09');
  expect(isoInTz(ms, 'Asia/Tokyo')).toBe('2026-01-10');
});

describe('align', () => {
  const dates = ['2026-01-05', '2026-01-06', '2026-01-07', '2026-01-08'];
  test('forward-fills gaps and back-fills before the first observation', () => {
    const out = align(dates, [
      { date: '2026-01-07', value: 3 },
      { date: '2026-01-06', value: 2 },
    ]);
    expect(out).toEqual([2, 2, 3, 3]);
  });
  test('uses the latest observation on or before each date (weekends roll into Monday)', () => {
    const out = align(
      ['2026-01-09', '2026-01-12'],
      [
        { date: '2026-01-09', value: 1 },
        { date: '2026-01-10', value: 1.5 },
        { date: '2026-01-11', value: 1.7 },
      ],
    );
    expect(out).toEqual([1, 1.7]);
  });
  test('drops invalid values and returns null when nothing is left', () => {
    expect(align(dates, [{ date: '2026-01-05', value: 0 }])).toBeNull();
    expect(align(dates, [{ date: '2026-01-05', value: Number.NaN }])).toBeNull();
    expect(align(dates, [])).toBeNull();
  });
});
