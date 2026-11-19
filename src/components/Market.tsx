import { alertInfo } from '../lib/alerts';
import { BY, GRID, MATRIX } from '../lib/currencies';
import { dir, fmt, p2, pct } from '../lib/format';
import { pairValue, pathD, prevOf, scale, series } from '../lib/model';
import type { MarketData } from '../lib/rates';
import { AlertForm } from './AlertForm';
import { Arrow, Bell, GridIco, ListIco, MatrixIco, Pin } from './Icons';
import { Odometer } from './Odometer';
import type { Alert, Draft, Motion, View } from './types';

export interface AlertFormCtl {
  open: string | null;
  draft: Draft;
  setDraft: (d: Draft) => void;
  save: () => void;
  remove: () => void;
  cancel: () => void;
}

interface Props {
  data: MarketData;
  base: string;
  featured: string;
  pins: string[];
  alerts: Record<string, Alert>;
  flash: Record<string, string>;
  motion: Motion;
  view: View;
  setView: (v: View) => void;
  alertCtl: AlertFormCtl;
  onFeature: (code: string) => void;
  onTogglePin: (code: string) => void;
  onOpenAlert: (code: string) => void;
  onOpen: (code: string) => void;
}

/** Ordem dos cards: fixadas primeiro, sempre sem a base. */
export function orderedCodes(base: string, pins: string[]) {
  const others = GRID.filter((c) => c !== base);
  return others.filter((c) => pins.includes(c)).concat(others.filter((c) => !pins.includes(c)));
}

function cardModel(data: MarketData, code: string, base: string) {
  const s = series(data, code, base, 8);
  const ch = s[7] / s[6] - 1;
  const wk = s[7] / s[0] - 1;
  const sc = scale(s, 156, 48, 5);
  const v = pairValue(data, code, base);
  return {
    s,
    ch,
    wk,
    sc,
    v,
    val: fmt(v),
    path: pathD(sc.pts),
    end: sc.pts[7],
    ref: `M0 ${sc.y(s[6]).toFixed(2)} H160`,
  };
}

export function MarketSection(p: Props) {
  const { data, base, view, setView } = p;
  const B = BY[base];
  return (
    <section className="mk" aria-label="Principais moedas">
      <div className="wrap">
        <div className="sh">
          <span className="sh-n">03</span>
          <span>Mercado</span>
          <span className="sh-r">Valores em {base}</span>
        </div>
        <div className="mk-head">
          <div>
            <h2 className="h2">
              O mundo visto a partir {B.fem ? 'da' : 'do'} <em>{B.name}</em>
            </h2>
            <p className="hint">Selecione uma moeda para colocá-la em destaque.</p>
          </div>
          <div className="seg" role="group" aria-label="Visualização">
            <button
              type="button"
              className={`seg-b ${view === 'grid' ? 'on' : ''}`}
              onClick={() => setView('grid')}
              aria-pressed={view === 'grid'}
            >
              <GridIco />
              Grade
            </button>
            <button
              type="button"
              className={`seg-b ${view === 'list' ? 'on' : ''}`}
              onClick={() => setView('list')}
              aria-pressed={view === 'list'}
            >
              <ListIco />
              Lista
            </button>
            <button
              type="button"
              className={`seg-b ${view === 'matrix' ? 'on' : ''}`}
              onClick={() => setView('matrix')}
              aria-pressed={view === 'matrix'}
            >
              <MatrixIco />
              Matriz
            </button>
          </div>
        </div>
        {view === 'grid' && <Grid {...p} />}
        {view === 'list' && <List {...p} />}
        {view === 'matrix' && <Matrix data={data} base={base} />}
      </div>
    </section>
  );
}

