import React, { useMemo, useState } from 'react'
import { Typography, Slider } from 'antd'
import { BgColorsOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import CssToggleGeneratorShell from '../components/CssToggleGeneratorShell'
import {
  SliderField,
  ColorField,
  SwitchField,
  SegmentedField,
  TextField,
} from '../components/CssToggleFormFields'
import {
  buildRadioButtonCss,
  buildRadioButtonHtml,
  buildRadioButtonFullDemo,
  PRESETS,
  DEFAULTS,
} from '../utils/cssRadioButtonGenerator'
import {
  buildToggleControlCss,
  buildCheckMarkerLines,
  buildDotMarkerLines,
  buildRingMarkerLines,
} from '../utils/cssNativeControlCss'

const { Text } = Typography

const MARKER_OPTIONS = {
  pt: [
    { label: 'Ponto', value: 'dot' },
    { label: 'Anel', value: 'ring' },
    { label: 'Check', value: 'check' },
  ],
  en: [
    { label: 'Dot', value: 'dot' },
    { label: 'Ring', value: 'ring' },
    { label: 'Check', value: 'check' },
  ],
}

const translations = {
  pt: {
    title: 'Gerador de Radio Button CSS',
    intro: (
      <>
        Crie radio buttons customizados usando só CSS + um input real. Escolha o
        marcador (ponto, anel ou check), ajuste cores, tamanho, borda e transição;
        o preview usa o CSS exato que será copiado, então você clica e vê o
        resultado final em tempo real.
      </>
    ),
    tipTitle: 'Como funciona (e as pegadinhas)',
    tipBody: (
      <>
        O input real fica invisível (mas acessível) e um{' '}
        <Text code>{'<span class="radio-box">'}</Text> atua como a bolha visual.
        O marcador é desenhado no pseudo-elemento <Text code>::after</Text> e
        aparece via <Text code>{'transform: scale(...)'}</Text> quando{' '}
        <Text code>{'input:checked + .radio-box'}</Text> dispara. Sempre envolva o
        input e a bolha num <Text code>{'<label>'}</Text> e agrupe radios
        relacionados com o mesmo atributo <Text code>name</Text>.
      </>
    ),
    settings: 'Configurações',
    size: 'Tamanho (px)',
    activeColor: 'Cor ativa (checked)',
    inactiveColor: 'Cor inativa',
    markerColor: 'Cor do marcador',
    borderColor: 'Cor da borda',
    borderWidth: 'Espessura da borda',
    markerSize: 'Tamanho do marcador (%)',
    markerStyle: 'Estilo do marcador',
    transitionDuration: 'Duração da transição (ms)',
    shadow: 'Sombra da bolha',
    disabled: 'Preview desabilitado',
    checked: 'Preview marcado por padrão',
    preview: 'Pré-visualização',
    previewHint: 'O radio button abaixo usa exatamente o CSS gerado — clique para testar.',
    outputCss: 'CSS gerado',
    outputHtml: 'HTML de exemplo',
    outputFull: 'Bloco completo',
    copy: 'Copiar',
    copied: 'Copiado!',
    copyError: 'Não foi possível copiar',
    presets: 'Presets',
    sourceCol: 'Código-fonte',
    sourceBody:
      'O núcleo vive em src/utils/cssRadioButtonGenerator.js. buildRadioButtonCss monta as regras do container, do input oculto, da bolha .radio-box e do pseudo-elemento ::after com o marcador (dot, ring ou check), além dos estados :hover, :checked, :focus-visible e :disabled. buildRadioButtonHtml gera o markup semântico envolvido por <label>.',
  },
  en: {
    title: 'CSS Radio Button Generator',
    intro: (
      <>
        Build custom radio buttons using only CSS + a real input. Choose the
        marker (dot, ring or check), tweak colors, size, border and transition;
        the preview uses the exact CSS that will be copied, so you click and see
        the final result in real time.
      </>
    ),
    tipTitle: 'How it works (and the gotchas)',
    tipBody: (
      <>
        The real input is visually hidden (but accessible) and a{' '}
        <Text code>{'<span class="radio-box">'}</Text> acts as the visual bubble.
        The marker is drawn in the <Text code>::after</Text> pseudo-element and
        reveals via <Text code>{'transform: scale(...)'}</Text> when{' '}
        <Text code>{'input:checked + .radio-box'}</Text> fires. Always wrap the
        input and bubble in a <Text code>{'<label>'}</Text> and group related
        radios with the same <Text code>name</Text> attribute.
      </>
    ),
    settings: 'Settings',
    size: 'Size (px)',
    activeColor: 'Active color (checked)',
    inactiveColor: 'Inactive color',
    markerColor: 'Marker color',
    borderColor: 'Border color',
    borderWidth: 'Border width',
    markerSize: 'Marker size (%)',
    markerStyle: 'Marker style',
    transitionDuration: 'Transition duration (ms)',
    shadow: 'Bubble shadow',
    disabled: 'Preview disabled',
    checked: 'Preview checked by default',
    preview: 'Preview',
    previewHint: 'The radio button below uses exactly the generated CSS — click to test it.',
    outputCss: 'Generated CSS',
    outputHtml: 'Example HTML',
    outputFull: 'Full block',
    copy: 'Copy',
    copied: 'Copied!',
    copyError: 'Could not copy',
    presets: 'Presets',
    sourceCol: 'Source code',
    sourceBody:
      'The core lives in src/utils/cssRadioButtonGenerator.js. buildRadioButtonCss builds the rules for the container, hidden input, .radio-box element and ::after pseudo-element with the marker (dot, ring or check), plus :hover, :checked, :focus-visible and :disabled states. buildRadioButtonHtml generates semantic markup wrapped in <label>.',
  },
}

const PRESET_ORDER = ['default', 'material', 'ios', 'minimal', 'check']

export default function CssRadioButtonGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [size, setSize] = useState(DEFAULTS.size)
  const [activeColor, setActiveColor] = useState(DEFAULTS.activeColor)
  const [inactiveColor, setInactiveColor] = useState(DEFAULTS.inactiveColor)
  const [markerColor, setMarkerColor] = useState(DEFAULTS.markerColor)
  const [borderColor, setBorderColor] = useState(DEFAULTS.borderColor)
  const [borderWidth, setBorderWidth] = useState(DEFAULTS.borderWidth)
  const [markerSize, setMarkerSize] = useState(DEFAULTS.markerSize)
  const [markerStyle, setMarkerStyle] = useState(DEFAULTS.markerStyle)
  const [transitionDuration, setTransitionDuration] = useState(DEFAULTS.transitionDuration)
  const [shadow, setShadow] = useState(DEFAULTS.shadow)
  const [disabled, setDisabled] = useState(false)
  const [checked, setChecked] = useState(false)

  const settings = useMemo(
    () => ({
      size,
      activeColor,
      inactiveColor,
      markerColor,
      borderColor,
      borderWidth,
      markerSize,
      markerStyle,
      transitionDuration,
      shadow,
    }),
    [
      size,
      activeColor,
      inactiveColor,
      markerColor,
      borderColor,
      borderWidth,
      markerSize,
      markerStyle,
      transitionDuration,
      shadow,
    ]
  )

  const cssOutput = useMemo(() => buildRadioButtonCss(settings), [settings])
  const htmlOutput = useMemo(
    () => buildRadioButtonHtml({ ...settings, labelText: t.title, checked, disabled }),
    [settings, checked, disabled, t.title]
  )
  const fullOutput = useMemo(() => buildRadioButtonFullDemo({ ...settings, checked, disabled }), [settings, checked, disabled])

  const applyPreset = (key) => {
    const p = PRESETS[key]
    if (!p) return
    setSize(p.size)
    setActiveColor(p.activeColor)
    setInactiveColor(p.inactiveColor)
    setMarkerColor(p.markerColor)
    setBorderColor(p.borderColor)
    setBorderWidth(p.borderWidth)
    setMarkerSize(p.markerSize)
    setMarkerStyle(p.markerStyle)
    setTransitionDuration(p.transitionDuration)
    setShadow(p.shadow)
  }

  return (
    <CssToggleGeneratorShell
      icon={<BgColorsOutlined />}
      title={t.title}
      intro={t.intro}
      tipTitle={t.tipTitle}
      tipBody={t.tipBody}
      settingsTitle={t.settings}
      presetOrder={PRESET_ORDER}
      onPreset={applyPreset}
      settings={
        <>
          <SegmentedField
            label={t.markerStyle}
            value={markerStyle}
            onChange={setMarkerStyle}
            options={MARKER_OPTIONS[lang]}
            style={{ width: '100%', marginTop: 8 }}
          />

          <SliderField label={t.size} value={size} />
          <Slider min={12} max={96} value={size} onChange={setSize} />

          <SliderField label={t.markerSize} value={markerSize} unit="%" />
          <Slider min={10} max={90} value={markerSize} onChange={setMarkerSize} />

          <ColorField label={t.activeColor} value={activeColor} onChange={setActiveColor} />
          <ColorField label={t.inactiveColor} value={inactiveColor} onChange={setInactiveColor} />
          <ColorField label={t.markerColor} value={markerColor} onChange={setMarkerColor} />
          <ColorField label={t.borderColor} value={borderColor} onChange={setBorderColor} />

          <SliderField label={t.borderWidth} value={borderWidth} />
          <Slider min={0} max={12} value={borderWidth} onChange={setBorderWidth} />

          <SliderField label={t.transitionDuration} value={transitionDuration} unit="ms" />
          <Slider min={0} max={800} value={transitionDuration} onChange={setTransitionDuration} />

          <TextField
            label={t.shadow}
            value={shadow}
            onChange={(e) => setShadow(e.target.value)}
            placeholder="0 2px 4px rgba(0,0,0,0.15)"
          />

          <SwitchField label={t.disabled} checked={disabled} onChange={setDisabled} />
          <SwitchField label={t.checked} checked={checked} onChange={setChecked} />
        </>
      }
      previewTitle={t.preview}
      previewHint={t.previewHint}
      cssOutput={cssOutput}
      preview={
        <label className="custom-radio">
          <input
            type="radio"
            name="radio-preview"
            defaultChecked={checked}
            disabled={disabled}
          />
          <span className="radio-box" />
          <span className="label-text">{t.title}</span>
        </label>
      }
      presetsTitle={t.presets}
      cssLabel={t.outputCss}
      htmlLabel={t.outputHtml}
      fullLabel={t.outputFull}
      htmlOutput={htmlOutput}
      fullOutput={fullOutput}
      copyLabel={t.copy}
      copiedLabel={t.copied}
      copyErrorLabel={t.copyError}
      sourceLabel={`${t.sourceCol} — buildRadioButtonCss / buildRadioButtonHtml`}
      sourceBody={t.sourceBody}
      sourceCode={[
        buildRadioButtonCss.toString(),
        buildToggleControlCss.toString(),
        buildDotMarkerLines.toString(),
        buildRingMarkerLines.toString(),
        buildCheckMarkerLines.toString(),
      ].join('\n\n')}
    />
  )
}
