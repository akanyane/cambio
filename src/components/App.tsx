import { useCallback, useEffect, useRef, useState } from 'react';
import { checkAlerts } from '../lib/alerts';
import { BY, CODES } from '../lib/currencies';
import { clockStr, dir, fmt, parseAmt, pct } from '../lib/format';
import { useMarket, useOnline, usePersistent, usePrefersReducedMotion } from '../lib/hooks';
import { pairValue, series } from '../lib/model';
import type { MarketData } from '../lib/rates';
import { BaseSelector } from './BaseSelector';
import { Converter } from './Converter';
import { Detail } from './Detail';
import { Featured } from './Featured';
import { Header, Ticker } from './Header';
import { Close } from './Icons';
import { type AlertFormCtl, MarketSection, orderedCodes } from './Market';
import type { Alert, Draft, Motion, View } from './types';

type Page = 'home' | 'detail';
type Theme = 'light' | 'dark';

interface Props {
  initialPage?: Page;
  initialDetail?: string;
}

const pathFor = (page: Page, code: string) => (page === 'detail' ? `/moeda/${code.toLowerCase()}` : '/');
const parsePath = (p: string): { page: Page; code?: string } => {
  const m = /\/moeda\/([a-z]{3})\/?$/i.exec(p);
  const code = m?.[1].toUpperCase();
  return code && BY[code] ? { page: 'detail', code } : { page: 'home' };
};
const valid = (c: string, fb: string) => (BY[c] ? c : fb);
/** The viewed currency can't be the base itself. */
const notBase = (c: string, base: string) => (c === base ? (base === 'USD' ? 'EUR' : 'USD') : c);

