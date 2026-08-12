import React, { useMemo, useState } from 'react'
import {
  Typography, Card, Space, Button, Alert, Collapse, message, Select,
  Slider, Switch, Tag, Row, Col,
} from 'antd'
import { ColumnWidthOutlined, CopyOutlined, ReloadOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  COLUMN_COUNTS, COLUMN_WIDTHS, GAPS, RULE_WIDTHS, RULE_STYLES,
  COLUMN_SPANS, COLUMN_FILLS, BREAK_INSIDES, DEFAULT_SETTINGS, PRESETS,
  buildColumnsCss, buildContainerStyle, buildChildStyle, buildDemoHtml,
  buildFullDemo, buildSummary,
} from '../utils/cssColumnsGenerator'

const { Title, Paragraph, Text } = Typography
const { useMessage } = message
const { Option } = Select

const translations = {
  pt: {
    title: 'Gerador de CSS Columns (Multicol)',
    intro: (
      <>Monte layouts multi-coluna com <Text code>column-count</Text>, <Text code>column-width</Text>, <Text code>column-gap</Text> e <Text code>column-rule</Text>. Ideal para textos estilo revista, galerias responsivas e listas que fluem entre colunas.</>
    ),
    tipTitle: 'Como funciona (e as pegadinhas)',
    tipBody: (
      <>
        As propriedades <Text code>column-*</Text> dividem o conteúdo de um container em colunas. Se você definir <Text code>column-count</Text> e <Text code>column-width</Text> juntos, o navegador respeita o que gerar mais colunas (mas respeitando a largura mínima). <Text code>column-span: all</Text> faz um filho atravessar todas as colunas — útil para títulos. Cuidado com <Text code>break-inside: avoid</Text>: ele evita que um elemento seja partido entre colunas, mas pode deixar o layout com espaços vazios.
      </>
    ),
    preset: 'Preset',
    columns: 'Número de colunas',
    columnWidth: 'Largura mínima da coluna',
    auto: 'automático',
    gap: 'Espaçamento entre colunas',
    rule: 'Linha divisória (column-rule)',
    ruleWidth: 'Espessura',
    ruleStyle: 'Estilo',
    ruleColor: 'Cor',
    span: 'Elemento atravessa as colunas',
    fill: 'Preenchimento',
    fillBalance: 'balance (altura igual)',
    fillAuto: 'auto (preenche antes de quebrar)',
    breakInside: 'Evitar quebra interna',
    preview: 'Pré-visualização',
    output: 'CSS gerado',
    copy: 'Copiar',
    copied: 'Copiado!',
    copyError: 'Não foi possível copiar',
    reset: 'Redefinir padrão',
    sourceCol: 'Código-fonte',
    sourceBody:
      'O núcleo vive em src/utils/cssColumnsGenerator.js. buildColumnsCss monta as regras do container e dos filhos; buildContainerStyle e buildChildStyle devolvem objetos de estilo para o preview ao vivo.',
    summaryCols: 'cols',
    summaryGap: 'gap',
    summaryRule: 'rule',
  },
  en: {
    title: 'CSS Columns (Multicol) Generator',
    intro: (
      <>Build multi-column layouts with <Text code>column-count</Text>, <Text code>column-width</Text>, <Text code>column-gap</Text> and <Text code>column-rule</Text>. Great for magazine-style text, responsive galleries and lists that flow across columns.</>
    ),
    tipTitle: 'How it works (and the gotchas)',
    tipBody: (
      <>
        The <Text code>column-*</Text> properties split a container's content into columns. If you set both <Text code>column-count</Text> and <Text code>column-width</Text>, the browser uses whichever produces more columns (while respecting the minimum width). <Text code>column-span: all</Text> makes a child span every column — useful for headings. Be careful with <Text code>break-inside: avoid</Text>: it prevents an element from being split across columns, but can leave white gaps in the layout.
      </>
    ),
    preset: 'Preset',
    columns: 'Column count',
    columnWidth: 'Minimum column width',
    auto: 'auto',
    gap: 'Gap between columns',
    rule: 'Divider line (column-rule)',
    ruleWidth: 'Width',
    ruleStyle: 'Style',
    ruleColor: 'Color',
    span: 'Child spans all columns',
    fill: 'Fill',
    fillBalance: 'balance (equal height)',
    fillAuto: 'auto (fill before breaking)',
    breakInside: 'Avoid internal break',
    preview: 'Preview',
    output: 'Generated CSS',
    copy: 'Copy',
    copied: 'Copied!',
    copyError: 'Could not copy',
    reset: 'Reset to default',
    sourceCol: 'Source code',
    sourceBody:
      'The core lives in src/utils/cssColumnsGenerator.js. buildColumnsCss builds the container and child rules; buildContainerStyle and buildChildStyle return style objects for the live preview.',
    summaryCols: 'cols',
    summaryGap: 'gap',
    summaryRule: 'rule',
  },
}

const PRESET_LABELS = {
  pt: {
    magazine: 'Revista',
    newspaper: 'Jornal',
    gallery: 'Galeria responsiva',
    'two-col': 'Duas colunas',
  },
  en: {
    magazine: 'Magazine',
    newspaper: 'Newspaper',
    gallery: 'Responsive gallery',
    'two-col': 'Two columns',
  },
}

