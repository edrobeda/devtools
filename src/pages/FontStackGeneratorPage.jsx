import React, { useEffect, useMemo, useState } from 'react'
import {
  Typography,
  Card,
  Space,
  Input,
  Button,
  Select,
  Tag,
  Collapse,
  Row,
  Col,
  Alert,
  message,
  Tooltip,
} from 'antd'
import {
  FontSizeOutlined,
  CopyOutlined,
  PlusOutlined,
  DeleteOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  UndoOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  PRESETS,
  COMMON_FONTS,
  GENERIC_FAMILIES,
  buildFontStackCSS,
  buildFontFamilyValue,
  detectAvailableFonts,
  defaultStack,
  getPresetByKey,
} from '../utils/fontStackGenerator'

const { Title, Paragraph, Text } = Typography
const { useMessage } = message

const PREVIEW_TEXT = {
  pt: 'Todo dia sai algo novo daqui — a esteira nunca para. Áéíóú 12345',
  en: 'Something new ships every day — the belt never stops. Áéíóú 12345',
}

const translations = {
  pt: {
    title: 'Gerador de Font Stack CSS',
    intro:
      'Monte stacks de font-family robustas para web: escolha entre stacks famosas (GitHub, Tailwind, Bootstrap, system-ui), adicione fontes manualmente, reordene e veja o CSS gerado. A detecção de fontes instaladas roda 100% no navegador, sem enviar dados para lugar nenhum.',
    presets: 'Modelos de um clique',
    reset: 'Restaurar padrão',
    editor: 'Editor da stack',
    addFont: 'Adicionar fonte',
    addGeneric: 'Adicionar fallback genérico',
    quickPick: 'Fontes comuns',
    preview: 'Preview ao vivo',
    previewTextLabel: 'Texto de preview',
    fontSize: 'Tamanho da fonte',
    generatedCSS: 'CSS gerado',
    copy: 'Copiar',
    copied: 'CSS copiado!',
    copyError: 'Não foi possível copiar',
    available: 'instalada',
    unavailable: 'não instalada',
    unknown: 'não verificada',
    sourceTitle: 'Motor de geração',
    sourceIntro: 'O motor vive em src/utils/fontStackGenerator.js. quoteFontName decide quando um nome precisa de aspas (espaço, hífen/dígito inicial ou nome genérico CSS sem aspas); buildFontStackCSS monta a declaração completa; isFontAvailable usa Canvas 2D para comparar a largura de um texto de referência renderizado com a fonte testada vs. uma fonte impossível.',
    tipTitle: 'Por que usar font stacks?',
    tipBody: (
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        <li>
          <Text strong>Fallback progressivo</Text>: se a primeira fonte não carregar,
          o navegador tenta a próxima da lista.
        </li>
        <li>
          <Text strong>system-ui</Text> e <Text strong>-apple-system</Text> usam a fonte nativa
          de cada sistema operacional, dando aparência nativa sem carregar nada.
        </li>
        <li>
          <Text strong>Emoji fonts</Text> no final da stack garantem emojis consistentes
          em Windows, macOS e Linux.
        </li>
        <li>
          Termine sempre com um <Text strong>genérico</Text> (sans-serif, serif, monospace)
          para que o navegador tenha uma última opção garantida.
        </li>
      </ul>
    ),
    emptyStack: 'Adicione pelo menos uma fonte para gerar o CSS.',
    dragHint: 'Use as setas para reordenar a lista — a ordem define a prioridade de fallback.',
  },
  en: {
    title: 'CSS Font Stack Generator',
    intro:
      'Build robust CSS font-family stacks: pick from famous presets (GitHub, Tailwind, Bootstrap, system-ui), add fonts manually, reorder them and preview the generated CSS. Installed-font detection runs 100% in the browser without sending data anywhere.',
    presets: 'One-click templates',
    reset: 'Reset to default',
    editor: 'Stack editor',
    addFont: 'Add font',
    addGeneric: 'Add generic fallback',
    quickPick: 'Common fonts',
    preview: 'Live preview',
    previewTextLabel: 'Preview text',
    fontSize: 'Font size',
    generatedCSS: 'Generated CSS',
    copy: 'Copy',
    copied: 'CSS copied!',
    copyError: 'Could not copy',
    available: 'installed',
    unavailable: 'not installed',
    unknown: 'not checked',
    sourceTitle: 'Generation engine',
    sourceIntro: 'The engine lives in src/utils/fontStackGenerator.js. quoteFontName decides when a name needs quotes (space, leading hyphen/digit or CSS generic names stay unquoted); buildFontStackCSS builds the full declaration; isFontAvailable uses Canvas 2D to compare the width of a reference text rendered with the tested font vs. an impossible font.',
    tipTitle: 'Why use font stacks?',
    tipBody: (
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        <li>
          <Text strong>Progressive fallback</Text>: if the first font fails to load,
          the browser tries the next one in the list.
        </li>
        <li>
          <Text strong>system-ui</Text> and <Text strong>-apple-system</Text> use the OS
          native font, giving a native look without loading anything.
        </li>
        <li>
          <Text strong>Emoji fonts</Text> at the end of the stack keep emojis consistent
          across Windows, macOS and Linux.
        </li>
        <li>
          Always end with a <Text strong>generic family</Text> (sans-serif, serif, monospace)
          so the browser has a guaranteed last resort.
        </li>
      </ul>
    ),
    emptyStack: 'Add at least one font to generate CSS.',
    dragHint: 'Use the arrows to reorder the list — order defines fallback priority.',
  },
}

