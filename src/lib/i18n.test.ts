import { afterEach, describe, expect, test } from 'bun:test';
import { checkAlerts } from './alerts';
import { BY } from './currencies';
import { dayMonth, fmt, longDay, parseAmt, pct } from './format';
import { cname, DICT, detailPath, homePath, inSentence, lede, parsePath, setLocale } from './i18n';
import { market } from './test-utils';

afterEach(() => setLocale('pt'));

describe('routes', () => {
  test('paths per locale', () => {
    expect(homePath('pt')).toBe('/');
    expect(homePath('en')).toBe('/en/');
    expect(detailPath('BRL', 'pt')).toBe('/moeda/brl');
    expect(detailPath('BRL', 'en')).toBe('/en/currency/brl');
  });
  test('parsePath round-trips', () => {
    expect(parsePath('/')).toEqual({ locale: 'pt', page: 'home', code: undefined });
    expect(parsePath('/moeda/eur/')).toEqual({ locale: 'pt', page: 'detail', code: 'EUR' });
    expect(parsePath('/en')).toEqual({ locale: 'en', page: 'home', code: undefined });
    expect(parsePath('/en/currency/xau')).toEqual({ locale: 'en', page: 'detail', code: 'XAU' });
    expect(parsePath('/en/moeda/eur').page).toBe('home'); // routes don't mix languages
  });
});

describe('English locale', () => {
  test('numbers use en-US separators', () => {
    setLocale('en');
    expect(fmt(5432.1)).toBe('5,432.10');
    expect(pct(-0.0123)).toBe('−1.23%');
    expect(pct(0)).toBe('0.00%');
  });

  test('typed amounts are parsed in the current locale', () => {
    setLocale('en');
    expect(parseAmt('1,234.56')).toBe(1234.56);
    setLocale('pt');
    expect(parseAmt('1.234,56')).toBe(1234.56);
  });

  test('dates', () => {
    setLocale('en');
    expect(dayMonth('2026-03-07')).toBe('Mar 07');
    expect(longDay('2026-12-25')).toBe('Dec 25 2026');
  });

  test('currency names', () => {
    expect(cname(BY.EUR, 'en')).toBe('Euro');
    expect(inSentence(BY.EUR, 'en')).toBe('euro');
    expect(lede(BY.USD, 'en')).toBe('One US dollar');
    expect(lede(BY.XAU, 'pt')).toBe('Uma onça de ouro');
  });

  test('alert messages', () => {
    setLocale('en');
    const { fired } = checkAlerts(market(), { USD: { base: 'BRL', dir: 'above', target: 5.4, fired: false } });
    expect(fired[0].text).toBe('USD/BRL rose above R$ 5.4000. Now at R$ 5.5000.');
  });
});

test('both dictionaries have the same keys', () => {
  const keys = (o: object) => Object.keys(o).sort();
  expect(keys(DICT.en)).toEqual(keys(DICT.pt));
  expect(keys(DICT.en.status)).toEqual(keys(DICT.pt.status));
  expect(DICT.en.months).toHaveLength(12);
  expect(DICT.en.weekdays).toHaveLength(7);
});
