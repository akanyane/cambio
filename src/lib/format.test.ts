import { describe, expect, test } from 'bun:test';
import { BY } from './currencies';
import { dayMonth, dir, fmt, fmtSigned, fold, longDay, money, monthYear, parseAmt, pct } from './format';
import { lede } from './i18n';

describe('fmt', () => {
  test('picks decimals by magnitude', () => {
    expect(fmt(5432.1)).toBe('5.432,10');
    expect(fmt(5.4321)).toBe('5,4321');
    expect(fmt(0.001234)).toBe('0,001234');
    expect(fmt(0.00001055)).toBe('0,00001055');
  });
});

test('money uses 2 decimals from 1 upwards', () => {
  expect(money(1234.5)).toBe('1.234,50');
  expect(money(0.5)).toBe('0,5000');
});

test('fmtSigned uses a real minus sign', () => {
  expect(fmtSigned(0.25)).toBe('+0,2500');
  expect(fmtSigned(-0.25)).toBe('−0,2500');
  expect(fmtSigned(0)).toBe('0,00000000');
});

describe('pct', () => {
  test('formats signed percentages', () => {
    expect(pct(0.0123)).toBe('+1,23%');
    expect(pct(-0.0123)).toBe('−1,23%');
  });
  test('collapses tiny and invalid values to zero', () => {
    expect(pct(0.00001)).toBe('0,00%');
    expect(pct(Number.NaN)).toBe('0,00%');
    expect(pct(Number.POSITIVE_INFINITY)).toBe('0,00%');
  });
});

test('dir has a dead zone around zero', () => {
  expect(dir(0.001)).toBe('up');
  expect(dir(-0.001)).toBe('dn');
  expect(dir(0.00001)).toBe('');
});

describe('parseAmt', () => {
  test('reads pt-BR numbers', () => {
    expect(parseAmt('1.234,56')).toBe(1234.56);
    expect(parseAmt(' 1 000 ')).toBe(1000);
    expect(parseAmt('0,5')).toBe(0.5);
  });
  test('returns 0 for garbage', () => {
    expect(parseAmt('abc')).toBe(0);
    expect(parseAmt('')).toBe(0);
  });
});

test('fold strips accents and case', () => {
  expect(fold('Iene Japonês')).toBe('iene japones');
  expect(fold('CÂMBIO')).toBe('cambio');
});

test('lede respects grammatical gender', () => {
  expect(lede(BY.GBP)).toBe('Uma libra esterlina');
  expect(lede(BY.USD)).toBe('Um dólar americano');
});

test('date helpers', () => {
  expect(dayMonth('2026-03-07')).toBe('07 mar');
  expect(longDay('2026-12-25')).toBe('25 dez 2026');
  expect(monthYear('2026-08-01')).toBe('ago 26');
});
