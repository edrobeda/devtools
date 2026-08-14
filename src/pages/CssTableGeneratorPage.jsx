import React, { useMemo, useState } from 'react'
import {
  Typography, Card, Space, Slider, Segmented, Alert, Button, Collapse,
  message, ColorPicker, Row, Col, Input, Switch, Tabs,
} from 'antd'
import { CopyOutlined, TableOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  buildTableCss,
  buildTableHtml,
  buildTableFullDemo,
  PRESETS,
  DEFAULTS,
} from '../utils/cssTableGenerator'

const { Title, Paragraph, Text } = Typography
const { useMessage } = message

const VARIANT_OPTIONS = {
  pt: [
    { label: 'Limpo', value: 'clean' },
    { label: 'Bordas', value: 'bordered' },
    { label: 'Listrado', value: 'striped' },
    { label: 'Hover', value: 'hover' },
    { label: 'Escuro', value: 'dark' },
    { label: 'Compacto', value: 'compact' },
  ],
  en: [
    { label: 'Clean', value: 'clean' },
    { label: 'Bordered', value: 'bordered' },
    { label: 'Striped', value: 'striped' },
    { label: 'Hover', value: 'hover' },
    { label: 'Dark', value: 'dark' },
    { label: 'Compact', value: 'compact' },
  ],
}

const ALIGN_OPTIONS = {
  pt: [
    { label: 'Esquerda', value: 'left' },
    { label: 'Centro', value: 'center' },
    { label: 'Direita', value: 'right' },
  ],
  en: [
    { label: 'Left', value: 'left' },
    { label: 'Center', value: 'center' },
    { label: 'Right', value: 'right' },
  ],
}

const RESPONSIVE_OPTIONS = {
  pt: [
    { label: 'Scroll horizontal', value: 'scroll' },
    { label: 'Cards', value: 'cards' },
  ],
  en: [
    { label: 'Horizontal scroll', value: 'scroll' },
    { label: 'Cards', value: 'cards' },
  ],
}

const PRESET_ORDER = ['clean', 'bordered', 'striped', 'hover', 'dark', 'compact']

