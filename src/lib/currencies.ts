export interface Currency {
  code: string;
  name: string;
  /** Symbol shown before values (US$, R$…). */
  sym: string;
  /** Decorative glyph on the cards. */
  tile: string;
  /** Feminine grammatical gender in Portuguese ("da libra", "uma rupia"). */
  fem: boolean;
  kind: 'fiat' | 'crypto' | 'metal';
  /** Sample generator parameters (offline fallback). */
  sample: { rate: number; vol: number; drift: number };
}

// code, name (pt-BR), symbol, glyph, units per 1 USD (sample), daily volatility, drift, feminine
const RAW: [string, string, string, string, number, number, number, number][] = [
  ['USD', 'Dólar americano', 'US$', '$', 1, 0, 0, 0],
  ['BRL', 'Real brasileiro', 'R$', 'R$', 5.42, 0.0045, 0, 0],
  ['EUR', 'Euro', '€', '€', 0.8615, 0.003, 0, 0],
  ['GBP', 'Libra esterlina', '£', '£', 0.7582, 0.0032, 0, 1],
  ['JPY', 'Iene japonês', '¥', '¥', 151.84, 0.004, 0, 0],
  ['CHF', 'Franco suíço', 'Fr', 'Fr', 0.8027, 0.003, 0, 0],
  ['CAD', 'Dólar canadense', 'C$', 'C$', 1.3984, 0.0025, 0, 0],
  ['AUD', 'Dólar australiano', 'A$', 'A$', 1.5318, 0.0038, 0, 0],
  ['CNY', 'Yuan chinês', 'CN¥', '元', 7.124, 0.0012, 0, 0],
  ['ARS', 'Peso argentino', 'AR$', '$', 1418.5, 0.0035, 0.0018, 0],
  ['MXN', 'Peso mexicano', 'MX$', '$', 18.352, 0.0048, 0, 0],
  ['BTC', 'Bitcoin', '₿', '₿', 1 / 94820, 0.022, 0, 0],
  ['KRW', 'Won sul-coreano', '₩', '₩', 1392.4, 0.004, 0, 0],
  ['INR', 'Rupia indiana', '₹', '₹', 84.62, 0.0015, 0, 1],
  ['SEK', 'Coroa sueca', 'kr', 'kr', 9.412, 0.004, 0, 1],
  ['NOK', 'Coroa norueguesa', 'kr', 'kr', 10.86, 0.0042, 0, 1],
  ['ZAR', 'Rand sul-africano', 'R', 'R', 17.84, 0.005, 0, 0],
  ['SGD', 'Dólar de Singapura', 'S$', 'S$', 1.3065, 0.002, 0, 0],
  ['HKD', 'Dólar de Hong Kong', 'HK$', 'HK$', 7.781, 0.0004, 0, 0],
  ['NZD', 'Dólar neozelandês', 'NZ$', 'NZ$', 1.6982, 0.004, 0, 0],
  ['CLP', 'Peso chileno', 'CLP$', '$', 935.2, 0.0045, 0, 0],
  ['COP', 'Peso colombiano', 'COL$', '$', 4012.0, 0.0048, 0, 0],
  ['ETH', 'Ethereum', 'Ξ', 'Ξ', 1 / 1786, 0.03, 0, 0],
  ['SOL', 'Solana', 'SOL', '◎', 1 / 74.5, 0.04, 0, 0],
  // precious metals are quoted per troy ounce
  ['XAU', 'Onça de ouro', 'Au', 'Au', 1 / 3684, 0.01, 0, 1],
  ['XAG', 'Onça de prata', 'Ag', 'Ag', 1 / 44.5, 0.018, 0, 1],
];

const CRYPTO = new Set(['BTC', 'ETH', 'SOL']);
const METALS = new Set(['XAU', 'XAG']);

export const CURRENCIES: Currency[] = RAW.map((r) => ({
  code: r[0],
  name: r[1],
  sym: r[2],
  tile: r[3],
  fem: !!r[7],
  kind: CRYPTO.has(r[0]) ? 'crypto' : METALS.has(r[0]) ? 'metal' : 'fiat',
  sample: { rate: r[4], vol: r[5], drift: r[6] },
}));

export const BY: Record<string, Currency> = Object.fromEntries(CURRENCIES.map((c) => [c.code, c]));
export const CODES = CURRENCIES.map((c) => c.code);

export const GRID = [
  'USD',
  'EUR',
  'GBP',
  'JPY',
  'CHF',
  'CAD',
  'AUD',
  'CNY',
  'ARS',
  'MXN',
  'BRL',
  'BTC',
  'ETH',
  'SOL',
  'XAU',
  'XAG',
];
export const QUICK = ['BRL', 'USD', 'EUR', 'GBP', 'JPY'];
export const MATRIX = ['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CNY', 'CAD', 'BRL'];
export const VIEWS = ['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'BRL', 'CNY', 'ARS'];

export interface Market {
  city: string;
  tz: string;
  abbr: string;
  o: number;
  c: number;
}
export const MARKETS: Market[] = [
  { city: 'Tóquio', tz: 'Asia/Tokyo', abbr: 'JST', o: 9, c: 15 },
  { city: 'Londres', tz: 'Europe/London', abbr: 'GMT', o: 8, c: 16.5 },
  { city: 'Nova York', tz: 'America/New_York', abbr: 'ET', o: 9.5, c: 16 },
  { city: 'São Paulo', tz: 'America/Sao_Paulo', abbr: 'BRT', o: 10, c: 17 },
];