function Grid({
  data,
  base,
  featured,
  pins,
  alerts,
  flash,
  motion,
  alertCtl,
  onFeature,
  onTogglePin,
  onOpenAlert,
  onOpen,
}: Props) {
  const B = BY[base];
  return (
    <div className="grid">
      {orderedCodes(base, pins).map((code, i) => {
        const c = BY[code];
        const m = cardModel(data, code, base);
        const pinned = pins.includes(code);
        const al = alertInfo(data, alerts, code, base);
        const isF = code === featured;
        const bellOn = alerts[code]?.base === base;
        return (
          <div
            key={code}
            className={`card ${isF ? 'feat-on' : ''} ${pinned ? 'pinned' : ''}`}
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <button
              type="button"
              className="card-hit"
              onClick={() => onFeature(code)}
              aria-pressed={isF}
              aria-label={`Destacar ${c.name}`}
            />
            <span className="card-top num">
              <span className="idx">{p2(i + 1)}</span>
              <span className="tools">
                <button
                  type="button"
                  className={`tool ${pinned ? 'on' : ''}`}
                  onClick={() => onTogglePin(code)}
                  aria-pressed={pinned}
                  aria-label={`Fixar ${code} no topo`}
                >
                  <Pin />
                </button>
                <button
                  type="button"
                  className={`tool ${bellOn ? 'on' : ''}`}
                  onClick={() => onOpenAlert(code)}
                  aria-label={`Alerta de preço para ${code}`}
                >
                  <Bell />
                </button>
              </span>
              <span className={dir(m.ch)}>{pct(m.ch)}</span>
            </span>
            <span className="card-id">
              <span className="card-code">{code}</span>
              <span className="card-sym" aria-hidden="true">
                {c.tile}
              </span>
            </span>
            <span className="card-name">{c.name}</span>
            <span className={`val ${flash[code] ?? ''}`}>
              <span className="val-sym">{B.sym}</span>
              <span className="sr">{m.val}</span>
              <Odometer value={m.val} booted={motion.booted} rollCls={motion.rollCls} />
            </span>
            {al && (
              <span className={`alert-line ${al.cls}`}>
                <span className="dm" aria-hidden="true" />
                {al.text}
              </span>
            )}
            <svg className="spark" viewBox="0 0 160 48" aria-hidden="true">
              <path className="ref" d={m.ref} />
              <path
                className={`spark-line ${motion.drawCls} ${dir(m.wk)}`}
                style={{ animationDelay: `${240 + i * 60}ms` }}
                d={m.path}
              />
              <rect
                className="spark-end"
                x={(m.end[0] - 2).toFixed(2)}
                y={(m.end[1] - 2).toFixed(2)}
                width="4"
                height="4"
              />
            </svg>
            <span className="card-foot num">
              <span>7d {pct(m.wk)}</span>
              <button type="button" className="more" onClick={() => onOpen(code)}>
                Detalhes <Arrow />
              </button>
            </span>
            {alertCtl.open === code && (
              <AlertForm
                variant="pop"
                code={code}
                base={base}
                baseSym={B.sym}
                draft={alertCtl.draft}
                setDraft={alertCtl.setDraft}
                hasAlert={bellOn}
                onSave={alertCtl.save}
                onRemove={alertCtl.remove}
                onCancel={alertCtl.cancel}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function List({ data, base, featured, pins, flash, motion, onFeature, onOpen }: Props) {
  return (
    <div className="tbl-box">
      <table className="tbl num">
        <thead>
          <tr>
            <th>Moeda</th>
            <th className="r">Valor em {base}</th>
            <th className="r">Dia</th>
            <th className="r">7 dias</th>
            <th className="r">Tendência</th>
            <th className="r">Inverso</th>
            <th className="r">
              <span className="sr">Abrir</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {orderedCodes(base, pins).map((code, i) => {
            const m = cardModel(data, code, base);
            return (
              <tr key={code} className="row" style={{ animationDelay: `${i * 60}ms` }}>
                <td>
                  <button
                    type="button"
                    className="row-btn"
                    onClick={() => onFeature(code)}
                    aria-pressed={code === featured}
                  >
                    <span className="row-idx">{p2(i + 1)}</span>
                    <span className="row-code">{code}</span>
                    <span className="row-name">{BY[code].name}</span>
                  </button>
                </td>
                <td className="r">
                  <span className={`row-val ${flash[code] ?? ''}`}>{m.val}</span>
                </td>
                <td className={`r ${dir(m.ch)}`}>{pct(m.ch)}</td>
                <td className={`r ${dir(m.wk)}`}>{pct(m.wk)}</td>
                <td className="r">
                  <svg className="spark" viewBox="0 0 160 48" aria-hidden="true">
                    <path className="ref" d={m.ref} />
                    <path
                      className={`spark-line ${motion.drawCls} ${dir(m.wk)}`}
                      style={{ animationDelay: `${240 + i * 60}ms` }}
                      d={m.path}
                    />
                  </svg>
                </td>
                <td className="r" style={{ color: 'var(--mute)' }}>
                  {fmt(1 / m.v)}
                </td>
                <td className="r">
                  <button
                    type="button"
                    className="more"
                    onClick={() => onOpen(code)}
                    aria-label={`Abrir página de ${code}`}
                  >
                    Abrir <Arrow />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Matrix({ data, base }: { data: MarketData; base: string }) {
  const mx = MATRIX.slice();
  if (!mx.includes(base)) mx[mx.length - 1] = base;
  return (
    <>
      <div className="mx-box">
        <table className="mx">
          <thead>
            <tr>
              <th className="c">1 unidade de ↓ em →</th>
              {mx.map((c) => (
                <th key={c} className={c === base ? 'base' : ''}>
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {mx.map((r) => (
              <tr key={r} className={r === base ? 'base' : ''}>
                <td className="rh">{r}</td>
                {mx.map((c) => {
                  if (c === r)
                    return (
                      <td key={c} className={`diag ${c === base ? 'base' : ''}`}>
                        —
                      </td>
                    );
                  const v = pairValue(data, r, c);
                  const p = v / prevOf(data, r, c) - 1;
                  const cls = (p > 0.0005 ? 's-up' : p < -0.0005 ? 's-dn' : '') + (c === base ? ' base' : '');
                  return (
                    <td key={c} className={cls}>
                      {fmt(v)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mx-legend">
        <span>Cor indica a variação do par no dia</span>
        <span className="up">Alta acima de 0,05%</span>
        <span className="dn">Queda abaixo de −0,05%</span>
      </div>
    </>
  );
}
