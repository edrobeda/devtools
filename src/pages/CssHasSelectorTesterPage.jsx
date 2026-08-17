import React, { useEffect, useMemo, useState } from 'react'
import {
  Typography, Card, Space, Button, Input, Row, Col,
  Collapse, Alert, message, Tag,
} from 'antd'
import {
  SelectOutlined, CopyOutlined, UndoOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  DEFAULT_HTML,
  DEFAULT_SELECTOR,
  PRESETS,
  isBrowserSupported,
  isValidSelector,
  buildPreviewDocument,
  buildHighlightRule,
  buildCssOutput,
  countMatches,
  getSelectorSummary,
} from '../utils/cssHasSelectorTester'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input

const translations = {
  pt: {
    title: 'Testador de :has() CSS',
    intro:
      'Teste seletores CSS :has() 100% no navegador. O pseudo-seletor relacional :has() permite estilizar um elemento baseado em seus descendentes, irmãos ou combinações complexas — como "selecionar cards que contenham um link" ou "campos sem label". Edite o HTML e o seletor, veja o match em tempo real e copie o CSS gerado.',
    htmlInput: 'HTML de teste',
    selectorInput: 'Seletor :has()',
    declarationsInput: 'Declarações CSS',
    preview: 'Preview ao vivo',
    previewHint: 'O iframe aplica o seletor e destaca os elementos combinados em azul.',
    cssOutput: 'CSS gerado',
    copyCss: 'Copiar CSS',
    copiedCss: 'CSS copiado!',
    copyError: 'Não foi possível copiar',
    presets: 'Exemplos rápidos',
    reset: 'Restaurar padrões',
    matches: (n) => `${n === null ? '?' : n} match(es)`,
    valid: 'Seletor válido',
    invalid: 'Seletor inválido',
    supported: ':has() suportado neste navegador',
    notSupported: ':has() não é suportado neste navegador',
    noteTitle: 'Por que :has() é poderoso?',
    noteBody:
      'Antes de :has(), estilizar um pai a partir de filhos exigia JavaScript ou classes auxiliares. Com :has() o CSS pode reagir à estrutura do DOM — por exemplo, .form-group:has(:focus-within) para destacar um campo ativo, ou article:has(> img) para cards com imagem em destaque.',
    supportTitle: 'Suporte nos navegadores',
    supportBody:
      ':has() é suportado em Chrome/Edge 105+, Firefox 121+, Safari 15.4+ e derivados. Navegadores antigos ignoram a regra inteira, então use como melhoria progressiva.',
    sourceTitle: 'Código-fonte do motor',
    sourceBody:
      'O motor em src/utils/cssHasSelectorTester.js usa CSS.supports("selector", seletor) para validar a sintaxe, monta um documento isolado em iframe com uma regra de highlight e conta os matches via DOMParser.querySelectorAll.',
    presetHasLink: 'Card com link',
    presetHasImage: 'Figure com imagem',
    presetNotHas: 'Campos sem label',
    presetHasCombinator: 'Item com filho direto',
    presetAdjacentSibling: 'Título seguido de parágrafo',
    placeholderSelector: 'ex: .card:has(a)',
    placeholderDeclarations: 'outline: 2px solid #1677ff;\nbackground: rgba(22, 119, 255, 0.08);',
  },
  en: {
    title: 'CSS :has() Selector Tester',
    intro:
      'Test CSS :has() selectors 100% in the browser. The relational :has() pseudo-selector lets you style an element based on its descendants, siblings or complex combinations — such as "select cards that contain a link" or "fields without a label". Edit the HTML and selector, see live matches and copy the generated CSS.',
    htmlInput: 'Test HTML',
    selectorInput: ':has() selector',
    declarationsInput: 'CSS declarations',
    preview: 'Live preview',
    previewHint: 'The iframe applies the selector and highlights matched elements in blue.',
    cssOutput: 'Generated CSS',
    copyCss: 'Copy CSS',
    copiedCss: 'CSS copied!',
    copyError: 'Could not copy',
    presets: 'Quick examples',
    reset: 'Reset defaults',
    matches: (n) => `${n === null ? '?' : n} match(es)`,
    valid: 'Valid selector',
    invalid: 'Invalid selector',
    supported: ':has() is supported in this browser',
    notSupported: ':has() is not supported in this browser',
    noteTitle: 'Why is :has() powerful?',
    noteBody:
      'Before :has(), styling a parent based on its children required JavaScript or helper classes. With :has(), CSS can react to DOM structure — for example, .form-group:has(:focus-within) to highlight an active field, or article:has(> img) for cards with a featured image.',
    supportTitle: 'Browser support',
    supportBody:
      ':has() is supported in Chrome/Edge 105+, Firefox 121+, Safari 15.4+ and derivatives. Older browsers ignore the entire rule, so use it as progressive enhancement.',
    sourceTitle: 'Engine source code',
    sourceBody:
      'The engine in src/utils/cssHasSelectorTester.js uses CSS.supports("selector", selector) to validate syntax, builds an isolated iframe document with a highlight rule and counts matches via DOMParser.querySelectorAll.',
    presetHasLink: 'Card with link',
    presetHasImage: 'Figure with image',
    presetNotHas: 'Fields without label',
    presetHasCombinator: 'Item with direct child',
    presetAdjacentSibling: 'Heading followed by paragraph',
    placeholderSelector: 'e.g. .card:has(a)',
    placeholderDeclarations: 'outline: 2px solid #1677ff;\nbackground: rgba(22, 119, 255, 0.08);',
  },
}

