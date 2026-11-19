import { useEffect, useState } from 'react';
import { alertInfo } from '../lib/alerts';
import { BY, VIEWS } from '../lib/currencies';
import { dayMonth, dir, fmt, fmtSigned, longDay, money, monthYear, nf, pct } from '../lib/format';
import { cname, lede, t } from '../lib/i18n';
import { pairValue, pathD, type Range, rangeCount, scale, series, seriesDates, volatility } from '../lib/model';
import type { MarketData } from '../lib/rates';
import { AlertForm } from './AlertForm';
import { chartKeyHandler } from './chartKeys';
import { sizeCls } from './Featured';
import { Back, Bell, Pin } from './Icons';
import type { AlertFormCtl } from './Market';
import { OdoValue } from './Odometer';
import type { Alert, Motion } from './types';

interface Props {
  data: MarketData;
  base: string;
  code: string;
  pins: string[];
  alerts: Record<string, Alert>;
  flash?: string;
  motion: Motion;
  alertCtl: AlertFormCtl;
  onBack: () => void;
  onTogglePin: () => void;
  onToggleAlert: () => void;
  onPickBase: (code: string) => void;
  onRedraw: () => void;
}

const AMTS = [1, 10, 100, 1000, 10000];
const RANGES: Range[] = ['1M', '6M', '1A'];

