/**
 * Motor do Gerador de Stagger CSS.
 *
 * Gera regras CSS para animar uma lista de elementos com delays progressivos
 * (stagger), seja via regras :nth-child individuais ou via custom properties
 * (--i) no HTML. Tudo é puro client-side — nenhuma chamada de rede.
 */

export const DIRECTIONS = ['forward', 'reverse', 'center', 'edges']

export const DIRECTION_LABELS = {
  pt: {
    forward: 'Crescente (1 → N)',
    reverse: 'Decrescente (N → 1)',
    center: 'Centro para fora',
    edges: 'Bordas para o centro',
  },
  en: {
    forward: 'Forward (1 → N)',
    reverse: 'Reverse (N → 1)',
    center: 'Center outward',
    edges: 'Edges inward',
  },
}

export const STRATEGIES = ['nth-child', 'custom-property']

export const STRATEGY_LABELS = {
  pt: {
    'nth-child': ':nth-child (CSS puro)',
    'custom-property': 'Custom properties (--i)',
  },
  en: {
    'nth-child': ':nth-child (pure CSS)',
    'custom-property': 'Custom properties (--i)',
  },
}

export const ANIMATIONS = {
  'fade-in': {
    name: 'stagger-fade-in',
    keyframes: `0% { opacity: 0; }
  100% { opacity: 1; }`,
  },
  'slide-up': {
    name: 'stagger-slide-up',
    keyframes: `0% { opacity: 0; transform: translateY(24px); }
  100% { opacity: 1; transform: translateY(0); }`,
  },
  'slide-down': {
    name: 'stagger-slide-down',
    keyframes: `0% { opacity: 0; transform: translateY(-24px); }
  100% { opacity: 1; transform: translateY(0); }`,
  },
  'slide-left': {
    name: 'stagger-slide-left',
    keyframes: `0% { opacity: 0; transform: translateX(24px); }
  100% { opacity: 1; transform: translateX(0); }`,
  },
  'slide-right': {
    name: 'stagger-slide-right',
    keyframes: `0% { opacity: 0; transform: translateX(-24px); }
  100% { opacity: 1; transform: translateX(0); }`,
  },
  'scale-in': {
    name: 'stagger-scale-in',
    keyframes: `0% { opacity: 0; transform: scale(0.85); }
  100% { opacity: 1; transform: scale(1); }`,
  },
  'rotate-in': {
    name: 'stagger-rotate-in',
    keyframes: `0% { opacity: 0; transform: rotate(-8deg) scale(0.95); }
  100% { opacity: 1; transform: rotate(0) scale(1); }`,
  },
  'flip-in': {
    name: 'stagger-flip-in',
    keyframes: `0% { opacity: 0; transform: perspective(400px) rotateX(-30deg); }
  100% { opacity: 1; transform: perspective(400px) rotateX(0); }`,
  },
  'custom': {
    name: 'stagger-custom',
    keyframes: `0% { opacity: 0; }
  100% { opacity: 1; }`,
  },
}

export const ANIMATION_LABELS = {
  pt: {
    'fade-in': 'Aparecer (fade-in)',
    'slide-up': 'Deslizar para cima',
    'slide-down': 'Deslizar para baixo',
    'slide-left': 'Deslizar da direita',
    'slide-right': 'Deslizar da esquerda',
    'scale-in': 'Zoom suave',
    'rotate-in': 'Rotacionar',
    'flip-in': 'Virar em X',
    custom: 'Personalizado (keyframes editável)',
  },
  en: {
    'fade-in': 'Fade in',
    'slide-up': 'Slide up',
    'slide-down': 'Slide down',
    'slide-left': 'Slide from right',
    'slide-right': 'Slide from left',
    'scale-in': 'Smooth zoom',
    'rotate-in': 'Rotate in',
    'flip-in': 'Flip in X',
    custom: 'Custom (editable keyframes)',
  },
}

export const EASINGS = [
  'ease',
  'ease-in',
  'ease-out',
  'ease-in-out',
  'linear',
  'cubic-bezier(0.34, 1.56, 0.64, 1)',
  'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  'cubic-bezier(0.4, 0, 0.2, 1)',
]

export function getDefaults() {
  return {
    selector: '.item',
    count: 8,
    animation: 'slide-up',
    duration: 0.5,
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    initialDelay: 0,
    stagger: 0.08,
    direction: 'forward',
    strategy: 'nth-child',
    fillMode: 'both',
    playState: 'running',
    iterations: 1,
    customKeyframes: `0% { opacity: 0; transform: translateY(20px); }
100% { opacity: 1; transform: translateY(0); }`,
  }
}

