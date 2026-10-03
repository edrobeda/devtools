/**
 * Lado SVG do conversor markup -> JSX.
 *
 * A serialização (camelCase, splitStyle, styleToObject, buildAttrs, render) não
 * mora mais aqui: está em src/utils/jsxConverter.js, compartilhada com
 * /tools/html-to-jsx-converter. Antes cada página carregava uma cópia própria
 * desse mesmo motor, já com código praticamente idêntico — e já divergido.
 *
 * O que sobra aqui é o que é genuinamente específico de SVG: o dicionário de
 * atributos SVG e o tratamento do envelope XML (strip da declaração <?xml?>
 * e o report de erro do DOMParser).
 */

import { convertMarkupToJsx } from './jsxConverter'

const SVG_ATTR_MAP = {
  'alignment-baseline': 'alignmentBaseline',
  'baseline-shift': 'baselineShift',
  'class': 'className',
  'clip-path': 'clipPath',
  'clip-rule': 'clipRule',
  'color-interpolation': 'colorInterpolation',
  'color-interpolation-filters': 'colorInterpolationFilters',
  'color-profile': 'colorProfile',
  'color-rendering': 'colorRendering',
  'dominant-baseline': 'dominantBaseline',
  'enable-background': 'enableBackground',
  'fill-opacity': 'fillOpacity',
  'fill-rule': 'fillRule',
  'flood-color': 'floodColor',
  'flood-opacity': 'floodOpacity',
  'font-family': 'fontFamily',
  'font-size': 'fontSize',
  'font-size-adjust': 'fontSizeAdjust',
  'font-stretch': 'fontStretch',
  'font-style': 'fontStyle',
  'font-variant': 'fontVariant',
  'font-weight': 'fontWeight',
  'glyph-name': 'glyphName',
  'glyph-orientation-horizontal': 'glyphOrientationHorizontal',
  'glyph-orientation-vertical': 'glyphOrientationVertical',
  'horiz-adv-x': 'horizAdvX',
  'horiz-origin-x': 'horizOriginX',
  'image-rendering': 'imageRendering',
  'letter-spacing': 'letterSpacing',
  'lighting-color': 'lightingColor',
  'marker-end': 'markerEnd',
  'marker-mid': 'markerMid',
  'marker-start': 'markerStart',
  'overline-position': 'overlinePosition',
  'overline-thickness': 'overlineThickness',
  'paint-order': 'paintOrder',
  'pointer-events': 'pointerEvents',
  'rendering-intent': 'renderingIntent',
  'shape-rendering': 'shapeRendering',
  'stop-color': 'stopColor',
  'stop-opacity': 'stopOpacity',
  'strikethrough-position': 'strikethroughPosition',
  'strikethrough-thickness': 'strikethroughThickness',
  'stroke-dasharray': 'strokeDasharray',
  'stroke-dashoffset': 'strokeDashoffset',
  'stroke-linecap': 'strokeLinecap',
  'stroke-linejoin': 'strokeLinejoin',
  'stroke-miterlimit': 'strokeMiterlimit',
  'stroke-opacity': 'strokeOpacity',
  'stroke-width': 'strokeWidth',
  'text-anchor': 'textAnchor',
  'text-decoration': 'textDecoration',
  'text-rendering': 'textRendering',
  'underline-position': 'underlinePosition',
  'underline-thickness': 'underlineThickness',
  'unicode-bidi': 'unicodeBidi',
  'unicode-range': 'unicodeRange',
  'units-per-em': 'unitsPerEm',
  'v-alphabetic': 'vAlphabetic',
  'v-hanging': 'vHanging',
  'v-ideographic': 'vIdeographic',
  'v-mathematical': 'vMathematical',
  'vector-effect': 'vectorEffect',
  'vert-adv-y': 'vertAdvY',
  'vert-origin-x': 'vertOriginX',
  'vert-origin-y': 'vertOriginY',
  'word-spacing': 'wordSpacing',
  'writing-mode': 'writingMode',
  'x-height': 'xHeight',
  'x-channel-selector': 'xChannelSelector',
  'y-channel-selector': 'yChannelSelector',
  'z': 'z',
  // HTML-transported in SVG (e.g. <foreignObject>)
  'accesskey': 'accessKey',
  'autocomplete': 'autoComplete',
  'autoplay': 'autoPlay',
  'cellpadding': 'cellPadding',
  'cellspacing': 'cellSpacing',
  'colspan': 'colSpan',
  'contenteditable': 'contentEditable',
  'crossorigin': 'crossOrigin',
  'datetime': 'dateTime',
  'enctype': 'encType',
  'formaction': 'formAction',
  'formenctype': 'formEncType',
  'formmethod': 'formMethod',
  'formnovalidate': 'formNoValidate',
  'formtarget': 'formTarget',
  'frameborder': 'frameBorder',
  'hreflang': 'hrefLang',
  'inputmode': 'inputMode',
  'maxlength': 'maxLength',
  'minlength': 'minLength',
  'nomodule': 'noModule',
  'novalidate': 'noValidate',
  'playsinline': 'playsInline',
  'readonly': 'readOnly',
  'referrerpolicy': 'referrerPolicy',
  'rowspan': 'rowSpan',
  'spellcheck': 'spellCheck',
  'srcdoc': 'srcDoc',
  'srclang': 'srcLang',
  'srcset': 'srcSet',
  'tabindex': 'tabIndex',
  'usemap': 'useMap',
  'crossorigin': 'crossOrigin',
  'allowfullscreen': 'allowFullScreen',
}

export function convertSvgToJsx(svg) {
  // Strip XML declaration if present (<?xml ...?>)
  const cleaned = svg.replace(/<\?xml[^?]*\?>/gi, '').trim()

  // Parse once up front so the DOMParser's own <parsererror> can be reported to
  // the user; the serialisation below re-parses through the shared engine.
  const doc = new DOMParser().parseFromString(cleaned, 'image/svg+xml')
  const parseError = doc.querySelector('parsererror')
  if (parseError) {
    return { jsx: '', error: parseError.textContent || 'Invalid SVG', elements: 0, chars: 0 }
  }

  // SVG has a single root: the <svg> element itself (no fragment wrapping)
  const jsx = convertMarkupToJsx(cleaned, {
    attrMap: SVG_ATTR_MAP,
    parseMode: 'image/svg+xml',
    root: 'documentElement',
  })

  if (!jsx) return { jsx: '', error: '', elements: 0, chars: 0 }

  return {
    jsx,
    error: '',
    elements: (jsx.match(/<[a-z]/g) || []).length,
    chars: jsx.length,
  }
}

export const SVG_SAMPLE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
  stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M12 2L2 7l10 5 10-5-10-5z" fill-rule="evenodd" />
  <path d="M2 17l10 5 10-5" />
  <path d="M2 12l10 5 10-5" />
</svg>`