export default function App({ initialPage = 'home', initialDetail = 'USD' }: Props) {
  const data = useMarket();
  const online = useOnline();
  const reduced = usePrefersReducedMotion();

  const [theme, setTheme] = usePersistent<Theme>('theme', () =>
    matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
  );
  const [curtain, setCurtain] = useState<string | null>(null);
  const [baseRaw, setBase] = usePersistent('base', 'BRL');
  const [featuredRaw, setFeatured] = usePersistent('featured', 'USD');
  const [view, setView] = usePersistent<View>('view', 'grid');
  const [pins, setPins] = usePersistent<string[]>('pins', ['USD', 'EUR']);
  const [alerts, setAlerts] = usePersistent<Record<string, Alert>>('alerts', {});
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState<Page>(initialPage);
  const [detailRaw, setDetail] = useState(valid(initialDetail, 'USD'));
  const [alertOpen, setAlertOpen] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>({ dir: 'above', val: '' });
  const [toast, setToast] = useState<string | null>(null);
  const [flash, setFlash] = useState<Record<string, string>>({});
  const [drawN, setDrawN] = useState(0);
  const [booted, setBooted] = useState(false);

  const base = valid(baseRaw, 'BRL');
  const featured = notBase(valid(featuredRaw, 'USD'), base);
  const detail = notBase(detailRaw, base);
  const motion: Motion = { booted, drawCls: drawN % 2 ? 'draw-b' : 'draw-a', rollCls: drawN % 2 ? 'roll-b' : 'roll-a' };

  // ---------- theme ----------
  useEffect(() => {
    const dark = theme === 'dark';
    document.documentElement.classList.toggle('dark', dark);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#0D1311' : '#ECEFE8');
  }, [theme]);

  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const curN = useRef(0);
  const flipTheme = () => {
    const to: Theme = theme === 'dark' ? 'light' : 'dark';
    if (reduced) {
      setTheme(to);
      return;
    }
    curN.current++;
    timers.current.forEach(clearTimeout);
    setCurtain(`${curN.current % 2 ? 'cur-a' : 'cur-b'} to-${to}`);
    timers.current = [setTimeout(() => setTheme(to), 400), setTimeout(() => setCurtain(null), 980)];
  };

  // ---------- entrance: digits start from 0 ----------
  const bootT = useRef<ReturnType<typeof setTimeout>>(undefined);
  const ready = data !== null;
  useEffect(() => {
    if (!ready) return;
    bootT.current = setTimeout(() => setBooted(true), 140);
    return () => clearTimeout(bootT.current);
  }, [ready]);
  const reboot = useCallback(() => {
    clearTimeout(bootT.current);
    setBooted(false);
    bootT.current = setTimeout(() => setBooted(true), 90);
  }, []);

  // ---------- navigation (History API) ----------
  const go = useCallback(
    (to: Page, code?: string, push = true) => {
      setPage(to);
      if (code) setDetail(code);
      setDrawN((n) => n + 1);
      setAlertOpen(null);
      setOpen(false);
      reboot();
      if (push) {
        const url = pathFor(to, code ?? detailRaw);
        if (location.pathname.replace(/\/$/, '') !== url.replace(/\/$/, '')) history.pushState(null, '', url);
        try {
          window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
        } catch {
          /* no scrolling */
        }
      }
    },
    [detailRaw, reduced, reboot],
  );

  useEffect(() => {
    const onPop = () => {
      const r = parsePath(location.pathname);
      go(r.page, r.code, false);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [go]);

  const pickBase = (code: string) => {
    setOpen(false);
    if (code === base) return;
    setBase(code);
    setDrawN((n) => n + 1);
    setAlertOpen(null);
  };

  // ---------- live updates: flash values that changed ----------
  const prevVals = useRef<{ base: string; vals: Record<string, number> } | null>(null);
  const flashN = useRef(0);
  const live = data?.live;
  useEffect(() => {
    if (!live) return;
    const vals: Record<string, number> = {};
    CODES.forEach((c) => {
      vals[c] = live[base] / live[c];
    });
    const prev = prevVals.current;
    prevVals.current = { base, vals };
    if (!prev || prev.base !== base) return;
    const suf = ++flashN.current % 2 ? '-a' : '-b';
    const f: Record<string, string> = {};
    CODES.forEach((c) => {
      if (c !== base && vals[c] !== prev.vals[c]) f[c] = (vals[c] > prev.vals[c] ? 'fl-up' : 'fl-dn') + suf;
    });
    if (Object.keys(f).length) setFlash(f);
  }, [live, base]);

  // ---------- alerts ----------
  useEffect(() => {
    if (!data) return;
    const { next, fired } = checkAlerts(data, alerts);
    if (!next) return;
    setAlerts(next);
    const text = fired[fired.length - 1].text;
    setToast(text);
    if ('Notification' in window && Notification.permission === 'granted' && document.hidden) {
      fired.forEach((f) => {
        try {
          new Notification('Alerta de preço · Câmbio', { body: f.text, icon: '/favicon.svg', tag: `alert-${f.code}` });
        } catch {
          /* not supported */
        }
      });
    }
    if ('vibrate' in navigator) navigator.vibrate?.([60, 40, 60]);
  }, [data, alerts, setAlerts]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 8000);
    return () => clearTimeout(t);
  }, [toast]);

  const openAlert = (code: string) => {
    if (!data) return;
    const a = alerts[code];
    const has = a && a.base === base;
    setAlertOpen(code);
    setDraft({ dir: has ? a.dir : 'above', val: fmt(has ? a.target : pairValue(data, code, base) * 1.01) });
  };

  const alertCtl: AlertFormCtl = {
    open: alertOpen,
    draft,
    setDraft,
    cancel: () => setAlertOpen(null),
    remove: () => {
      if (!alertOpen) return;
      const next = { ...alerts };
      delete next[alertOpen];
      setAlerts(next);
      setAlertOpen(null);
    },
    save: () => {
      const target = parseAmt(draft.val);
      if (alertOpen && target > 0) {
        setAlerts({ ...alerts, [alertOpen]: { base, dir: draft.dir, target, fired: false } });
        if ('Notification' in window && Notification.permission === 'default')
          Notification.requestPermission().catch(() => {});
      }
      setAlertOpen(null);
    },
  };

  const togglePin = (code: string) => setPins(pins.includes(code) ? pins.filter((p) => p !== code) : [...pins, code]);

  // ---------- tab title ----------
  useEffect(() => {
    if (!data) return;
    document.title =
      page === 'detail'
        ? `${detail}/${base} ${BY[base].sym} ${fmt(pairValue(data, detail, base))} · Câmbio`
        : 'Câmbio — as moedas do mundo, vistas de onde você está';
  }, [data, page, detail, base]);

  return (
    <div className={`cx ${theme === 'dark' ? 'dark' : ''}`}>
      <a className="skip" href="#main">
        Pular para o conteúdo
      </a>
      <header>
        <Header
          theme={theme}
          onToggleTheme={flipTheme}
          status={!online ? 'offline' : data && !data.sample ? 'live' : 'sample'}
        />
        {data ? <Ticker items={tickerItems(data, base, pins)} /> : <div className="ticker" />}
      </header>

      <main id="main" tabIndex={-1}>
        {!data && <Loading />}
        {data && page === 'home' && (
          <>
            <BaseSelector base={base} open={open} setOpen={setOpen} onPick={pickBase} />
            <Featured
              data={data}
              base={base}
              code={featured}
              flash={flash[featured]}
              motion={motion}
              onOpen={() => go('detail', featured)}
            />
            <MarketSection
              data={data}
              base={base}
              featured={featured}
              pins={pins}
              alerts={alerts}
              flash={flash}
              motion={motion}
              view={view}
              setView={setView}
              alertCtl={alertCtl}
              onFeature={setFeatured}
              onTogglePin={togglePin}
              onOpenAlert={(c) => (alertOpen === c ? setAlertOpen(null) : openAlert(c))}
              onOpen={(c) => go('detail', c)}
            />
            <Converter data={data} />
          </>
        )}
        {data && page === 'detail' && (
          <Detail
            data={data}
            base={base}
            code={detail}
            pins={pins}
            alerts={alerts}
            flash={flash[detail]}
            motion={motion}
            alertCtl={alertCtl}
            onBack={() => go('home')}
            onTogglePin={() => togglePin(detail)}
            onToggleAlert={() => (alertOpen === detail ? setAlertOpen(null) : openAlert(detail))}
            onPickBase={pickBase}
            onRedraw={() => setDrawN((n) => n + 1)}
          />
        )}
      </main>

      <Colophon data={data} />

      {toast && (
        <div className="toast" role="status">
          <span className="toast-mark" aria-hidden="true" />
          <div className="toast-body">
            <span className="lbl">Alerta de preço</span>
            <p>{toast}</p>
          </div>
          <button type="button" className="toast-x" onClick={() => setToast(null)} aria-label="Fechar aviso">
            <Close />
          </button>
        </div>
      )}
      {curtain && <div className={`curtain ${curtain}`} aria-hidden="true" />}
    </div>
  );
}

