import React, { useMemo, useState, useCallback } from 'react'
import {
  Typography,
  Card,
  Space,
  Input,
  Button,
  Collapse,
  Row,
  Col,
  Checkbox,
  message,
  List,
  Tag,
  Empty,
  Alert,
} from 'antd'
import {
  PictureOutlined,
  CopyOutlined,
  DownloadOutlined,
  PlusOutlined,
  DeleteOutlined,
  UndoOutlined,
  InfoCircleOutlined,
  FileTextOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  buildSprite,
  buildUsageHtml,
  buildIconCss,
  parseSvg,
  sanitizeId,
  DEFAULTS,
  PRESETS,
} from '../utils/svgSpriteGenerator'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input

const translations = {
  pt: {
    title: 'Gerador de SVG Sprite',
    intro:
      'Combine vários SVGs em um único sprite com <symbol> e reuse-os com <use>. ' +
      'Cole os SVGs, defina IDs, visualize o preview e baixe o arquivo. Tudo acontece no navegador.',
    presets: 'Modelos de um clique',
    reset: 'Limpar tudo',
    addSymbol: 'Adicionar símbolo',
    newId: 'ID do símbolo',
    newName: 'Nome (title/desc)',
    newSvg: 'Cole o SVG aqui',
    idPlaceholder: 'ex: icon-home',
    namePlaceholder: 'ex: Home',
    svgPlaceholder: '<svg viewBox="0 0 24 24">...</svg>',
    symbolsCard: 'Símbolos',
    noSymbols: 'Nenhum símbolo adicionado ainda.',
    optionsCard: 'Opções do sprite',
    width: 'Largura padrão',
    height: 'Altura padrão',
    color: 'Cor padrão',
    className: 'Classe CSS',
    addTitle: 'Incluir <title> acessível',
    addDesc: 'Incluir <desc> acessível',
    inlineStyles: 'Esconder sprite com display:none inline',
    usageCard: 'Como usar',
    usageIntro: 'Inclua o sprite no HTML e referencie os ícones assim:',
    cssCard: 'CSS sugerido',
    outputCard: 'Sprite SVG gerado',
    copy: 'Copiar',
    copied: 'Copiado!',
    download: 'Baixar .svg',
    lineCount: (n) => `${n} linha${n === 1 ? '' : 's'}`,
    byteCount: (n) => `${n} bytes`,
    invalidSvg: 'SVG inválido ou vazio.',
    duplicateId: 'ID já existe; será ajustado automaticamente.',
    sourceTitle: 'Código-fonte do motor',
    sourceBody:
      'parseSvg extrai viewBox e conteúdo interno de cada SVG; buildSprite gera os <symbol> com IDs ' +
      'sanitizados e metadados acessíveis opcionais; buildUsageHtml e buildIconCss produzem o snippet pronto para uso.',
    tipTitle: 'Dicas de SVG Sprite',
    tipBody: (
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        <li>
          Use <Text code>aria-hidden=&quot;true&quot;</Text> no <Text code>{'<svg>'}</Text> de uso quando o ícone for decorativo.
        </li>
        <li>
          Mantenha o sprite <Text code>display: none</Text> ou posicione-o fora da tela para não ocupar espaço.
        </li>
        <li>
          Prefira <Text code>currentColor</Text> nos ícones para herdar a cor do texto ao redor.
        </li>
        <li>
          IDs duplicados são ajustados automaticamente, mas nomes únicos facilitam a manutenção.
        </li>
      </ul>
    ),
  },
  en: {
    title: 'SVG Sprite Generator',
    intro:
      'Combine multiple SVGs into a single <symbol> sprite and reuse them with <use>. ' +
      'Paste SVGs, set IDs, preview the result, and download the file. Everything happens in the browser.',
    presets: 'One-click templates',
    reset: 'Clear all',
    addSymbol: 'Add symbol',
    newId: 'Symbol ID',
    newName: 'Name (title/desc)',
    newSvg: 'Paste SVG here',
    idPlaceholder: 'e.g. icon-home',
    namePlaceholder: 'e.g. Home',
    svgPlaceholder: '<svg viewBox="0 0 24 24">...</svg>',
    symbolsCard: 'Symbols',
    noSymbols: 'No symbols added yet.',
    optionsCard: 'Sprite options',
    width: 'Default width',
    height: 'Default height',
    color: 'Default color',
    className: 'CSS class',
    addTitle: 'Include accessible <title>',
    addDesc: 'Include accessible <desc>',
    inlineStyles: 'Hide sprite with inline display:none',
    usageCard: 'How to use',
    usageIntro: 'Include the sprite in your HTML and reference icons like this:',
    cssCard: 'Suggested CSS',
    outputCard: 'Generated SVG sprite',
    copy: 'Copy',
    copied: 'Copied!',
    download: 'Download .svg',
    lineCount: (n) => `${n} line${n === 1 ? '' : 's'}`,
    byteCount: (n) => `${n} bytes`,
    invalidSvg: 'Invalid or empty SVG.',
    duplicateId: 'ID already exists; it will be adjusted automatically.',
    sourceTitle: 'Engine source code',
    sourceBody:
      'parseSvg extracts the viewBox and inner content of each SVG; buildSprite generates <symbol> tags ' +
      'with sanitized IDs and optional accessible metadata; buildUsageHtml and buildIconCss produce the ready-to-use snippets.',
    tipTitle: 'SVG Sprite tips',
    tipBody: (
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        <li>
          Use <Text code>aria-hidden=&quot;true&quot;</Text> on the usage <Text code>{'<svg>'}</Text> when the icon is decorative.
        </li>
        <li>
          Keep the sprite <Text code>display: none</Text> or off-screen so it does not take up layout space.
        </li>
        <li>
          Prefer <Text code>currentColor</Text> in icons to inherit the surrounding text color.
        </li>
        <li>
          Duplicate IDs are adjusted automatically, but unique names make maintenance easier.
        </li>
      </ul>
    ),
  },
}

