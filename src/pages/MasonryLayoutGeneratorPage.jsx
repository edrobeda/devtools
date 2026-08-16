import React, { useMemo, useState } from 'react'
import {
  Typography, Card, Space, Button, Alert, Collapse, message, Select,
  Slider, Switch, Tag, Row, Col, InputNumber,
} from 'antd'
import { AppstoreOutlined, CopyOutlined, ReloadOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  DEFAULT_SETTINGS, PRESETS,
  generateItems, buildContainerStyle, buildItemStyle,
  buildMasonryCss, buildHtml, buildFullDemo, buildSummary,
} from '../utils/masonryLayoutGenerator'

const { Title, Paragraph, Text } = Typography
const { useMessage } = message

const translations = {
  pt: {
    title: 'Gerador de Layout Masonry CSS',
    intro: (
      <>Crie grades estilo Pinterest com colunas fluindo verticalmente usando <Text code>column-count</Text> ou o modo experimental <Text code>grid-template-rows: masonry</Text>. Ajuste colunas, espaçamento, estilo dos itens e copie o CSS pronto para usar.</>
    ),
    tipTitle: 'Dica de uso',
    tipBody: (
      <>
        O modo <Text code>columns</Text> tem suporte amplo nos navegadores e funciona bem com <Text code>break-inside: avoid</Text> para evitar que itens sejam cortados entre colunas. O modo <Text code>grid</Text> usa a sintaxe nativa de masonry do CSS Grid, ainda em fase de adoção — teste no Firefox e nas versões mais recentes do Chrome/Edge.
      </>
    ),
    preset: 'Preset',
    mode: 'Modo de layout',
    modeColumns: 'CSS Columns',
    modeGrid: 'CSS Grid masonry',
    columns: 'Colunas',
    gap: 'Espaçamento',
    itemRadius: 'Arredondamento do item',
    itemPadding: 'Padding do item',
    itemBackground: 'Cor de fundo do item',
    breakInside: 'Evitar quebra interna (break-inside: avoid)',
    itemCount: 'Quantidade de itens no preview',
    responsive: 'Incluir media queries responsivas',
    preview: 'Pré-visualização',
    output: 'CSS gerado',
    html: 'HTML de exemplo',
    full: 'CSS + HTML completos',
    copy: 'Copiar',
    copied: 'Copiado!',
    copyError: 'Não foi possível copiar',
    reset: 'Redefinir padrão',
    sourceCol: 'Código-fonte',
    sourceBody:
      'O motor mora em src/utils/masonryLayoutGenerator.js. buildMasonryCss monta as regras do container e dos itens; buildContainerStyle e buildItemStyle devolvem objetos de estilo para o preview ao vivo.',
    summaryCols: 'cols',
    summaryGap: 'gap',
    summaryRadius: 'radius',
    summaryResponsive: 'responsive',
  },
  en: {
    title: 'CSS Masonry Layout Generator',
    intro: (
      <>Build Pinterest-style layouts with vertically flowing columns using <Text code>column-count</Text> or the experimental <Text code>grid-template-rows: masonry</Text>. Tweak columns, gap, item style and copy the ready-to-use CSS.</>
    ),
    tipTitle: 'Usage tip',
    tipBody: (
      <>
        The <Text code>columns</Text> mode has broad browser support and works well with <Text code>break-inside: avoid</Text> to prevent items from being split across columns. The <Text code>grid</Text> mode uses the native CSS Grid masonry syntax, still gaining adoption — test it in Firefox and the latest Chrome/Edge versions.
      </>
    ),
    preset: 'Preset',
    mode: 'Layout mode',
    modeColumns: 'CSS Columns',
    modeGrid: 'CSS Grid masonry',
    columns: 'Columns',
    gap: 'Gap',
    itemRadius: 'Item radius',
    itemPadding: 'Item padding',
    itemBackground: 'Item background',
    breakInside: 'Avoid internal break (break-inside: avoid)',
    itemCount: 'Preview item count',
    responsive: 'Include responsive media queries',
    preview: 'Preview',
    output: 'Generated CSS',
    html: 'Sample HTML',
    full: 'Full CSS + HTML',
    copy: 'Copy',
    copied: 'Copied!',
    copyError: 'Could not copy',
    reset: 'Reset to default',
    sourceCol: 'Source code',
    sourceBody:
      'The engine lives in src/utils/masonryLayoutGenerator.js. buildMasonryCss builds the container and item rules; buildContainerStyle and buildItemStyle return style objects for the live preview.',
    summaryCols: 'cols',
    summaryGap: 'gap',
    summaryRadius: 'radius',
    summaryResponsive: 'responsive',
  },
}

const PRESET_LABELS = {
  pt: {
    pinterest: 'Estilo Pinterest (colunas)',
    photos: 'Galeria de fotos (grid masonry)',
    minimal: 'Minimalista',
    cards: 'Cards coloridos',
  },
  en: {
    pinterest: 'Pinterest-like (columns)',
    photos: 'Photo gallery (grid masonry)',
    minimal: 'Minimal',
    cards: 'Colorful cards',
  },
}

