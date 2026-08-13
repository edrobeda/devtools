import React, { useMemo, useState } from 'react'
import {
  Typography, Card, Space, Slider, Segmented, Alert, Button, Collapse,
  message, ColorPicker, Row, Col, Input, Switch, Tabs,
} from 'antd'
import { BgColorsOutlined, CopyOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  buildAvatarCss,
  buildAvatarHtml,
  buildAvatarGroupCss,
  buildAvatarGroupHtml,
  buildAvatarFullDemo,
  ICON_SVGS,
  PRESETS,
  DEFAULTS,
  STATUS_COLORS,
} from '../utils/cssAvatarGenerator'

const { Title, Paragraph, Text } = Typography
const { useMessage } = message

const SHAPE_OPTIONS = {
  pt: [
    { label: 'Círculo', value: 'circle' },
    { label: 'Quadrado', value: 'square' },
    { label: 'Arredondado', value: 'rounded' },
    { label: 'Hexágono', value: 'hexagon' },
  ],
  en: [
    { label: 'Circle', value: 'circle' },
    { label: 'Square', value: 'square' },
    { label: 'Rounded', value: 'rounded' },
    { label: 'Hexagon', value: 'hexagon' },
  ],
}

const VARIANT_OPTIONS = {
  pt: [
    { label: 'Preenchido', value: 'filled' },
    { label: 'Gradiente', value: 'gradient' },
    { label: 'Contorno', value: 'outline' },
    { label: 'Suave', value: 'soft' },
  ],
  en: [
    { label: 'Filled', value: 'filled' },
    { label: 'Gradient', value: 'gradient' },
    { label: 'Outline', value: 'outline' },
    { label: 'Soft', value: 'soft' },
  ],
}

const CONTENT_OPTIONS = {
  pt: [
    { label: 'Iniciais', value: 'initials' },
    { label: 'Ícone', value: 'icon' },
  ],
  en: [
    { label: 'Initials', value: 'initials' },
    { label: 'Icon', value: 'icon' },
  ],
}

const STATUS_OPTIONS = {
  pt: [
    { label: 'Nenhum', value: 'none' },
    { label: 'Online', value: 'online' },
    { label: 'Offline', value: 'offline' },
    { label: 'Ausente', value: 'away' },
    { label: 'Ocupado', value: 'busy' },
  ],
  en: [
    { label: 'None', value: 'none' },
    { label: 'Online', value: 'online' },
    { label: 'Offline', value: 'offline' },
    { label: 'Away', value: 'away' },
    { label: 'Busy', value: 'busy' },
  ],
}

const STATUS_POSITION_OPTIONS = {
  pt: [
    { label: 'Inferior direito', value: 'bottom-right' },
    { label: 'Inferior esquerdo', value: 'bottom-left' },
    { label: 'Superior direito', value: 'top-right' },
    { label: 'Superior esquerdo', value: 'top-left' },
  ],
  en: [
    { label: 'Bottom right', value: 'bottom-right' },
    { label: 'Bottom left', value: 'bottom-left' },
    { label: 'Top right', value: 'top-right' },
    { label: 'Top left', value: 'top-left' },
  ],
}

const BADGE_OPTIONS = {
  pt: [
    { label: 'Nenhum', value: 'none' },
    { label: 'Ponto', value: 'dot' },
    { label: 'Número', value: 'number' },
  ],
  en: [
    { label: 'None', value: 'none' },
    { label: 'Dot', value: 'dot' },
    { label: 'Number', value: 'number' },
  ],
}

const BORDER_STYLE_OPTIONS = {
  pt: [
    { label: 'Sólida', value: 'solid' },
    { label: 'Tracejada', value: 'dashed' },
    { label: 'Pontilhada', value: 'dotted' },
  ],
  en: [
    { label: 'Solid', value: 'solid' },
    { label: 'Dashed', value: 'dashed' },
    { label: 'Dotted', value: 'dotted' },
  ],
}

const PRESET_ORDER = ['default', 'material', 'slack', 'discord', 'minimal', 'square', 'hexagon']