const translations = {
  pt: {
    title: 'Gerador de Tabela CSS',
    intro: (
      <>
        Crie tabelas de dados usando só CSS: variações visuais, cabeçalho
        fixo, listras, hover, responsividade com scroll horizontal ou cards em
        mobile e paginação visual. O preview usa o CSS exato gerado, então você
        vê o resultado final em tempo real.
      </>
    ),
    tipTitle: 'Como funciona (e as pegadinhas)',
    tipBody: (
      <>
        A tabela usa <Text code>{'<table class="data-table">'}</Text> dentro de
        um wrapper <Text code>{'.table-scroll'}</Text>. O modo responsivo em
        cards esconde o <Text code>{'<thead>'}</Text> e usa{' '}
        <Text code>{'td::before { content: attr(data-label) }'}</Text> para
        mostrar os rótulos. A ordenação é apenas visual (setinhas no{' '}
        <Text code>{'th[aria-sort]'}</Text>) — sem JavaScript ela não ordena de
        verdade.
      </>
    ),
    settings: 'Configurações visuais',
    data: 'Dados da tabela',
    columnsLabel: 'Colunas (separadas por vírgula)',
    rowsLabel: 'Linhas (uma por linha; células separadas por vírgula)',
    variant: 'Variação visual',
    maxWidth: 'Largura máxima (px)',
    fontSize: 'Tamanho da fonte (px)',
    headerFontWeight: 'Peso da fonte do cabeçalho',
    padding: 'Padding das células (px)',
    borderWidth: 'Espessura da borda (px)',
    borderRadius: 'Border radius (px)',
    align: 'Alinhamento do texto',
    stickyHeader: 'Cabeçalho fixo (sticky)',
    striped: 'Listras (zebra)',
    hover: 'Destaque ao passar o mouse',
    compact: 'Modo compacto',
    responsiveMode: 'Responsividade em telas estreitas',
    showPagination: 'Mostrar paginação visual',
    headerBg: 'Fundo do cabeçalho',
    headerText: 'Texto do cabeçalho',
    rowBg: 'Fundo das linhas',
    rowAltBg: 'Fundo das linhas alternadas',
    textColor: 'Cor do texto',
    borderColor: 'Cor da borda',
    hoverBg: 'Fundo do hover',
    accentColor: 'Cor de destaque',
    preview: 'Pré-visualização',
    previewHint: 'A tabela abaixo usa exatamente o CSS gerado. Redimensione a janela para testar a responsividade.',
    outputCss: 'CSS gerado',
    outputHtml: 'HTML de exemplo',
    outputFull: 'Bloco completo',
    copy: 'Copiar',
    copied: 'Copiado!',
    copyError: 'Não foi possível copiar',
    presets: 'Presets',
    sourceCol: 'Código-fonte',
    sourceBody:
      'O núcleo vive em src/utils/cssTableGenerator.js. buildTableCss monta as regras do container .table-wrapper, do wrapper .table-scroll, da tabela .data-table, cabeçalho, células, listras, hover, responsividade e paginação. buildTableHtml gera o markup semântico com <table>, <thead>, <tbody> e data-labels para o modo card.',
  },
  en: {
    title: 'CSS Table Generator',
    intro: (
      <>
        Build data tables using only CSS: visual variants, sticky header, zebra
        striping, hover state, responsive behavior with horizontal scroll or
        stacked cards on mobile, and visual pagination. The preview uses the
        exact generated CSS, so you see the final result in real time.
      </>
    ),
    tipTitle: 'How it works (and the gotchas)',
    tipBody: (
      <>
        The table uses a <Text code>{'<table class="data-table">'}</Text> inside
        a <Text code>{'.table-scroll'}</Text> wrapper. The card responsive mode
        hides <Text code>{'<thead>'}</Text> and uses{' '}
        <Text code>{'td::before { content: attr(data-label) }'}</Text> to show
        labels. Sorting is purely visual (arrows on{' '}
        <Text code>{'th[aria-sort]'}</Text>) — without JavaScript it will not
        actually sort rows.
      </>
    ),
    settings: 'Visual settings',
    data: 'Table data',
    columnsLabel: 'Columns (comma-separated)',
    rowsLabel: 'Rows (one per line; cells comma-separated)',
    variant: 'Visual variant',
    maxWidth: 'Max width (px)',
    fontSize: 'Font size (px)',
    headerFontWeight: 'Header font weight',
    padding: 'Cell padding (px)',
    borderWidth: 'Border width (px)',
    borderRadius: 'Border radius (px)',
    align: 'Text alignment',
    stickyHeader: 'Sticky header',
    striped: 'Zebra striping',
    hover: 'Highlight on hover',
    compact: 'Compact mode',
    responsiveMode: 'Narrow-screen responsiveness',
    showPagination: 'Show visual pagination',
    headerBg: 'Header background',
    headerText: 'Header text',
    rowBg: 'Row background',
    rowAltBg: 'Alternate row background',
    textColor: 'Text color',
    borderColor: 'Border color',
    hoverBg: 'Hover background',
    accentColor: 'Accent color',
    preview: 'Preview',
    previewHint: 'The table below uses exactly the generated CSS. Resize the window to test responsiveness.',
    outputCss: 'Generated CSS',
    outputHtml: 'Example HTML',
    outputFull: 'Full block',
    copy: 'Copy',
    copied: 'Copied!',
    copyError: 'Could not copy',
    presets: 'Presets',
    sourceCol: 'Source code',
    sourceBody:
      'The core lives in src/utils/cssTableGenerator.js. buildTableCss builds the rules for the .table-wrapper container, .table-scroll wrapper, .data-table, header, cells, striping, hover, responsive behavior and pagination. buildTableHtml generates semantic markup with <table>, <thead>, <tbody> and data-labels for the card mode.',
  },
}

const DEFAULT_COLUMNS = {
  pt: ['ID', 'Nome', 'Cargo', 'Status', 'Desde'],
  en: ['ID', 'Name', 'Role', 'Status', 'Joined'],
}

const DEFAULT_ROWS = {
  pt: [
    ['#1001', 'Ana Souza', 'Engineer', 'Ativo', '2023-04-12'],
    ['#1002', 'Bruno Lima', 'Designer', 'Ativo', '2022-11-05'],
    ['#1003', 'Carla Dias', 'Manager', 'Ausente', '2021-08-22'],
    ['#1004', 'Diego Rocha', 'Engineer', 'Inativo', '2023-01-18'],
    ['#1005', 'Elisa Moraes', 'Analyst', 'Ativo', '2022-06-30'],
  ],
  en: [
    ['#1001', 'Ana Souza', 'Engineer', 'Active', '2023-04-12'],
    ['#1002', 'Bruno Lima', 'Designer', 'Active', '2022-11-05'],
    ['#1003', 'Carla Dias', 'Manager', 'Away', '2021-08-22'],
    ['#1004', 'Diego Rocha', 'Engineer', 'Offline', '2023-01-18'],
    ['#1005', 'Elisa Moraes', 'Analyst', 'Active', '2022-06-30'],
  ],
}

