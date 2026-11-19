# Vantage — handoff de design para implementação

> Nome de trabalho em português: **Câmbio**. Nome sugerido em inglês: **Vantage** (a moeda base é o "ponto de vista" de onde se olha o mundo).

Este pacote contém o design completo, feito como protótipo interativo no canvas Design do Claude. Use-o como **fonte de verdade visual e de comportamento** para implementar a aplicação real (sugestão: Next.js + React + TypeScript + CSS Modules ou Tailwind, sem biblioteca de UI).

## Conteúdo do pacote

| Arquivo | O que é |
|---|---|
| `design/Main.dc.html` | **Arquivo principal.** Todo o HTML, CSS e a lógica (classe `Component`) da aplicação. Leia este primeiro. |
| `design/*.dc.html` (demais) | Telas do canvas que apenas importam `Main` com props diferentes (tema, página, estado inicial). Servem de referência de estado. |
| `design/canvas.json` | Índice do canvas (posição e tamanho de cada tela). |
| `assets/grain.png` | Textura de papel (ruído 256×256, alfa baixo) usada no fundo. |
| `HANDOFF.md` | Este documento. |

### Sobre o formato `.dc.html`
- O markup fica dentro de `<x-dc>`; o CSS global fica em `<helmet><style>`.
- `{{nome}}` é um valor vindo de `renderVals()`; `<sc-for list=… as=…>` é um loop; `<sc-if value=…>` é um condicional.
- Eventos usam camelCase do React (`onClick`, `onChange`, `onMouseMove`).
- A classe `Component extends DCLogic` funciona como um componente de classe React: `state`, `setState`, `componentDidMount`.
- `support.js` e `/_blob/...` são do runtime do canvas: na implementação, troque `/_blob/1941bfd4888134ac00c5eb3ba25bc83d` por `assets/grain.png`.

## Regras visuais inegociáveis
- **Zero cantos arredondados**: `border-radius: 0` em tudo (cards, botões, inputs, selects, tooltips, badges, gráficos).
- Estética editorial/suíça: grid rígido, linhas de 1 px, muito espaço em branco, seções numeradas (01–04).
- **Fonte única: Archivo** (Google Fonts, eixos `wdth` 62–125 e `wght` 100–900).
  - Números e códigos de moeda: peso 620–720, `font-stretch: 112–115%`, `font-variant-numeric: tabular-nums lining-nums`.
  - Nome "Câmbio/Vantage": 800, `font-stretch: 110%`.
  - Títulos: 640. Texto de apoio: 500. Corpo e rótulos: 450.
  - Rótulos: 10,5–11 px, caixa-alta, `letter-spacing: .16em`.
  - Sem itálico.

## Tokens de cor

| Token | Claro | Escuro |
|---|---|---|
| `--bg` | `#ECEFE8` | `#0D1311` |
| `--panel` | `#E3E8DF` | `#15201C` |
| `--ink` | `#121613` | `#E7ECE6` |
| `--ink2` | `#343B36` | `#C2CAC3` |
| `--mute` | `#5C645E` | `#8C978F` |
| `--line` | `#CDD4C9` | `#1F2B26` |
| `--line2` | `#A9B2A6` | `#34433C` |
| `--accent` (dourado) | `#C9A961` | `#C9A961` |
| `--accentInk` (dourado para texto) | `#7A5F26` | `#C9A961` |
| `--up` | `#2D6A4E` | `#82BB9C` |
| `--down` | `#9A3A31` | `#DC8C81` |

Easing padrão: `cubic-bezier(0.22, 1, 0.36, 1)`; durações de 300 a 1000 ms.

## Estrutura da tela