export default function CssColumnsGeneratorPage() {
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

  const containerStyle = useMemo(() => buildContainerStyle(settings), [settings])
  const childStyle = useMemo(() => buildChildStyle(settings), [settings])
  const cssOutput = useMemo(() => buildColumnsCss(settings), [settings])
  const fullOutput = useMemo(() => buildFullDemo(settings), [settings])
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
      <Title level={2}><ColumnWidthOutlined /> {t.title}</Title>
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

          <Card title="Configurações" style={{ marginTop: 16 }}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div>
                <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                  <Text>{t.columns}</Text>
                  <Select
                    value={settings.columnCount}
                    onChange={(v) => update({ columnCount: v })}
                    style={{ width: 120 }}
                    options={[
                      { value: 'auto', label: t.auto },
                      ...COLUMN_COUNTS.map((n) => ({ value: n, label: `${n}` })),
                    ]}
                  />
                </Space>
              </div>

              <div>
                <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                  <Text>{t.columnWidth}</Text>
                  <Select
                    value={settings.columnWidth}
                    onChange={(v) => update({ columnWidth: v })}
                    style={{ width: 120 }}
                    options={[
                      { value: 'auto', label: t.auto },
                      ...COLUMN_WIDTHS.filter((w) => w !== 'auto').map((w) => ({
                        value: w,
                        label: `${w}px`,
                      })),
                    ]}
                  />
                </Space>
              </div>

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
                <Text>{t.rule}</Text>
                <Space style={{ width: '100%', marginTop: 8 }} wrap>
                  <Select
                    value={settings.ruleWidth}
                    onChange={(v) => update({ ruleWidth: v })}
                    style={{ width: 100 }}
                    options={RULE_WIDTHS.map((w) => ({ value: w, label: `${w}px` }))}
                  />
                  <Select
                    value={settings.ruleStyle}
                    onChange={(v) => update({ ruleStyle: v })}
                    style={{ width: 120 }}
                    options={RULE_STYLES.map((s) => ({ value: s, label: s }))}
                  />
                  <Space align="center">
                    <input
                      type="color"
                      value={settings.ruleColor}
                      onChange={(e) => update({ ruleColor: e.target.value })}
                      style={{ width: 40, height: 32, border: 'none', cursor: 'pointer', background: 'none' }}
                    />
                    <Text code>{settings.ruleColor}</Text>
                  </Space>
                </Space>
              </div>

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.span}</Text>
                <Switch
                  checked={settings.span === 'all'}
                  onChange={(v) => update({ span: v ? 'all' : 'none' })}
                />
              </Space>

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.fill}</Text>
                <Select
                  value={settings.fill}
                  onChange={(v) => update({ fill: v })}
                  style={{ width: 180 }}
                  options={[
                    { value: 'balance', label: t.fillBalance },
                    { value: 'auto', label: t.fillAuto },
                  ]}
                />
              </Space>

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.breakInside}</Text>
                <Select
                  value={settings.breakInside}
                  onChange={(v) => update({ breakInside: v })}
                  style={{ width: 140 }}
                  options={BREAK_INSIDES.map((b) => ({ value: b, label: b }))}
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
              <div style={{ ...containerStyle }}>
                <h3 style={{ marginTop: 0, ...childStyle }}>{lang === 'pt' ? 'Título que atravessa todas as colunas' : 'Heading that spans every column'}</h3>
                <p style={childStyle}>{lang === 'pt' ? 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.' : 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.'}</p>
                <p style={childStyle}>{lang === 'pt' ? 'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.' : 'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.'}</p>
                <p style={childStyle}>{lang === 'pt' ? 'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.' : 'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.'}</p>
                <p style={childStyle}>{lang === 'pt' ? 'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.' : 'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.'}</p>
                <p style={childStyle}>{lang === 'pt' ? 'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium.' : 'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium.'}</p>
              </div>
            </div>
          </Card>

          <Card style={{ marginTop: 16 }}>
            <Space wrap size={[8, 8]}>
              {settings.columnCount !== 'auto' && (
                <Tag color="blue">{settings.columnCount} {t.summaryCols}</Tag>
              )}
              {settings.columnWidth !== 'auto' && (
                <Tag color="cyan">min {settings.columnWidth}px</Tag>
              )}
              {settings.gap > 0 && <Tag color="green">{settings.gap}px {t.summaryGap}</Tag>}
              {settings.ruleWidth > 0 && (
                <Tag color="orange">{settings.ruleWidth}px {t.summaryRule}</Tag>
              )}
              {settings.span !== 'none' && <Tag color="purple">column-span: {settings.span}</Tag>}
              {settings.breakInside !== 'auto' && <Tag color="volcano">{settings.breakInside}</Tag>}
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
          <code>{cssOutput || '/* selecione ao menos uma opção */'}</code>
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
            label: `${t.sourceCol} — buildColumnsCss`,
            children: (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Paragraph type="secondary">{t.sourceBody}</Paragraph>
                <pre style={{ margin: 0, overflowX: 'auto', maxHeight: 320 }}>
                  <code>{`${buildColumnsCss.toString()}\n\n${buildContainerStyle.toString()}\n\n${buildChildStyle.toString()}`}</code>
                </pre>
              </Space>
            ),
          },
        ]}
      />
    </Space>
  )
}