export default function MasonryLayoutGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [messageApi, messageContextHolder] = useMessage()

  const [settings, setSettings] = useState(DEFAULT_SETTINGS)

  const update = (patch) => setSettings((prev) => ({ ...prev, ...patch }))

  const applyPreset = (key) => {
    const p = PRESETS.find((x) => x.key === key)
    if (p) setSettings(p.settings)
  }

  const reset = () => setSettings(DEFAULT_SETTINGS)

  const items = useMemo(() => generateItems(settings.itemCount), [settings.itemCount])
  const containerStyle = useMemo(() => buildContainerStyle(settings), [settings])
  const itemStyle = useMemo(() => buildItemStyle(settings), [settings])
  const cssOutput = useMemo(() => buildMasonryCss(settings), [settings])
  const htmlOutput = useMemo(() => buildHtml(settings, items), [settings, items])
  const fullOutput = useMemo(() => buildFullDemo(settings, items), [settings, items])
  const summary = useMemo(() => buildSummary(settings), [settings])

  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      messageApi.success(t.copied)
    } catch {
      messageApi.error(t.copyError)
    }
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {messageContextHolder}
      <Title level={2}><AppstoreOutlined /> {t.title}</Title>
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

          <Card title={lang === 'pt' ? 'Configurações' : 'Settings'} style={{ marginTop: 16 }}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.mode}</Text>
                <Select
                  value={settings.mode}
                  onChange={(v) => update({ mode: v })}
                  style={{ width: 170 }}
                  options={[
                    { value: 'columns', label: t.modeColumns },
                    { value: 'grid', label: t.modeGrid },
                  ]}
                />
              </Space>

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.columns}</Text>
                <InputNumber
                  min={1}
                  max={6}
                  value={settings.columns}
                  onChange={(v) => update({ columns: v })}
                />
              </Space>

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.itemCount}</Text>
                <InputNumber
                  min={1}
                  max={30}
                  value={settings.itemCount}
                  onChange={(v) => update({ itemCount: v })}
                />
              </Space>

              <div>
                <Text>{t.gap}: {settings.gap}px</Text>
                <Slider
                  min={0}
                  max={64}
                  step={4}
                  value={settings.gap}
                  onChange={(v) => update({ gap: v })}
                />
              </div>

              <div>
                <Text>{t.itemRadius}: {settings.itemRadius}px</Text>
                <Slider
                  min={0}
                  max={32}
                  step={4}
                  value={settings.itemRadius}
                  onChange={(v) => update({ itemRadius: v })}
                />
              </div>

              <div>
                <Text>{t.itemPadding}: {settings.itemPadding}px</Text>
                <Slider
                  min={0}
                  max={32}
                  step={4}
                  value={settings.itemPadding}
                  onChange={(v) => update({ itemPadding: v })}
                />
              </div>

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.itemBackground}</Text>
                <Space align="center">
                  <input
                    type="color"
                    value={settings.itemBackground}
                    onChange={(e) => update({ itemBackground: e.target.value })}
                    style={{ width: 40, height: 32, border: 'none', cursor: 'pointer', background: 'none' }}
                  />
                  <Text code>{settings.itemBackground}</Text>
                </Space>
              </Space>

              {settings.mode === 'columns' && (
                <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                  <Text>{t.breakInside}</Text>
                  <Switch
                    checked={settings.breakInside}
                    onChange={(v) => update({ breakInside: v })}
                  />
                </Space>
              )}

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.responsive}</Text>
                <Switch
                  checked={settings.responsive}
                  onChange={(v) => update({ responsive: v })}
                />
              </Space>

              <Button icon={<ReloadOutlined />} onClick={reset} block>{t.reset}</Button>
            </Space>
          </Card>
        </Col>

        <Col xs={24} md={14}>
          <Card title={t.preview}>
            <div
              style={{
                border: '1px solid #f0f0f0',
                borderRadius: 8,
                padding: 24,
                background: '#fafafa',
                minHeight: 240,
              }}
            >
              <div style={containerStyle}>
                {items.map((it) => (
                  <div
                    key={it.id}
                    className="masonry-item"
                    style={{
                      ...itemStyle,
                      height: it.height,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 600,
                      color: 'rgba(0,0,0,0.45)',
                    }}
                  >
                    {it.id}
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <Card style={{ marginTop: 16 }}>
            <Space wrap size={[8, 8]}>
              <Tag color="blue">{settings.columns} {t.summaryCols}</Tag>
              {settings.gap > 0 && <Tag color="green">{settings.gap}px {t.summaryGap}</Tag>}
              {settings.itemRadius > 0 && <Tag color="orange">{settings.itemRadius}px {t.summaryRadius}</Tag>}
              {settings.responsive && <Tag color="purple">{t.summaryResponsive}</Tag>}
              <Tag color="cyan">{summary.split(' · ')[0]}</Tag>
            </Space>
          </Card>
        </Col>
      </Row>

      <Card
        title={t.output}
        extra={(
          <Space>
            <Button size="small" icon={<CopyOutlined />} onClick={() => copy(cssOutput)}>{t.copy}</Button>
          </Space>
        )}
      >
        <pre style={{ margin: 0, overflowX: 'auto', maxHeight: 420 }}>
          <code>{cssOutput}</code>
        </pre>
      </Card>

      <Collapse
        items={[
          {
            key: 'html',
            label: t.html,
            children: (
              <Card
                title=""
                extra={<Button size="small" icon={<CopyOutlined />} onClick={() => copy(htmlOutput)}>{t.copy}</Button>}
              >
                <pre style={{ margin: 0, overflowX: 'auto', maxHeight: 420 }}>
                  <code>{htmlOutput}</code>
                </pre>
              </Card>
            ),
          },
          {
            key: 'full',
            label: t.full,
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
            label: `${t.sourceCol} — buildMasonryCss`,
            children: (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Paragraph type="secondary">{t.sourceBody}</Paragraph>
                <pre style={{ margin: 0, overflowX: 'auto', maxHeight: 320 }}>
                  <code>{`${buildMasonryCss.toString()}\n\n${buildContainerStyle.toString()}\n\n${buildItemStyle.toString()}`}</code>
                </pre>
              </Space>
            ),
          },
        ]}
      />
    </Space>
  )
}
