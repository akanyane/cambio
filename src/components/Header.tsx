import { MARKETS } from '../lib/currencies';
import { clockStr, DIA, MESL, p2 } from '../lib/format';
import { useNow } from '../lib/hooks';
import { Moon, Sun } from './Icons';

interface Props {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  live: boolean;
}

const WD: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
const dur = (h: number) => {
  const m = Math.round(h * 60);
  return `${Math.floor(m / 60)}h${p2(m % 60)}`;
};
const hm = (h: number) => `${p2(Math.floor(h))}:${p2(Math.round((h % 1) * 60))}`;

function marketRows(now: Date) {
  return MARKETS.map((m, i) => {
    let wd = 3,
      h = 12,
      mi = 0;
    try {
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: m.tz,
        hour12: false,
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit',
      }).formatToParts(now);
      const g = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
      wd = WD[g('weekday')];
      h = Number(g('hour')) % 24;
      mi = Number(g('minute'));
    } catch {
      /* fuso indisponível */
    }
    const t = h + mi / 60;
    const weekday = wd >= 1 && wd <= 5;
    const isOpen = weekday && t >= m.o && t < m.c;
    let note: string;
    if (isOpen) note = `Fecha em ${dur(m.c - t)}`;
    else if (weekday && t < m.o) note = `Abre em ${dur(m.o - t)}`;
    else if (wd === 5 || wd === 6) note = `Abre segunda às ${hm(m.o)}`;
    else note = `Abre amanhã às ${hm(m.o)}`;
    return {
      ...m,
      isOpen,
      note,
      time: `${p2(h)}:${p2(mi)}`,
      sL: (m.o / 24) * 100,
      sW: ((m.c - m.o) / 24) * 100,
      nowL: (t / 24) * 100,
      delay: 500 + i * 90,
    };
  });
}

export function Header({ theme, onToggleTheme, live }: Props) {
  const now = useNow();
  const start = new Date(now.getFullYear(), 0, 0);
  const edition = Math.floor((now.getTime() - start.getTime()) / 864e5);
  const longDate = `${DIA[now.getDay()]}, ${now.getDate()} de ${MESL[now.getMonth()]} de ${now.getFullYear()}`;
  const letters = ['C', 'â', 'm', 'b', 'i', 'o'];

  return (
    <div className="wrap">
      <div className="top lbl">
        <div className="top-l">
          <span className="ed">Nº {edition}</span>
          <span>{longDate}</span>
        </div>
        <div className="top-r">
          <span className={`live ${live ? '' : 'demo'}`}>
            <span className="dot" aria-hidden="true" />
            {live ? 'Ao vivo' : 'Exemplo'}
          </span>
          <span className="clock num">{clockStr(now)}</span>
          <button
            type="button"
            className="sq-btn"
            onClick={onToggleTheme}
            aria-label={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
          >
            {theme === 'dark' ? <Sun /> : <Moon />}
          </button>
        </div>
      </div>
      <div className="mast">
        <h1 className="word" aria-label="Câmbio">
          {letters.map((l, i) => {
            const Tag = i === 1 ? 'em' : 'span';
            return (
              <Tag key={l} className="l" style={{ animationDelay: `${80 + i * 60}ms` }}>
                {l}
              </Tag>
            );
          })}
          <sup>FX</sup>
        </h1>
        <p className="tagline">As moedas do mundo, vistas de onde você está.</p>
      </div>
      <div className="rule" aria-hidden="true" />
      <section className="mkts" aria-label="Horário dos mercados">
        {marketRows(now).map((m) => (
          <div key={m.city} className={`mkt ${m.isOpen ? 'on' : ''}`} style={{ animationDelay: `${m.delay}ms` }}>
            <div className="mkt-top">
              <span className="mkt-city">{m.city}</span>
              <span className={`mkt-st ${m.isOpen ? 'on' : ''}`}>
                <span className="sq" aria-hidden="true" />
                {m.isOpen ? 'Aberto' : 'Fechado'}
              </span>
            </div>
            <div className="mkt-time num">
              {m.time} <span className="lbl">{m.abbr}</span>
            </div>
            <div className="mkt-bar" aria-hidden="true">
              <span className="mkt-sess" style={{ left: `${m.sL.toFixed(2)}%`, width: `${m.sW.toFixed(2)}%` }} />
              <span className="mkt-now" style={{ left: `${m.nowL.toFixed(2)}%` }} />
            </div>
            <div className="mkt-note">{m.note}</div>
          </div>
        ))}
      </section>
    </div>
  );
}

export interface TickerItem {
  pair: string;
  val: string;
  chg: string;
  dir: string;
}

export function Ticker({ items }: { items: TickerItem[] }) {
  const all = items.concat(items);
  return (
    <section className="ticker" aria-label="Cotações em tempo real">
      <div className="track">
        {all.map((t, i) => (
          <span
            key={`${t.pair}-${i < items.length ? 'a' : 'b'}`}
            className="tk num"
            aria-hidden={i >= items.length || undefined}
          >
            <b>{t.pair}</b>
            <span className="v">{t.val}</span>
            <span className={t.dir}>{t.chg}</span>
          </span>
        ))}
      </div>
    </section>
  );
}
