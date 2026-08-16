import React, { useMemo, useState } from 'react'
import {
  Typography,
  Card,
  Space,
  Slider,
  InputNumber,
  Segmented,
  Button,
  Collapse,
  message,
  Row,
  Col,
  Select,
  Table,
  Tag,
} from 'antd'
import { FontSizeOutlined, CopyOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  PRESETS,
  buildScale,
  generateCssVariables,
  generateUtilityClasses,
  generateMarkdownTable,
} from '../utils/typographyScaleCalculator'

const { Title, Paragraph, Text } = Typography
const { useMessage } = message
const { Panel } = Collapse

const UNIT_OPTIONS = [
  { label: 'rem', value: 'rem' },
  { label: 'px', value: 'px' },
]

const PRESET_LABEL = {
  golden: { pt: 'Proporção Áurea', en: 'Golden Ratio' },
  fourth: { pt: 'Quarta Justa', en: 'Perfect Fourth' },
  majorThird: { pt: 'Terça Maior', en: 'Major Third' },
  minorThird: { pt: 'Terça Menor', en: 'Minor Third' },
  majorSecond: { pt: 'Segunda Maior', en: 'Major Second' },
  custom: { pt: 'Personalizada', en: 'Custom' },
}

const translations = {
  pt: {
    title: 'Calculadora de Escala Tipográfica',
    intro: (
      <>
        Monte uma escala modular de tamanhos de fonte para o seu design system.{' '}
        A partir de um tamanho base e uma razão (proporção áurea, terças,
        segundas etc.), cada passo sobe ou desce geometricamente, gerando uma
        hierarquia harmoniosa de títulos, corpo e textos pequenos. O output em{' '}
        <Text code>rem</Text> respeita as preferências de acessibilidade do
        usuário.
      </>
    ),
    settings: 'Configurações',
    preset: 'Razão / preset',
    customRatio: 'Razão personalizada',
    baseSize: 'Tamanho base',
    stepsUp: 'Passos acima do base',
    stepsDown: 'Passos abaixo do base',
    decimals: 'Casas decimais',
    unit: 'Unidade de saída',
    lineHeight: 'Altura de linha',
    preview: 'Pré-visualização',
    previewHint: 'Amostra de cada passo com o tamanho e a altura de linha calculados.',
    tableStep: 'Step',
    tableSize: 'Tamanho',
    tablePx: 'px',
    tableLineHeight: 'Line-height',
    outputVariables: 'CSS variables',
    outputClasses: 'Classes utilitárias',
    outputMarkdown: 'Tabela Markdown',
    copy: 'Copiar',
    copied: 'Copiado!',
    copyError: 'Não foi possível copiar',
    sourceTitle: 'Código-fonte do motor',
    sourceBody:
      'O núcleo vive em src/utils/typographyScaleCalculator.js. buildScale recebe base, ratio, up, down, decimals, unit e lineHeight; valida os limites; itera de -down até +up e calcula cada passo como base × ratio^i. A função formatValue converte para rem quando solicitado (dividindo por 16) e arredonda para o número de casas decimais configurado. generateCssVariables, generateUtilityClasses e generateMarkdownTable formatam a mesma estrutura para os três outputs da página.',
    sampleText: 'O rápuro marrom rapa salta sobre o cão preguiçoso.',
    sampleHeading: 'Título de exemplo',
  },
  en: {
    title: 'Typography Scale Calculator',
    intro: (
      <>
        Build a modular type scale for your design system. From a base size and a
        ratio (golden ratio, perfect fourth, major/minor third, etc.), each step
        moves up or down geometrically, producing a harmonious hierarchy of
        headings, body text and small print. The <Text code>rem</Text> output
        respects user accessibility preferences.
      </>
    ),
    settings: 'Settings',
    preset: 'Ratio / preset',
    customRatio: 'Custom ratio',
    baseSize: 'Base size',
    stepsUp: 'Steps above base',
    stepsDown: 'Steps below base',
    decimals: 'Decimal places',
    unit: 'Output unit',
    lineHeight: 'Line height',
    preview: 'Preview',
    previewHint: 'Sample of each step with the computed size and line height.',
    tableStep: 'Step',
    tableSize: 'Size',
    tablePx: 'px',
    tableLineHeight: 'Line-height',
    outputVariables: 'CSS variables',
    outputClasses: 'Utility classes',
    outputMarkdown: 'Markdown table',
    copy: 'Copy',
    copied: 'Copied!',
    copyError: 'Could not copy',
    sourceTitle: 'Engine source code',
    sourceBody:
      'The engine lives in src/utils/typographyScaleCalculator.js. buildScale takes base, ratio, up, down, decimals, unit and lineHeight; validates ranges; iterates from -down to +up and calculates each step as base × ratio^i. formatValue converts to rem when requested (dividing by 16) and rounds to the configured decimal places. generateCssVariables, generateUtilityClasses and generateMarkdownTable format the same structure into the three page outputs.',
    sampleText: 'The quick brown fox jumps over the lazy dog.',
    sampleHeading: 'Sample heading',
  },
}

