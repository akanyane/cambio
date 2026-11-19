# Cambio

An editorial-style currency dashboard: the world's currencies, seen from where you stand.

**Live:** https://cambio.akanyane.dev

Built with **Astro + Preact (TypeScript, via `preact/compat`)** from the design handoff in `docs/design/`. The interface is in Brazilian Portuguese.

## Features

- Pick any of 22 currencies as the base; every value is shown from that point of view
- Market clock for Tokyo, London, New York and São Paulo, plus a scrolling ticker
- Featured pair with an odometer-style value and a 7-session chart
- Market view as grid, list or 8×8 cross-rate matrix
- Converter, pinned currencies and price alerts (with browser notifications)
- Per-currency detail page (`/moeda/xxx`) with 1M / 6M / 1Y history, 52-week range and volatility
- Light and dark themes, responsive layout, `prefers-reduced-motion` support
- Installable PWA that keeps working offline with the last quotes it saw
- Share previews (Open Graph cards) for the home page and every currency

## Getting started

Requires [Bun](https://bun.sh).

```bash
bun install
bun run dev       # http://localhost:4321
bun run build     # astro check + static build into dist/
bun test          # unit tests (formatting, pair math, alerts, data sources)
bun run lint      # Biome (lint + format check)
bun run lint:fix  # apply Biome fixes
```

## Data sources

All public, keyless and CORS-enabled, fetched directly from the browser.

| Purpose                                                                         | Source                                                                                     |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Daily history for 17 currencies (defines the session calendar)                  | [Frankfurter](https://frankfurter.dev): European Central Bank reference rates              |
| ARS, CLP and COP history                                                        | [AwesomeAPI](https://docs.awesomeapi.com.br/api-de-moedas), `/json/daily`                  |
| BTC history                                                                     | Binance, `data-api.binance.vision` (daily klines)                                          |
| Live quotes for 20 fiat currencies (every 60 s, paused while the tab is hidden) | AwesomeAPI, `/json/last`                                                                   |
| Real-time BTC                                                                   | Binance WebSocket (`miniTicker`)                                                           |
| Fallback                                                                        | Frankfurter `/latest`; if nothing responds, the prototype's deterministic sample generator |

Browser APIs used: `Intl` (pt-BR formatting and market time zones), History API (`/moeda/xxx` routes), `localStorage` (theme, base, pins, alerts, converter and a 6-hour history cache), Notifications, Page Visibility, Service Worker + Cache Storage (offline), online/offline events, `prefers-reduced-motion` and `prefers-color-scheme`.

Rates are informational only. Do not use them for trading.

## Project structure

- `src/lib/rates/`: data layer. One file per source; `index.ts` merges them into a single `MarketData` shape (units per 1 USD).
- `src/lib/model.ts`: series, ranges, chart scaling and volatility.
- `src/components/`: Header/Ticker, BaseSelector, Featured, Market (grid, list, matrix), Converter, Detail, AlertForm, Odometer.
- `src/pages/`: `index.astro` and `moeda/[code].astro` (22 static pages, all hydrating the same Preact island) and `og/[slug].png.ts` (Open Graph cards rendered at build time).
- `src/lib/images.ts`: build-time Open Graph cards and app icons (satori + resvg).
- `public/sw.js`: service worker (network-first pages and rate APIs, cache-first assets and fonts).
- `src/styles/global.css`: CSS ported from the design. No `border-radius` anywhere.

## Releases and deployment

- Commits follow [Conventional Commits](https://www.conventionalcommits.org); [release-please](https://github.com/googleapis/release-please) opens release PRs and publishes GitHub releases.
- CI runs Biome, the unit tests and the build on every push and pull request.
- Every push to `main` deploys to Vercel.
