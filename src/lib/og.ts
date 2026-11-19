import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { Resvg } from '@resvg/resvg-js';
import satori from 'satori';
import { BY, CODES, type Currency } from './currencies';

// Build-time only: renders the 1200×630 Open Graph cards served at /og/*.png.

const W = 1200;
const H = 630;
const C = { bg: '#ECEFE8', ink: '#121613', ink2: '#343B36', mute: '#5C645E', line: '#CDD4C9', accent: '#C9A961' };

type Node = { type: string; props: { style?: Record<string, unknown>; children?: unknown } };
const h = (type: string, style: Record<string, unknown>, ...children: unknown[]): Node => ({
  type,
  props: { style: { display: 'flex', ...style }, children: children.length === 1 ? children[0] : children },
});

const require = createRequire(import.meta.url);
const font = (weight: number) =>
  readFile(require.resolve(`@fontsource/archivo/files/archivo-latin-${weight}-normal.woff`));

let fonts: Promise<{ name: string; data: Buffer; weight: 400 | 500 | 800 | 900; style: 'normal' }[]> | null = null;
function loadFonts() {
  fonts ??= Promise.all(
    ([400, 500, 800, 900] as const).map(async (weight) => ({
      name: 'Archivo',
      data: await font(weight),
      weight,
      style: 'normal' as const,
    })),
  );
  return fonts;
}

function frame(main: Node, footer: string) {
  return h(
    'div',
    {
      width: '100%',
      height: '100%',
      boxSizing: 'border-box',
      flexDirection: 'column',
      justifyContent: 'space-between',
      background: C.bg,
      color: C.ink,
      fontFamily: 'Archivo',
      padding: '56px 72px',
      borderTop: `14px solid ${C.ink}`,
    },
    h(
      'div',
      { alignItems: 'center', justifyContent: 'space-between', borderBottom: `2px solid ${C.ink}`, paddingBottom: 20 },
      h(
        'div',
        { alignItems: 'center', gap: 16 },
        h('div', { width: 26, height: 26, background: C.accent }),
        h('div', { fontSize: 30, fontWeight: 900, letterSpacing: 6 }, 'CÂMBIO'),
      ),
      h('div', { fontSize: 22, fontWeight: 500, color: C.mute, letterSpacing: 2 }, 'COTAÇÕES AO VIVO'),
    ),
    main,
    h(
      'div',
      {
        justifyContent: 'space-between',
        borderTop: `1px solid ${C.line}`,
        paddingTop: 20,
        fontSize: 22,
        color: C.mute,
      },
      h('div', {}, footer),
      h('div', { fontWeight: 800, color: C.ink2 }, 'cambio.akanyane.dev'),
    ),
  );
}

function homeCard() {
  const codes = CODES.filter((c) => c !== 'BTC').slice(0, 11);
  return frame(
    h(
      'div',
      { flexDirection: 'column', gap: 28 },
      h(
        'div',
        { fontSize: 78, fontWeight: 900, lineHeight: 1, letterSpacing: -2, maxWidth: 1000 },
        'As moedas do mundo, vistas de onde você está.',
      ),
      h(
        'div',
        { gap: 14, flexWrap: 'wrap' },
        ...codes.map((c) =>
          h('div', { fontSize: 22, fontWeight: 800, padding: '6px 12px', border: `2px solid ${C.ink}` }, c),
        ),
      ),
    ),
    '22 moedas · câmbio cruzado · conversor · alertas',
  );
}

function currencyCard(c: Currency) {
  return frame(
    h(
      'div',
      { alignItems: 'flex-end', gap: 48 },
      h('div', { fontSize: 240, fontWeight: 900, lineHeight: 0.8, letterSpacing: -8 }, c.code),
      h(
        'div',
        { flexDirection: 'column', gap: 10, paddingBottom: 6, flex: 1, minWidth: 0 },
        h('div', { width: 64, height: 8, background: C.accent }),
        h('div', { fontSize: 52, fontWeight: 800, lineHeight: 1.05 }, c.name),
        h('div', { fontSize: 26, color: C.ink2 }, 'Histórico de 1 ano, faixa de 52 semanas e conversões'),
      ),
    ),
    `/moeda/${c.code.toLowerCase()}`,
  );
}

/** Renders the card for `slug` ('home' or a lowercase currency code) as PNG bytes. */
export async function renderOg(slug: string): Promise<Uint8Array<ArrayBuffer>> {
  const c = BY[slug.toUpperCase()];
  const tree = c ? currencyCard(c) : homeCard();
  // satori accepts React-element-shaped plain objects
  const svg = await satori(tree as unknown as Parameters<typeof satori>[0], {
    width: W,
    height: H,
    fonts: await loadFonts(),
  });
  return new Uint8Array(new Resvg(svg, { fitTo: { mode: 'width', value: W } }).render().asPng());
}

export const OG_SLUGS = ['home', ...CODES.map((c) => c.toLowerCase())];
