/** Todas as taxas são "unidades da moeda por 1 USD". O valor de X na base B é rate[B] / rate[X]. */
export interface MarketData {
  /** Sessões fechadas (yyyy-mm-dd, crescente), todas anteriores a hoje. */
  dates: string[];
  /** Fechamentos alinhados a `dates`. */
  closes: Record<string, number[]>;
  /** Cotação atual (hoje, ao vivo). */
  live: Record<string, number>;
  /** De onde veio cada moeda. */
  sources: Record<string, SourceId>;
  /** true quando nenhuma API respondeu e tudo é gerado localmente. */
  sample: boolean;
  /** Momento da última atualização ao vivo (ms). */
  asOf: number;
}

export type SourceId = 'fixo' | 'BCE' | 'AwesomeAPI' | 'Binance' | 'exemplo';

export interface LiveQuote {
  value: number;
  /** Fechamento anterior informado pela fonte ao vivo, quando houver. */
  prevClose?: number;
}

export type LiveUpdate = Record<string, LiveQuote>;

export interface Observation {
  date: string;
  value: number;
}
