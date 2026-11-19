export interface Motion {
  /** false right after loading/navigating: digits start from 0. */
  booted: boolean;
  /** Toggles between draw-a / draw-b to restart stroke animations. */
  drawCls: string;
  rollCls: string;
}

export type AlertDir = 'above' | 'below';

export interface Alert {
  base: string;
  dir: AlertDir;
  target: number;
  fired: boolean;
}

export interface Draft {
  dir: AlertDir;
  val: string;
}

export type View = 'grid' | 'list' | 'matrix';
