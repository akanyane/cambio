import { useEffect, useRef, useState } from 'react';
import { BY, CURRENCIES, QUICK } from '../lib/currencies';
import { fold } from '../lib/format';
import { cname, t } from '../lib/i18n';
import { Check, Chevron, Search } from './Icons';

interface Props {
  base: string;
  open: boolean;
  setOpen: (o: boolean) => void;
  onPick: (code: string) => void;
}

export function BaseSelector({ base, open, setOpen, onPick }: Props) {
  const [query, setQuery] = useState('');
  const input = useRef<HTMLInputElement>(null);
  const B = BY[base];

  useEffect(() => {
    if (!open) {
      setQuery('');
      return;
    }
    input.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, setOpen]);

  const T = t();
  const q = fold(query.trim());
  // matches the code and the name in either language
  const options = CURRENCIES.filter((c) => !q || fold(`${c.code} ${c.name} ${c.en}`).includes(q));

  return (
    <section className="pov" aria-label={T.pov}>
      <div className="wrap">
        <div className="sh">
          <span className="sh-n">01</span>
          <span>{T.pov}</span>
          <span className="sh-r">{T.baseCurrency}</span>
        </div>
        <div className="pov-in">
          <div className="pov-pick">
            <p className="sentence">
              {T.seenFrom(B)}{' '}
              <button
                type="button"
                className={`pick ${open ? 'open' : ''}`}
                onClick={() => setOpen(!open)}
                aria-expanded={open}
                aria-haspopup="true"
              >
                {cname(B)}
                <span className="pick-code">
                  {B.tile} · {base}
                </span>
                <Chevron />
              </button>
            </p>
            {open && (
              <>
                <button
                  type="button"
                  className="backdrop"
                  aria-label={T.closeSelector}
                  onClick={() => setOpen(false)}
                />
                <div className="panel">
                  <div className="search">
                    <Search />
                    <label className="sr" htmlFor="cx-q">
                      {T.searchLabel}
                    </label>
                    <input
                      ref={input}
                      id="cx-q"
                      type="search"
                      autoComplete="off"
                      placeholder={T.searchPlaceholder}
                      value={query}
                      onInput={(e) => setQuery(e.currentTarget.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && options[0]) onPick(options[0].code);
                      }}
                    />
                  </div>
                  <div className="opt-list">
                    {options.map((c) => (
                      <button
                        key={c.code}
                        type="button"
                        className="opt"
                        onClick={() => onPick(c.code)}
                        aria-pressed={c.code === base}
                      >
                        <span className="opt-sym" aria-hidden="true">
                          {c.tile}
                        </span>
                        <span className="opt-code">{c.code}</span>
                        <span className="opt-name">{cname(c)}</span>
                        {c.code === base && <Check />}
                      </button>
                    ))}
                    {options.length === 0 && <div className="empty">{T.noResults}</div>}
                  </div>
                </div>
              </>
            )}
          </div>
          <div className="quick">
            <span className="lbl">{T.shortcuts}</span>
            <div className="quick-row">
              {QUICK.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`qb ${c === base ? 'on' : ''}`}
                  onClick={() => onPick(c)}
                  aria-pressed={c === base}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
