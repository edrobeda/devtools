import React, { useEffect, useMemo, useState } from 'react'
import {
  Typography, Card, Space, Slider, Segmented, Alert, Button, Collapse,
  message, ColorPicker, Row, Col, Input, Switch, Tabs,
} from 'antd'
import { BgColorsOutlined, CopyOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  buildPaginationCss,
  buildPaginationHtml,
  buildPaginationFullDemo,
  PRESETS,
  DEFAULTS,
} from '../utils/cssPaginationGenerator'

const { Title, Paragraph, Text } = Typography
const { useMessage } = message

const VARIANT_OPTIONS = {
  pt: [
    { label: 'Preenchido', value: 'filled' },
    { label: 'Contorno', value: 'outline' },
    { label: 'Minimal', value: 'minimal' },
  ],
  en: [
    { label: 'Filled', value: 'filled' },
    { label: 'Outline', value: 'outline' },
    { label: 'Minimal', value: 'minimal' },
  ],
}

const SHAPE_OPTIONS = {
  pt: [
    { label: 'Arredondado', value: 'rounded' },
    { label: 'Pílula', value: 'pill' },
    { label: 'Quadrado', value: 'square' },
  ],
  en: [
    { label: 'Rounded', value: 'rounded' },
    { label: 'Pill', value: 'pill' },
    { label: 'Square', value: 'square' },
  ],
}

const translations = {
  pt: {
    title: 'Gerador de Paginação CSS',
    intro: (
      <>
        Crie controles de paginação customizados usando só CSS: escolha o estilo
        visual, ajuste cores ativa/inativa/hover, raio de borda, espaçamento e
        borda; o preview injeta o CSS exato gerado, então você clica nas páginas
        e vê o resultado final em tempo real.
      </>
    ),
    tipTitle: 'Como funciona (e as pegadinhas)',
    tipBody: (
      <>
        A paginação é uma lista semântica <Text code>{'<nav aria-label="Pagination">'}</Text>{' '}
        com <Text code>{'<ul>'}</Text> e <Text code>{'<li>'}</Text>. Cada página é um{' '}
        <Text code>{'<a>'}</Text> (ou <Text code>{'<span>'}</Text> para a atual) com classes
        como <Text code>.pagination__link</Text>, <Text code>.pagination__item--active</Text>{' '}
        e <Text code>.pagination__item--disabled</Text>. Use <Text code>aria-current="page"</Text>{' '}
        no item ativo e <Text code>aria-disabled="true"</Text> nos controles desabilitados.
        Evite criar links para todas as páginas quando são centenas — use ellipsis (…).
      </>
    ),
    settings: 'Configurações',
    variant: 'Variação',
    shape: 'Forma',
    activeColor: 'Cor ativa',
    inactiveColor: 'Cor inativa',
    hoverColor: 'Cor do hover',
    textColor: 'Cor do texto ativo',
    borderColor: 'Cor da borda',
    borderWidth: 'Espessura da borda',
    borderRadius: 'Raio da borda',
    itemSize: 'Altura do item (px)',
    gap: 'Espaço entre itens (px)',
    fontSize: 'Tamanho da fonte (px)',
    fontWeight: 'Peso da fonte',
    transitionDuration: 'Duração da transição (ms)',
    shadow: 'Sombra do item ativo',
    showPrevNext: 'Botões Anterior/Próximo',
    showFirstLast: 'Botões Primeira/Última',
    showEllipsis: 'Mostrar ellipsis (…)',
    prevLabel: 'Label "Anterior"',
    nextLabel: 'Label "Próximo"',
    firstLabel: 'Label "Primeira"',
    lastLabel: 'Label "Última"',
    totalPages: 'Total de páginas',
    currentPage: 'Página atual',
    preview: 'Pré-visualização',
    previewHint: 'A paginação abaixo usa exatamente o CSS gerado — clique nos itens para testar.',
    outputCss: 'CSS gerado',
    outputHtml: 'HTML de exemplo',
    outputFull: 'Bloco completo',
    copy: 'Copiar',
    copied: 'Copiado!',
    copyError: 'Não foi possível copiar',
    presets: 'Presets',
    sourceCol: 'Código-fonte',
    sourceBody:
      'O núcleo vive em src/utils/cssPaginationGenerator.js. buildPaginationCss monta as regras de .pagination, .pagination__link, .pagination__item--active e .pagination__item--disabled a partir da variação (filled/outline/minimal) e da forma (rounded/pill/square); buildPaginationHtml gera o markup semântico com aria-current e aria-disabled.',
  },
  en: {
    title: 'CSS Pagination Generator',
    intro: (
      <>
        Build custom pagination controls using only CSS: choose the visual style,
        tweak active/inactive/hover colors, border radius, spacing and border; the
        preview injects the exact generated CSS, so you click the pages and see the
        final result in real time.
      </>
    ),
    tipTitle: 'How it works (and the gotchas)',
    tipBody: (
      <>
        Pagination is a semantic list inside <Text code>{'<nav aria-label="Pagination">'}</Text>{' '}
        with <Text code>{'<ul>'}</Text> and <Text code>{'<li>'}</Text>. Each page is an{' '}
        <Text code>{'<a>'}</Text> (or <Text code>{'<span>'}</Text> for the current one) with classes
        like <Text code>.pagination__link</Text>, <Text code>.pagination__item--active</Text>{' '}
        and <Text code>.pagination__item--disabled</Text>. Use <Text code>aria-current="page"</Text>{' '}
        on the active item and <Text code>aria-disabled="true"</Text> on disabled controls.
        Avoid linking every page when there are hundreds — use ellipsis (…).
      </>
    ),
    settings: 'Settings',
    variant: 'Variant',
    shape: 'Shape',
    activeColor: 'Active color',
    inactiveColor: 'Inactive color',
    hoverColor: 'Hover color',
    textColor: 'Active text color',
    borderColor: 'Border color',
    borderWidth: 'Border width',
    borderRadius: 'Border radius',
    itemSize: 'Item height (px)',
    gap: 'Gap between items (px)',
    fontSize: 'Font size (px)',
    fontWeight: 'Font weight',
    transitionDuration: 'Transition duration (ms)',
    shadow: 'Active item shadow',
    showPrevNext: 'Previous/Next buttons',
    showFirstLast: 'First/Last buttons',
    showEllipsis: 'Show ellipsis (…)',
    prevLabel: '"Previous" label',
    nextLabel: '"Next" label',
    firstLabel: '"First" label',
    lastLabel: '"Last" label',
    totalPages: 'Total pages',
    currentPage: 'Current page',
    preview: 'Preview',
    previewHint: 'The pagination below uses exactly the generated CSS — click items to test.',
    outputCss: 'Generated CSS',
    outputHtml: 'Example HTML',
    outputFull: 'Full block',
    copy: 'Copy',
    copied: 'Copied!',
    copyError: 'Could not copy',
    presets: 'Presets',
    sourceCol: 'Source code',
    sourceBody:
      'The core lives in src/utils/cssPaginationGenerator.js. buildPaginationCss builds the rules for .pagination, .pagination__link, .pagination__item--active and .pagination__item--disabled based on the variant (filled/outline/minimal) and shape (rounded/pill/square); buildPaginationHtml generates semantic markup with aria-current and aria-disabled.',
  },
}