export default function CssTableGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [messageApi, messageContextHolder] = useMessage()

  const [variant, setVariant] = useState(DEFAULTS.variant)
  const [maxWidth, setMaxWidth] = useState(DEFAULTS.maxWidth)
  const [fontSize, setFontSize] = useState(DEFAULTS.fontSize)
  const [headerFontWeight, setHeaderFontWeight] = useState(DEFAULTS.headerFontWeight)
  const [padding, setPadding] = useState(DEFAULTS.padding)
  const [borderWidth, setBorderWidth] = useState(DEFAULTS.borderWidth)
  const [borderRadius, setBorderRadius] = useState(DEFAULTS.borderRadius)
  const [align, setAlign] = useState(DEFAULTS.align)
  const [stickyHeader, setStickyHeader] = useState(DEFAULTS.stickyHeader)
  const [striped, setStriped] = useState(DEFAULTS.striped)
  const [hover, setHover] = useState(DEFAULTS.hover)
  const [compact, setCompact] = useState(DEFAULTS.compact)
  const [responsiveMode, setResponsiveMode] = useState(DEFAULTS.responsiveMode)
  const [showPagination, setShowPagination] = useState(DEFAULTS.showPagination)
  const [headerBg, setHeaderBg] = useState(DEFAULTS.headerBg)
  const [headerText, setHeaderText] = useState(DEFAULTS.headerText)
  const [rowBg, setRowBg] = useState(DEFAULTS.rowBg)
  const [rowAltBg, setRowAltBg] = useState(DEFAULTS.rowAltBg)
  const [textColor, setTextColor] = useState(DEFAULTS.textColor)
  const [borderColor, setBorderColor] = useState(DEFAULTS.borderColor)
  const [hoverBg, setHoverBg] = useState(DEFAULTS.hoverBg)
  const [accentColor, setAccentColor] = useState(DEFAULTS.accentColor)

  const [columns, setColumns] = useState(DEFAULT_COLUMNS[lang])
  const [rows, setRows] = useState(DEFAULT_ROWS[lang])

  const applyPreset = (key) => {
    const p = PRESETS[key]
    if (!p) return
    setVariant(key)
    setHeaderBg(p.headerBg)
    setHeaderText(p.headerText)
    setRowBg(p.rowBg)
    setRowAltBg(p.rowAltBg)
    setTextColor(p.textColor)
    setBorderColor(p.borderColor)
    setHoverBg(p.hoverBg)
    setAccentColor(p.accentColor)
    setStriped(p.striped)
    setHover(p.hover)
    setBorderWidth(p.borderWidth)
  }

  const parseColumns = (raw) => raw.split(',').map((s) => s.trim()).filter(Boolean)
  const parseRows = (raw) => raw.split('\n').map((line) => line.split(',').map((s) => s.trim())).filter((r) => r.length > 0 && r.some(Boolean))

  const settings = useMemo(
    () => ({
      variant,
      maxWidth,
      fontSize,
      headerFontWeight,
      padding,
      borderWidth,
      borderRadius,
      align,
      stickyHeader,
      striped,
      hover,
      compact,
      responsiveMode,
      showPagination,
      headerBg,
      headerText,
      rowBg,
      rowAltBg,
      textColor,
      borderColor,
      hoverBg,
      accentColor,
      columns,
      rows,
    }),
    [
      variant,
      maxWidth,
      fontSize,
      headerFontWeight,
      padding,
      borderWidth,
      borderRadius,
      align,
      stickyHeader,
      striped,
      hover,
      compact,
      responsiveMode,
      showPagination,
      headerBg,
      headerText,
      rowBg,
      rowAltBg,
      textColor,
      borderColor,
      hoverBg,
      accentColor,
      columns,
      rows,
    ]
  )

  const cssOutput = useMemo(() => buildTableCss(settings), [settings])
  const htmlOutput = useMemo(() => buildTableHtml(settings, lang), [settings, lang])
  const fullOutput = useMemo(() => buildTableFullDemo(settings, lang), [settings, lang])

  const copy = async (value) => {
    try {
      await navigator.clipboard.writeText(value)
      messageApi.success(t.copied)
    } catch {
      messageApi.error(t.copyError)
    }
  }

  const outputTabs = [
    {
      key: 'css',
      label: t.outputCss,
      children: (
        <pre style={{ margin: 0, overflowX: 'auto' }}>
          <code>{cssOutput}</code>
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

  const renderColorControl = (label, value, onChange) => (
    <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
      <Text>{label}</Text>
      <ColorPicker value={value} onChange={onChange} showText />
    </Space>
  )

  const renderSlider = (label, value, onChange, min, max, step = 1) => (
    <>
      <Space style={{ width: '100%', justifyContent: 'space-between' }}>
        <Text>{label}</Text>
        <Text code>{value}{step === 1 ? 'px' : ''}</Text>
      </Space>
      <Slider min={min} max={max} step={step} value={value} onChange={onChange} />
    </>
  )

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {messageContextHolder}
      <Title level={2}><TableOutlined /> {t.title}</Title>
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
                  label: VARIANT_OPTIONS[lang].find((s) => s.value === key)?.label || key,
                }))}
              />

              <Space direction="vertical" size={4} style={{ width: '100%', marginTop: 8 }}>
                <Text>{t.variant}</Text>
                <Segmented
                  style={{ width: '100%' }}
                  block
                  value={variant}
                  onChange={setVariant}
                  options={VARIANT_OPTIONS[lang]}
                />
              </Space>

              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text>{t.align}</Text>
                <Segmented
                  style={{ width: '100%' }}
                  block
                  value={align}
                  onChange={setAlign}
                  options={ALIGN_OPTIONS[lang]}
                />
              </Space>

              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text>{t.responsiveMode}</Text>
                <Segmented
                  style={{ width: '100%' }}
                  block
                  value={responsiveMode}
                  onChange={setResponsiveMode}
                  options={RESPONSIVE_OPTIONS[lang]}
                />
              </Space>

              {renderSlider(t.maxWidth, maxWidth, setMaxWidth, 320, 1600)}
              {renderSlider(t.fontSize, fontSize, setFontSize, 10, 24)}
              {renderSlider(t.headerFontWeight, headerFontWeight, setHeaderFontWeight, 300, 900)}
              {renderSlider(t.padding, padding, setPadding, 4, 32)}
              {renderSlider(t.borderWidth, borderWidth, setBorderWidth, 0, 8)}
              {renderSlider(t.borderRadius, borderRadius, setBorderRadius, 0, 32)}

              {renderColorControl(t.headerBg, headerBg, setHeaderBg)}
              {renderColorControl(t.headerText, headerText, setHeaderText)}
              {renderColorControl(t.rowBg, rowBg, setRowBg)}
              {renderColorControl(t.rowAltBg, rowAltBg, setRowAltBg)}
              {renderColorControl(t.textColor, textColor, setTextColor)}
              {renderColorControl(t.borderColor, borderColor, setBorderColor)}
              {renderColorControl(t.hoverBg, hoverBg, setHoverBg)}
              {renderColorControl(t.accentColor, accentColor, setAccentColor)}

              <Space direction="vertical" size={4} style={{ width: '100%', marginTop: 8 }}>
                <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text>{t.stickyHeader}</Text>
                  <Switch size="small" checked={stickyHeader} onChange={setStickyHeader} />
                </Space>
                <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text>{t.striped}</Text>
                  <Switch size="small" checked={striped} onChange={setStriped} />
                </Space>
                <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text>{t.hover}</Text>
                  <Switch size="small" checked={hover} onChange={setHover} />
                </Space>
                <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text>{t.compact}</Text>
                  <Switch size="small" checked={compact} onChange={setCompact} />
                </Space>
                <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text>{t.showPagination}</Text>
                  <Switch size="small" checked={showPagination} onChange={setShowPagination} />
                </Space>
              </Space>
            </Space>
          </Card>

          <Card title={t.data} style={{ marginTop: 24 }}>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text>{t.columnsLabel}</Text>
                <Input
                  value={columns.join(', ')}
                  onChange={(e) => setColumns(parseColumns(e.target.value))}
                />
              </Space>
              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text>{t.rowsLabel}</Text>
                <Input.TextArea
                  rows={6}
                  value={rows.map((r) => r.join(', ')).join('\n')}
                  onChange={(e) => setRows(parseRows(e.target.value))}
                />
              </Space>
            </Space>
          </Card>
        </Col>

        <Col xs={24} md={14}>
          <Card title={t.preview}>
            <style>{cssOutput}</style>
            <div
              style={{
                border: '1px solid #f0f0f0',
                borderRadius: 8,
                padding: 24,
                background: '#fafafa',
                minHeight: 320,
                overflow: 'auto',
              }}
              dangerouslySetInnerHTML={{ __html: htmlOutput }}
            />
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
            label: `${t.sourceCol} — buildTableCss / buildTableHtml`,
            children: (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Paragraph type="secondary">{t.sourceBody}</Paragraph>
                <pre style={{ margin: 0, overflowX: 'auto', maxHeight: 320 }}>
                  <code>{buildTableCss.toString()}</code>
                </pre>
              </Space>
            ),
          },
        ]}
      />
    </Space>
  )
}