export function Detail({
  data,
  base,
  code: X,
  pins,
  alerts,
  flash,
  motion,
  alertCtl,
  onBack,
  onTogglePin,
  onToggleAlert,
  onPickBase,
  onRedraw,
}: Props) {
  const [range, setRange] = useState<Range>('6M');
  const T = t();
  const [hov, setHov] = useState<number | null>(null);
  useEffect(() => setHov(null), []);

  const XC = BY[X];
  const B = BY[base];
  const n = rangeCount(data, range);
  const ds = series(data, X, base, n);
  const dDates = seriesDates(data, n);
  const nYear = rangeCount(data, '1A');
  const year = series(data, X, base, nYear);
  const sc = scale(ds, 1176, 380, 30);
  const dp = sc.pts;
  const d = pathD(dp);
  const dv = pairValue(data, X, base);
  const dValStr = fmt(dv);
  const d7 = series(data, X, base, 8);
  const day = d7[7] / d7[6] - 1;
  const wk = d7[7] / d7[0] - 1;
  const yMin = Math.min(...year);
  const yMax = Math.max(...year);
  const dh = hov === null ? n - 1 : Math.max(0, Math.min(n - 1, hov));
  const al = alertInfo(data, alerts, X, base);
  const hasAlert = alerts[X]?.base === base;
  const pinned = pins.includes(X);
  const rangeChg = ds[n - 1] / ds[0] - 1;

  const axis = [];
  for (let k = 0; k < 6; k++) {
    const i = Math.round((k * (n - 1)) / 5);
    axis.push({ d: dDates[i], label: k === 5 ? T.today : range === '1A' ? monthYear(dDates[i]) : dayMonth(dDates[i]) });
  }

  const move = (ev: React.PointerEvent<HTMLDivElement>) => {
    const r = ev.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (ev.clientX - r.left) / (r.width * 0.98)));
    const i = Math.round(x * (n - 1));
    if (i !== hov) setHov(i);
  };

  const left = `${((dp[dh][0] / 1200) * 100).toFixed(3)}%`;

  return (
    <section className="dt" aria-label={T.detailLabel}>
      <div className="wrap">
        <nav className="dt-nav lbl" aria-label={T.navLabel}>
          <button type="button" className="back" onClick={onBack}>
            <Back />
            {T.dashboard}
          </button>
          <span className="crumb">
            {T.crumb} <b>{X}</b>
          </span>
          <div className="dt-act">
            <button type="button" className={`btn ${pinned ? 'on' : ''}`} onClick={onTogglePin} aria-pressed={pinned}>
              <Pin />
              {pinned ? T.pinned : T.pin}
            </button>
            <button
              type="button"
              className={`btn ${hasAlert ? 'on' : ''}`}
              onClick={onToggleAlert}
              aria-expanded={alertCtl.open === X}
            >
              <Bell />
              {hasAlert ? T.editAlert : T.createAlert}
            </button>
          </div>
        </nav>

        {alertCtl.open === X && (
          <AlertForm
            variant="dpop"
            code={X}
            base={base}
            baseSym={B.sym}
            draft={alertCtl.draft}
            setDraft={alertCtl.setDraft}
            hasAlert={hasAlert}
            onSave={alertCtl.save}
            onRemove={alertCtl.remove}
            onCancel={alertCtl.cancel}
          />
        )}

        <div className="dt-hero">
          <div>
            <div className="sh">
              <span className="sh-n">{X}</span>
              <span>
                {X} / {base}
              </span>
              <span className="sh-r">{XC.tile}</span>
            </div>
            <h2 className="dt-title">{cname(XC)}</h2>
            <p className="dt-sub">
              {T.worthToday(lede(XC))}
              <span className="src">
                {T.source} {T.sources[data.sources[X === 'USD' ? base : X]]}
              </span>
            </p>
            <div className={`big ${sizeCls(dValStr)}`}>
              <span className="big-sym">{B.sym}</span>
              <OdoValue value={dValStr} flash={flash} booted={motion.booted} rollCls={motion.rollCls} />
            </div>
            <div className="delta" style={{ marginTop: 22 }}>
              <span className={`delta-p ${dir(day)}`}>{pct(day)}</span>
              <span className="delta-s num">
                {T.onDay} · {fmtSigned(d7[7] - d7[6])}
              </span>
            </div>
            {al && (
              <span className={`alert-line ${al.cls}`} style={{ marginTop: 18 }}>
                <span className="dm" aria-hidden="true" />
                {al.text}
              </span>
            )}
          </div>
          <div className="dt-side">
            <div>
              <span className="lbl">{T.range52}</span>
              <div className="r52">
                <span
                  className="r52-m"
                  style={{ left: `${(Math.max(0, Math.min(1, (dv - yMin) / (yMax - yMin || 1))) * 100).toFixed(2)}%` }}
                >
                  <span className="num">{dValStr}</span>
                  <i />
                </span>
              </div>
              <div className="r52-labels num">
                <span>{fmt(yMin)}</span>
                <span>{fmt(yMax)}</span>
              </div>
            </div>
            <dl className="facts num">
              <div>
                <dt>{T.periodOpen}</dt>
                <dd>{fmt(ds[0])}</dd>
              </div>
              <div>
                <dt>{T.inverse}</dt>
                <dd>
                  {fmt(1 / dv)} {X}
                </dd>
              </div>
              <div>
                <dt>{T.periodHigh}</dt>
                <dd>{fmt(Math.max(...ds))}</dd>
              </div>
              <div>
                <dt>{T.periodLow}</dt>
                <dd>{fmt(Math.min(...ds))}</dd>
              </div>
              <div>
                <dt>{T.annualVol}</dt>
                <dd>{nf(1).format(volatility(year) * 100)}%</dd>
              </div>
              <div>
                <dt>{T.change7d}</dt>
                <dd className={dir(wk)}>{pct(wk)}</dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="dchart-wrap">
          <div className="dchart-head">
            <div>
              <span className="lbl">
                {T.history} · {T.rangeLabel[range]}
              </span>
              <div className="delta" style={{ marginTop: 10 }}>
                <span className={`delta-p ${dir(rangeChg)}`}>{pct(rangeChg)}</span>
                <span className="delta-s">{T.inPeriod}</span>
              </div>
            </div>
            <div className="seg" role="group" aria-label={T.periodLabel}>
              {RANGES.map((r) => (
                <button
                  key={r}
                  type="button"
                  className={`seg-b ${r === range ? 'on' : ''}`}
                  aria-pressed={r === range}
                  onClick={() => {
                    if (r !== range) {
                      setRange(r);
                      onRedraw();
                    }
                  }}
                >
                  {T.rangeBtn[r]}
                </button>
              ))}
            </div>
          </div>
          <div className="crop">
            <i className="tl" aria-hidden="true" />
            <i className="tr" aria-hidden="true" />
            <i className="bl" aria-hidden="true" />
            <i className="br" aria-hidden="true" />
            <div
              className="dchart"
              role="slider"
              aria-roledescription={T.chartRole}
              aria-label={T.chartSummary(
                T.pairIn(X, base),
                T.rangeLabel[range],
                fmt(ds[0]),
                longDay(dDates[0]),
                fmt(ds[n - 1]),
                pct(rangeChg),
                fmt(Math.min(...ds)),
                fmt(Math.max(...ds)),
              )}
              aria-valuemin={0}
              aria-valuemax={n - 1}
              aria-valuenow={dh}
              aria-valuetext={`${dh === n - 1 ? T.today : longDay(dDates[dh])}: ${fmt(ds[dh])}`}
              tabIndex={0}
              onKeyDown={chartKeyHandler(n, hov, setHov)}
              onBlur={() => setHov(null)}
            >
              <svg className="chart-svg" viewBox="0 0 1200 380" aria-hidden="true">
                <path className="gl" d="M0 28H1200" />
                <path className="gl" d="M0 190H1200" />
                <path className="gl" d="M0 352H1200" />
                <path className="ref" d={`M0 ${sc.y(ds[0]).toFixed(2)} H1200`} />
                <path className={`area ${motion.drawCls}`} d={`${d} L1176 380 L0 380 Z`} />
                <path className={`chart-line dline ${motion.drawCls}`} d={d} />
                <rect
                  className="chart-dot"
                  x={(dp[dh][0] - 4.5).toFixed(2)}
                  y={(dp[dh][1] - 4.5).toFixed(2)}
                  width="9"
                  height="9"
                />
              </svg>
              <span className="yl hi num">{fmt(Math.max(...ds))}</span>
              <span className="yl lo num">{fmt(Math.min(...ds))}</span>
              {hov !== null && (
                <>
                  <span className="xh" style={{ left }} />
                  <span
                    className={`tip ${dh > n * 0.66 ? 'r' : ''}`}
                    style={{ left, top: `${((dp[dh][1] / 380) * 100).toFixed(3)}%` }}
                  >
                    <span>{dh === n - 1 ? T.today : longDay(dDates[dh])}</span>
                    <strong className="num">{fmt(ds[dh])}</strong>
                  </span>
                </>
              )}
              <div
                className="dhit"
                aria-hidden="true"
                onPointerMove={move}
                onPointerDown={move}
                onPointerLeave={() => setHov(null)}
              />
            </div>
            <div className="axis num">
              {axis.map((a) => (
                <span key={a.d}>{a.label}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="dt-grid">
          <div>
            <div className="sh">
              <span className="sh-n">A</span>
              <span>{T.quickConversions}</span>
              <span className="sh-r">
                {X} ⇄ {base}
              </span>
            </div>
            <div className="ctabs">
              <table className="ctab num">
                <tbody>
                  {AMTS.map((a) => (
                    <tr key={a}>
                      <td>
                        {nf(0).format(a)} {X}
                      </td>
                      <td className="r">
                        {B.sym} {money(a * dv)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <table className="ctab num">
                <tbody>
                  {AMTS.map((a) => (
                    <tr key={a}>
                      <td>
                        {nf(0).format(a)} {base}
                      </td>
                      <td className="r">
                        {XC.sym} {money(a / dv)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div>
            <div className="sh">
              <span className="sh-n">B</span>
              <span>{T.seenFromOthers(X)}</span>
              <span className="sh-r">{T.tapToSwitch}</span>
            </div>
            <div className="views">
              {VIEWS.filter((c) => c !== X).map((c) => {
                const s = series(data, X, c, 2);
                const p = s[1] / s[0] - 1;
                return (
                  <button
                    key={c}
                    type="button"
                    className={`view ${c === base ? 'on' : ''}`}
                    onClick={() => onPickBase(c)}
                    aria-pressed={c === base}
                  >
                    <span className="view-code">{c}</span>
                    <span className="view-name">{cname(BY[c])}</span>
                    <span className="view-val">
                      {BY[c].sym} {fmt(pairValue(data, X, c))}
                    </span>
                    <span className={`view-chg num ${dir(p)}`}>{pct(p)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
