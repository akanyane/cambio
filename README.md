# Câmbio · Vantage

Painel de cotações editorial, implementado em **Astro + React (TypeScript)** a partir do handoff em `docs/design/`.

```bash
bun install
bun run dev       # http://localhost:4321
bun run build     # astro check + build estático em dist/
bun run lint      # Biome (lint + formatação)
```

## APIs usadas (todas públicas, sem chave, com CORS)

| Uso                                                                     | Fonte                                                                         |
| ----------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Histórico diário de 17 moedas (calendário de sessões)                   | [Frankfurter](https://frankfurter.dev): taxas de referência do BCE            |
| Histórico de ARS, CLP e COP                                             | [AwesomeAPI](https://docs.awesomeapi.com.br/api-de-moedas), `/json/daily`     |
| Histórico do BTC                                                        | Binance, `data-api.binance.vision` (klines diárias)                           |
| Cotação ao vivo de 20 moedas fiat (a cada 60 s, pausa com a aba oculta) | AwesomeAPI, `/json/last`                                                      |
| BTC em tempo real                                                       | Binance WebSocket (`miniTicker`)                                              |
| Fallback                                                                | Frankfurter `/latest`; se nada responder, gerador determinístico do protótipo |

APIs do navegador: `Intl` (formatação pt-BR e fusos dos mercados), History API (rotas `/moeda/xxx`), `localStorage` (tema, base, fixadas, alertas, conversor e cache do histórico por 6 h), Notifications (alerta disparado com a aba em segundo plano), Page Visibility e `prefers-reduced-motion` / `prefers-color-scheme`.

## Estrutura

- `src/lib/rates/`: camada de dados. Cada fonte fica num arquivo e `index.ts` junta tudo num `MarketData` (unidades por 1 USD).
- `src/lib/model.ts`: séries, períodos, escala dos gráficos e volatilidade.
- `src/components/`: Header/Ticker, BaseSelector, Featured, Market (grade, lista e matriz), Converter, Detail, AlertForm, Odometer.
- `src/pages/`: `index.astro` e `moeda/[code].astro` (22 páginas estáticas, todas com a mesma ilha React).
- `src/styles/global.css`: CSS portado do design, sem nenhum `border-radius`.