export function getPresets() {
  return [
    {
      key: 'cards',
      label: { pt: 'Cards em cascata', en: 'Cascade cards' },
      values: {
        selector: '.card',
        count: 8,
        animation: 'slide-up',
        duration: 0.5,
        easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
        initialDelay: 0,
        stagger: 0.08,
        direction: 'forward',
        strategy: 'nth-child',
        fillMode: 'both',
        playState: 'running',
        iterations: 1,
      },
    },
    {
      key: 'menu',
      label: { pt: 'Itens de menu', en: 'Menu items' },
      values: {
        selector: '.menu li',
        count: 6,
        animation: 'slide-right',
        duration: 0.35,
        easing: 'ease-out',
        initialDelay: 0.05,
        stagger: 0.05,
        direction: 'forward',
        strategy: 'nth-child',
        fillMode: 'both',
        playState: 'running',
        iterations: 1,
      },
    },
    {
      key: 'gallery',
      label: { pt: 'Galeria central', en: 'Center gallery' },
      values: {
        selector: '.gallery img',
        count: 9,
        animation: 'scale-in',
        duration: 0.45,
        easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        initialDelay: 0,
        stagger: 0.06,
        direction: 'center',
        strategy: 'custom-property',
        fillMode: 'both',
        playState: 'running',
        iterations: 1,
      },
    },
    {
      key: 'toast',
      label: { pt: 'Pilha de toasts', en: 'Toast stack' },
      values: {
        selector: '.toast',
        count: 5,
        animation: 'slide-left',
        duration: 0.4,
        easing: 'ease-out',
        initialDelay: 0,
        stagger: 0.1,
        direction: 'reverse',
        strategy: 'nth-child',
        fillMode: 'both',
        playState: 'running',
        iterations: 1,
      },
    },
    {
      key: 'loop',
      label: { pt: 'Loop infinito', en: 'Infinite loop' },
      values: {
        selector: '.dot',
        count: 12,
        animation: 'scale-in',
        duration: 0.8,
        easing: 'ease-in-out',
        initialDelay: 0,
        stagger: 0.06,
        direction: 'forward',
        strategy: 'nth-child',
        fillMode: 'both',
        playState: 'running',
        iterations: 'infinite',
      },
    },
  ]
}

/**
 * Calcula o delay de um item considerando a direção escolhida.
 *
 * @param {number} index   Índice do item (0-based).
 * @param {number} count   Total de itens.
 * @param {number} stagger Delay entre itens em segundos.
 * @param {number} initial Delay inicial em segundos.
 * @param {string} direction Uma das direções em DIRECTIONS.
 * @returns {number}       Delay em segundos.
 */
export function computeDelay(index, count, stagger, initial, direction) {
  const center = (count - 1) / 2
  switch (direction) {
    case 'reverse':
      return initial + (count - 1 - index) * stagger
    case 'center':
      return initial + Math.abs(index - center) * stagger
    case 'edges':
      return initial + Math.min(index, count - 1 - index) * stagger
    case 'forward':
    default:
      return initial + index * stagger
  }
}

function escapeSelector(sel) {
  // Remove espaços desnecessários nas pontas para usar em classes de exemplo.
  return (sel || '.item').trim()
}

function buildKeyframesRule(animation, customKeyframes) {
  const name = animation === 'custom' ? 'stagger-custom' : ANIMATIONS[animation]?.name || 'stagger-fade-in'
  const body = animation === 'custom'
    ? customKeyframes
    : (ANIMATIONS[animation]?.keyframes || ANIMATIONS['fade-in'].keyframes)
  return [`@keyframes ${name} {`, body, '}'].join('\n')
}

function buildBaseRule(sel, animation, duration, easing, fillMode, iterations) {
  const name = animation === 'custom' ? 'stagger-custom' : ANIMATIONS[animation]?.name || 'stagger-fade-in'
  const iterationValue = iterations === 'infinite' ? 'infinite' : `${iterations}`
  return [
    `${sel} {`,
    `  opacity: 0;`,
    `  animation: ${name} ${duration}s ${easing} ${iterationValue} ${fillMode};`,
    `}`,
  ].join('\n')
}

/**
 * Gera o CSS completo e o HTML de exemplo para o stagger.
 *
 * @param {Object} params Parâmetros de configuração.
 * @returns {{ css: string, html: string, delays: number[] }}
 */