const translations = {
  pt: {
    heading: 'Gerador de Avatar CSS',
    intro: (
      <>
        Crie avatares usando só CSS: círculo, quadrado, arredondado ou hexágono,
        com iniciais ou ícone, anel de status, badge de notificação e grupo
        empilhado. O preview injeta exatamente o CSS gerado, então você vê o
        resultado final em tempo real.
      </>
    ),
    tipTitle: 'Como funciona (e as pegadinhas)',
    tipBody: (
      <>
        Um avatar é tipicamente um <Text code>{'<span>'}</Text> com{' '}
        <Text code>display: inline-flex</Text>, largura/altura fixas e texto
        centralizado. Use <Text code>border-radius: 50%</Text> para círculos ou{' '}
        <Text code>clip-path</Text> para hexágonos. O anel de status é um
        pseudo-elemento absoluto — lembre-se de deixar o pai com{' '}
        <Text code>position: relative</Text>. O grupo empilhado usa{' '}
        <Text code>margin-left</Text> negativo nos itens seguintes.
      </>
    ),
    settings: 'Configurações',
    presets: 'Presets',
    shape: 'Forma',
    variant: 'Variação visual',
    size: 'Tamanho (px)',
    content: 'Conteúdo',
    initials: 'Iniciais',
    fontSize: 'Tamanho da fonte (px)',
    fontWeight: 'Peso da fonte',
    background: 'Cor de fundo',
    background2: 'Cor do gradiente',
    textColor: 'Cor do texto',
    autoTextColor: 'Automática',
    border: 'Borda',
    borderWidth: 'Espessura da borda (px)',
    borderColor: 'Cor da borda',
    borderStyle: 'Estilo da borda',
    shadow: 'Box-shadow',
    status: 'Status',
    statusPosition: 'Posição do status',
    statusSize: 'Tamanho do status (px)',
    statusRingWidth: 'Espessura do anel (px)',
    badge: 'Badge',
    badgeNumber: 'Número do badge',
    badgeColor: 'Cor do badge',
    badgeTextColor: 'Cor do texto do badge',
    group: 'Mostrar grupo empilhado',
    groupCount: 'Avatares no grupo',
    groupOverlap: 'Sobreposição (px)',
    className: 'Nome da classe CSS',
    preview: 'Pré-visualização',
    previewHint: 'O avatar abaixo usa exatamente o CSS gerado.',
    outputCss: 'CSS gerado',
    outputHtml: 'HTML de exemplo',
    outputFull: 'Bloco completo',
    copy: 'Copiar',
    copied: 'Copiado!',
    copyError: 'Não foi possível copiar',
    sourceCol: 'Código-fonte',
    sourceBody:
      'O núcleo vive em src/utils/cssAvatarGenerator.js. buildAvatarCss monta as regras de .avatar a partir da forma, variação e cores; buildAvatarHtml gera o markup semântico; buildAvatarGroupCss e buildAvatarGroupHtml cuidam do empilhamento.',
  },
  en: {
    heading: 'CSS Avatar Generator',
    intro: (
      <>
        Build avatars using only CSS: circle, square, rounded or hexagon, with
        initials or icon, status ring, notification badge and stacked group. The
        preview injects the exact generated CSS, so you see the final result in
        real time.
      </>
    ),
    tipTitle: 'How it works (and the gotchas)',
    tipBody: (
      <>
        An avatar is usually a <Text code>{'<span>'}</Text> with{' '}
        <Text code>display: inline-flex</Text>, fixed width/height and centered
        text. Use <Text code>border-radius: 50%</Text> for circles or{' '}
        <Text code>clip-path</Text> for hexagons. The status ring is an absolute
        pseudo-element — remember to set <Text code>position: relative</Text>{' '}
        on the parent. The stacked group uses negative{' '}
        <Text code>margin-left</Text> on subsequent items.
      </>
    ),
    settings: 'Settings',
    presets: 'Presets',
    shape: 'Shape',
    variant: 'Visual variant',
    size: 'Size (px)',
    content: 'Content',
    initials: 'Initials',
    fontSize: 'Font size (px)',
    fontWeight: 'Font weight',
    background: 'Background color',
    background2: 'Gradient color',
    textColor: 'Text color',
    autoTextColor: 'Auto',
    border: 'Border',
    borderWidth: 'Border width (px)',
    borderColor: 'Border color',
    borderStyle: 'Border style',
    shadow: 'Box-shadow',
    status: 'Status',
    statusPosition: 'Status position',
    statusSize: 'Status size (px)',
    statusRingWidth: 'Ring width (px)',
    badge: 'Badge',
    badgeNumber: 'Badge number',
    badgeColor: 'Badge color',
    badgeTextColor: 'Badge text color',
    group: 'Show stacked group',
    groupCount: 'Avatars in group',
    groupOverlap: 'Overlap (px)',
    className: 'CSS class name',
    preview: 'Preview',
    previewHint: 'The avatar below uses the exact generated CSS.',
    outputCss: 'Generated CSS',
    outputHtml: 'Example HTML',
    outputFull: 'Full block',
    copy: 'Copy',
    copied: 'Copied!',
    copyError: 'Could not copy',
    sourceCol: 'Source code',
    sourceBody:
      'The core lives in src/utils/cssAvatarGenerator.js. buildAvatarCss builds the rules for .avatar based on shape, variant and colors; buildAvatarHtml generates semantic markup; buildAvatarGroupCss and buildAvatarGroupHtml handle stacking.',
  },
}

