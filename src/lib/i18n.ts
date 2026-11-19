// Interface strings and routes for each locale. Each page load renders one locale (the app is a single
// client island per page), so the current locale is module state set once by <App> before rendering.

import type { Currency } from './currencies';

export type Locale = 'pt' | 'en';
export const LOCALES: Locale[] = ['pt', 'en'];

let current: Locale = 'pt';
export const setLocale = (l: Locale) => {
  current = l;
};
export const getLocale = () => current;

/** BCP 47 tag for Intl. */
export const intlTag = (l: Locale = current) => (l === 'pt' ? 'pt-BR' : 'en-US');

// ---------- routes ----------

export const homePath = (l: Locale = current) => (l === 'pt' ? '/' : '/en/');
export const detailPath = (code: string, l: Locale = current) =>
  l === 'pt' ? `/moeda/${code.toLowerCase()}` : `/en/currency/${code.toLowerCase()}`;

/** Parses a pathname into locale, page and currency code (not validated). */
export function parsePath(path: string): { locale: Locale; page: 'home' | 'detail'; code?: string } {
  const en = /^\/en(\/|$)/.test(path);
  const m = (en ? /^\/en\/currency\/([a-z]{3})\/?$/i : /^\/moeda\/([a-z]{3})\/?$/i).exec(path);
  return { locale: en ? 'en' : 'pt', page: m ? 'detail' : 'home', code: m?.[1].toUpperCase() };
}

// ---------- currency names ----------

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Display name (titles, cards, lists). */
export const cname = (c: Currency, l: Locale = current) => (l === 'pt' ? c.name : cap(c.en));

/** "One US dollar" / "Um dólar americano". */
export const lede = (c: Currency, l: Locale = current) =>
  l === 'pt' ? (c.fem ? 'Uma ' : 'Um ') + c.name.charAt(0).toLowerCase() + c.name.slice(1) : `One ${c.en}`;

/** Name as used mid-sentence: "Real brasileiro" / "Brazilian real", "euro". */
export const inSentence = (c: Currency, l: Locale = current) => (l === 'pt' ? c.name : c.en);

// ---------- strings ----------