export function buildStagger(params) {
  const {
    selector,
    count,
    animation,
    duration,
    easing,
    initialDelay,
    stagger,
    direction,
    strategy,
    fillMode,
    iterations,
    customKeyframes,
  } = { ...getDefaults(), ...params }

  const sel = escapeSelector(selector)
  const delays = Array.from({ length: count }, (_, i) =>
    computeDelay(i, count, stagger, initialDelay, direction)
  )

  const lines = []
  lines.push('/* Stagger animation generated by DevTools */')
  lines.push('')

  // Estratégia com custom properties: declara variáveis no container e no item.
  if (strategy === 'custom-property') {
    const parentSel = sel.includes(' ') ? sel.split(' ').slice(0, -1).join(' ') || ':root' : '.container'
    lines.push(`${parentSel} {`)
    lines.push(`  --stagger-delay: ${stagger}s;`)
    lines.push(`  --stagger-initial: ${initialDelay}s;`)
    lines.push(`}`)
    lines.push('')
    lines.push(`${sel} {`)
    lines.push(`  --i: 0;`)
    lines.push(`  opacity: 0;`)
    const name = animation === 'custom' ? 'stagger-custom' : ANIMATIONS[animation]?.name || 'stagger-fade-in'
    const iterationValue = iterations === 'infinite' ? 'infinite' : `${iterations}`
    lines.push(`  animation: ${name} ${duration}s ${easing} ${iterationValue} ${fillMode};`)
    lines.push(`  animation-delay: calc(var(--stagger-initial) + var(--i) * var(--stagger-delay));`)
    lines.push(`}`)
    lines.push('')

    if (direction === 'forward') {
      for (let i = 0; i < count; i += 1) {
        lines.push(`${sel}:nth-child(${i + 1}) { --i: ${i}; }`)
      }
    } else if (direction === 'reverse') {
      for (let i = 0; i < count; i += 1) {
        lines.push(`${sel}:nth-child(${i + 1}) { --i: ${count - 1 - i}; }`)
      }
    } else if (direction === 'center') {
      const center = (count - 1) / 2
      for (let i = 0; i < count; i += 1) {
        const distance = Math.abs(i - center)
        lines.push(`${sel}:nth-child(${i + 1}) { --i: ${distance}; }`)
      }
    } else if (direction === 'edges') {
      for (let i = 0; i < count; i += 1) {
        const distance = Math.min(i, count - 1 - i)
        lines.push(`${sel}:nth-child(${i + 1}) { --i: ${distance}; }`)
      }
    }
    lines.push('')
  } else {
    // Estratégia :nth-child com delays explícitos.
    lines.push(buildBaseRule(sel, animation, duration, easing, fillMode, iterations))
    lines.push('')
    for (let i = 0; i < count; i += 1) {
      const delay = delays[i].toFixed(3).replace(/\.?0+$/, '')
      lines.push(`${sel}:nth-child(${i + 1}) {`)
      lines.push(`  animation-delay: ${delay}s;`)
      lines.push(`}`)
    }
    lines.push('')
  }

  lines.push(buildKeyframesRule(animation, customKeyframes))

  const css = lines.join('\n')

  // HTML de exemplo.
  const tag = sel.includes(' ') ? 'div' : sel.replace(/^[.#]/, '') || 'div'
  const safeTag = /^[a-z][a-z0-9]*$/i.test(tag) ? tag : 'div'
  const className = sel.startsWith('.') ? sel.slice(1).split(/[ >+~]/)[0] : (sel.split(/[ >+~]/)[0] || 'item')
  const parentTag = 'div'
  const items = Array.from({ length: count }, (_, i) => `  <${safeTag} class="${className}">Item ${i + 1}</${safeTag}>`)
  const html = [
    `<${parentTag} class="${className}s">`,
    ...items,
    `</${parentTag}>`,
  ].join('\n')

  return { css, html, delays }
}

/**
 * Calcula o tempo total da animação, do primeiro trigger até o último item
 * terminar (considerando delay + duração).
 */
export function computeTotalDuration(count, stagger, initialDelay, direction, duration) {
  const lastDelay = Math.max(...Array.from({ length: count }, (_, i) =>
    computeDelay(i, count, stagger, initialDelay, direction)
  ))
  return lastDelay + duration
}

/**
 * Gera uma chave única para forçar re-mount da animação no preview.
 */
export function makeAnimationKey(params) {
  return [
    params.selector,
    params.count,
    params.animation,
    params.duration,
    params.easing,
    params.initialDelay,
    params.stagger,
    params.direction,
    params.strategy,
    params.fillMode,
    params.iterations,
    params.customKeyframes,
  ].join('|')
}
