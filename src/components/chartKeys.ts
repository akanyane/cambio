/**
 * Keyboard support for the charts (exposed as sliders): arrows move between points, Home/End jump to the ends,
 * Escape clears. `hov` is the hovered index (null = none, which the charts render as the last point).
 */
export function chartKeyHandler(n: number, hov: number | null, setHov: (i: number | null) => void) {
  return (e: KeyboardEvent) => {
    const cur = hov ?? n - 1;
    const step = e.shiftKey ? Math.max(1, Math.round(n / 10)) : 1;
    let next: number | null;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') next = Math.max(0, cur - step);
    else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') next = Math.min(n - 1, cur + step);
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = n - 1;
    else if (e.key === 'Escape') next = null;
    else return;
    e.preventDefault();
    setHov(next);
  };
}
