import React, { useMemo, useState } from 'react'
import {
  Typography, Card, Space, Button, Alert, Collapse, message, ColorPicker,
  Row, Col, Input, InputNumber, Switch, Slider, Tag, Select,
} from 'antd'
import { BgColorsOutlined, CopyOutlined, ReloadOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  COLOR_NAMES,
  DEFAULT_SETTINGS,
  PRESETS,
  buildCustomPropertiesCss,
  buildPreviewHtml,
  buildColorScale,
} from '../utils/customPropertiesGenerator'

const { Title, Paragraph, Text } = Typography
const { useMessage } = message

const translations = {
  pt: {
    title: 'Gerador de CSS Custom Properties',
    intro: (
      <>Monte um conjunto de <Text code>CSS Custom Properties</Text> (design tokens) para padronizar cores, espaçamento, bordas, sombras e tipografia de um projeto — com preview ao vivo e código pronto para copiar.</>
    ),
    tipTitle: 'Como usar (e as pegadinhas)',
    tipBody: (
      <>
        Custom properties vivem em <Text code>:root</Text> e são acessadas com <Text code>var(--nome)</Text>. Use um prefixo curto e único do projeto (ex.: <Text code>dt-</Text>) para evitar colisão com bibliotecas. A função <Text code>adjustHexLightness</Text> clareia/escurece a cor base no espaço HSL, então tons muito claros/escuros são limitados artificialmente para não virarem branco/preto puro. Lembre-se: alterar um token no :root muda toda a interface que o usa — por isso a consistência vale a pena.
      </>
    ),
    preset: 'Preset',
    presetDefault: 'Padrão',
    presetDark: 'Escuro',
    presetPastel: 'Pastel',
    presetForest: 'Floresta',
    colors: 'Cores semânticas',
    colorsHint: 'Ajuste a cor base; as variantes light/dark são geradas automaticamente quando "Gerar tons" está ativo.',
    prefix: 'Prefixo das variáveis',
    includeShades: 'Gerar tons light/dark',
    lightFactor: 'Fator de clareamento',
    darkFactor: 'Fator de escurecimento',
    spacing: 'Escala de espaçamento',
    spacingUnit: 'Unidade base (rem)',
    spacingSteps: 'Número de passos',
    radius: 'Bordas arredondadas',
    radiusSm: 'Pequeno (rem)',
    radiusMd: 'Médio (rem)',
    radiusLg: 'Grande (rem)',
    shadows: 'Sombras',
    shadowsEnabled: 'Incluir sombras',
    shadowColor: 'Cor da sombra',
    typography: 'Tipografia',
    preview: 'Preview ao vivo',
    output: 'CSS gerado',
    copy: 'Copiar',
    copied: 'Copiado!',
    copyError: 'Não foi possível copiar',
    reset: 'Redefinir padrão',
    sourceCol: 'Código-fonte',
    sourceBody:
      'O núcleo vive em src/utils/customPropertiesGenerator.js. buildCustomPropertiesCss monta o bloco :root; buildColorScale deriva as variantes light/dark via adjustHexLightness no espaço HSL.',
    tagsColors: 'cores',
    tagsTokens: 'tokens',
  },
  en: {
    title: 'CSS Custom Properties Generator',
    intro: (
      <>Build a set of <Text code>CSS Custom Properties</Text> (design tokens) to standardize colors, spacing, borders, shadows and typography across a project — with a live preview and copy-ready code.</>
    ),
    tipTitle: 'How to use (and the gotchas)',
    tipBody: (
      <>
        Custom properties live in <Text code>:root</Text> and are accessed with <Text code>var(--name)</Text>. Use a short, project-specific prefix (e.g. <Text code>dt-</Text>) to avoid collisions with libraries. The <Text code>adjustHexLightness</Text> function lightens/darkens the base color in HSL space, and extreme shades are clamped so they never become pure white/black. Remember: changing one token in :root updates every place that uses it — that consistency is the whole point.
      </>
    ),
    preset: 'Preset',
    presetDefault: 'Default',
    presetDark: 'Dark',
    presetPastel: 'Pastel',
    presetForest: 'Forest',
    colors: 'Semantic colors',
    colorsHint: 'Adjust the base color; light/dark variants are generated automatically when "Generate shades" is on.',
    prefix: 'Variable prefix',
    includeShades: 'Generate light/dark shades',
    lightFactor: 'Lighten factor',
    darkFactor: 'Darken factor',
    spacing: 'Spacing scale',
    spacingUnit: 'Base unit (rem)',
    spacingSteps: 'Number of steps',
    radius: 'Border radius',
    radiusSm: 'Small (rem)',
    radiusMd: 'Medium (rem)',
    radiusLg: 'Large (rem)',
    shadows: 'Shadows',
    shadowsEnabled: 'Include shadows',
    shadowColor: 'Shadow color',
    typography: 'Typography',
    preview: 'Live preview',
    output: 'Generated CSS',
    copy: 'Copy',
    copied: 'Copied!',
    copyError: 'Could not copy',
    reset: 'Reset to default',
    sourceCol: 'Source code',
    sourceBody:
      'The core lives in src/utils/customPropertiesGenerator.js. buildCustomPropertiesCss builds the :root block; buildColorScale derives light/dark variants via adjustHexLightness in HSL space.',
    tagsColors: 'colors',
    tagsTokens: 'tokens',
  },
}

