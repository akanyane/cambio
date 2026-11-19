// Frankfurter — taxas de referência do Banco Central Europeu, diárias, sem chave.
// https://frankfurter.dev
import { getJSON } from './util';

const API = 'https://api.frankfurter.dev/v1';

export const FRANKFURTER_CODES = [
  'BRL',
  'EUR',
  'GBP',
  'JPY',
  'CHF',
  'CAD',
  'AUD',
  'CNY',
  'MXN',
  'KRW',
  'INR',
  'SEK',
  'NOK',
  'ZAR',
  'SGD',
  'HKD',
  'NZD',
];

interface SeriesResp {
  rates: Record<string, Record<string, number>>;
}
interface LatestResp {
  date: string;
  rates: Record<string, number>;
}

/** Série diária (dias úteis) a partir de `start`, base USD. */
export async function fetchFrankfurterSeries(start: string, codes = FRANKFURTER_CODES) {
  const j = await getJSON<SeriesResp>(`${API}/${start}..?base=USD&symbols=${codes.join(',')}`, 20000);
  const dates = Object.keys(j.rates).sort();
  const series: Record<string, { date: string; value: number }[]> = {};
  codes.forEach((c) => {
    series[c] = dates.filter((d) => j.rates[d][c] != null).map((d) => ({ date: d, value: j.rates[d][c] }));
  });
  return { dates, series };
}

export async function fetchFrankfurterLatest(codes = FRANKFURTER_CODES) {
  return getJSON<LatestResp>(`${API}/latest?base=USD&symbols=${codes.join(',')}`);
}