export default function SvgSpriteGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [symbols, setSymbols] = useState(DEFAULTS.symbols)
  const [newId, setNewId] = useState('')
  const [newName, setNewName] = useState('')
  const [newSvg, setNewSvg] = useState('')
  const [width, setWidth] = useState(DEFAULTS.width)
  const [height, setHeight] = useState(DEFAULTS.height)
  const [color, setColor] = useState('currentColor')
  const [className, setClassName] = useState('icon')
  const [addTitle, setAddTitle] = useState(DEFAULTS.addTitle)
  const [addDesc, setAddDesc] = useState(DEFAULTS.addDesc)
  const [inlineStyles, setInlineStyles] = useState(DEFAULTS.inlineStyles)

  const options = useMemo(
    () => ({ symbols, addTitle, addDesc, inlineStyles }),
    [symbols, addTitle, addDesc, inlineStyles]
  )

  const sprite = useMemo(() => buildSprite(options), [options])
  const ids = useMemo(
    () =>
      symbols
        .map((s, i) => {
          const parsed = parseSvg(s.svg)
          if (!parsed) return null
          const base = sanitizeId(s.id)
          return base || `icon-${i + 1}`
        })
        .filter(Boolean),
    [symbols]
  )
  const usageHtml = useMemo(
    () => buildUsageHtml(ids, { width, height, color, className }),
    [ids, width, height, color, className]
  )
  const iconCss = useMemo(() => buildIconCss(className), [className])

  const lineCount = sprite ? sprite.split('\n').length : 0
  const byteCount = useMemo(() => new Blob([sprite]).size, [sprite])

  const addSymbol = useCallback(() => {
    const parsed = parseSvg(newSvg)
    if (!parsed) {
      message.error(t.invalidSvg)
      return
    }
    const id = sanitizeId(newId)
    if (symbols.some((s) => sanitizeId(s.id) === id && id)) {
      message.warning(t.duplicateId)
    }
    setSymbols((prev) => [
      ...prev,
      { id: id || `icon-${prev.length + 1}`, name: newName || id || `Icon ${prev.length + 1}`, svg: newSvg },
    ])
    setNewId('')
    setNewName('')
    setNewSvg('')
  }, [newId, newName, newSvg, symbols, t])

  const removeSymbol = useCallback((index) => {
    setSymbols((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const updateSymbol = useCallback((index, field, value) => {
    setSymbols((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: value } : s))
    )
  }, [])

  const resetAll = useCallback(() => {
    setSymbols(DEFAULTS.symbols)
    setNewId('')
    setNewName('')
    setNewSvg('')
    setWidth(DEFAULTS.width)
    setHeight(DEFAULTS.height)
    setColor('currentColor')
    setClassName('icon')
    setAddTitle(DEFAULTS.addTitle)
    setAddDesc(DEFAULTS.addDesc)
    setInlineStyles(DEFAULTS.inlineStyles)
  }, [])

  const applyPreset = useCallback((key) => {
    const preset = PRESETS[key]
    if (preset) setSymbols(preset.symbols)
  }, [])

  const copySprite = useCallback(() => {
    navigator.clipboard.writeText(sprite)
    message.success(t.copied)
  }, [sprite, t])

  const copyUsage = useCallback(() => {
    navigator.clipboard.writeText(usageHtml)
    message.success(t.copied)
  }, [usageHtml, t])

  const copyCss = useCallback(() => {
    navigator.clipboard.writeText(iconCss)
    message.success(t.copied)
  }, [iconCss, t])

  const downloadSprite = useCallback(() => {
    const blob = new Blob([sprite], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'sprite.svg'
    a.click()
    URL.revokeObjectURL(url)
  }, [sprite])

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><PictureOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Alert type="info" showIcon icon={<InfoCircleOutlined />} message={t.tipTitle} description={t.tipBody} />

      <Space style={{ width: '100%', justifyContent: 'space-between' }}>
        <Text strong>{t.presets}</Text>
        <Button size="small" icon={<UndoOutlined />} onClick={resetAll}>{t.reset}</Button>
      </Space>
      <Space wrap>
        {Object.entries(PRESETS).map(([key, p]) => (
          <Button key={key} size="small" onClick={() => applyPreset(key)}>{p.label[lang]}</Button>
        ))}
      </Space>

      <Card title={t.symbolsCard}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Row gutter={[16, 12]}>
            <Col xs={24} sm={12} lg={6}>
              <FormItem label={<Text code>{t.newId}</Text>}>
                <Input
                  value={newId}
                  onChange={(e) => setNewId(e.target.value)}
                  placeholder={t.idPlaceholder}
                />
              </FormItem>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <FormItem label={<Text>{t.newName}</Text>}>
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder={t.namePlaceholder}
                />
              </FormItem>
            </Col>
            <Col xs={24} lg={12}>
              <FormItem label={<Text>{t.newSvg}</Text>}>
                <TextArea
                  value={newSvg}
                  onChange={(e) => setNewSvg(e.target.value)}
                  placeholder={t.svgPlaceholder}
                  autoSize={{ minRows: 2, maxRows: 6 }}
                  style={{ fontFamily: 'monospace' }}
                />
              </FormItem>
            </Col>
          </Row>
          <Button type="primary" icon={<PlusOutlined />} onClick={addSymbol}>{t.addSymbol}</Button>

          {symbols.length === 0 ? (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t.noSymbols} />
          ) : (
            <List
              size="small"
              bordered
              dataSource={symbols}
              renderItem={(item, index) => (
                <List.Item
                  actions={[
                    <Button
                      key="remove"
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => removeSymbol(index)}
                    />,
                  ]}
                >
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Space wrap>
                      <Input
                        value={item.id}
                        onChange={(e) => updateSymbol(index, 'id', e.target.value)}
                        placeholder={t.idPlaceholder}
                        style={{ width: 160 }}
                      />
                      <Input
                        value={item.name}
                        onChange={(e) => updateSymbol(index, 'name', e.target.value)}
                        placeholder={t.namePlaceholder}
                        style={{ width: 160 }}
                      />
                    </Space>
                    <TextArea
                      value={item.svg}
                      onChange={(e) => updateSymbol(index, 'svg', e.target.value)}
                      autoSize={{ minRows: 2, maxRows: 6 }}
                      style={{ fontFamily: 'monospace' }}
                    />
                  </Space>
                </List.Item>
              )}
            />
          )}
        </Space>
      </Card>

      <Card title={t.optionsCard}>
        <Row gutter={[16, 12]}>
          <Col xs={24} sm={12} lg={6}>
            <FormItem label={<Text>{t.width}</Text>}>
              <Input
                type="number"
                min={1}
                value={width}
                onChange={(e) => setWidth(Number(e.target.value))}
              />
            </FormItem>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <FormItem label={<Text>{t.height}</Text>}>
              <Input
                type="number"
                min={1}
                value={height}
                onChange={(e) => setHeight(Number(e.target.value))}
              />
            </FormItem>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <FormItem label={<Text>{t.color}</Text>}>
              <Input
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="currentColor"
              />
            </FormItem>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <FormItem label={<Text>{t.className}</Text>}>
              <Input
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                placeholder="icon"
              />
            </FormItem>
          </Col>
          <Col xs={24}>
            <Space>
              <Checkbox checked={addTitle} onChange={(e) => setAddTitle(e.target.checked)}>{t.addTitle}</Checkbox>
              <Checkbox checked={addDesc} onChange={(e) => setAddDesc(e.target.checked)}>{t.addDesc}</Checkbox>
              <Checkbox checked={inlineStyles} onChange={(e) => setInlineStyles(e.target.checked)}>{t.inlineStyles}</Checkbox>
            </Space>
          </Col>
        </Row>
      </Card>

      {sprite && (
        <>
          <Card title={t.usageCard}>
            <Paragraph type="secondary">{t.usageIntro}</Paragraph>
            <pre
              style={{
                margin: 0,
                overflowX: 'auto',
                background: '#0d1117',
                color: '#e6edf3',
                padding: 12,
                borderRadius: 8,
                maxHeight: 240,
                fontSize: 12.5,
                lineHeight: 1.6,
              }}
            >
              <code>{usageHtml}</code>
            </pre>
            <Button size="small" icon={<CopyOutlined />} onClick={copyUsage} style={{ marginTop: 8 }}>{t.copy}</Button>
          </Card>

          <Card title={t.cssCard}>
            <pre
              style={{
                margin: 0,
                overflowX: 'auto',
                background: '#0d1117',
                color: '#e6edf3',
                padding: 12,
                borderRadius: 8,
                maxHeight: 240,
                fontSize: 12.5,
                lineHeight: 1.6,
              }}
            >
              <code>{iconCss}</code>
            </pre>
            <Button size="small" icon={<CopyOutlined />} onClick={copyCss} style={{ marginTop: 8 }}>{t.copy}</Button>
          </Card>
        </>
      )}

      <Card
        title={t.outputCard}
        extra={
          <Space>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {t.lineCount(lineCount)} · {t.byteCount(byteCount)}
            </Text>
            <Button size="small" icon={<CopyOutlined />} onClick={copySprite}>{t.copy}</Button>
            <Button size="small" icon={<DownloadOutlined />} onClick={downloadSprite}>{t.download}</Button>
          </Space>
        }
      >
        {sprite ? (
          <>
            <div
              style={{
                marginBottom: 16,
                padding: 16,
                border: '1px dashed #d9d9d9',
                borderRadius: 8,
                background: '#fafafa',
              }}
              // Renderiza o sprite inline para que os <use> possam referenciá-lo na mesma página.
              dangerouslySetInnerHTML={{ __html: sprite + usageHtml.replace(/\n/g, '') }}
            />
            <pre
              style={{
                margin: 0,
                overflowX: 'auto',
                background: '#0d1117',
                color: '#e6edf3',
                padding: 12,
                borderRadius: 8,
                maxHeight: 420,
                fontSize: 12.5,
                lineHeight: 1.6,
              }}
            >
              <code>{sprite}</code>
            </pre>
          </>
        ) : (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t.noSymbols} />
        )}
      </Card>

      <Collapse
        items={[
          {
            key: 'source',
            label: t.sourceTitle,
            children: (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Paragraph type="secondary">{t.sourceBody}</Paragraph>
                <pre style={{ margin: 0, overflowX: 'auto', maxHeight: 300 }}>
                  <code>{buildSprite.toString()}</code>
                </pre>
              </Space>
            ),
          },
        ]}
      />
    </Space>
  )
}

function FormItem({ label, children }) {
  return (
    <Space direction="vertical" size={4} style={{ width: '100%' }}>
      {label}
      {children}
    </Space>
  )
}
