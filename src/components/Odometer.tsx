const DIG = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

interface Props {
  value: string;
  booted: boolean;
  rollCls: string;
  /** Fixed number of slots, so each column keeps its identity across values. */
  slots?: number;
}

/** Each digit is a 0–9 column moved by translateY, staggered right to left. */
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

/** Large value with screen-reader text. */
export function OdoValue({ value, flash, ...rest }: Props & { flash?: string }) {
  return (
    <span className={`big-num ${flash ?? ''}`}>
      <span className="sr">{value}</span>
      <Odometer value={value} {...rest} />
    </span>
  );
}
