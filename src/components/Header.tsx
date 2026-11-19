import { useState } from 'react';
import { MARKETS } from '../lib/currencies';
import { clockStr, p2 } from '../lib/format';
import { useNow } from '../lib/hooks';
import { getLocale, t } from '../lib/i18n';
import { Moon, Sun } from './Icons';

interface Props {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  status: 'live' | 'sample' | 'offline';
  /** Same page in the other language. */
  altHref: string;
}

/** Remembers an explicit language choice so the home page stops auto-redirecting. */
const rememberLang = (l: string) => {
  try {
    localStorage.setItem('cambio:lang', JSON.stringify(l));
  } catch {
    /* storage unavailable */
  }
};

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
      /* time zone unavailable */
    }
    const time = h + mi / 60;
    const weekday = wd >= 1 && wd <= 5;
    const isOpen = weekday && time >= m.o && time < m.c;
    const T = t();
    let note: string;
    if (isOpen) note = T.closesIn(dur(m.c - time));
    else if (weekday && time < m.o) note = T.opensIn(dur(m.o - time));
    else if (wd === 5 || wd === 6) note = T.opensMonday(hm(m.o));
    else note = T.opensTomorrow(hm(m.o));
    return {
      ...m,
      isOpen,
      note,
      time: `${p2(h)}:${p2(mi)}`,
      sL: (m.o / 24) * 100,
      sW: ((m.c - m.o) / 24) * 100,
      nowL: (time / 24) * 100,
      delay: 500 + i * 90,
    };
  });
}

export function Header({ theme, onToggleTheme, status, altHref }: Props) {
  const T = t();
  const now = useNow();
  const start = new Date(now.getFullYear(), 0, 0);
  const edition = Math.floor((now.getTime() - start.getTime()) / 864e5);
  const longDate = T.longDate(T.weekdays[now.getDay()], now.getDate(), T.monthsLong[now.getMonth()], now.getFullYear());
  const other = getLocale() === 'pt' ? 'en' : 'pt';
  const letters = ['C', 'â', 'm', 'b', 'i', 'o'];

  return (
    <div className="wrap">
      <div className="top lbl">
        <div className="top-l">
          <span className="ed">
            {T.edition} {edition}
          </span>
          <span>{longDate}</span>
        </div>
        <div className="top-r">
          <span className={`live ${status === 'live' ? '' : status === 'sample' ? 'demo' : 'off'}`} role="status">
            <span className="dot" aria-hidden="true" />
            {T.status[status]}
          </span>
          <span className="clock num">{clockStr(now)}</span>
          <a
            className="lang"
            href={altHref}
            hrefLang={other}
            lang={other}
            aria-label={T.langSwitch}
            onClick={() => rememberLang(other)}
          >
            {other.toUpperCase()}
          </a>
          <button
            type="button"
            className="sq-btn"
            onClick={onToggleTheme}
            aria-label={theme === 'dark' ? T.themeToLight : T.themeToDark}
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
        <p className="tagline">{T.brandTagline}</p>
      </div>
      <div className="rule" aria-hidden="true" />
      <section className="mkts" aria-label={T.marketsLabel}>
        {marketRows(now).map((m) => (
          <div key={m.city} className={`mkt ${m.isOpen ? 'on' : ''}`} style={{ animationDelay: `${m.delay}ms` }}>
            <div className="mkt-top">
              <span className="mkt-city">{T.cities[m.city]}</span>
              <span className={`mkt-st ${m.isOpen ? 'on' : ''}`}>
                <span className="sq" aria-hidden="true" />
                {m.isOpen ? T.open : T.closed}
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
  const [paused, setPaused] = useState(false);
  const T = t();
  return (
    <section className={`ticker ${paused ? 'paused' : ''}`} aria-label={T.tickerLabel}>
      <button type="button" className="tk-pause" aria-pressed={paused} onClick={() => setPaused(!paused)}>
        {paused ? T.tickerResume : T.tickerPause}
      </button>
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
