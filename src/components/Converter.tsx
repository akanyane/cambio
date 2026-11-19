import { useState } from 'react';
import { BY, CURRENCIES } from '../lib/currencies';
import { fmt, money, parseAmt } from '../lib/format';
import { usePersistent } from '../lib/hooks';
import { cname, getLocale, intlTag, t } from '../lib/i18n';
import { pairValue } from '../lib/model';
import type { MarketData } from '../lib/rates';
import { Chevron, Swap } from './Icons';

const AMTS = [100, 1000, 10000, 100000];
const whole = (n: number) => n.toLocaleString(intlTag());

function CurSelect({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="sel">
      <label className="sr" htmlFor={id}>
        {label}
      </label>
      <select id={id} value={value} onChange={(e) => onChange(e.currentTarget.value)}>
        {CURRENCIES.map((c) => (
          <option key={c.code} value={c.code}>
            {c.code}
          </option>
        ))}
      </select>
      <Chevron />
    </div>
  );
}

export function Converter({ data }: { data: MarketData }) {
  const T = t();
  // the typed amount is locale-formatted, so each language keeps its own
  const [amount, setAmount] = usePersistent(getLocale() === 'pt' ? 'conv:amount' : 'conv:amount:en', whole(1000));
  const [from, setFrom] = usePersistent('conv:from', 'USD');
  const [to, setTo] = usePersistent('conv:to', 'BRL');
  const [deg, setDeg] = useState(0);
  const rate = pairValue(data, from, to);
  const amt = parseAmt(amount);

  return (
    <section className="conv" aria-label={T.convLabel}>
      <div className="wrap">
        <div className="sh">
          <span className="sh-n">04</span>
          <span>{T.converter}</span>
          <span className="sh-r">{T.panelRate}</span>
        </div>
        <div className="conv-in">
          <div className="cf">
            <label className="lbl" htmlFor="cx-amt">
              {T.youHave}
            </label>
            <div className="cf-line">
              <input
                id="cx-amt"
                className="cf-in"
                type="text"
                inputMode="decimal"
                autoComplete="off"
                value={amount}
                onInput={(e) => setAmount(e.currentTarget.value.replace(/[^0-9.,]/g, ''))}
              />
              <CurSelect id="cx-from" label={T.fromCurrency} value={from} onChange={setFrom} />
            </div>
            <span className="cf-name">{cname(BY[from])}</span>
          </div>
          <button
            type="button"
            className="swap"
            onClick={() => {
              setFrom(to);
              setTo(from);
              setDeg(deg + 180);
            }}
            aria-label={T.swap}
          >
            <Swap className="ico ico-lg" style={{ transform: `rotate(${deg}deg)` }} />
          </button>
          <div className="cf">
            <span className="lbl">{T.youGet}</span>
            <div className="cf-line">
              <output className="cf-in cf-out" htmlFor="cx-amt cx-from cx-to" aria-live="polite">
                {BY[to].sym} {money(amt * rate)}
              </output>
              <CurSelect id="cx-to" label={T.toCurrency} value={to} onChange={setTo} />
            </div>
            <span className="cf-name">{cname(BY[to])}</span>
          </div>
        </div>
        <div className="conv-foot">
          <div className="amts" role="group" aria-label={T.quickAmounts}>
            {AMTS.map((a) => (
              <button key={a} type="button" className="amt num" onClick={() => setAmount(whole(a))}>
                {whole(a)}
              </button>
            ))}
          </div>
          <span className="rate num">
            <b>
              1 {from} = {fmt(rate)} {to}
            </b>{' '}
            · 1 {to} = {fmt(1 / rate)} {from}
          </span>
        </div>
      </div>
    </section>
  );
}