const PRESET_OPTIONS = PRESETS.map((p) => ({ value: p.key, label: p.name }))
const GENERIC_OPTIONS = GENERIC_FAMILIES.map((g) => ({ value: g.label, label: g.label }))
const COMMON_OPTIONS = COMMON_FONTS.map((f) => ({ value: f, label: f }))

export default function FontStackGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [messageApi, messageContextHolder] = useMessage()

  const [stack, setStack] = useState(defaultStack)
  const [newFont, setNewFont] = useState('')
  const [previewText, setPreviewText] = useState(PREVIEW_TEXT[lang])
  const [fontSize, setFontSize] = useState(24)
  const [availability, setAvailability] = useState({})

  const allFontsToCheck = useMemo(() => {
    const set = new Set([...COMMON_FONTS, ...stack.filter((f) => !GENERIC_FAMILIES.some((g) => g.label === f))])
    return Array.from(set)
  }, [stack])

  useEffect(() => {
    let cancelled = false
    // Pequeno delay para não bloquear a renderização inicial.
    const id = setTimeout(() => {
      const result = detectAvailableFonts(allFontsToCheck)
      if (!cancelled) setAvailability(result)
    }, 50)
    return () => {
      cancelled = true
      clearTimeout(id)
    }
  }, [allFontsToCheck])

  const cssDeclaration = useMemo(() => buildFontStackCSS(stack), [stack])
  const fontFamilyValue = useMemo(() => buildFontFamilyValue(stack), [stack])

  const applyPreset = (key) => {
    const preset = getPresetByKey(key, lang)
    if (preset) setStack([...preset.stack])
  }

  const reset = () => setStack(defaultStack())

  const addFont = (name) => {
    const trimmed = String(name || newFont).trim()
    if (!trimmed) return
    if (stack.includes(trimmed)) return
    setStack((prev) => [...prev, trimmed])
    setNewFont('')
  }

  const removeFont = (index) => {
    setStack((prev) => prev.filter((_, i) => i !== index))
  }

  const updateFont = (index, value) => {
    const trimmed = value.trim()
    if (!trimmed) return
    setStack((prev) => prev.map((f, i) => (i === index ? trimmed : f)))
  }

  const move = (index, direction) => {
    setStack((prev) => {
      const next = [...prev]
      const target = index + direction
      if (target < 0 || target >= next.length) return prev
      const temp = next[index]
      next[index] = next[target]
      next[target] = temp
      return next
    })
  }

  const copyCSS = async () => {
    try {
      await navigator.clipboard.writeText(cssDeclaration)
      messageApi.success(t.copied)
    } catch {
      messageApi.error(t.copyError)
    }
  }

  const copyValue = async () => {
    try {
      await navigator.clipboard.writeText(fontFamilyValue)
      messageApi.success(t.copied)
    } catch {
      messageApi.error(t.copyError)
    }
  }

  const isGeneric = (name) => GENERIC_FAMILIES.some((g) => g.label === name)

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {messageContextHolder}
      <Title level={2}><FontSizeOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Alert type="info" showIcon message={t.tipTitle} description={t.tipBody} />

      <Card title={t.presets}>
        <Space wrap>
          {PRESETS.map((p) => (
            <Button key={p.key} size="small" onClick={() => applyPreset(p.key)}>
              {lang === 'pt' ? p.name : p.nameEn}
            </Button>
          ))}
          <Button size="small" icon={<UndoOutlined />} onClick={reset}>{t.reset}</Button>
        </Space>
      </Card>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={12}>
          <Card title={t.editor}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Text type="secondary">{t.dragHint}</Text>
              {stack.map((font, index) => {
                const available = availability[font]
                return (
                  <Row key={`${index}-${font}`} gutter={[8, 8]} align="middle">
                    <Col flex="auto">
                      <Input
                        value={font}
                        onChange={(e) => updateFont(index, e.target.value)}
                      />
                    </Col>
                    <Col>
                      <Space>
                        {!isGeneric(font) && (
                          <Tooltip title={available === true ? t.available : available === false ? t.unavailable : t.unknown}>
                            {available === true ? (
                              <CheckCircleOutlined style={{ color: '#52c41a' }} />
                            ) : available === false ? (
                              <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
                            ) : (
                              <QuestionCircleOutlined style={{ color: '#bfbfbf' }} />
                            )}
                          </Tooltip>
                        )}
                        {isGeneric(font) && <Tag color="blue">generic</Tag>}
                        <Button
                          size="small"
                          icon={<ArrowUpOutlined />}
                          disabled={index === 0}
                          onClick={() => move(index, -1)}
                        />
                        <Button
                          size="small"
                          icon={<ArrowDownOutlined />}
                          disabled={index === stack.length - 1}
                          onClick={() => move(index, 1)}
                        />
                        <Button
                          size="small"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => removeFont(index)}
                        />
                      </Space>
                    </Col>
                  </Row>
                )
              })}

              <Row gutter={[8, 8]} align="bottom">
                <Col flex="auto">
                  <Input
                    placeholder="Ex: Inter"
                    value={newFont}
                    onChange={(e) => setNewFont(e.target.value)}
                    onPressEnter={() => addFont()}
                  />
                </Col>
                <Col>
                  <Button type="primary" icon={<PlusOutlined />} onClick={() => addFont()}>
                    {t.addFont}
                  </Button>
                </Col>
              </Row>

              <div>
                <Text>{t.addGeneric}</Text>
                <Select
                  style={{ width: '100%', marginTop: 8 }}
                  placeholder="sans-serif, serif, monospace..."
                  options={GENERIC_OPTIONS}
                  value={null}
                  onChange={(value) => addFont(value)}
                />
              </div>
            </Space>
          </Card>

          <Card title={t.quickPick} style={{ marginTop: 16 }}>
            <Select
              mode="multiple"
              style={{ width: '100%' }}
              placeholder={t.quickPick}
              options={COMMON_OPTIONS}
              value={[]}
              onChange={(values) => {
                values.forEach((v) => addFont(v))
              }}
            />
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Card title={t.preview}>
              <div
                style={{
                  border: '1px solid #f0f0f0',
                  borderRadius: 8,
                  padding: '24px 20px',
                  background: '#fafafa',
                  fontFamily: fontFamilyValue || 'inherit',
                  fontSize,
                  lineHeight: 1.5,
                  minHeight: 120,
                  wordBreak: 'break-word',
                }}
              >
                {previewText}
              </div>

              <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
                <Col xs={24} md={16}>
                  <FormItem label={t.previewTextLabel}>
                    <Input.TextArea
                      rows={2}
                      value={previewText}
                      onChange={(e) => setPreviewText(e.target.value)}
                    />
                  </FormItem>
                </Col>
                <Col xs={24} md={8}>
                  <FormItem label={t.fontSize}>
                    <Input
                      type="number"
                      min={8}
                      max={120}
                      value={fontSize}
                      onChange={(e) => setFontSize(Number(e.target.value) || 16)}
                      suffix="px"
                    />
                  </FormItem>
                </Col>
              </Row>
            </Card>

            <Card
              title={t.generatedCSS}
              extra={(
                <Space>
                  <Button size="small" icon={<CopyOutlined />} onClick={copyValue}>
                    value
                  </Button>
                  <Button size="small" icon={<CopyOutlined />} onClick={copyCSS}>
                    {t.copy}
                  </Button>
                </Space>
              )}
            >
              {cssDeclaration ? (
                <pre style={{
                  margin: 0,
                  overflowX: 'auto',
                  background: '#0d1117',
                  color: '#e6edf3',
                  padding: 12,
                  borderRadius: 8,
                  fontSize: 13,
                  lineHeight: 1.6,
                }}>
                  <code>{cssDeclaration}</code>
                </pre>
              ) : (
                <Text type="secondary">{t.emptyStack}</Text>
              )}
            </Card>
          </Space>
        </Col>
      </Row>

      <Collapse
        items={[
          {
            key: 'source',
            label: t.sourceTitle,
            children: (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Paragraph type="secondary">{t.sourceIntro}</Paragraph>
                <pre style={{ margin: 0, overflowX: 'auto', maxHeight: 320 }}>
                  <code>{buildFontStackCSS.toString()}</code>
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
      <Text>{label}</Text>
      {children}
    </Space>
  )
}