const PRESET_ORDER = ['default', 'outline', 'minimal', 'pills', 'dark']

export default function CssPaginationGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [messageApi, messageContextHolder] = useMessage()

  const [variant, setVariant] = useState(DEFAULTS.variant)
  const [shape, setShape] = useState(DEFAULTS.shape)
  const [activeColor, setActiveColor] = useState(DEFAULTS.activeColor)
  const [inactiveColor, setInactiveColor] = useState(DEFAULTS.inactiveColor)
  const [hoverColor, setHoverColor] = useState(DEFAULTS.hoverColor)
  const [textColor, setTextColor] = useState(DEFAULTS.textColor)
  const [borderColor, setBorderColor] = useState(DEFAULTS.borderColor)
  const [borderWidth, setBorderWidth] = useState(DEFAULTS.borderWidth)
  const [borderRadius, setBorderRadius] = useState(DEFAULTS.borderRadius)
  const [itemSize, setItemSize] = useState(DEFAULTS.itemSize)
  const [gap, setGap] = useState(DEFAULTS.gap)
  const [fontSize, setFontSize] = useState(DEFAULTS.fontSize)
  const [fontWeight, setFontWeight] = useState(DEFAULTS.fontWeight)
  const [transitionDuration, setTransitionDuration] = useState(DEFAULTS.transitionDuration)
  const [shadow, setShadow] = useState(DEFAULTS.shadow)
  const [showPrevNext, setShowPrevNext] = useState(DEFAULTS.showPrevNext)
  const [showFirstLast, setShowFirstLast] = useState(DEFAULTS.showFirstLast)
  const [showEllipsis, setShowEllipsis] = useState(DEFAULTS.showEllipsis)
  const [prevLabel, setPrevLabel] = useState(DEFAULTS.prevLabel)
  const [nextLabel, setNextLabel] = useState(DEFAULTS.nextLabel)
  const [firstLabel, setFirstLabel] = useState(DEFAULTS.firstLabel)
  const [lastLabel, setLastLabel] = useState(DEFAULTS.lastLabel)
  const [totalPages, setTotalPages] = useState(DEFAULTS.totalPages)
  const [currentPage, setCurrentPage] = useState(DEFAULTS.currentPage)

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages)
  }, [currentPage, totalPages])

  const applyPreset = (key) => {
    const p = PRESETS[key]
    if (!p) return
    setVariant(p.variant)
    setShape(p.shape)
    setActiveColor(p.activeColor)
    setInactiveColor(p.inactiveColor)
    setHoverColor(p.hoverColor)
    setTextColor(p.textColor)
    setBorderColor(p.borderColor)
    setBorderWidth(p.borderWidth)
    setBorderRadius(p.borderRadius)
    setItemSize(p.itemSize)
    setGap(p.gap)
    setFontSize(p.fontSize)
    setFontWeight(p.fontWeight)
    setTransitionDuration(p.transitionDuration)
    setShadow(p.shadow)
    setShowPrevNext(p.showPrevNext)
    setShowFirstLast(p.showFirstLast)
    setShowEllipsis(p.showEllipsis)
    setPrevLabel(p.prevLabel)
    setNextLabel(p.nextLabel)
    setFirstLabel(p.firstLabel)
    setLastLabel(p.lastLabel)
  }

  const settings = useMemo(
    () => ({
      variant,
      shape,
      activeColor,
      inactiveColor,
      hoverColor,
      textColor,
      borderColor,
      borderWidth,
      borderRadius,
      itemSize,
      gap,
      fontSize,
      fontWeight,
      transitionDuration,
      shadow,
      showPrevNext,
      showFirstLast,
      showEllipsis,
      prevLabel,
      nextLabel,
      firstLabel,
      lastLabel,
      totalPages,
      currentPage,
    }),
    [
      variant,
      shape,
      activeColor,
      inactiveColor,
      hoverColor,
      textColor,
      borderColor,
      borderWidth,
      borderRadius,
      itemSize,
      gap,
      fontSize,
      fontWeight,
      transitionDuration,
      shadow,
      showPrevNext,
      showFirstLast,
      showEllipsis,
      prevLabel,
      nextLabel,
      firstLabel,
      lastLabel,
      totalPages,
      currentPage,
    ]
  )

  const cssOutput = useMemo(() => buildPaginationCss(settings), [settings])
  const htmlOutput = useMemo(() => buildPaginationHtml(settings), [settings])
  const fullOutput = useMemo(() => buildPaginationFullDemo(settings), [settings])

  const copy = async (value) => {
    try {
      await navigator.clipboard.writeText(value)
      messageApi.success(t.copied)
    } catch {
      messageApi.error(t.copyError)
    }
  }

  const renderPaginationPreview = () => {
    const pages = []
    if (totalPages <= 7 || !showEllipsis) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      let start = Math.max(2, currentPage - 1)
      let end = Math.min(totalPages - 1, currentPage + 1)
      if (currentPage <= 3) {
        start = 2
        end = 4
      } else if (currentPage >= totalPages - 2) {
        start = totalPages - 3
        end = totalPages - 1
      }
      if (start > 2) pages.push('…')
      for (let i = start; i <= end; i++) pages.push(i)
      if (end < totalPages - 1) pages.push('…')
      pages.push(totalPages)
    }

    const renderLink = (label, page, disabled, active) => {
      const liClass = ['pagination__item', active ? 'pagination__item--active' : '', disabled ? 'pagination__item--disabled' : '']
        .filter(Boolean)
        .join(' ')
      const handleClick = (e) => {
        e.preventDefault()
        if (!disabled && page !== null && page !== '…') {
          setCurrentPage(page)
        }
      }
      if (active) {
        return (
          <li key={`${label}-${page}`} className={liClass}>
            <span className="pagination__link" aria-current="page">{label}</span>
          </li>
        )
      }
      if (disabled) {
        return (
          <li key={`${label}-${page}`} className={liClass}>
            <span className="pagination__link" aria-disabled="true">{label}</span>
          </li>
        )
      }
      return (
        <li key={`${label}-${page}`} className={liClass}>
          <a href={`?page=${page}`} className="pagination__link" onClick={handleClick}>{label}</a>
        </li>
      )
    }

    return (
      <nav aria-label={t.title}>
        <ul className="pagination">
          {showFirstLast && renderLink(firstLabel, 1, currentPage === 1)}
          {showPrevNext && renderLink(prevLabel, currentPage - 1, currentPage === 1)}
          {pages.map((p) => renderLink(p === '…' ? '…' : String(p), p === '…' ? null : p, false, p === currentPage))}
          {showPrevNext && renderLink(nextLabel, currentPage + 1, currentPage === totalPages)}
          {showFirstLast && renderLink(lastLabel, totalPages, currentPage === totalPages)}
        </ul>
      </nav>
    )
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

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {messageContextHolder}
      <Title level={2}><BgColorsOutlined /> {t.title}</Title>
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
                <Text>{t.shape}</Text>
                <Segmented
                  style={{ width: '100%' }}
                  block
                  value={shape}
                  onChange={setShape}
                  options={SHAPE_OPTIONS[lang]}
                />
              </Space>

              <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text>{t.activeColor}</Text>
                <ColorPicker value={activeColor} onChange={setActiveColor} showText />
              </Space>

              <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text>{t.inactiveColor}</Text>
                <ColorPicker value={inactiveColor} onChange={setInactiveColor} showText />
              </Space>

              <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text>{t.hoverColor}</Text>
                <ColorPicker value={hoverColor} onChange={setHoverColor} showText />
              </Space>

              <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text>{t.textColor}</Text>
                <ColorPicker value={textColor} onChange={setTextColor} showText />
              </Space>

              <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text>{t.borderColor}</Text>
                <ColorPicker value={borderColor} onChange={setBorderColor} showText />
              </Space>

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.borderWidth}</Text>
                <Text code>{borderWidth}px</Text>
              </Space>
              <Slider min={0} max={8} step={1} value={borderWidth} onChange={setBorderWidth} />

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.borderRadius}</Text>
                <Text code>{borderRadius}px</Text>
              </Space>
              <Slider min={0} max={50} value={borderRadius} onChange={setBorderRadius} />

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.itemSize}</Text>
                <Text code>{itemSize}px</Text>
              </Space>
              <Slider min={24} max={64} value={itemSize} onChange={setItemSize} />

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.gap}</Text>
                <Text code>{gap}px</Text>
              </Space>
              <Slider min={0} max={24} value={gap} onChange={setGap} />

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.fontSize}</Text>
                <Text code>{fontSize}px</Text>
              </Space>
              <Slider min={10} max={24} value={fontSize} onChange={setFontSize} />

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.fontWeight}</Text>
                <Text code>{fontWeight}</Text>
              </Space>
              <Slider min={100} max={900} step={100} value={fontWeight} onChange={setFontWeight} />

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.transitionDuration}</Text>
                <Text code>{transitionDuration}ms</Text>
              </Space>
              <Slider min={0} max={600} value={transitionDuration} onChange={setTransitionDuration} />

              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text>{t.shadow}</Text>
                <Input
                  value={shadow}
                  onChange={(e) => setShadow(e.target.value)}
                  placeholder="0 2px 4px rgba(0,0,0,0.15)"
                />
              </Space>

              <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text>{t.showPrevNext}</Text>
                <Switch size="small" checked={showPrevNext} onChange={setShowPrevNext} />
              </Space>

              <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text>{t.showFirstLast}</Text>
                <Switch size="small" checked={showFirstLast} onChange={setShowFirstLast} />
              </Space>

              <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text>{t.showEllipsis}</Text>
                <Switch size="small" checked={showEllipsis} onChange={setShowEllipsis} />
              </Space>

              {showPrevNext && (
                <>
                  <Space direction="vertical" size={4} style={{ width: '100%' }}>
                    <Text>{t.prevLabel}</Text>
                    <Input value={prevLabel} onChange={(e) => setPrevLabel(e.target.value)} />
                  </Space>
                  <Space direction="vertical" size={4} style={{ width: '100%' }}>
                    <Text>{t.nextLabel}</Text>
                    <Input value={nextLabel} onChange={(e) => setNextLabel(e.target.value)} />
                  </Space>
                </>
              )}

              {showFirstLast && (
                <>
                  <Space direction="vertical" size={4} style={{ width: '100%' }}>
                    <Text>{t.firstLabel}</Text>
                    <Input value={firstLabel} onChange={(e) => setFirstLabel(e.target.value)} />
                  </Space>
                  <Space direction="vertical" size={4} style={{ width: '100%' }}>
                    <Text>{t.lastLabel}</Text>
                    <Input value={lastLabel} onChange={(e) => setLastLabel(e.target.value)} />
                  </Space>
                </>
              )}

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.totalPages}</Text>
                <Text code>{totalPages}</Text>
              </Space>
              <Slider min={1} max={20} value={totalPages} onChange={setTotalPages} />

              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text>{t.currentPage}</Text>
                <Text code>{currentPage}</Text>
              </Space>
              <Slider min={1} max={totalPages} value={currentPage} onChange={setCurrentPage} />
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
                padding: 40,
                background: '#fafafa',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 180,
              }}
            >
              {renderPaginationPreview()}
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
            label: `${t.sourceCol} — buildPaginationCss / buildPaginationHtml`,
            children: (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Paragraph type="secondary">{t.sourceBody}</Paragraph>
                <pre style={{ margin: 0, overflowX: 'auto', maxHeight: 320 }}>
                  <code>{buildPaginationCss.toString()}</code>
                </pre>
              </Space>
            ),
          },
        ]}
      />
    </Space>
  )
}