const pt = {
  brandTagline: 'As moedas do mundo, vistas de onde você está.',
  titleHome: 'Câmbio — as moedas do mundo, vistas de onde você está',
  description:
    'As moedas do mundo, vistas de onde você está. Cotações ao vivo, câmbio cruzado, conversor e alertas de preço.',
  detailDescription: (name: string, code: string) =>
    `Cotação, histórico de 1 ano, faixa de 52 semanas e conversões de ${name} (${code}).`,
  skip: 'Pular para o conteúdo',

  months: ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'],
  monthsLong: [
    'janeiro',
    'fevereiro',
    'março',
    'abril',
    'maio',
    'junho',
    'julho',
    'agosto',
    'setembro',
    'outubro',
    'novembro',
    'dezembro',
  ],
  weekdays: ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'],
  longDate: (wd: string, day: number, month: string, year: number) => `${wd}, ${day} de ${month} de ${year}`,
  dayMonth: (day: string, month: string) => `${day} ${month}`,
  today: 'Hoje',

  // header
  edition: 'Nº',
  status: { live: 'Ao vivo', sample: 'Exemplo', offline: 'Offline' },
  themeToLight: 'Ativar modo claro',
  themeToDark: 'Ativar modo escuro',
  langSwitch: 'Read in English',
  marketsLabel: 'Horário dos mercados',
  cities: { Tokyo: 'Tóquio', London: 'Londres', 'New York': 'Nova York', 'São Paulo': 'São Paulo' } as Record<
    string,
    string
  >,
  open: 'Aberto',
  closed: 'Fechado',
  closesIn: (d: string) => `Fecha em ${d}`,
  opensIn: (d: string) => `Abre em ${d}`,
  opensMonday: (t: string) => `Abre segunda às ${t}`,
  opensTomorrow: (t: string) => `Abre amanhã às ${t}`,
  tickerLabel: 'Cotações em tempo real',
  tickerPause: 'Pausar rolagem das cotações',
  tickerResume: 'Retomar rolagem das cotações',

  // base selector
  pov: 'Ponto de vista',
  baseCurrency: 'Moeda base',
  seenFrom: (c: Currency) => `Valores vistos a partir ${c.fem ? 'da' : 'do'}`,
  closeSelector: 'Fechar seletor',
  searchLabel: 'Buscar moeda',
  searchPlaceholder: 'Buscar por nome ou código',
  noResults: 'Nenhuma moeda encontrada.',
  shortcuts: 'Atalhos',

  // featured
  featuredLabel: 'Moeda em destaque',
  featured: 'Em destaque',
  worthToday: (lede: string) => `${lede} vale hoje`,
  sinceClose: 'desde o fechamento',
  close: 'Fechamento',
  inverse: 'Inverso',
  high7: 'Máx. 7d',
  low7: 'Mín. 7d',
  fullPage: (code: string) => `Página completa de ${code}`,
  sevenSessions: 'Sete sessões',
  chartRole: 'gráfico',
  chartSummary: (
    pair: string,
    span: string,
    from: string,
    fromDate: string,
    to: string,
    chg: string,
    lo: string,
    hi: string,
  ) => `${pair}, ${span}: de ${from} em ${fromDate} a ${to} hoje, ${chg}. Mínima ${lo}, máxima ${hi}.`,
  lastSevenSessions: 'últimas sete sessões',
  pairIn: (x: string, b: string) => `${x} em ${b}`,

  // market
  marketLabel: 'Principais moedas',
  market: 'Mercado',
  valuesIn: (b: string) => `Valores em ${b}`,
  worldFrom: (c: Currency) => `O mundo visto a partir ${c.fem ? 'da' : 'do'}`,
  pickHint: 'Selecione uma moeda para colocá-la em destaque.',
  viewLabel: 'Visualização',
  views: { grid: 'Grade', list: 'Lista', matrix: 'Matriz' },
  feature: (name: string) => `Destacar ${name}`,
  pinTop: (code: string) => `Fixar ${code} no topo`,
  alertFor: (code: string) => `Alerta de preço para ${code}`,
  details: 'Detalhes',
  thCurrency: 'Moeda',
  thValueIn: (b: string) => `Valor em ${b}`,
  thDay: 'Dia',
  th7d: '7 dias',
  thTrend: 'Tendência',
  openAction: 'Abrir',
  openPage: (code: string) => `Abrir página de ${code}`,
  matrixCaption: 'Câmbio cruzado: valor de 1 unidade da moeda da linha em cada moeda da coluna',
  matrixCorner: '1 unidade de ↓ em →',
  matrixLegend: 'Cor indica a variação do par no dia',
  matrixUp: (p: string) => `Alta acima de ${p}`,
  matrixDown: (p: string) => `Queda abaixo de ${p}`,

  // alerts
  notifyWhen: 'Avisar quando',
  notifyWhenTail: 'ficar',
  alertDirLabel: 'Direção do alerta',
  above: 'Acima de',
  below: 'Abaixo de',
  targetIn: (b: string) => `Valor-alvo em ${b}`,
  save: 'Salvar',
  remove: 'Remover',
  cancel: 'Cancelar',
  alertWord: { above: 'acima de', below: 'abaixo de' },
  alertFired: (word: string, target: string) => `Alerta disparado · ${word} ${target}`,
  alertPending: (word: string, target: string, dist: string) => `Alerta ${word} ${target} · faltam ${dist}%`,
  alertCrossed: (pair: string, dir: 'above' | 'below', target: string, now: string) =>
    `${pair}${dir === 'above' ? ' passou de ' : ' caiu abaixo de '}${target}. Agora vale ${now}.`,
  priceAlert: 'Alerta de preço',
  closeToast: 'Fechar aviso',

  // converter
  convLabel: 'Conversor rápido',
  converter: 'Conversor',
  panelRate: 'Taxa do painel',
  youHave: 'Você tem',
  youGet: 'Você recebe',
  fromCurrency: 'Moeda de origem',
  toCurrency: 'Moeda de destino',
  swap: 'Inverter moedas',
  quickAmounts: 'Valores rápidos',

  // detail
  detailLabel: 'Detalhe da moeda',
  navLabel: 'Navegação',
  dashboard: 'Painel',
  crumb: 'Painel / Moedas /',
  pinned: 'Fixada',
  pin: 'Fixar',
  editAlert: 'Editar alerta',
  createAlert: 'Criar alerta',
  source: 'Fonte:',
  sources: { fixed: 'fixo', ECB: 'BCE', AwesomeAPI: 'AwesomeAPI', Binance: 'Binance', sample: 'exemplo' },
  onDay: 'no dia',
  range52: 'Faixa de 52 semanas',
  periodOpen: 'Abertura do período',
  periodHigh: 'Máx. do período',
  periodLow: 'Mín. do período',
  annualVol: 'Volatilidade anual',
  change7d: 'Variação 7d',
  history: 'Histórico',
  inPeriod: 'no período',
  periodLabel: 'Período do gráfico',
  rangeBtn: { '1M': '1M', '6M': '6M', '1A': '1A' },
  rangeLabel: { '1M': '1 mês', '6M': '6 meses', '1A': '1 ano' },
  quickConversions: 'Conversões rápidas',
  seenFromOthers: (code: string) => `${code} visto de outras moedas`,
  tapToSwitch: 'Toque para trocar a base',

  // loading / footer
  loading: 'Carregando cotações',
  sampleNote: 'As APIs de câmbio não responderam: exibindo cotações ilustrativas geradas localmente.',
  sourcesNote:
    'Cotações de referência do BCE (Frankfurter), AwesomeAPI e Binance. Informativo; não use para operações.',
  someSample: ' Algumas séries usam dados de exemplo.',
  sourcesShort: 'BCE · AwesomeAPI · Binance',
  typographyLbl: 'Tipografia',
  typography: 'Archivo em toda a interface, com pesos e larguras variáveis.',
  updatesLbl: 'Atualização',
  updatesSample: 'Simulada a cada 3 segundos.',
  updatesLive: 'Moedas e metais a cada 60 s, cripto em tempo real.',
  lastAt: (t: string) => ` Última às ${t}.`,
};