export default function CssHasSelectorTesterPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [messageApi, messageContextHolder] = message.useMessage()

  const [html, setHtml] = useState(DEFAULT_HTML)
  const [selector, setSelector] = useState(DEFAULT_SELECTOR)
  const [declarations, setDeclarations] = useState('')
  const [supported, setSupported] = useState(true)

  useEffect(() => {
    setSupported(isBrowserSupported())
  }, [])

  const valid = useMemo(() => isValidSelector(selector), [selector])
  const highlightRule = useMemo(() => buildHighlightRule(selector, valid), [selector, valid])
  const previewDoc = useMemo(() => buildPreviewDocument(html, selector, highlightRule), [html, selector, highlightRule])
  const matches = useMemo(() => (valid ? countMatches(html, selector) : null), [html, selector, valid])
  const cssOutput = useMemo(() => buildCssOutput(selector, declarations || undefined), [selector, declarations])
  const summary = useMemo(() => getSelectorSummary(selector, valid, supported, matches), [selector, valid, supported, matches])

  const copy = async (text, successText) => {
    try {
      await navigator.clipboard.writeText(text)
      messageApi.success(successText)
    } catch {
      messageApi.error(t.copyError)
    }
  }

  const applyPreset = (key) => {
    const preset = PRESETS.find((p) => p.key === key)
    if (!preset) return
    setHtml(preset.html)
    setSelector(preset.selector)
  }

  const reset = () => {
    setHtml(DEFAULT_HTML)
    setSelector(DEFAULT_SELECTOR)
    setDeclarations('')
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {messageContextHolder}

      <Title level={2}><SelectOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title={t.htmlInput}>
            <TextArea
              value={html}
              onChange={(e) => setHtml(e.target.value)}
              rows={14}
              spellCheck={false}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title={t.preview}>
            <Paragraph type="secondary" style={{ fontSize: 12, marginTop: -8 }}>{t.previewHint}</Paragraph>
            <iframe
              title=":has() preview"
              srcDoc={previewDoc}
              style={{
                width: '100%',
                height: 280,
                border: '1px solid #d9d9d9',
                borderRadius: 8,
                background: '#fff',
              }}
              sandbox="allow-same-origin"
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card title={t.selectorInput}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Input
                value={selector}
                onChange={(e) => setSelector(e.target.value)}
                placeholder={t.placeholderSelector}
                status={valid ? '' : 'error'}
                suffix={
                  <Tag color={valid ? 'success' : 'error'}>
                    {valid ? t.valid : t.invalid}
                  </Tag>
                }
              />
              <Space>
                <Tag color={supported ? 'blue' : 'warning'}>
                  {supported ? t.supported : t.notSupported}
                </Tag>
                <Text type="secondary">{t.matches(summary.matches)}</Text>
              </Space>
            </Space>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card
            title={t.cssOutput}
            extra={
              <Button size="small" icon={<CopyOutlined />} onClick={() => copy(cssOutput, t.copiedCss)}>
                {t.copyCss}
              </Button>
            }
          >
            <pre style={{ margin: 0, overflowX: 'auto', maxHeight: 220 }}>
              <code>{cssOutput || `/* ${t.selectorInput} */`}</code>
            </pre>
          </Card>
        </Col>
      </Row>

      <Card title={t.declarationsInput}>
        <TextArea
          value={declarations}
          onChange={(e) => setDeclarations(e.target.value)}
          placeholder={t.placeholderDeclarations}
          rows={4}
          spellCheck={false}
        />
      </Card>

      <Card
        title={t.presets}
        extra={<Button size="small" icon={<UndoOutlined />} onClick={reset}>{t.reset}</Button>}
      >
        <Space wrap>
          {PRESETS.map((p) => (
            <Button key={p.key} size="small" onClick={() => applyPreset(p.key)}>
              {t[p.labelKey]}
            </Button>
          ))}
        </Space>
      </Card>

      <Alert type="info" showIcon message={t.noteTitle} description={t.noteBody} />
      <Alert type="warning" showIcon message={t.supportTitle} description={t.supportBody} />

      <Collapse
        items={[
          {
            key: 'source',
            label: t.sourceTitle,
            children: (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Paragraph type="secondary">{t.sourceBody}</Paragraph>
                <pre style={{ margin: 0, overflowX: 'auto', maxHeight: 400 }}>
                  <code>{`// src/utils/cssHasSelectorTester.js

export const DEFAULT_HTML = \`...

export const DEFAULT_SELECTOR = '${DEFAULT_SELECTOR}';

export const PRESETS = ${JSON.stringify(PRESETS, null, 2).replace(/\$/g, '\\$')};

export function isBrowserSupported() {
  if (typeof window === 'undefined' || !window.CSS || typeof window.CSS.supports !== 'function') {
    return false;
  }
  return window.CSS.supports('selector(:has(*))');
}

export function isValidSelector(selector) {
  const trimmed = (selector || '').trim();
  if (!trimmed) return false;
  if (typeof window === 'undefined' || !window.CSS || typeof window.CSS.supports !== 'function') {
    return true;
  }
  try {
    return window.CSS.supports('selector', trimmed);
  } catch {
    return false;
  }
}

export function buildPreviewDocument(html, selector, highlightRule) {
  const safeHtml = (html || '').trim() || '<p>...</p>';
  const rule = (highlightRule || '').trim();
  return \`<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  /* estilos base */
\${rule ? '  ' + rule : ''}
</style>
</head>
<body>
\${safeHtml}
</body>
</html>\`;
}

export function buildHighlightRule(selector, valid) {
  if (!valid) return '';
  const trimmed = (selector || '').trim();
  if (!trimmed) return '';
  return \`\${trimmed} {
  outline: 3px solid #1677ff !important;
  background: rgba(22, 119, 255, 0.12) !important;
}\`;
}

export function buildCssOutput(selector, declarations) {
  const trimmed = (selector || '').trim();
  if (!trimmed) return '';
  const body = (declarations || '...').trim();
  return \`\${trimmed} {\\n\${body}\\n}\`;
}

export function countMatches(html, selector) {
  if (typeof window === 'undefined' || !window.DOMParser) return null;
  const trimmed = (selector || '').trim();
  if (!trimmed) return null;
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(\`<!DOCTYPE html><html><body>\${html}</body></html>\`, 'text/html');
    return doc.querySelectorAll(trimmed).length;
  } catch {
    return null;
  }
}`}</code>
                </pre>
              </Space>
            ),
          },
        ]}
      />
    </Space>
  )
}