function tickerItems(data: MarketData, base: string, pins: string[]) {
  return orderedCodes(base, pins).map((c) => {
    const s = series(data, c, base, 2);
    const ch = s[1] / s[0] - 1;
    return { pair: `${c}/${base}`, val: fmt(s[1]), chg: pct(ch), dir: dir(ch) };
  });
}

function Loading() {
  return (
    <section className="loading" aria-live="polite">
      <div className="wrap">
        <div className="sh">
          <span className="sh-n">··</span>
          <span>Carregando cotações</span>
          <span className="sh-r">BCE · AwesomeAPI · Binance</span>
        </div>
        <div className="bar" aria-hidden="true" />
      </div>
    </section>
  );
}

function Colophon({ data }: { data: MarketData | null }) {
  const sample = data?.sample;
  const anySample = data && Object.values(data.sources).includes('sample');
  return (
    <footer className="colo">
      <div className="wrap colo-in">
        <div>
          <div className="colo-word">Câmbio</div>
          <p>
            {sample
              ? 'As APIs de câmbio não responderam: exibindo cotações ilustrativas geradas localmente.'
              : 'Cotações de referência do BCE (Frankfurter), AwesomeAPI e Binance. Informativo; não use para operações.'}
            {!sample && anySample && ' Algumas séries usam dados de exemplo.'}
          </p>
        </div>
        <div>
          <span className="lbl">Tipografia</span>
          <p>Archivo em toda a interface, com pesos e larguras variáveis.</p>
        </div>
        <div>
          <span className="lbl">Atualização</span>
          <p className="num">
            {sample ? 'Simulada a cada 3 segundos.' : 'Moedas e metais a cada 60 s, cripto em tempo real.'}
            {data && ` Última às ${clockStr(new Date(data.asOf))}.`}
          </p>
        </div>
      </div>
    </footer>
  );
}