export default function CssAvatarGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [messageApi, messageContextHolder] = useMessage()

  const [shape, setShape] = useState(DEFAULTS.shape)
  const [variant, setVariant] = useState(DEFAULTS.variant)
  const [size, setSize] = useState(DEFAULTS.size)
  const [content, setContent] = useState(DEFAULTS.content)
  const [initials, setInitials] = useState(DEFAULTS.initials)
  const [fontSize, setFontSize] = useState(DEFAULTS.fontSize)
  const [fontWeight, setFontWeight] = useState(DEFAULTS.fontWeight)
  const [background, setBackground] = useState(DEFAULTS.background)
  const [background2, setBackground2] = useState(DEFAULTS.background2)
  const [textColor, setTextColor] = useState(DEFAULTS.textColor)
  const [autoText, setAutoText] = useState(DEFAULTS.textColor === 'auto')
  const [borderWidth, setBorderWidth] = useState(DEFAULTS.borderWidth)
  const [borderColor, setBorderColor] = useState(DEFAULTS.borderColor)
  const [borderStyle, setBorderStyle] = useState(DEFAULTS.borderStyle)
  const [shadow, setShadow] = useState(DEFAULTS.shadow)
  const [status, setStatus] = useState(DEFAULTS.status)
  const [statusPosition, setStatusPosition] = useState(DEFAULTS.statusPosition)
  const [statusSize, setStatusSize] = useState(DEFAULTS.statusSize)
  const [statusRingWidth, setStatusRingWidth] = useState(DEFAULTS.statusRingWidth)
  const [badge, setBadge] = useState(DEFAULTS.badge)
  const [badgeNumber, setBadgeNumber] = useState(DEFAULTS.badgeNumber)
  const [badgeColor, setBadgeColor] = useState(DEFAULTS.badgeColor)
  const [badgeTextColor, setBadgeTextColor] = useState(DEFAULTS.badgeTextColor)
  const [group, setGroup] = useState(DEFAULTS.group)
  const [groupCount, setGroupCount] = useState(DEFAULTS.groupCount)
  const [groupOverlap, setGroupOverlap] = useState(DEFAULTS.groupOverlap)
  const [className, setClassName] = useState(DEFAULTS.className)

  const applyPreset = (key) => {
    const p = PRESETS[key]
    if (!p) return
    setShape(p.shape)
    setVariant(p.variant)
    setSize(p.size)
    setContent(p.content)
    setInitials(p.initials)
    setFontSize(p.fontSize)
    setFontWeight(p.fontWeight)
    setBackground(p.background)
    setBackground2(p.background2)
    setTextColor(p.textColor)
    setAutoText(p.textColor === 'auto')
    setBorderWidth(p.borderWidth)
    setBorderColor(p.borderColor)
    setBorderStyle(p.borderStyle)
    setShadow(p.shadow)
    setStatus(p.status)
    setStatusPosition(p.statusPosition)
    setStatusSize(p.statusSize)
    setStatusRingWidth(p.statusRingWidth)
    setBadge(p.badge)
    setBadgeNumber(p.badgeNumber)
    setBadgeColor(p.badgeColor)
    setBadgeTextColor(p.badgeTextColor)
    setGroup(p.group)
    setGroupCount(p.groupCount)
    setGroupOverlap(p.groupOverlap)
    setClassName(p.className)
  }

  const settings = useMemo(
    () => ({
      shape,
      variant,
      size,
      content,
      initials,
      fontSize,
      fontWeight,
      background,
      background2,
      textColor: autoText ? 'auto' : textColor,
      borderWidth,
      borderColor,
      borderStyle,
      shadow,
      status,
      statusPosition,
      statusSize,
      statusRingWidth,
      badge,
      badgeNumber,
      badgeColor,
      badgeTextColor,
      group,
      groupCount,
      groupOverlap,
      className,
    }),
    [
      shape,
      variant,
      size,
      content,
      initials,
      fontSize,
      fontWeight,
      background,
      background2,
      autoText,
      textColor,
      borderWidth,
      borderColor,
      borderStyle,
      shadow,
      status,
      statusPosition,
      statusSize,
      statusRingWidth,
      badge,
      badgeNumber,
      badgeColor,
      badgeTextColor,
      group,
      groupCount,
      groupOverlap,
      className,
    ]
  )

  const cssOutput = useMemo(() => buildAvatarCss(settings), [settings])
  const htmlOutput = useMemo(() => (group ? buildAvatarGroupHtml(settings) : buildAvatarHtml(settings)), [settings, group])
  const fullOutput = useMemo(() => buildAvatarFullDemo(settings), [settings])
  const groupCssOutput = useMemo(() => (group ? buildAvatarGroupCss(settings) : ''), [settings, group])

  const copy = async (value) => {
    try {
      await navigator.clipboard.writeText(value)
      messageApi.success(t.copied)
    } catch {
      messageApi.error(t.copyError)
    }
  }

  const handleTextColorChange = (checked) => {
    setAutoText(checked)
    if (checked) setTextColor('auto')
  }

  const renderAvatar = (index) => {
    const initialsPool = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
    const displayInitials = group
      ? `${initialsPool[index % initialsPool.length]}${initialsPool[(index + 1) % initialsPool.length]}`
      : initials
    const isIcon = content === 'icon'
    const showStatus = !group && status !== 'none'
    const showBadge = !group && badge !== 'none'

    return (
      <span key={index} className={className}>
        {isIcon ? (
          <span dangerouslySetInnerHTML={{ __html: ICON_SVGS.user }} />
        ) : (
          <span className={`${className}__text`}>{displayInitials}</span>
        )}
        {showStatus && (
          <span className={`${className}__status`} style={{ background: STATUS_COLORS[status] }} />
        )}
        {showBadge && (
          <span className={`${className}__badge`}>
            {badge === 'dot' ? '' : badgeNumber}
          </span>
        )}
      </span>
    )
  }

  const outputTabs = [
    {
      key: 'css',
      label: t.outputCss,
      children: (
        <pre style={{ margin: 0, overflowX: 'auto' }}>
          <code>{cssOutput}{groupCssOutput ? `\n\n${groupCssOutput}` : ''}</code>
        </pre>
      ),
    },
    {
      key: 'html',
      label: t.outputHtml,
      children: (
        <pre style={{ margin: 0, overflowX: 'auto' }}>
          <code>{htmlOutput}</code>
        </pre>
      ),
    },
    {
      key: 'full',
      label: t.outputFull,
      children: (
        <pre style={{ margin: 0, overflowX: 'auto' }}>
          <code>{fullOutput}</code>
        </pre>
      ),
    },
  ]

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {messageContextHolder}
      <Title level={2}><BgColorsOutlined /> {t.heading}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Alert type="info" showIcon message={t.tipTitle} description={t.tipBody} />

      <Row gutter={[24, 24]}>
        <Col xs={24} md={10}>
          <Card title={t.settings}>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <Segmented
                style={{ width: '100%' }}
                block
                value={null}
                onChange={applyPreset}
                options={PRESET_ORDER.map((key) => ({
                  value: key,
                  label: key.charAt(0).toUpperCase() + key.slice(1),
                }))}
              />

              <Space direction="vertical" size={4} style={{ width: '100%', marginTop: 8 }}>
                <Text>{t.shape}</Text>
                <Segmented
                  style={{ width: '100%' }}
                  block
                  value={shape}
                  onChange={setShape}
                  options={SHAPE_OPTIONS[lang]}
                />
              </Space>

              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text>{t.variant}</Text>
                <Segmented
                  style={{ width: '100%' }}
                  block
                  value={variant}
                  onChange={setVariant}
                  options={VARIANT_OPTIONS[lang]}
                />
              </Space>

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.size}</Text>
                <Text code>{size}px</Text>
              </Space>
              <Slider min={24} max={160} value={size} onChange={setSize} />

              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text>{t.content}</Text>
                <Segmented
                  style={{ width: '100%' }}
                  block
                  value={content}
                  onChange={setContent}
                  options={CONTENT_OPTIONS[lang]}
                />
              </Space>

              {content === 'initials' && (
                <Space direction="vertical" size={4} style={{ width: '100%' }}>
                  <Text>{t.initials}</Text>
                  <Input
                    value={initials}
                    onChange={(e) => setInitials(e.target.value)}
                    maxLength={3}
                  />
                </Space>
              )}

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.fontSize}</Text>
                <Text code>{fontSize}px</Text>
              </Space>
              <Slider min={8} max={80} value={fontSize} onChange={setFontSize} />

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.fontWeight}</Text>
                <Text code>{fontWeight}</Text>
              </Space>
              <Slider min={100} max={900} step={100} value={fontWeight} onChange={setFontWeight} />

              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text>{t.background}</Text>
                <ColorPicker value={background} onChange={(color) => setBackground(color.toHexString())} showText />
              </Space>

              {variant === 'gradient' && (
                <Space direction="vertical" size={4} style={{ width: '100%' }}>
                  <Text>{t.background2}</Text>
                  <ColorPicker value={background2} onChange={(color) => setBackground2(color.toHexString())} showText />
                </Space>
              )}

              <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text>{t.autoTextColor}</Text>
                <Switch size="small" checked={autoText} onChange={handleTextColorChange} />
              </Space>

              {!autoText && (
                <Space direction="vertical" size={4} style={{ width: '100%' }}>
                  <Text>{t.textColor}</Text>
                  <ColorPicker value={textColor} onChange={(color) => setTextColor(color.toHexString())} showText />
                </Space>
              )}

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.borderWidth}</Text>
                <Text code>{borderWidth}px</Text>
              </Space>
              <Slider min={0} max={12} value={borderWidth} onChange={setBorderWidth} />

              {borderWidth > 0 && (
                <>
                  <Space direction="vertical" size={4} style={{ width: '100%' }}>
                    <Text>{t.borderColor}</Text>
                    <ColorPicker value={borderColor} onChange={(color) => setBorderColor(color.toHexString())} showText />
                  </Space>
                  <Space direction="vertical" size={4} style={{ width: '100%' }}>
                    <Text>{t.borderStyle}</Text>
                    <Segmented
                      style={{ width: '100%' }}
                      block
                      value={borderStyle}
                      onChange={setBorderStyle}
                      options={BORDER_STYLE_OPTIONS[lang]}
                    />
                  </Space>
                </>
              )}

              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text>{t.shadow}</Text>
                <Input
                  value={shadow}
                  onChange={(e) => setShadow(e.target.value)}
                  placeholder="0 2px 8px rgba(0, 0, 0, 0.15)"
                />
              </Space>

              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text>{t.status}</Text>
                <Segmented
                  style={{ width: '100%' }}
                  block
                  value={status}
                  onChange={setStatus}
                  options={STATUS_OPTIONS[lang]}
                />
              </Space>

              {status !== 'none' && (
                <>
                  <Space direction="vertical" size={4} style={{ width: '100%' }}>
                    <Text>{t.statusPosition}</Text>
                    <Segmented
                      style={{ width: '100%' }}
                      block
                      value={statusPosition}
                      onChange={setStatusPosition}
                      options={STATUS_POSITION_OPTIONS[lang]}
                    />
                  </Space>
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Text>{t.statusSize}</Text>
                    <Text code>{statusSize}px</Text>
                  </Space>
                  <Slider min={6} max={48} value={statusSize} onChange={setStatusSize} />
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Text>{t.statusRingWidth}</Text>
                    <Text code>{statusRingWidth}px</Text>
                  </Space>
                  <Slider min={0} max={8} value={statusRingWidth} onChange={setStatusRingWidth} />
                </>
              )}

              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text>{t.badge}</Text>
                <Segmented
                  style={{ width: '100%' }}
                  block
                  value={badge}
                  onChange={setBadge}
                  options={BADGE_OPTIONS[lang]}
                />
              </Space>

              {badge === 'number' && (
                <Space direction="vertical" size={4} style={{ width: '100%' }}>
                  <Text>{t.badgeNumber}</Text>
                  <Input
                    type="number"
                    min={0}
                    max={999}
                    value={badgeNumber}
                    onChange={(e) => setBadgeNumber(Number(e.target.value))}
                  />
                </Space>
              )}

              {badge !== 'none' && (
                <>
                  <Space direction="vertical" size={4} style={{ width: '100%' }}>
                    <Text>{t.badgeColor}</Text>
                    <ColorPicker value={badgeColor} onChange={(color) => setBadgeColor(color.toHexString())} showText />
                  </Space>
                  <Space direction="vertical" size={4} style={{ width: '100%' }}>
                    <Text>{t.badgeTextColor}</Text>
                    <ColorPicker value={badgeTextColor} onChange={(color) => setBadgeTextColor(color.toHexString())} showText />
                  </Space>
                </>
              )}

              <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text>{t.group}</Text>
                <Switch size="small" checked={group} onChange={setGroup} />
              </Space>

              {group && (
                <>
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Text>{t.groupCount}</Text>
                    <Text code>{groupCount}</Text>
                  </Space>
                  <Slider min={2} max={8} value={groupCount} onChange={setGroupCount} />
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Text>{t.groupOverlap}</Text>
                    <Text code>{groupOverlap}px</Text>
                  </Space>
                  <Slider min={0} max={48} value={groupOverlap} onChange={setGroupOverlap} />
                </>
              )}

              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text>{t.className}</Text>
                <Input value={className} onChange={(e) => setClassName(e.target.value)} />
              </Space>
            </Space>
          </Card>
        </Col>

        <Col xs={24} md={14}>
          <Card title={t.preview}>
            <style>{cssOutput}</style>
            {group && <style>{groupCssOutput}</style>}
            <div
              style={{
                border: '1px solid #f0f0f0',
                borderRadius: 8,
                padding: 40,
                background: '#fafafa',
                minHeight: 180,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexWrap: 'wrap',
                gap: 16,
              }}
            >
              {group ? (
                <div className={`${className}-group`}>
                  {Array.from({ length: groupCount }, (_, i) => renderAvatar(i))}
                </div>
              ) : (
                renderAvatar(0)
              )}
            </div>
            <Paragraph type="secondary" style={{ marginTop: 12, marginBottom: 0 }}>
              {t.previewHint}
            </Paragraph>
          </Card>
        </Col>
      </Row>

      <Card
        title={t.presets}
        extra={
          <Button size="small" icon={<CopyOutlined />} onClick={() => copy(cssOutput)}>
            {t.copy}
          </Button>
        }
      >
        <Tabs
          items={outputTabs}
          tabBarExtraContent={
            <Button size="small" icon={<CopyOutlined />} onClick={() => copy(fullOutput)}>
              {t.copy}
            </Button>
          }
        />
      </Card>

      <Collapse
        items={[
          {
            key: 'source',
            label: `${t.sourceCol} — buildAvatarCss / buildAvatarHtml`,
            children: (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Paragraph type="secondary">{t.sourceBody}</Paragraph>
                <pre style={{ margin: 0, overflowX: 'auto', maxHeight: 320 }}>
                  <code>{buildAvatarCss.toString()}</code>
                </pre>
              </Space>
            ),
          },
        ]}
      />
    </Space>
  )
}
