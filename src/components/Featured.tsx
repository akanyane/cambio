import { useEffect, useState } from 'react';
import { BY } from '../lib/currencies';
import { dayMonth, dir, fmt, fmtSigned, pct } from '../lib/format';
import { lede, t } from '../lib/i18n';
import { pairValue, pathD, scale, series, seriesDates } from '../lib/model';
import type { MarketData } from '../lib/rates';
import { chartKeyHandler } from './chartKeys';
import { Arrow } from './Icons';
import { OdoValue } from './Odometer';
import type { Motion } from './types';

interface Props {
  data: MarketData;
  base: string;
  code: string;
  flash?: string;
  motion: Motion;
  onOpen: () => void;
}

export const sizeCls = (s: string) => (s.length <= 7 ? 'xl' : s.length <= 11 ? 'lg' : 'md');

export function Featured({ data, base, code, flash, motion, onOpen }: Props) {
  const [hov, setHov] = useState<number | null>(null);
  useEffect(() => setHov(null), []);
  const T = t();
  const F = BY[code];
  const B = BY[base];
  const fs = series(data, code, base, 8);
  const dates = seriesDates(data, 8);
  const last = fs.length - 1;
  const ch = fs[last] / fs[last - 1] - 1;
  const wk = fs[last] / fs[0] - 1;
  const sc = scale(fs, 624, 260, 24);
  const fp = sc.pts;
  const d = pathD(fp);
  const v = pairValue(data, code, base);
  const vStr = fmt(v);
  const hi = hov === null ? last : Math.max(0, Math.min(last, hov));
  const labels = dates.map((iso, i) => (i === last ? T.today : dayMonth(iso)));

  return (
    <section className="feat" aria-label={T.featuredLabel}>
      <div className="wrap">
        <div className="sh">
          <span className="sh-n">02</span>
          <span>{T.featured}</span>
          <span className="sh-r">
            {code} / {base}
          </span>
        </div>
        <div className="feat-in">
          <div className="feat-left">
            <p className="lede">{T.worthToday(lede(F))}</p>
            <div className={`big ${sizeCls(vStr)}`}>
              <span className="big-sym">{B.sym}</span>
              <OdoValue value={vStr} flash={flash} booted={motion.booted} rollCls={motion.rollCls} />
            </div>
            <div className="delta">
              <span className={`delta-p ${dir(ch)}`}>{pct(ch)}</span>
              <span className="delta-s num">
                {fmtSigned(fs[last] - fs[last - 1])} {T.sinceClose}
              </span>
            </div>
            <dl className="facts num">
              <div>
                <dt>{T.close}</dt>
                <dd>{fmt(fs[last - 1])}</dd>
              </div>
              <div>
                <dt>{T.inverse}</dt>
                <dd>
                  {fmt(1 / v)} {code}
                </dd>
              </div>
              <div>
                <dt>{T.high7}</dt>
                <dd>{fmt(Math.max(...fs))}</dd>
              </div>
              <div>
                <dt>{T.low7}</dt>
                <dd>{fmt(Math.min(...fs))}</dd>
              </div>
            </dl>
            <button type="button" className="link-btn" onClick={onOpen}>
              {T.fullPage(code)} <Arrow />
            </button>
          </div>
          <div className="feat-right">
            <div className="chart-head">
              <span className="lbl">{T.sevenSessions}</span>
              <span className={`num ${dir(wk)}`}>7d {pct(wk)}</span>
            </div>
            <div className="crop">
              <i className="tl" aria-hidden="true" />
              <i className="tr" aria-hidden="true" />
              <i className="bl" aria-hidden="true" />
              <i className="br" aria-hidden="true" />
              <div
                className="chart"
                role="slider"
                aria-roledescription={T.chartRole}
                aria-label={T.chartSummary(
                  T.pairIn(code, base),
                  T.lastSevenSessions,
                  fmt(fs[0]),
                  labels[0],
                  fmt(fs[last]),
                  pct(wk),
                  fmt(Math.min(...fs)),
                  fmt(Math.max(...fs)),
                )}
                aria-valuemin={0}
                aria-valuemax={last}
                aria-valuenow={hi}
                aria-valuetext={`${labels[hi]}: ${fmt(fs[hi])}`}
                tabIndex={0}
                onKeyDown={chartKeyHandler(fs.length, hov, setHov)}
                onBlur={() => setHov(null)}
                onPointerLeave={() => setHov(null)}
              >
                <svg className="chart-svg" viewBox="0 0 640 260" aria-hidden="true">
                  <path className="gl" d="M0 24H640" />
                  <path className="gl" d="M0 130H640" />
                  <path className="gl" d="M0 236H640" />
                  <path className="ref" d={`M0 ${sc.y(fs[last - 1]).toFixed(2)} H640`} />
                  <path className={`area ${motion.drawCls}`} d={`${d} L624 260 L0 260 Z`} />
                  <path className={`chart-line ${motion.drawCls}`} d={d} />
                  <rect
                    className="chart-dot"
                    x={(fp[hi][0] - 4.5).toFixed(2)}
                    y={(fp[hi][1] - 4.5).toFixed(2)}
                    width="9"
                    height="9"
                  />
                </svg>
                <span className="yl hi num">{fmt(Math.max(...fs))}</span>
                <span className="yl lo num">{fmt(Math.min(...fs))}</span>
                {hov !== null && (
                  <>
                    <span className="xh" style={{ left: `${((fp[hi][0] / 640) * 100).toFixed(3)}%` }} />
                    <span
                      className={`tip ${hi >= 5 ? 'r' : ''}`}
                      style={{
                        left: `${((fp[hi][0] / 640) * 100).toFixed(3)}%`,
                        top: `${((fp[hi][1] / 260) * 100).toFixed(3)}%`,
                      }}
                    >
                      <span>{labels[hi]}</span>
                      <strong className="num">{fmt(fs[hi])}</strong>
                    </span>
                  </>
                )}
                <div className="hits" aria-hidden="true">
                  {fs.map((_, i) => (
                    <span
                      key={dates[i]}
                      className="hit"
                      onPointerEnter={() => setHov(i)}
                      onPointerDown={() => setHov(i)}
                    />
                  ))}
                </div>
              </div>
              <div className="axis num">
                {labels.map((l, i) => (
                  <span key={dates[i]}>{l}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
