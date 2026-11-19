import { expect, test } from 'bun:test';
import { BY, CODES } from '../currencies';
import { parseISO } from '../format';
import { businessDays, hash, rng, sampleCloses, sampleMarket } from './sample';

test('rng is deterministic per seed', () => {
  const a = rng(42);
  const b = rng(42);
  const xs = [a(), a(), a()];
  expect([b(), b(), b()]).toEqual(xs);
  for (const x of xs) expect(x >= 0 && x < 1).toBe(true);
  expect(rng(43)()).not.toBe(xs[0]);
});

test('hash is stable', () => {
  expect(hash('BRL')).toBe(hash('BRL'));
  expect(hash('BRL')).not.toBe(hash('EUR'));
});

test('businessDays skips weekends and ends before the given day', () => {
  const days = businessDays(10, new Date(2026, 0, 12)); // Monday
  expect(days).toHaveLength(10);
  expect(days.at(-1)).toBe('2026-01-09'); // previous Friday
  for (const d of days) expect([0, 6]).not.toContain(parseISO(d).getDay());
  expect([...days].sort()).toEqual(days);
});

test('sampleCloses produces positive, finite values', () => {
  const s = sampleCloses(BY.BRL, 100, 5.5);
  expect(s).toHaveLength(100);
  for (const v of s) expect(v > 0 && Number.isFinite(v)).toBe(true);
  expect(sampleCloses(BY.USD, 5)).toEqual([1, 1, 1, 1, 1]);
});

test('sampleMarket covers every currency', () => {
  const m = sampleMarket(30);
  expect(m.sample).toBe(true);
  expect(m.dates).toHaveLength(30);
  for (const c of CODES) {
    expect(m.closes[c]).toHaveLength(30);
    expect(m.live[c]).toBeGreaterThan(0);
  }
});
