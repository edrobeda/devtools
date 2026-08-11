import React, { useCallback, useMemo, useState } from 'react'
import { Typography, Card, Space, Input, List, Tag, Radio, Alert, Button, message } from 'antd'
import { ReadOutlined, SearchOutlined, BgColorsOutlined, CopyOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const CATEGORIES = [
  'layout',
  'flex',
  'grid',
  'spacing',
  'sizing',
  'typography',
  'backgrounds',
  'borders',
  'effects',
  'transitions',
  'transforms',
  'interactivity',
  'tables',
  'svg',
]

const CATEGORY_COLOR = {
  layout: 'blue',
  flex: 'green',
  grid: 'cyan',
  spacing: 'orange',
  sizing: 'purple',
  typography: 'magenta',
  backgrounds: 'geekblue',
  borders: 'gold',
  effects: 'volcano',
  transitions: 'lime',
  transforms: 'processing',
  interactivity: 'red',
  tables: 'default',
  svg: '#13c2c2',
}

const labelOf = {
  layout: { pt: 'Layout & posicionamento', en: 'Layout & positioning' },
  flex: { pt: 'Flexbox', en: 'Flexbox' },
  grid: { pt: 'Grid', en: 'Grid' },
  spacing: { pt: 'Espaçamento', en: 'Spacing' },
  sizing: { pt: 'Tamanho', en: 'Sizing' },
  typography: { pt: 'Tipografia', en: 'Typography' },
  backgrounds: { pt: 'Fundos', en: 'Backgrounds' },
  borders: { pt: 'Bordas', en: 'Borders' },
  effects: { pt: 'Efeitos', en: 'Effects' },
  transitions: { pt: 'Transições & animações', en: 'Transitions & animations' },
  transforms: { pt: 'Transformações', en: 'Transforms' },
  interactivity: { pt: 'Interatividade & a11y', en: 'Interactivity & a11y' },
  tables: { pt: 'Tabelas', en: 'Tables' },
  svg: { pt: 'SVG', en: 'SVG' },
}

const ITEMS = [
  // ─── Layout & posicionamento ───────────────────────────────────────────
  { code: '<div class="container mx-auto px-4">...</div>', cat: 'layout',
    pt: 'Container centralizado com padding horizontal automático — o padrão de largura máxima responsiva do Tailwind.',
    en: 'A centered container with horizontal auto-padding — Tailwind’s responsive max-width pattern.' },
  { code: 'class="block"', cat: 'layout',
    pt: 'display: block — ocupa a largura toda e empilha verticalmente.',
    en: 'display: block — takes full width and stacks vertically.' },
  { code: 'class="inline-block"', cat: 'layout',
    pt: 'display: inline-block — caixa que aceita largura/altura mas flui no texto.',
    en: 'display: inline-block — accepts width/height but flows inline.' },
  { code: 'class="hidden"', cat: 'layout',
    pt: 'display: none — esconde o elemento (comum em responsivo: md:block).',
    en: 'display: none — hides the element (common in responsive: md:block).' },
  { code: 'class="static | fixed | absolute | relative | sticky"', cat: 'layout',
    pt: 'Estratégias de posicionamento; sticky precisa de um ancestor com scroll e um threshold (top-0).',
    en: 'Positioning strategies; sticky needs a scrolling ancestor and a threshold (top-0).' },
  { code: 'class="inset-0"', cat: 'layout',
    pt: 'top/right/bottom/left: 0 — estica o elemento absoluto/fixo pelas quatro bordas do ancestral posicionado.',
    en: 'top/right/bottom/left: 0 — stretches an absolute/fixed element to all edges of its positioned ancestor.' },
  { code: 'class="top-0 left-0"', cat: 'layout',
    pt: 'Desloca o elemento posicionado a partir do topo e da esquerda (qualquer combinação de lados).',
    en: 'Offsets a positioned element from top and left (any side combination).' },
  { code: 'class="z-0 z-10 z-50"', cat: 'layout',
    pt: 'Camada de empilhamento; use valores do scale do Tailwind ou z-auto. Não funciona sem position.',
    en: 'Stacking layer; uses Tailwind’s scale values or z-auto. Doesn’t work without position.' },
  { code: 'class="overflow-hidden"', cat: 'layout',
    pt: 'Corta conteúdo que transborda; parceiro comum de rounded-full pra imagens circulares.',
    en: 'Clips overflowing content; common partner with rounded-full for circular images.' },
  { code: 'class="overflow-auto"', cat: 'layout',
    pt: 'Adiciona barras de rolagem apenas quando necessário.',
    en: 'Adds scrollbars only when needed.' },
  { code: 'class="overscroll-contain"', cat: 'layout',
    pt: 'Evita que o scroll do elemento “vaze” pro body quando chega no fim (útil em modais).',
    en: 'Prevents the element’s scroll from chaining to the body at its edges (useful in modals).' },
  { code: 'class="object-cover"', cat: 'layout',
    pt: 'Imagem/vídeo preenche o box cortando o excesso (como background-size: cover).',
    en: 'Image/video fills the box and crops the excess (like background-size: cover).' },
  { code: 'class="object-contain"', cat: 'layout',
    pt: 'Imagem/vídeo cabe inteiro dentro do box sem cortar.',
    en: 'Image/video fits entirely inside the box without cropping.' },
  { code: 'class="object-center"', cat: 'layout',
    pt: 'Centraliza o ponto de foco do objeto substituído.',
    en: 'Centers the focal point of the replaced object.' },

  // ─── Flexbox ─────────────────────────────────────────────────────────────
  { code: 'class="flex"', cat: 'flex',
    pt: 'display: flex — ativa o flex container.',
    en: 'display: flex — enables the flex container.' },
  { code: 'class="flex-row" / "flex-col"', cat: 'flex',
    pt: 'Direção principal: horizontal (padrão) ou vertical; inverta com flex-row-reverse/flex-col-reverse.',
    en: 'Main axis: horizontal (default) or vertical; reverse with flex-row-reverse/flex-col-reverse.' },
  { code: 'class="flex-1"', cat: 'flex',
    pt: 'Ocupa todo o espaço restante disponível (flex: 1 1 0%).',
    en: 'Takes all remaining available space (flex: 1 1 0%).' },
  { code: 'class="flex-auto"', cat: 'flex',
    pt: 'Cresce e encolhe considerando seu próprio tamanho inicial (flex: 1 1 auto).',
    en: 'Grows and shrinks considering its own initial size (flex: 1 1 auto).' },
  { code: 'class="flex-none"', cat: 'flex',
    pt: 'Não cresce nem encolhe (flex: none) — mantém tamanho intrínseco.',
    en: 'Does not grow or shrink (flex: none) — keeps intrinsic size.' },
  { code: 'class="flex-wrap"', cat: 'flex',
    pt: 'Permite quebra de linha quando os itens não cabem; nowrap é o padrão.',
    en: 'Allows line breaks when items don’t fit; nowrap is the default.' },
  { code: 'class="items-start | items-center | items-end | items-stretch"', cat: 'flex',
    pt: 'Alinhamento no eixo transversal (cross axis) do container.',
    en: 'Cross-axis alignment inside the container.' },
  { code: 'class="justify-start | justify-center | justify-end | justify-between | justify-around | justify-evenly"', cat: 'flex',
    pt: 'Distribuição dos itens ao longo do eixo principal.',
    en: 'Distribution of items along the main axis.' },
  { code: 'class="gap-4"', cat: 'flex',
    pt: 'Espaço uniforme entre linhas e colunas do flex/grid (gap: 1rem).',
    en: 'Uniform gutter between flex/grid rows and columns (gap: 1rem).' },
  { code: 'class="gap-x-4 gap-y-2"', cat: 'flex',
    pt: 'Espaçamento de gap separado entre colunas (x) e linhas (y).',
    en: 'Separate gap spacing for columns (x) and rows (y).' },
  { code: 'class="order-1"', cat: 'flex',
    pt: 'Reordena visualmente um item flex/grid sem mudar o DOM.',
    en: 'Visually reorders a flex/grid item without changing the DOM.' },
  { code: 'class="grow" / "grow-0"', cat: 'flex',
    pt: 'Permite (ou proíbe) que o item cresça além do tamanho inicial.',
    en: 'Allows (or forbids) the item to grow beyond its initial size.' },
  { code: 'class="shrink-0"', cat: 'flex',
    pt: 'Impede o item de encolher — útil pra botões/ícones não esmagarem.',
    en: 'Prevents the item from shrinking — useful so buttons/icons don’t squash.' },
  { code: 'class="basis-1/2"', cat: 'flex',
    pt: 'Tamanho inicial do item antes do crescimento/encolhimento (flex-basis).',
    en: 'Initial size of the item before growing/shrinking (flex-basis).' },

  // ─── Grid ────────────────────────────────────────────────────────────────
  { code: 'class="grid"', cat: 'grid',
    pt: 'display: grid — ativa o grid container.',
    en: 'display: grid — enables the grid container.' },
  { code: 'class="grid-cols-1 md:grid-cols-3"', cat: 'grid',
    pt: 'Define colunas responsivas; 1 coluna no mobile, 3 a partir do breakpoint md.',
    en: 'Defines responsive columns; 1 column on mobile, 3 from the md breakpoint.' },
  { code: 'class="grid-cols-12"', cat: 'grid',
    pt: 'Grade de 12 colunas — base clássica para layouts de dashboard.',
    en: 'A 12-column grid — classic foundation for dashboard layouts.' },
  { code: 'class="col-span-2"', cat: 'grid',
    pt: 'Item ocupa 2 colunas da grade (grid-column: span 2 / span 2).',
    en: 'Item spans 2 grid columns (grid-column: span 2 / span 2).' },
  { code: 'class="col-span-full"', cat: 'grid',
    pt: 'Item ocupa todas as colunas da linha.',
    en: 'Item spans all columns of the row.' },
  { code: 'class="col-start-2"', cat: 'grid',
    pt: 'Posiciona o item começando na linha 2 da grade.',
    en: 'Positions the item starting at grid line 2.' },
  { code: 'class="row-span-2"', cat: 'grid',
    pt: 'Item ocupa 2 linhas da grade.',
    en: 'Item spans 2 grid rows.' },
  { code: 'class="grid-flow-col"', cat: 'grid',
    pt: 'Itens fluem preenchendo colunas primeiro, em vez de linhas.',
    en: 'Items flow by filling columns first, instead of rows.' },
  { code: 'class="auto-cols-auto"', cat: 'grid',
    pt: 'Colunas implícitas criadas automaticamente usam tamanho do conteúdo.',
    en: 'Implicit columns are automatically sized by their content.' },
  { code: 'class="place-items-center"', cat: 'grid',
    pt: 'Centraliza itens nas duas direções (justify-items + align-items).',
    en: 'Centers items in both directions (justify-items + align-items).' },

  // ─── Espaçamento ─────────────────────────────────────────────────────────
  { code: 'class="p-4"', cat: 'spacing',
    pt: 'Padding em todos os lados (1rem / 16px por padrão).',
    en: 'Padding on all sides (1rem / 16px by default).' },
  { code: 'class="px-4 py-2"', cat: 'spacing',
    pt: 'Padding horizontal e vertical separados; pt/pb/pr/pl controlam um lado só.',
    en: 'Separate horizontal and vertical padding; pt/pb/pr/pl control a single side.' },
  { code: 'class="m-4"', cat: 'spacing',
    pt: 'Margem em todos os lados.',
    en: 'Margin on all sides.' },
  { code: 'class="mx-auto"', cat: 'spacing',
    pt: 'Margem horizontal automática — centraliza um bloco de largura fixa.',
    en: 'Horizontal auto margin — centers a block with a fixed width.' },
  { code: 'class="mt-4 mb-2"', cat: 'spacing',
    pt: 'Margem só em cima e embaixo.',
    en: 'Margin only on top and bottom.' },
  { code: 'class="-m-4"', cat: 'spacing',
    pt: 'Margem negativa; útil pra compensar padding de containers.',
    en: 'Negative margin; useful to offset container padding.' },
  { code: 'class="space-x-4"', cat: 'spacing',
    pt: 'Adiciona margem horizontal entre IRMÃOS, exceto o primeiro (gap legacy pra flex).',
    en: 'Adds horizontal margin between SIBLINGS, except the first (legacy flex gap).' },
  { code: 'class="space-y-2"', cat: 'spacing',
    pt: 'Adiciona margem vertical entre irmãos.',
    en: 'Adds vertical margin between siblings.' },

  // ─── Tamanho ─────────────────────────────────────────────────────────────
  { code: 'class="w-full"', cat: 'sizing',
    pt: 'width: 100% — estica até a largura do container.',
    en: 'width: 100% — stretches to the container width.' },
  { code: 'class="w-screen"', cat: 'sizing',
    pt: 'width: 100vw — largura total da viewport.',
    en: 'width: 100vw — full viewport width.' },
  { code: 'class="min-w-0"', cat: 'sizing',
    pt: 'Permite que o elemento encolha abaixo do conteúdo (resolve overflow em flex).',
    en: 'Allows the element to shrink below its content (fixes overflow in flex).' },
  { code: 'class="max-w-md"', cat: 'sizing',
    pt: 'Largura máxima do scale (sm/md/lg/xl/2xl/…/7xl/prose/none).',
    en: 'Maximum width from the scale (sm/md/lg/xl/2xl/…/7xl/prose/none).' },
  { code: 'class="max-w-screen-xl"', cat: 'sizing',
    pt: 'Largura máxima igual ao breakpoint xl (1280px por padrão).',
    en: 'Maximum width matching the xl breakpoint (1280px by default).' },
  { code: 'class="h-full"', cat: 'sizing',
    pt: 'height: 100% — precisa que o pai tenha altura definida.',
    en: 'height: 100% — parent needs an explicit height.' },
  { code: 'class="h-screen"', cat: 'sizing',
    pt: 'height: 100vh — altura total da viewport.',
    en: 'height: 100vh — full viewport height.' },
  { code: 'class="min-h-screen"', cat: 'sizing',
    pt: 'Altura mínima de 100vh — layout que empurra o rodapé pro final.',
    en: 'Minimum height of 100vh — layout that pushes the footer to the bottom.' },

  // ─── Tipografia ──────────────────────────────────────────────────────────
  { code: 'class="text-sm"', cat: 'typography',
    pt: 'Tamanho de fonte pequeno (0.875rem/14px).',
    en: 'Small font size (0.875rem / 14px).' },
  { code: 'class="text-base lg:text-lg"', cat: 'typography',
    pt: 'Tamanho responsivo de fonte; scale vai de xs a 9xl.',
    en: 'Responsive font size; scale goes from xs to 9xl.' },
  { code: 'class="font-normal | font-medium | font-semibold | font-bold"', cat: 'typography',
    pt: 'Peso da fonte; use o peso que o arquivo de fonte realmente carrega.',
    en: 'Font weight; use a weight that the actual font file loads.' },
  { code: 'class="text-left | text-center | text-right | text-justify"', cat: 'typography',
    pt: 'Alinhamento horizontal do texto.',
    en: 'Horizontal text alignment.' },
  { code: 'class="text-slate-500"', cat: 'typography',
    pt: 'Cor do texto usando a paleta do Tailwind (slate/gray/zinc/red/blue/…).',
    en: 'Text color using Tailwind’s palette (slate/gray/zinc/red/blue/…).' },
  { code: 'class="text-current"', cat: 'typography',
    pt: 'Herda a cor do texto do elemento pai (currentColor).',
    en: 'Inherits text color from the parent element (currentColor).' },
  { code: 'class="leading-tight | leading-snug | leading-normal | leading-relaxed"', cat: 'typography',
    pt: 'Altura da linha (line-height).',
    en: 'Line height.' },
  { code: 'class="tracking-tight | tracking-wide"', cat: 'typography',
    pt: 'Espaçamento entre letras (letter-spacing).',
    en: 'Letter spacing.' },
  { code: 'class="uppercase | lowercase | capitalize"', cat: 'typography',
    pt: 'Transformação de caixa do texto.',
    en: 'Text case transformation.' },
  { code: 'class="truncate"', cat: 'typography',
    pt: 'Corta texto com reticências em uma única linha (white-space: nowrap + overflow: hidden).',
    en: 'Truncates text with ellipsis on a single line (white-space: nowrap + overflow: hidden).' },
  { code: 'class="line-clamp-2"', cat: 'typography',
    pt: 'Limita o texto a 2 linhas com reticências (requer o plugin @tailwindcss/line-clamp no v3 ou nativo no v4).',
    en: 'Limits text to 2 lines with ellipsis (requires the @tailwindcss/line-clamp plugin in v3, native in v4).' },

  // ─── Fundos ──────────────────────────────────────────────────────────────
  { code: 'class="bg-white"', cat: 'backgrounds',
    pt: 'Cor de fundo branca; use qualquer cor da paleta (ex: bg-slate-900).',
    en: 'White background; use any palette color (e.g., bg-slate-900).' },
  { code: 'class="bg-slate-100"', cat: 'backgrounds',
    pt: 'Cinza claro de fundo — cor de superfície comum.',
    en: 'Light gray background — common surface color.' },
  { code: 'class="bg-current"', cat: 'backgrounds',
    pt: 'Fundo usa currentColor — útil pra preencher ícones com a cor do texto.',
    en: 'Background uses currentColor — useful for filling icons with text color.' },
  { code: 'class="bg-gradient-to-r from-blue-500 to-purple-500"', cat: 'backgrounds',
    pt: 'Gradiente linear da esquerda pra direita entre duas cores.',
    en: 'Linear gradient from left to right between two colors.' },
  { code: 'class="bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500"', cat: 'backgrounds',
    pt: 'Gradiente diagonal com cor intermediária (via).',
    en: 'Diagonal gradient with an intermediate color (via).' },
  { code: 'class="bg-cover"', cat: 'backgrounds',
    pt: 'Background-size: cover.',
    en: 'Background-size: cover.' },
  { code: 'class="bg-center"', cat: 'backgrounds',
    pt: 'Centraliza a imagem de fundo.',
    en: 'Centers the background image.' },
  { code: 'class="bg-no-repeat"', cat: 'backgrounds',
    pt: 'Imagem de fundo não se repete.',
    en: 'Background image does not repeat.' },

  // ─── Bordas ──────────────────────────────────────────────────────────────
  { code: 'class="border"', cat: 'borders',
    pt: 'Borda de 1px na cor padrão da configuração (geralmente slate-200).',
    en: '1px border using the default config color (usually slate-200).' },
  { code: 'class="border-2"', cat: 'borders',
    pt: 'Espessura da borda (0, 2, 4, 8).',
    en: 'Border width (0, 2, 4, 8).' },
  { code: 'class="border-t-4"', cat: 'borders',
    pt: 'Borda só em cima (border-top-width).',
    en: 'Border only on top (border-top-width).' },
  { code: 'class="border-slate-200"', cat: 'borders',
    pt: 'Cor da borda; pode ser transparent pra espaçar sem mostrar linha.',
    en: 'Border color; can be transparent to create space without showing a line.' },
  { code: 'class="rounded"', cat: 'borders',
    pt: 'Cantos arredondados pequenos (0.25rem); scale: sm, md, lg, xl, 2xl, 3xl, full, none.',
    en: 'Small rounded corners (0.25rem); scale: sm, md, lg, xl, 2xl, 3xl, full, none.' },
  { code: 'class="rounded-full"', cat: 'borders',
    pt: 'Cantos totalmente arredondados — círculos/elipses.',
    en: 'Fully rounded corners — circles/ellipses.' },
  { code: 'class="rounded-t-lg"', cat: 'borders',
    pt: 'Arredonda só os cantos superiores (t/b/l/r/tl/tr/bl/br).',
    en: 'Rounds only the top corners (t/b/l/r/tl/tr/bl/br).' },
  { code: 'class="outline-none focus:outline-none"', cat: 'borders',
    pt: 'Remove o outline padrão; sempre substitua por ring ou shadow de foco acessível.',
    en: 'Removes default outline; always replace it with an accessible focus ring or shadow.' },
  { code: 'class="ring-2 ring-blue-500"', cat: 'borders',
    pt: 'Anel de foco/destaque via box-shadow (não ocupa espaço de layout).',
    en: 'Focus/highlight ring via box-shadow (doesn’t take layout space).' },

  // ─── Efeitos ─────────────────────────────────────────────────────────────
  { code: 'class="shadow"', cat: 'effects',
    pt: 'Sombra pequena; scale: sm, md, lg, xl, 2xl, inner, none.',
    en: 'Small shadow; scale: sm, md, lg, xl, 2xl, inner, none.' },
  { code: 'class="shadow-lg"', cat: 'effects',
    pt: 'Sombra grande — comum em cards flutuantes e modais.',
    en: 'Large shadow — common for floating cards and modals.' },
  { code: 'class="opacity-0 | opacity-50 | opacity-100"', cat: 'effects',
    pt: 'Opacidade em múltiplos de 5 ou 0/100.',
    en: 'Opacity in multiples of 5 or 0/100.' },
  { code: 'class="mix-blend-multiply"', cat: 'effects',
    pt: 'Modo de blend da camada (multiply/screen/overlay/difference).',
    en: 'Layer blend mode (multiply/screen/overlay/difference).' },
  { code: 'class="backdrop-blur-sm"', cat: 'effects',
    pt: 'Desfoque do fundo atrás do elemento (backdrop-filter).',
    en: 'Blurs the background behind the element (backdrop-filter).' },

  // ─── Transições & animações ──────────────────────────────────────────────
  { code: 'class="transition"', cat: 'transitions',
    pt: 'Ativa transição nas propriedades comuns (color, bg, border, shadow, transform, opacity).',
    en: 'Enables transition on common properties (color, bg, border, shadow, transform, opacity).' },
  { code: 'class="transition-all"', cat: 'transitions',
    pt: 'Transiciona TODAS as propriedades; use com cuidado por performance.',
    en: 'Transitions ALL properties; use with care for performance.' },
  { code: 'class="duration-150"', cat: 'transitions',
    pt: 'Duração da transição (75/100/150/200/300/500/700/1000 ms).',
    en: 'Transition duration (75/100/150/200/300/500/700/1000 ms).' },
  { code: 'class="ease-in-out"', cat: 'transitions',
    pt: 'Função de temporização (linear, in, out, in-out).',
    en: 'Timing function (linear, in, out, in-out).' },
  { code: 'class="delay-100"', cat: 'transitions',
    pt: 'Atraso antes de iniciar a transição.',
    en: 'Delay before the transition starts.' },
  { code: 'class="animate-spin"', cat: 'transitions',
    pt: 'Animação de rotação contínua — spinner.',
    en: 'Continuous rotation animation — spinner.' },
  { code: 'class="animate-pulse"', cat: 'transitions',
    pt: 'Pulsação de opacidade — skeleton placeholder.',
    en: 'Opacity pulsing — skeleton placeholder.' },
  { code: 'class="animate-bounce"', cat: 'transitions',
    pt: 'Animação de salto — use com moderação.',
    en: 'Bouncing animation — use sparingly.' },

  // ─── Transformações ──────────────────────────────────────────────────────
  { code: 'class="scale-95"', cat: 'transforms',
    pt: 'Escala 95% — útil pra efeito de pressionar botão (hover:scale-105).',
    en: '95% scale — useful for pressed-button effect (hover:scale-105).' },
  { code: 'class="scale-100 hover:scale-105"', cat: 'transforms',
    pt: 'Escala padrão com aumento no hover.',
    en: 'Default scale with hover grow.' },
  { code: 'class="rotate-45"', cat: 'transforms',
    pt: 'Rotação em graus (0, 1, 2, 3, 6, 12, 45, 90, 180).',
    en: 'Rotation in degrees (0, 1, 2, 3, 6, 12, 45, 90, 180).' },
  { code: 'class="translate-x-4"', cat: 'transforms',
    pt: 'Deslocamento horizontal usando o scale de spacing.',
    en: 'Horizontal offset using the spacing scale.' },
  { code: 'class="-translate-y-1/2"', cat: 'transforms',
    pt: 'Sobe metade da própria altura — técnica de centralização absoluta.',
    en: 'Moves up by half its own height — absolute centering technique.' },
  { code: 'class="skew-x-12"', cat: 'transforms',
    pt: 'Inclinação horizontal.',
    en: 'Horizontal skew.' },

  // ─── Interatividade & a11y ───────────────────────────────────────────────
  { code: 'class="cursor-pointer"', cat: 'interactivity',
    pt: 'Cursor de mão; também existe not-allowed, wait, text, grab, etc.',
    en: 'Hand cursor; also not-allowed, wait, text, grab, etc.' },
  { code: 'class="cursor-not-allowed"', cat: 'interactivity',
    pt: 'Indica elemento desabilitado; combine com disabled no HTML e opacidade baixa.',
    en: 'Indicates disabled element; combine with disabled HTML attribute and low opacity.' },
  { code: 'class="pointer-events-none"', cat: 'interactivity',
    pt: 'Elemento não recebe cliques/teclado/mouse; útil em overlays decorativos.',
    en: 'Element ignores clicks/keyboard/mouse; useful for decorative overlays.' },
  { code: 'class="select-none"', cat: 'interactivity',
    pt: 'Impede seleção de texto.',
    en: 'Prevents text selection.' },
  { code: 'class="resize"', cat: 'interactivity',
    pt: 'Permite redimensionar textarea (padrão do navegador).',
    en: 'Allows textarea resizing (browser default).' },
  { code: 'class="sr-only"', cat: 'interactivity',
    pt: 'Esconde visualmente mas mantém acessível pra leitores de tela.',
    en: 'Visually hidden but still accessible to screen readers.' },
  { code: 'class="not-sr-only"', cat: 'interactivity',
    pt: 'Reverte sr-only em um breakpoint (ex: md:not-sr-only).',
    en: 'Reverts sr-only at a breakpoint (e.g., md:not-sr-only).' },

  // ─── Tabelas ─────────────────────────────────────────────────────────────
  { code: 'class="table-auto"', cat: 'tables',
    pt: 'Colunas se ajustam ao conteúdo (padrão do HTML).',
    en: 'Columns adjust to content (HTML default).' },
  { code: 'class="table-fixed"', cat: 'tables',
    pt: 'Largura das colunas fixada pela primeira linha — melhor performance e controle.',
    en: 'Column widths fixed by the first row — better performance and control.' },
  { code: 'class="border-collapse"', cat: 'tables',
    pt: 'Bordas das células se fundem (padrão).',
    en: 'Cell borders collapse together (default).' },
  { code: 'class="border-separate"', cat: 'tables',
    pt: 'Bordas das células ficam separadas; use com border-spacing.',
    en: 'Cell borders stay separate; use with border-spacing.' },

  // ─── SVG ─────────────────────────────────────────────────────────────────
  { code: 'class="fill-current"', cat: 'svg',
    pt: 'Preenche SVG com currentColor — ícone herda a cor do texto.',
    en: 'Fills SVG with currentColor — icon inherits text color.' },
  { code: 'class="stroke-current"', cat: 'svg',
    pt: 'Contorno SVG usa currentColor.',
    en: 'SVG stroke uses currentColor.' },
  { code: 'class="stroke-2"', cat: 'svg',
    pt: 'Espessura do traço SVG (0, 1, 2).',
    en: 'SVG stroke width (0, 1, 2).' },
]

const translations = {
  pt: {
    title: 'Cheat Sheet de Tailwind CSS',
    intro: (
      <>
        Referência pesquisável das classes utilitárias do{' '}
        <Text code>Tailwind CSS</Text> — o framework CSS que vira escolha padrão
        em muitos projetos React/Vite. Cada entrada mostra a classe, a
        categoria e o que ela faz na prática. Complementa os geradores de CSS
        do devtools e os cheat sheets de <Text code>Flexbox</Text> e{' '}
        <Text code>CSS Grid</Text>, que explicam os conceitos; este aqui é o
        catálogo rápido de classes.
      </>
    ),
    search: 'Buscar classe, conceito ou descrição...',
    all: 'Todas',
    empty: 'Nenhuma classe encontrada. Tente outra busca ou categoria.',
    tipTitle: 'Como ler as classes',
    tipBody: (
      <>
        Tailwind usa um <Text code>design system</Text> embutido: cores (slate,
        gray, red, blue…), espaçamento (0–96 em 0.25rem), tamanhos de fonte
        (xs–9xl) e breakpoints (sm, md, lg, xl, 2xl). O prefixo{' '}
        <Text code>hover:</Text>, <Text code>focus:</Text>,{' '}
        <Text code>md:</Text> etc. ativa a classe apenas naquele estado ou
        largura. Quase tudo é configurável no <Text code>tailwind.config</Text>{' '}
        — as classes daqui refletem os defaults, que são os mais comuns em
        projetos que não customizam o scale.
      </>
    ),
    resultsOne: 'classe encontrada',
    resultsMany: 'classes encontradas',
    copy: 'Copiar como Markdown',
    copyCode: 'Copiar código',
    copiedCode: 'Código copiado',
    copiedList: 'Lista Markdown copiada',
    copyError: 'Não foi possível copiar',
  },
  en: {
    title: 'Tailwind CSS Cheat Sheet',
    intro: (
      <>
        A searchable reference for <Text code>Tailwind CSS</Text> utility
        classes — the CSS framework that became the default choice in many
        React/Vite projects. Each entry shows the class, its category and what
        it actually does. It complements the devtools CSS generators and the{' '}
        <Text code>Flexbox</Text> / <Text code>CSS Grid</Text> cheat sheets
        (which explain the concepts); this one is the quick class catalog.
      </>
    ),
    search: 'Search class, concept or description...',
    all: 'All',
    empty: 'No class found. Try a different search or category.',
    tipTitle: 'How to read the classes',
    tipBody: (
      <>
        Tailwind uses a built-in <Text code>design system</Text>: colors
        (slate, gray, red, blue…), spacing (0–96 in 0.25rem steps), font sizes
        (xs–9xl) and breakpoints (sm, md, lg, xl, 2xl). Prefixes like{' '}
        <Text code>hover:</Text>, <Text code>focus:</Text>,{' '}
        <Text code>md:</Text> activate the class only in that state or width.
        Almost everything is configurable in{' '}
        <Text code>tailwind.config</Text> — the classes here reflect the
        defaults, which are the most common in projects that don’t customize
        the scale.
      </>
    ),
    resultsOne: 'class found',
    resultsMany: 'classes found',
    copy: 'Copy as Markdown',
    copyCode: 'Copy code',
    copiedCode: 'Code copied',
    copiedList: 'Markdown list copied',
    copyError: 'Could not copy',
  },
}

export default function TailwindCheatsheetPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [messageApi, messageContextHolder] = message.useMessage()

  const normalized = useCallback((s) => String(s).trim().toLowerCase(), [])

  const catCounts = useMemo(() => {
    const counts = { all: ITEMS.length }
    for (const cat of CATEGORIES) {
      counts[cat] = ITEMS.filter((it) => it.cat === cat).length
    }
    return counts
  }, [])

  const filtered = useMemo(() => {
    const q = normalized(query)
    return ITEMS.filter((it) => {
      if (category !== 'all' && it.cat !== category) return false
      if (!q) return true
      return (
        it.code.toLowerCase().includes(q) ||
        (it[lang] || '').toLowerCase().includes(q) ||
        labelOf[it.cat][lang].toLowerCase().includes(q)
      )
    })
  }, [query, category, lang, normalized])

  const mdList = useMemo(() => {
    const header = '# Tailwind CSS (cheat sheet)\n\n'
    const body = filtered
      .map((it) =>
        [
          `### ${labelOf[it.cat][lang]}`,
          '',
          '```html',
          it.code,
          '```',
          '',
          it[lang],
        ].join('\n')
      )
      .join('\n\n---\n\n')
    return header + body
  }, [filtered, lang])

  const copyCode = useCallback(
    async (code) => {
      try {
        await navigator.clipboard.writeText(code)
        messageApi.success(t.copiedCode)
      } catch {
        messageApi.error(t.copyError)
      }
    },
    [messageApi, t]
  )

  const copyMarkdown = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(mdList)
      messageApi.success(t.copiedList)
    } catch {
      messageApi.error(t.copyError)
    }
  }, [mdList, messageApi, t])

  const resultLabel = filtered.length === 1 ? t.resultsOne : t.resultsMany

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {messageContextHolder}
      <Title level={2}><ReadOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Alert
        type="info"
        showIcon
        icon={<BgColorsOutlined />}
        message={t.tipTitle}
        description={t.tipBody}
      />

      <Space direction="vertical" style={{ width: '100%' }}>
        <Input
          prefix={<SearchOutlined />}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.search}
          allowClear
        />
        <Radio.Group value={category} onChange={(e) => setCategory(e.target.value)} optionType="button">
          <Radio.Button value="all">{t.all} ({catCounts.all})</Radio.Button>
          {CATEGORIES.map((cat) => (
            <Radio.Button key={cat} value={cat}>
              {labelOf[cat][lang]} ({catCounts[cat]})
            </Radio.Button>
          ))}
        </Radio.Group>
      </Space>

      <Space style={{ width: '100%', justifyContent: 'space-between', flexWrap: 'wrap', rowGap: 8 }}>
        <Text type="secondary">
          {filtered.length} {resultLabel}
        </Text>
        {filtered.length > 0 && (
          <Button size="small" icon={<CopyOutlined />} onClick={copyMarkdown}>
            {t.copy}
          </Button>
        )}
      </Space>

      <Card>
        <List
          dataSource={filtered}
          locale={{ emptyText: t.empty }}
          renderItem={(item) => (
            <List.Item key={`${item.cat}-${item.code}`}>
              <Space direction="vertical" size={6} style={{ width: '100%' }}>
                <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                  <Tag color={CATEGORY_COLOR[item.cat]}>{labelOf[item.cat][lang]}</Tag>
                  <Button
                    size="small"
                    type="text"
                    icon={<CopyOutlined />}
                    title={t.copyCode}
                    onClick={() => copyCode(item.code)}
                  />
                </Space>
                <pre
                  style={{
                    margin: 0,
                    padding: '8px 12px',
                    background: '#f5f5f5',
                    borderRadius: 6,
                    fontSize: 12.5,
                    lineHeight: 1.65,
                    overflowX: 'auto',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {item.code}
                </pre>
                <Text type="secondary">{item[lang]}</Text>
              </Space>
            </List.Item>
          )}
        />
      </Card>
    </Space>
  )
}
