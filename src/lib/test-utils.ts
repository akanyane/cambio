import type { MarketData } from './rates';

/** Small MarketData fixture: units per 1 USD, three closed sessions plus today's live quote. */
export function market(overrides: Partial<MarketData> = {}): MarketData {
  return {
    dates: ['2026-01-05', '2026-01-06', '2026-01-07'],
    closes: {
      USD: [1, 1, 1],
      BRL: [5, 5.2, 5.4],
      EUR: [0.9, 0.9, 0.8],
    },
    live: { USD: 1, BRL: 5.5, EUR: 0.85 },
    sources: { USD: 'fixed', BRL: 'AwesomeAPI', EUR: 'ECB' },
    sample: false,
    asOf: 0,
    ...overrides,
  };
}
