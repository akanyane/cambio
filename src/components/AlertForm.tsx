import { useEffect, useRef } from 'react';
import type { Draft } from './types';

interface Props {
  code: string;
  base: string;
  baseSym: string;
  draft: Draft;
  setDraft: (d: Draft) => void;
  hasAlert: boolean;
  onSave: () => void;
  onRemove: () => void;
  onCancel: () => void;
  /** 'pop' over the card; 'dpop' on the detail page. */
  variant: 'pop' | 'dpop';
}

export function AlertForm({
  code,
  base,
  baseSym,
  draft,
  setDraft,
  hasAlert,
  onSave,
  onRemove,
  onCancel,
  variant,
}: Props) {
  const id = variant === 'pop' ? 'cx-alert' : 'cx-alert-d';
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    input.current?.focus();
    input.current?.select();
  }, []);

  const field = (
    <>
      <label className="sr" htmlFor={id}>
        Valor-alvo em {base}
      </label>
      <div className="pop-in">
        <span>{baseSym}</span>
        <input
          ref={input}
          id={id}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={draft.val}
          onInput={(e) => setDraft({ ...draft, val: e.currentTarget.value.replace(/[^0-9.,]/g, '') })}
        />
      </div>
    </>
  );

  return (
    <form
      className={variant}
      onSubmit={(e) => {
        e.preventDefault();
        onSave();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onCancel();
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <p className="pop-h">
        Avisar quando <em>{code}</em> ficar
      </p>
      <div className="pop-seg" role="group" aria-label="Direção do alerta">
        <button
          type="button"
          className={draft.dir === 'above' ? 'on' : ''}
          onClick={() => setDraft({ ...draft, dir: 'above' })}
          aria-pressed={draft.dir === 'above'}
        >
          Acima de
        </button>
        <button
          type="button"
          className={draft.dir === 'below' ? 'on' : ''}
          onClick={() => setDraft({ ...draft, dir: 'below' })}
          aria-pressed={draft.dir === 'below'}
        >
          Abaixo de
        </button>
      </div>
      {variant === 'dpop' ? <div>{field}</div> : field}
      <div className="pop-act">
        <button type="submit" className="btn pri">
          Salvar
        </button>
        {hasAlert && (
          <button type="button" className="btn" onClick={onRemove}>
            Remover
          </button>
        )}
        <button type="button" className="btn" onClick={onCancel}>
          Cancelar
        </button>
      </div>
    </form>
  );
}