1. **Cabeçalho**: barra superior (edição do dia, data por extenso, "Ao vivo" pulsando, relógio, botão de tema); nome grande; linha dupla (2 px + 1 px).
2. **Relógio dos mercados**: Tóquio, Londres, Nova York e São Paulo, com hora local, aberto/fechado, "fecha em / abre em" e barra de 24 h com a sessão e a hora atual. Usa `Intl.DateTimeFormat` com `timeZone`.
3. **Ticker**: faixa rolando com todos os pares; pausa no hover.
4. **01 Ponto de vista**: frase "Valores vistos a partir do [moeda ▾]"; painel com busca (ignora acentos); atalhos BRL/USD/EUR/GBP/JPY. A concordância do/da depende do gênero da moeda.
5. **02 Em destaque**: número grande em odômetro, variação do dia, fechamento, inverso, máx./mín. de 7 dias; gráfico de 7 sessões com marcas de corte douradas e cursor (linha vertical + tooltip); link para a página de detalhe.
6. **03 Mercado**: visualizações Grade / Lista / Matriz (câmbio cruzado 8×8).
   - Card: índice, botões de fixar e de alerta, variação, código, símbolo, nome, valor em odômetro, linha de alerta, sparkline com referência do fechamento, rodapé com 7d e "Detalhes".
   - Moedas fixadas vêm primeiro e ganham um quadrado dourado no canto.
7. **04 Conversor**: "Você tem / Você recebe" com campos sublinhados, selects, botão de inverter (gira 180°) e valores rápidos.
8. **Colofão** (rodapé).
9. **Página de detalhe** (rota): voltar, fixar, criar/editar alerta; título, valor, faixa de 52 semanas com marcador; abertura, máx., mín., volatilidade anual e 7d do período; gráfico de 1M/6M/1A com cursor; conversões rápidas nos dois sentidos; "visto de outras moedas" (troca a base).
10. **Aviso (toast)**: canto inferior direito, quando um alerta dispara.

### Responsividade
- Acima de 1100 px: 4 colunas.
- De 760 a 1100 px: 2 colunas; destaque e conversor empilham.
- Abaixo de 640 px: 1 coluna.

## Movimento
- **Entrada**: letras do nome sobem em sequência; a linha dupla se desenha (`scaleX`); mercados, ticker e cards entram em stagger (fade + 16 px para cima).
- **Odômetro**: cada dígito é uma coluna 0–9 movida por `translateY(-n × 1.1em)`, com atraso da direita para a esquerda (35 ms por casa); desfoque leve durante a troca de base.
- **Ao carregar e ao navegar**: os dígitos partem de 0.
- **Sparklines e gráficos**: se desenham com `stroke-dashoffset`; redesenham ao trocar a base ou o período.
- **Hover do card**: sobe 4 px e uma linha dourada de 2 px cresce da esquerda.
- **Atualização ao vivo**: a cada 3,2 s um par oscila e o valor pisca em verde ou vermelho.
- **Troca de tema**: cortina de cor cheia com bordas douradas cruza a tela; o tema muda quando ela cobre tudo.
- Respeitar `prefers-reduced-motion`.

## Dados e lógica
- As cotações são **dados de exemplo**: unidades por 1 USD, com séries geradas por um PRNG determinístico (mulberry32 + hash FNV). O valor de X na base B é `rate[B] / rate[X]`.
- 22 moedas; a grade mostra USD, EUR, GBP, JPY, CHF, CAD, AUD, CNY, ARS, MXN, BTC e BRL, sempre excluindo a base.
- **Formatação** `pt-BR`:
  - Valores ≥ 100 → 2 casas.
  - De 0,01 a 100 → 4 casas.
  - Menores → 6 ou 8 casas.
  - Variações com sinal "+" ou "−" (U+2212).
- **Alertas**: `{ base, dir: 'above' | 'below', target, fired }` por moeda; checados a cada tick; ao disparar, mostram o toast por 8 s.
- **Para produção**: trocar o gerador por uma API real de câmbio (com histórico diário) e manter o mesmo formato de série.

## Acessibilidade
- Controles reais: `<button>`, `<input>` com `<label>`, `aria-pressed` e `aria-expanded`.
- Alvos de toque ≥ 44 px.
- O odômetro tem o valor em texto para leitores de tela (`.sr`).
- Contraste mínimo de 4,5:1 nos dois temas.

## Prompt sugerido para o Claude Code
> Implemente o app "Vantage" a partir de `design/Main.dc.html` e deste HANDOFF.md, em Next.js + TypeScript. Reproduza fielmente tokens, tipografia, layout, estados e animações; separe em componentes (Header, MarketClock, Ticker, BaseSelector, Featured, MarketGrid/List/Matrix, Converter, DetailPage, Toast, Odometer, Sparkline). Comece com os dados de exemplo do arquivo e deixe uma camada `rates` pronta para trocar por uma API real.