export default function TypographyScaleCalculatorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [presetKey, setPresetKey] = useState('majorThird')
  const [customRatio, setCustomRatio] = useState(1.25)
  const [base, setBase] = useState(16)
  const [up, setUp] = useState(5)
  const [down, setDown] = useState(2)
  const [decimals, setDecimals] = useState(3)
  const [unit, setUnit] = useState('rem')
  const [lineHeight, setLineHeight] = useState(1.5)
  const [activeOutput, setActiveOutput] = useState('variables')
  const [messageApi, contextHolder] = useMessage()

  const ratio = useMemo(() => {
    const preset = PRESETS.find((p) => p.key === presetKey)
    return preset ? preset.ratio : Math.max(1.001, Number(customRatio) || 1.25)
  }, [presetKey, customRatio])

  const steps = useMemo(
    () => buildScale({ base, ratio, up, down, decimals, unit, lineHeight }),
    [base, ratio, up, down, decimals, unit, lineHeight]
  )

  const outputs = useMemo(
    () => ({
      variables: generateCssVariables(steps),
      classes: generateUtilityClasses(steps),
      markdown: generateMarkdownTable(steps, unit),
    }),
    [steps, unit]
  )

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(outputs[activeOutput])
      messageApi.success(t.copied)
    } catch {
      messageApi.error(t.copyError)
    }
  }

  const columns = [
    {
      title: t.tableStep,
      dataIndex: 'label',
      key: 'label',
      render: (label, record) => (
        <Text strong={record.key === 'base'}>{label}</Text>
      ),
    },
    {
      title: t.tableSize,
      dataIndex: 'value',
      key: 'value',
    },
    {
      title: t.tablePx,
      dataIndex: 'px',
      key: 'px',
      render: (px) => `${Math.round(px * 1000) / 1000}px`,
    },
    {
      title: t.tableLineHeight,
      dataIndex: 'lineHeight',
      key: 'lineHeight',
    },
  ]

  const sampleTexts = {
    base: t.sampleText,
    sm: t.sampleText,
    xs: t.sampleText,
    '2xs': t.sampleText,
    md: t.sampleText,
    lg: t.sampleHeading,
    xl: t.sampleHeading,
    '2xl': t.sampleHeading,
    '3xl': t.sampleHeading,
    '4xl': t.sampleHeading,
    '5xl': t.sampleHeading,
    '6xl': t.sampleHeading,
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {contextHolder}
      <div>
        <Title level={2} style={{ marginBottom: 8 }}>
          <FontSizeOutlined style={{ marginRight: 10 }} />
          {t.title}
        </Title>
        <Paragraph type="secondary">{t.intro}</Paragraph>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={10}>
          <Card title={t.settings}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div>
                <Text strong>{t.preset}</Text>
                <Select
                  value={presetKey}
                  onChange={setPresetKey}
                  style={{ width: '100%', marginTop: 8 }}
                  options={PRESETS.map((p) => ({
                    value: p.key,
                    label: `${PRESET_LABEL[p.key][lang]} (${p.ratio})`,
                  }))}
                />
              </div>

              {presetKey === 'custom' && (
                <div>
                  <Text strong>{t.customRatio}</Text>
                  <InputNumber
                    min={1.001}
                    max={3}
                    step={0.001}
                    value={customRatio}
                    onChange={(v) => setCustomRatio(v)}
                    style={{ width: '100%', marginTop: 8 }}
                  />
                </div>
              )}

              <div>
                <Text strong>{t.baseSize}</Text>
                <InputNumber
                  min={1}
                  max={64}
                  value={base}
                  onChange={(v) => setBase(v)}
                  addonAfter="px"
                  style={{ width: '100%', marginTop: 8 }}
                />
              </div>

              <div>
                <Text strong>{t.stepsUp}</Text>
                <Slider min={0} max={8} value={up} onChange={setUp} marks={{ 0: '0', 4: '4', 8: '8' }} />
              </div>

              <div>
                <Text strong>{t.stepsDown}</Text>
                <Slider min={0} max={4} value={down} onChange={setDown} marks={{ 0: '0', 2: '2', 4: '4' }} />
              </div>

              <div>
                <Text strong>{t.decimals}</Text>
                <Slider min={0} max={6} value={decimals} onChange={setDecimals} marks={{ 0: '0', 3: '3', 6: '6' }} />
              </div>

              <div>
                <Text strong>{t.lineHeight}</Text>
                <Slider
                  min={1}
                  max={2}
                  step={0.05}
                  value={lineHeight}
                  onChange={setLineHeight}
                  marks={{ 1: '1', 1.5: '1.5', 2: '2' }}
                />
              </div>

              <div>
                <Text strong>{t.unit}</Text>
                <Segmented
                  value={unit}
                  onChange={setUnit}
                  options={UNIT_OPTIONS}
                  block
                  style={{ marginTop: 8 }}
                />
              </div>
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={14}>
          <Card title={t.preview}>
            <Paragraph type="secondary" style={{ fontSize: 13, marginBottom: 16 }}>
              {t.previewHint}
            </Paragraph>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              {steps.map((step) => (
                <div
                  key={step.key}
                  style={{
                    fontSize: `${step.px}px`,
                    lineHeight: step.lineHeight,
                  }}
                >
                  <Tag color={step.key === 'base' ? 'blue' : 'default'}>{step.label}</Tag>
                  {sampleTexts[step.key] || t.sampleText}
                </div>
              ))}
            </Space>
          </Card>
        </Col>
      </Row>

      <Card>
        <Table
          dataSource={steps}
          columns={columns}
          rowKey="key"
          pagination={false}
          size="small"
          bordered
        />
      </Card>

      <Card
        title={
          <Segmented
            value={activeOutput}
            onChange={setActiveOutput}
            options={[
              { label: t.outputVariables, value: 'variables' },
              { label: t.outputClasses, value: 'classes' },
              { label: t.outputMarkdown, value: 'markdown' },
            ]}
          />
        }
        extra={
          <Button icon={<CopyOutlined />} onClick={handleCopy}>
            {t.copy}
          </Button>
        }
      >
        <pre
          style={{
            background: '#f6ffed',
            padding: 16,
            borderRadius: 8,
            overflow: 'auto',
            fontSize: 13,
            margin: 0,
          }}
        >
          <code>{outputs[activeOutput]}</code>
        </pre>
      </Card>

      <Collapse bordered>
        <Panel header={t.sourceTitle} key="source">
          <Paragraph>{t.sourceBody}</Paragraph>
        </Panel>
      </Collapse>
    </Space>
  )
}