type Dict = typeof pt;

const en: Dict = {
  brandTagline: 'The world’s currencies, seen from where you stand.',
  titleHome: 'Câmbio — the world’s currencies, seen from where you stand',
  description:
    'The world’s currencies, seen from where you stand. Live rates, cross rates, a converter and price alerts.',
  detailDescription: (name, code) => `${name} (${code}) rate, 1-year history, 52-week range and conversions.`,
  skip: 'Skip to content',

  months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  monthsLong: [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ],
  weekdays: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  longDate: (wd, day, month, year) => `${wd}, ${month} ${day}, ${year}`,
  dayMonth: (day, month) => `${month} ${day}`,
  today: 'Today',

  edition: 'No.',
  status: { live: 'Live', sample: 'Sample', offline: 'Offline' },
  themeToLight: 'Switch to light mode',
  themeToDark: 'Switch to dark mode',
  langSwitch: 'Ler em português',
  marketsLabel: 'Market hours',
  cities: { Tokyo: 'Tokyo', London: 'London', 'New York': 'New York', 'São Paulo': 'São Paulo' },
  open: 'Open',
  closed: 'Closed',
  closesIn: (d) => `Closes in ${d}`,
  opensIn: (d) => `Opens in ${d}`,
  opensMonday: (t) => `Opens Monday at ${t}`,
  opensTomorrow: (t) => `Opens tomorrow at ${t}`,
  tickerLabel: 'Live quotes',
  tickerPause: 'Pause scrolling quotes',
  tickerResume: 'Resume scrolling quotes',

  pov: 'Point of view',
  baseCurrency: 'Base currency',
  seenFrom: () => 'Values seen from the',
  closeSelector: 'Close selector',
  searchLabel: 'Search currency',
  searchPlaceholder: 'Search by name or code',
  noResults: 'No currency found.',
  shortcuts: 'Shortcuts',

  featuredLabel: 'Featured currency',
  featured: 'Featured',
  worthToday: (lede) => `${lede} is worth today`,
  sinceClose: 'since the close',
  close: 'Close',
  inverse: 'Inverse',
  high7: '7d high',
  low7: '7d low',
  fullPage: (code) => `Full ${code} page`,
  sevenSessions: 'Seven sessions',
  chartRole: 'chart',
  chartSummary: (pair, span, from, fromDate, to, chg, lo, hi) =>
    `${pair}, ${span}: from ${from} on ${fromDate} to ${to} today, ${chg}. Low ${lo}, high ${hi}.`,
  lastSevenSessions: 'last seven sessions',
  pairIn: (x, b) => `${x} in ${b}`,

  marketLabel: 'Main currencies',
  market: 'Market',
  valuesIn: (b) => `Values in ${b}`,
  worldFrom: () => 'The world seen from the',
  pickHint: 'Select a currency to feature it.',
  viewLabel: 'View',
  views: { grid: 'Grid', list: 'List', matrix: 'Matrix' },
  feature: (name) => `Feature ${name}`,
  pinTop: (code) => `Pin ${code} to the top`,
  alertFor: (code) => `Price alert for ${code}`,
  details: 'Details',
  thCurrency: 'Currency',
  thValueIn: (b) => `Value in ${b}`,
  thDay: 'Day',
  th7d: '7 days',
  thTrend: 'Trend',
  openAction: 'Open',
  openPage: (code) => `Open ${code} page`,
  matrixCaption: 'Cross rates: value of 1 unit of the row currency in each column currency',
  matrixCorner: '1 unit of ↓ in →',
  matrixLegend: 'Color shows the pair’s change today',
  matrixUp: (p) => `Up more than ${p}`,
  matrixDown: (p) => `Down more than ${p}`,

  notifyWhen: 'Notify me when',
  notifyWhenTail: 'is',
  alertDirLabel: 'Alert direction',
  above: 'Above',
  below: 'Below',
  targetIn: (b) => `Target value in ${b}`,
  save: 'Save',
  remove: 'Remove',
  cancel: 'Cancel',
  alertWord: { above: 'above', below: 'below' },
  alertFired: (word, target) => `Alert triggered · ${word} ${target}`,
  alertPending: (word, target, dist) => `Alert ${word} ${target} · ${dist}% to go`,
  alertCrossed: (pair, dir, target, now) =>
    `${pair}${dir === 'above' ? ' rose above ' : ' fell below '}${target}. Now at ${now}.`,
  priceAlert: 'Price alert',
  closeToast: 'Dismiss',

  convLabel: 'Quick converter',
  converter: 'Converter',
  panelRate: 'Dashboard rate',
  youHave: 'You have',
  youGet: 'You get',
  fromCurrency: 'From currency',
  toCurrency: 'To currency',
  swap: 'Swap currencies',
  quickAmounts: 'Quick amounts',

  detailLabel: 'Currency detail',
  navLabel: 'Navigation',
  dashboard: 'Dashboard',
  crumb: 'Dashboard / Currencies /',
  pinned: 'Pinned',
  pin: 'Pin',
  editAlert: 'Edit alert',
  createAlert: 'Create alert',
  source: 'Source:',
  sources: { fixed: 'fixed', ECB: 'ECB', AwesomeAPI: 'AwesomeAPI', Binance: 'Binance', sample: 'sample' },
  onDay: 'today',
  range52: '52-week range',
  periodOpen: 'Period open',
  periodHigh: 'Period high',
  periodLow: 'Period low',
  annualVol: 'Annual volatility',
  change7d: '7d change',
  history: 'History',
  inPeriod: 'over the period',
  periodLabel: 'Chart period',
  rangeBtn: { '1M': '1M', '6M': '6M', '1A': '1Y' },
  rangeLabel: { '1M': '1 month', '6M': '6 months', '1A': '1 year' },
  quickConversions: 'Quick conversions',
  seenFromOthers: (code) => `${code} seen from other currencies`,
  tapToSwitch: 'Tap to switch the base',

  loading: 'Loading quotes',
  sampleNote: 'The exchange-rate APIs did not respond: showing illustrative quotes generated locally.',
  sourcesNote:
    'Reference rates from the ECB (Frankfurter), AwesomeAPI and Binance. Informational only; not for trading.',
  someSample: ' Some series use sample data.',
  sourcesShort: 'ECB · AwesomeAPI · Binance',
  typographyLbl: 'Typography',
  typography: 'Archivo throughout, with variable weights and widths.',
  updatesLbl: 'Updates',
  updatesSample: 'Simulated every 3 seconds.',
  updatesLive: 'Currencies and metals every 60 s, crypto in real time.',
  lastAt: (t) => ` Last at ${t}.`,
};

export const DICT: Record<Locale, Dict> = { pt, en };

/** Strings for the current locale. */
export const t = () => DICT[current];
