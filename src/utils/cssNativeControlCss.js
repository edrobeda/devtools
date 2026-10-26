// Núcleo compartilhado dos geradores de controle nativo em CSS puro
// (checkbox customizado e radio button customizado).
//
// Os dois motores implementam o MESMO esqueleto: um <label> container que
// alinha o input real (escondido, mas acessível) com uma caixa decorativa, e
// o estado "checked" desenhado no ::after dessa caixa. O que muda entre eles
// é o nome das classes, o tipo do input e a geometria/estilo do marcador.
//
// Antes cada motor tinha uma cópia byte-a-byte do esqueleto (container,
// input oculto, caixa, :hover, :checked, :focus-visible, :disabled e o texto
// ao lado). Este módulo emite esse esqueleto uma única vez, parametrizado
// pelo nome das classes e pelo texto dos comentários; o ::after do marcador
// fica a cargo de cada motor, que escolhe a construção (check em L, traço,
// ponto ou anel) e entrega as linhas prontas.
//
// O CSS gerado é byte-a-byte idêntico ao de antes: os comentários, a ordem
// das regras e os valores saem exatamente iguais.

import { toPx } from './cssColor.js'

// Monta o esqueleto do controle (container, input oculto, caixa, estados e
// texto ao lado). `markerLines` são as linhas do bloco ::after do marcador,
// escritas pelo motor chamador.
export function buildToggleControlCss({
  rootClass,
  boxClass,
  controlNoun,
  boxNoun,
  size,
  radius,
  active,
  inactive,
  border,
  borderWidth,
  shadow,
  duration,
  markerLines = [],
}) {
  const boxWord = boxNoun.charAt(0).toUpperCase() + boxNoun.slice(1)

  const lines = [
    '/* Container alinha input + label */',
    `.${rootClass} {`,
    '  display: inline-flex;',
    '  align-items: center;',
    '  gap: 10px;',
    '  cursor: pointer;',
    '  user-select: none;',
    '  -webkit-tap-highlight-color: transparent;',
    '}',
    '',
    `/* Esconde o ${controlNoun} real mas mantém acessibilidade */`,
    `.${rootClass} input {`,
    '  position: absolute;',
    '  opacity: 0;',
    '  width: 0;',
    '  height: 0;',
    '}',
    '',
    `/* ${boxWord} visual */`,
    `.${rootClass} .${boxClass} {`,
    '  position: relative;',
    `  width: ${toPx(size)};`,
    `  height: ${toPx(size)};`,
    `  background: ${inactive};`,
    `  border: ${borderWidth > 0 ? `${toPx(borderWidth)} solid ${border}` : 'none'};`,
    `  border-radius: ${radius};`,
    `  box-shadow: ${shadow};`,
    `  transition: background ${duration}ms ease, border-color ${duration}ms ease, box-shadow ${duration}ms ease;`,
    '  flex-shrink: 0;',
    '}',
    '',
    `/* Hover na ${boxNoun} */`,
    `.${rootClass}:hover .${boxClass} {`,
    `  border-color: ${active};`,
    '}',
    '',
    '/* Estado checked: fundo e borda ativos */',
    `.${rootClass} input:checked + .${boxClass} {`,
    `  background: ${active};`,
    borderWidth > 0 ? `  border-color: ${active};` : null,
    '}',
  ]

  lines.push(...markerLines)

  lines.push(
    '',
    '/* Foco via teclado */',
    `.${rootClass} input:focus-visible + .${boxClass} {`,
    `  outline: 2px solid ${active};`,
    '  outline-offset: 2px;',
    '}',
    '',
    '/* Estado desabilitado */',
    `.${rootClass} input:disabled + .${boxClass},`,
    `.${rootClass} input:disabled ~ .label-text {`,
    '  opacity: 0.55;',
    '  cursor: not-allowed;',
    '}',
    '',
    '/* Texto ao lado */',
    `.${rootClass} .label-text {`,
    '  font-size: 14px;',
    '  color: #262626;',
    '  line-height: 1.4;',
    '}'
  )

  return lines.filter(Boolean).join('\n')
}

