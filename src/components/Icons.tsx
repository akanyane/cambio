type P = { className?: string; style?: React.CSSProperties };
const s16 =
  (d: string) =>
  ({ className = 'ico', style }: P) => (
    <svg className={className} style={style} viewBox="0 0 16 16" aria-hidden="true">
      <path d={d} />
    </svg>
  );
const s24 =
  (d: string) =>
  ({ className = 'ico', style }: P) => (
    <svg className={className} style={style} viewBox="0 0 24 24" aria-hidden="true">
      <path d={d} />
    </svg>
  );

export const Sun = s24(
  'M12 7a5 5 0 1 0 0 10a5 5 0 1 0 0-10zM12 1v3M12 20v3M1 12h3M20 12h3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1',
);
export const Moon = s24('M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z');
export const Search = s24('M10.5 18a7.5 7.5 0 1 1 0-15a7.5 7.5 0 0 1 0 15zM16 16l5 5');
export const Swap = s24('M3 8h17l-4-4M21 16H4l4 4');
export const Chevron = s16('M3 6l5 5l5-5');
export const Check = s16('M3 8l3.5 3.5L13 5');
export const Arrow = s16('M2 8h11M9 4l4 4l-4 4');
export const Back = s16('M14 8H3M7 4L3 8l4 4');
export const Pin = s16('M5 2h6v4.5l2 3H3l2-3zM8 9.5V15');
export const Bell = s16('M3.5 11.5V7a4.5 4.5 0 0 1 9 0v4.5l1.5 1.5H2zM6.5 15h3');
export const Close = s16('M3 3l10 10M13 3L3 13');
export const GridIco = s16('M2 2h5v5H2zM9 2h5v5H9zM2 9h5v5H2zM9 9h5v5H9z');
export const ListIco = s16('M2 3.5h12M2 8h12M2 12.5h12');
export const MatrixIco = s16('M2 2h12v12H2zM2 6h12M2 10h12M6 2v12M10 2v12');
