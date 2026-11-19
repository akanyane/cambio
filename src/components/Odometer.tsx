const DIG = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

interface Props {
  value: string;
  booted: boolean;
  rollCls: string;
  /** Número fixo de casas, para que cada coluna mantenha sua identidade entre valores. */
  slots?: number;
}

/** Cada dígito é uma coluna 0–9 movida por translateY; atraso da direita para a esquerda. */
export function Odometer({ value, booted, rollCls, slots = 15 }: Props) {
  const cells = [];
  for (let k = 0; k < slots; k++) {
    const idx = value.length - slots + k;
    const ch = idx >= 0 ? value.charAt(idx) : '';
    if (!ch) continue;
    const isD = ch >= '0' && ch <= '9';
    if (isD) {
      const y = booted ? -Number(ch) * 1.1 : 0;
      cells.push(
        <span className="odo-col" key={k}>
          <span
            className="odo-strip"
            style={{ transform: `translateY(${y.toFixed(2)}em)`, transitionDelay: `${(slots - 1 - k) * 35}ms` }}
          >
            {DIG.map((g) => (
              <span key={g}>{g}</span>
            ))}
          </span>
        </span>,
      );
    } else {
      cells.push(
        <span className="odo-sep" key={k}>
          {ch}
        </span>,
      );
    }
  }
  return (
    <span className={`odo ${rollCls}`} aria-hidden="true">
      {cells}
    </span>
  );
}

/** Valor grande com texto para leitores de tela. */
export function OdoValue({ value, flash, ...rest }: Props & { flash?: string }) {
  return (
    <span className={`big-num ${flash ?? ''}`}>
      <span className="sr">{value}</span>
      <Odometer value={value} {...rest} />
    </span>
  );
}
