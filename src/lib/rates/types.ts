/** All rates are "units of currency per 1 USD". The value of X in base B is rate[B] / rate[X]. */
export interface MarketData {
  /** Closed sessions (yyyy-mm-dd, ascending), all before today. */
  dates: string[];
  /** Closes aligned to `dates`. */
  closes: Record<string, number[]>;
  /** Current quote (today, live). */
  live: Record<string, number>;
  /** Where each currency came from. */
  sources: Record<string, SourceId>;
  /** true when no API responded and everything is generated locally. */
  sample: boolean;
  /** Time of the last live update (ms). */
  asOf: number;
}

export type SourceId = 'fixed' | 'ECB' | 'AwesomeAPI' | 'Binance' | 'sample';

export interface LiveQuote {
  value: number;
  /** Previous close reported by the live source, when available. */
  prevClose?: number;
}

export type LiveUpdate = Record<string, LiveQuote>;

export interface Observation {
  date: string;
  value: number;
}

/** UI label (pt-BR) for each source. */
export const SOURCE_LABEL: Record<SourceId, string> = {
  fixed: 'fixo',
  ECB: 'BCE',
  AwesomeAPI: 'AwesomeAPI',
  Binance: 'Binance',
  sample: 'exemplo',
};