const PRESET_LABELS = {
  pt: {
    default: 'Padrão',
    dark: 'Escuro',
    pastel: 'Pastel',
    forest: 'Floresta',
  },
  en: {
    default: 'Default',
    dark: 'Dark',
    pastel: 'Pastel',
    forest: 'Forest',
  },
}

function colorLabel(name, lang) {
  const labels = {
    pt: {
      primary: 'Primária',
      secondary: 'Secundária',
      success: 'Sucesso',
      warning: 'Aviso',
      error: 'Erro',
      info: 'Info',
      background: 'Fundo',
      surface: 'Superfície',
      text: 'Texto',
    },
    en: {
      primary: 'Primary',
      secondary: 'Secondary',
      success: 'Success',
      warning: 'Warning',
      error: 'Error',
      info: 'Info',
      background: 'Background',
      surface: 'Surface',
      text: 'Text',
    },
  }
  return labels[lang][name] || name
}

export default function CustomPropertiesGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [messageApi, messageContextHolder] = useMessage()

  const [settings, setSettings] = useState(DEFAULT_SETTINGS)

  const update = (patch) => setSettings((prev) => ({ ...prev, ...patch }))
  const updateColor = (name, value) => {
    setSettings((prev) => ({
      ...prev,
      colors: { ...prev.colors, [name]: value },
    }))
  }
  const updateRadius = (patch) => {
    setSettings((prev) => ({ ...prev, radius: { ...prev.radius, ...patch } }))
  }
  const updateTypography = (patch) => {
    setSettings((prev) => ({ ...prev, typography: { ...prev.typography, ...patch } }))
  }
  const updateShadows = (patch) => {
    setSettings((prev) => ({ ...prev, shadows: { ...prev.shadows, ...patch } }))
  }

  const applyPreset = (key) => {
    const p = PRESETS.find((x) => x.key === key)
    if (p) setSettings((prev) => ({ ...prev, colors: p.colors }))
  }

  const reset = () => setSettings(DEFAULT_SETTINGS)

  const cssOutput = useMemo(() => buildCustomPropertiesCss(settings), [settings])
  const fullOutput = useMemo(() => buildPreviewHtml(cssOutput), [cssOutput])

  const tokenCount = useMemo(() => {
    let count = COLOR_NAMES.length * (settings.includeShades ? 3 : 1)
    count += settings.spacingSteps
    count += 3 // radius
    if (settings.shadows.enabled) count += 3
    count += 5 // typography
    return count
  }, [settings])

  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      messageApi.success(t.copied)
    } catch {
      messageApi.error(t.copyError)
    }
  }

  const prefix = (settings.prefix || 'dt').trim().replace(/[^a-zA-Z0-9_-]/g, '-') || 'dt'

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {messageContextHolder}
      <Title level={2}><BgColorsOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Alert type="info" showIcon message={t.tipTitle} description={t.tipBody} />

      <Row gutter={[24, 24]}>
        <Col xs={24} md={10}>
          <Card size="small" title={t.preset}>
            <Select
              style={{ width: '100%' }}
              placeholder={t.preset}
              value={null}
              onChange={applyPreset}
              options={PRESETS.map((p) => ({
                value: p.key,
                label: PRESET_LABELS[lang][p.key],
              }))}
            />
          </Card>

          <Card title={t.colors} style={{ marginTop: 16 }}>
            <Paragraph type="secondary" style={{ fontSize: 12 }}>
              {t.colorsHint}
            </Paragraph>
            <Row gutter={[12, 12]}>
              {COLOR_NAMES.map((name) => (
                <Col xs={12} key={name}>
                  <Space direction="vertical" size={2} style={{ width: '100%' }}>
                    <Text>{colorLabel(name, lang)}</Text>
                    <ColorPicker
                      value={settings.colors[name]}
                      onChange={(c) => updateColor(name, c.toHexString())}
                      showText
                      style={{ width: '100%' }}
                    />
                  </Space>
                </Col>
              ))}
            </Row>
          </Card>

          <Card title={t.prefix} style={{ marginTop: 16 }}>
            <Input
              value={settings.prefix}
              onChange={(e) => update({ prefix: e.target.value })}
              placeholder="dt"
            />
            <Space style={{ width: '100%', justifyContent: 'space-between', marginTop: 16 }}>
              <Text>{t.includeShades}</Text>
              <Switch checked={settings.includeShades} onChange={(v) => update({ includeShades: v })} />
            </Space>
            {settings.includeShades && (
              <>
                <div style={{ marginTop: 16 }}>
                  <Text>{t.lightFactor}</Text>
                  <Slider
                    min={0}
                    max={0.6}
                    step={0.02}
                    value={settings.lightFactor}
                    onChange={(v) => update({ lightFactor: v })}
                  />
                </div>
                <div style={{ marginTop: 8 }}>
                  <Text>{t.darkFactor}</Text>
                  <Slider
                    min={-0.6}
                    max={0}
                    step={0.02}
                    value={settings.darkFactor}
                    onChange={(v) => update({ darkFactor: v })}
                  />
                </div>
              </>
            )}
          </Card>

          <Card title={t.spacing} style={{ marginTop: 16 }}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.spacingUnit}</Text>
                <InputNumber
                  min={0.125}
                  max={1}
                  step={0.125}
                  value={settings.spacingUnit}
                  onChange={(v) => update({ spacingUnit: v ?? 0.25 })}
                  style={{ width: 90 }}
                />
              </Space>
              <div>
                <Text>{t.spacingSteps}</Text>
                <Slider
                  min={1}
                  max={8}
                  step={1}
                  value={settings.spacingSteps}
                  onChange={(v) => update({ spacingSteps: v })}
                />
              </div>
            </Space>
          </Card>

          <Card title={t.radius} style={{ marginTop: 16 }}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              {['sm', 'md', 'lg'].map((key) => (
                <Space key={key} style={{ width: '100%', justifyContent: 'space-between' }}>
                  <Text>{t[`radius${key.charAt(0).toUpperCase()}${key.slice(1)}`]}</Text>
                  <InputNumber
                    min={0}
                    max={4}
                    step={0.125}
                    value={settings.radius[key]}
                    onChange={(v) => updateRadius({ [key]: v ?? 0 })}
                    style={{ width: 90 }}
                  />
                </Space>
              ))}
            </Space>
          </Card>

          <Card title={t.shadows} style={{ marginTop: 16 }}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.shadowsEnabled}</Text>
                <Switch checked={settings.shadows.enabled} onChange={(v) => updateShadows({ enabled: v })} />
              </Space>
              {settings.shadows.enabled && (
                <ColorPicker
                  value={settings.shadows.color}
                  onChange={(c) => updateShadows({ color: c.toHexString() })}
                  showText
                />
              )}
            </Space>
          </Card>

          <Card title={t.typography} style={{ marginTop: 16 }}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              {['xs', 'sm', 'md', 'lg', 'xl'].map((key) => (
                <Space key={key} style={{ width: '100%', justifyContent: 'space-between' }}>
                  <Text style={{ textTransform: 'uppercase' }}>{key}</Text>
                  <InputNumber
                    min={0.5}
                    max={4}
                    step={0.125}
                    value={settings.typography[key]}
                    onChange={(v) => updateTypography({ [key]: v ?? 1 })}
                    style={{ width: 90 }}
                  />
                </Space>
              ))}
            </Space>
          </Card>

          <Button icon={<ReloadOutlined />} onClick={reset} block style={{ marginTop: 16 }}>
            {t.reset}
          </Button>
        </Col>

        <Col xs={24} md={14}>
          <Card title={t.preview}>
            <style>{cssOutput}</style>
            <div style={{
              border: '1px solid #f0f0f0',
              borderRadius: 8,
              padding: 24,
              background: `var(--${prefix}-color-background)`,
              minHeight: 280,
            }}>
              <div style={{
                background: `var(--${prefix}-color-surface)`,
                color: `var(--${prefix}-color-text)`,
                padding: `var(--${prefix}-space-lg)`,
                borderRadius: `var(--${prefix}-radius-lg)`,
                boxShadow: settings.shadows.enabled ? `var(--${prefix}-shadow-md)` : 'none',
                maxWidth: 420,
              }}>
                <h3 style={{
                  margin: `0 0 var(--${prefix}-space-sm)`,
                  color: `var(--${prefix}-color-text)`,
                  fontSize: `var(--${prefix}-font-size-xl)`,
                }}>
                  Preview
                </h3>
                <p style={{
                  margin: `0 0 var(--${prefix}-space-md)`,
                  color: settings.includeShades ? `var(--${prefix}-color-text-light)` : `var(--${prefix}-color-text)`,
                  fontSize: `var(--${prefix}-font-size-md)`,
                }}>
                  {lang === 'pt' ? 'Este card usa os tokens gerados no :root.' : 'This card uses the generated :root tokens.'}
                </p>
                <Space size={`var(--${prefix}-space-sm)`} wrap>
                  <button type="button" style={{
                    background: `var(--${prefix}-color-primary)`,
                    color: '#fff',
                    border: 'none',
                    padding: `var(--${prefix}-space-sm) var(--${prefix}-space-md)`,
                    borderRadius: `var(--${prefix}-radius-md)`,
                    boxShadow: settings.shadows.enabled ? `var(--${prefix}-shadow-sm)` : 'none',
                    fontSize: `var(--${prefix}-font-size-md)`,
                    cursor: 'pointer',
                  }}>
                    Primary
                  </button>
                  <button type="button" style={{
                    background: `var(--${prefix}-color-secondary)`,
                    color: '#fff',
                    border: 'none',
                    padding: `var(--${prefix}-space-sm) var(--${prefix}-space-md)`,
                    borderRadius: `var(--${prefix}-radius-md)`,
                    fontSize: `var(--${prefix}-font-size-md)`,
                    cursor: 'pointer',
                  }}>
                    Secondary
                  </button>
                </Space>
                <div style={{
                  marginTop: `var(--${prefix}-space-md)`,
                  display: 'flex',
                  gap: `var(--${prefix}-space-xs)`,
                }}>
                  {['success', 'warning', 'error', 'info'].map((name) => (
                    <span key={name} style={{
                      background: `var(--${prefix}-color-${name}${settings.includeShades ? '' : ''})`,
                      color: '#fff',
                      padding: `var(--${prefix}-space-xs) var(--${prefix}-space-sm)`,
                      borderRadius: `var(--${prefix}-radius-sm)`,
                      fontSize: `var(--${prefix}-font-size-xs)`,
                    }}>
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          <Card style={{ marginTop: 16 }}>
            <Space wrap size={[8, 8]}>
              <Tag color="blue">{COLOR_NAMES.length} {t.tagsColors}</Tag>
              <Tag color="green">{tokenCount} {t.tagsTokens}</Tag>
              <Tag color="orange">--{prefix}...</Tag>
            </Space>
          </Card>
        </Col>
      </Row>

      <Card
        title={t.output}
        extra={(
          <Button size="small" icon={<CopyOutlined />} onClick={() => copy(cssOutput)}>{t.copy}</Button>
        )}
      >
        <pre style={{ margin: 0, overflowX: 'auto', maxHeight: 480 }}>
          <code>{cssOutput}</code>
        </pre>
      </Card>

      <Collapse
        items={[
          {
            key: 'full',
            label: 'CSS + HTML',
            children: (
              <Card
                title=""
                extra={<Button size="small" icon={<CopyOutlined />} onClick={() => copy(fullOutput)}>{t.copy}</Button>}
              >
                <pre style={{ margin: 0, overflowX: 'auto', maxHeight: 420 }}>
                  <code>{fullOutput}</code>
                </pre>
              </Card>
            ),
          },
          {
            key: 'source',
            label: `${t.sourceCol} — buildCustomPropertiesCss / buildColorScale`,
            children: (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Paragraph type="secondary">{t.sourceBody}</Paragraph>
                <pre style={{ margin: 0, overflowX: 'auto', maxHeight: 320 }}>
                  <code>{`${buildCustomPropertiesCss.toString()}\n\n${buildColorScale.toString()}`}</code>
                </pre>
              </Space>
            ),
          },
        ]}
      />
    </Space>
  )
}
