export const PARALLAX_SHIFT = 80

export function clampSpeed(v) {
  const n = Number(v)
  if (!Number.isFinite(n)) return 0
  return Math.min(1, Math.max(-1, Math.round(n * 100) / 100))
}

export function layerColorString(c) {
  if (typeof c === 'string' && c) return c
  if (c && typeof c.toHexString === 'function') return c.toHexString()
  return '#1677ff'
}

export function buildScrollParallaxCss({ sceneHeight, layers }) {
  const h = Math.round(sceneHeight)
  const parts = [
    `/* Parallax com Scroll-Driven Animations: cada camada anima a própria
   transform conforme o scroll avança (animation-timeline: scroll()).
   Suporte: Chromium 115+ e Firefox 114+. */
.scene {
  position: relative;
  height: ${h}px;
  overflow-y: auto;
}`,
    `/* A progressão 0->1 acompanha o scroll de 0% até o fim do .scene.
   O --speed de cada camada controla velocidade e direção. */
@keyframes devtools-parallax {
  from { transform: translateY(calc(var(--speed) * -${PARALLAX_SHIFT}px)); }
  to   { transform: translateY(calc(var(--speed) * ${PARALLAX_SHIFT}px)); }
}`,
  ]

  layers.forEach((layer, i) => {
    const n = i + 1
    const speed = clampSpeed(layer.factor)
    parts.push(`.parallax-layer-${n} {
  position: absolute;
  top: -${PARALLAX_SHIFT}px;
  bottom: -${PARALLAX_SHIFT}px;
  left: 0;
  right: 0;
  pointer-events: none;
  background: ${layerColorString(layer.color)};
  --speed: ${speed}; /* negativo = fundo (mais lento), 0 = neutro, positivo = frente */
  animation: devtools-parallax linear both;
  animation-timeline: scroll(nearest);
}`)
  })

  return parts.join('\n\n')
}

export function buildStickyParallaxCss({ sceneHeight, layers, sectionLabel }) {
  const h = Math.round(sceneHeight)
  const label = sectionLabel || 'Seção'
  const parts = [
    `/* Parallax "empilhado" com position: sticky: cada seção tem a mesma
   altura do cenário e prende o próprio bloco no topo enquanto passa.
   Funciona em todos os navegadores, sem JS e sem animation-timeline. */
.scene {
  height: ${h}px;
  overflow-y: auto;
}
.parallax-section {
  position: relative;
  height: ${h}px;
}
.parallax-section > * {
  position: sticky;
  top: 0;
  height: ${h}px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.95);
  font-weight: 700;
  letter-spacing: 0.02em;
}`,
  ]

  layers.forEach((layer, i) => {
    const n = i + 1
    parts.push(`.section-${n} {
  background: ${layerColorString(layer.color)};
}`)
    void n
  })

  const htmlSections = layers
    .map(
      (layer, i) =>
        `  <div class="parallax-section"><div class="section-${i + 1}">${label} ${i + 1}</div></div>`
    )
    .join('\n')

  return {
    css: parts.join('\n\n'),
    html: `<div class="scene">\n${htmlSections}\n</div>`,
  }
}

export function buildLastHtml({ sceneHeight, layers, scrollLabel }) {
  const tags = layers.map((l, i) => `  <div class="parallax-layer-${i + 1}"></div>`).join('\n')
  return `<div class="scene">
  <div class="content"><p>${scrollLabel}</p></div>
${tags}
</div>`
}