// Marcador em L feito com bordas (checkbox "check" e radio "check").
// A geometria e a cor das bordas são decididas pelo motor chamador.
export function buildCheckMarkerLines({
  rootClass,
  boxClass,
  duration,
  borderWidth,
  borderColor,
  left,
  top,
  width,
  height,
  comment,
}) {
  return [
    '',
    `/* ${comment} */`,
    `.${rootClass} .${boxClass}::after {`,
    '  content: "";',
    '  position: absolute;',
    '  display: block;',
    `  left: ${toPx(left)};`,
    `  top: ${toPx(top)};`,
    `  width: ${toPx(width)};`,
    `  height: ${toPx(height)};`,
    '  border: solid transparent;',
    `  border-width: 0 ${toPx(borderWidth)} ${toPx(borderWidth)} 0;`,
    `  border-color: ${borderColor};`,
    '  transform: rotate(45deg) scale(0);',
    '  transform-origin: center;',
    `  transition: transform ${duration}ms ease;`,
    '}',
    '',
    `.${rootClass} input:checked + .${boxClass}::after {`,
    '  transform: rotate(45deg) scale(1);',
    '}',
  ]
}

// Marcador de traço (checkbox "dash"): barra sólida que cresce no eixo X.
export function buildDashMarkerLines({
  rootClass,
  boxClass,
  size,
  duration,
  color,
  thickness,
}) {
  return [
    '',
    '/* Símbolo de traço (dash) */',
    `.${rootClass} .${boxClass}::after {`,
    '  content: "";',
    '  position: absolute;',
    '  display: block;',
    `  left: ${toPx(size * 0.18)};`,
    '  top: 50%;',
    `  width: ${toPx(size * 0.55)};`,
    `  height: ${toPx(thickness)};`,
    `  background: ${color};`,
    '  border-radius: 999px;',
    '  transform: translateY(-50%) scaleX(0);',
    '  transform-origin: left center;',
    `  transition: transform ${duration}ms ease;`,
    '}',
    '',
    `.${rootClass} input:checked + .${boxClass}::after {`,
    '  transform: translateY(-50%) scaleX(1);',
    '}',
  ]
}

// Marcador em círculo sólido no centro (radio "dot").
export function buildDotMarkerLines({
  rootClass,
  boxClass,
  duration,
  color,
  markerPx,
}) {
  return [
    '',
    '/* Marcador como círculo sólido no centro */',
    `.${rootClass} .${boxClass}::after {`,
    '  content: "";',
    '  position: absolute;',
    '  display: block;',
    `  width: ${toPx(markerPx)};`,
    `  height: ${toPx(markerPx)};`,
    `  background: ${color};`,
    '  border-radius: 50%;',
    '  left: 50%;',
    '  top: 50%;',
    '  transform: translate(-50%, -50%) scale(0);',
    '  transform-origin: center;',
    `  transition: transform ${duration}ms ease;`,
    '}',
    '',
    `.${rootClass} input:checked + .${boxClass}::after {`,
    '  transform: translate(-50%, -50%) scale(1);',
    '}',
  ]
}

// Marcador em anel interno (radio "ring").
export function buildRingMarkerLines({
  rootClass,
  boxClass,
  duration,
  color,
  markerPx,
}) {
  return [
    '',
    '/* Marcador como anel interno */',
    `.${rootClass} .${boxClass}::after {`,
    '  content: "";',
    '  position: absolute;',
    '  display: block;',
    `  width: ${toPx(markerPx)};`,
    `  height: ${toPx(markerPx)};`,
    '  background: transparent;',
    `  border: ${toPx(Math.max(2, Math.round(markerPx * 0.18)))} solid ${color};`,
    '  border-radius: 50%;',
    '  left: 50%;',
    '  top: 50%;',
    '  transform: translate(-50%, -50%) scale(0);',
    '  transform-origin: center;',
    `  transition: transform ${duration}ms ease;`,
    '}',
    '',
    `.${rootClass} input:checked + .${boxClass}::after {`,
    '  transform: translate(-50%, -50%) scale(1);',
    '}',
  ]
}

// Markup de exemplo: <label> com o input real, a caixa decorativa e o texto.
export function buildToggleControlHtml({
  rootClass,
  boxClass,
  inputType,
  inputAttrs = '',
  labelText = '',
  checked = false,
  disabled = false,
}) {
  const checkedAttr = checked ? ' checked' : ''
  const disabledAttr = disabled ? ' disabled' : ''

  return [
    `<label class="${rootClass}">`,
    `  <input type="${inputType}"${inputAttrs}${checkedAttr}${disabledAttr}>`,
    `  <span class="${boxClass}"></span>`,
    labelText ? `  <span class="label-text">${labelText}</span>` : '',
    '</label>',
  ]
    .filter(Boolean)
    .join('\n')
}
