export interface Motion {
  /** false logo após carregar/navegar: os dígitos partem de 0. */
  booted: boolean;
  /** Alterna entre draw-a / draw-b para reiniciar as animações de traço. */
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
