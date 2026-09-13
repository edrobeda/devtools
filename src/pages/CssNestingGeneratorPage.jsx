import React, { useEffect, useMemo, useState } from 'react'
import {
  Typography, Card, Space, Button, Input, Row, Col,
  Collapse, Alert, message, Tag,
} from 'antd'
import {
  CopyOutlined, DeleteOutlined, PlusOutlined, UndoOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  buildNestedCss,
  buildFlatCss,
  buildPreviewDoc,
  supportsNesting,
  buildRule,
  expandChildSelector,
  PRESETS,
} from '../utils/cssNestingGenerator'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input

let idSeq = 0
const withId = (rule) => ({ ...rule, id: ++idSeq })

const translations = {
  pt: {
    title: 'Gerador de CSS Nesting',
    intro:
      'Crie blocos de CSS nativos aninhados (seletores descendentes, & e & tal) e veja o equivalente "achatado" em tempo real — o CSS que os pré-processadores (Sass/LESS) sempre geraram, agora quase nativo no navegador. Ideal para aprender CSS Nesting e para treinar o código antes de adotar a sintaxe no projeto.',
    noteTitle: 'O que é CSS Nesting?',
    noteBody:
      'CSS Nesting permite escrever seletores filhos dentro do bloco do pai, sem repetir o seletor: dentro de .card, escrever &__title equivale a .card__title, e a:hover equivale a .card a:hover. Sem o &, o seletor é tratado como descendência implícita. Regras @media aninhadas (como @media (min-width: 420px)) funcionam da mesma forma, agrupando o seletor pai. A especificação e os navegadores modernos (Chrome 120+, Safari 17+, Firefox 117+) suportam a sintaxe aninhada nativamente.',
    supportTitle: 'Suporte do seu navegador',
    supportYes: 'Navegador compatível com CSS Nesting nativo',
    supportNo: 'Navegador ainda sem suporte nativo — a prévia usa o CSS expandido',
    presets: 'Exemplos rápidos',
    reset: 'Limpar e voltar aos padrões',
    parentSelector: 'Seletor do pai',
    parentSelectorPh: 'ex.: .card',
    parentDecls: 'Declarações do pai',
    parentDeclsPh: 'propriedade: valor;',
    childrenTitle: 'Regras aninhadas',
    childrenHint:
      'Use & para o seletor do pai (ex.: &, &__title, &:hover, & > li). Seletores sem & viram descendência. Blocos que começam com @ (ex.: @media) são envoltos no seletor pai.',
    childSelector: 'Seletor filho',
    childSelectorPh: 'ex.: &__title',
    childDecls: 'Declarações',
    childDeclsPh: 'propriedade: valor;',
    addChild: 'Adicionar regra',
    removeChild: 'Remover',
    emptyParent: 'Informe o seletor do pai para gerar o CSS.',
    nestedTitle: 'CSS aninhado (nativo)',
    expandedTitle: 'CSS expandido (flat)',
    copyNested: 'Copiar',
    copyExpanded: 'Copiar',
    copied: 'Copiado!',
    copyError: 'Não foi possível copiar',
    previewTitle: 'Prévia ao vivo',
    previewHtmlTitle: 'HTML de exemplo',
    previewHtmlPh: '<div class="card">…</div>',
    previewTagSupported: 'Usando CSS aninhado',
    previewTagFallback: 'Usando CSS expandido',
    previewOpenDoc: 'Abrir doc',
    sourceTitle: 'Código-fonte deste componente',
    sourceBody:
      'O gerador é 100% client-side: sem dependências externas, sem chamadas de API. O "expandido" é montado trocando cada & pelo seletor do pai (descendência implícita para seletores sem &) e envolvendo @media no seletor pai.',
  },
  en: {
    title: 'CSS Nesting Generator',
    intro:
      'Build native nested CSS blocks (descendant selectors, & and friends) and see the "flattened" equivalent in real time — the CSS pre-processors (Sass/LESS) always generated, now nearly native in the browser. Great for learning CSS Nesting and for drafting code before adopting the syntax in your project.',
    noteTitle: 'What is CSS Nesting?',
    noteBody:
      'CSS Nesting lets you write child selectors inside the parent block without repeating the selector: inside .card, writing &__title equals .card__title, and a:hover equals .card a:hover. Without the &, the selector becomes implicit descendant. Nested @media rules (like @media (min-width: 420px)) work the same way, wrapping the parent selector. The spec and modern browsers (Chrome 120+, Safari 17+, Firefox 117+) support the nested syntax natively.',
    supportTitle: 'Your browser support',
    supportYes: 'Browser supports native CSS Nesting',
    supportNo: 'Browser lacks native support — the preview uses the expanded CSS',
    presets: 'Quick examples',
    reset: 'Clear and reset',
    parentSelector: 'Parent selector',
    parentSelectorPh: 'e.g. .card',
    parentDecls: 'Parent declarations',
    parentDeclsPh: 'property: value;',
    childrenTitle: 'Nested rules',
    childrenHint:
      'Use & for the parent selector (e.g. &, &__title, &:hover, & > li). Selectors without & become descendants. Blocks starting with @ (e.g. @media) wrap the parent selector.',
    childSelector: 'Child selector',
    childSelectorPh: 'e.g. &__title',
    childDecls: 'Declarations',
    childDeclsPh: 'property: value;',
    addChild: 'Add rule',
    removeChild: 'Remove',
    emptyParent: 'Provide the parent selector to generate CSS.',
    nestedTitle: 'Nested CSS (native)',
    expandedTitle: 'Expanded (flat) CSS',
    copyNested: 'Copy',
    copyExpanded: 'Copy',
    copied: 'Copied!',
    copyError: 'Could not copy',
    previewTitle: 'Live preview',
    previewHtmlTitle: 'Sample HTML',
    previewHtmlPh: '<div class="card">…</div>',
    previewTagSupported: 'Using nested CSS',
    previewTagFallback: 'Using expanded CSS',
    previewOpenDoc: 'Open doc',
    sourceTitle: 'Source code of this component',
    sourceBody:
      'This generator is 100% client-side: no external dependencies, no API calls. The "expanded" output is built by swapping each & for the parent selector (implicit descendant for selectors without &) and wrapping @media around the parent selector.',
  },
}

export default function CssNestingGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [support, setSupport] = useState(true)
  const [parent, setParent] = useState(PRESETS[0].parent)
  const [parentDecls, setParentDecls] = useState(PRESETS[0].parentDecls)
  const [childRules, setChildRules] = useState(() => PRESETS[0].children.map(withId))
  const [previewHtml, setPreviewHtml] = useState(PRESETS[0].previewHtml)
  const [baseCss, setBaseCss] = useState(PRESETS[0].baseCss)

  useEffect(() => {
    setSupport(supportsNesting())
  }, [])

  const applyPreset = (key) => {
    const preset = PRESETS.find((p) => p.key === key)
    if (!preset) return
    setParent(preset.parent)
    setParentDecls(preset.parentDecls)
    setChildRules(preset.children.map(withId))
    setPreviewHtml(preset.previewHtml)
    setBaseCss(preset.baseCss)
  }

  const resetAll = () => applyPreset(PRESETS[0].key)

  const updateParent = (e) => setParent(e.target.value)
  const updateParentDecls = (e) => setParentDecls(e.target.value)

  const updateChild = (id, field, value) => {
    setChildRules((prev) =>
      prev.map((rule) => (rule.id === id ? { ...rule, [field]: value } : rule)),
    )
  }

  const addChild = () => {
    setChildRules((prev) => [...prev, withId({ selector: '', declarations: '' })])
  }

  const removeChild = (id) => {
    setChildRules((prev) => prev.filter((rule) => rule.id !== id))
  }

  const nestedCss = useMemo(
    () => buildNestedCss(parent, parentDecls, childRules),
    [parent, parentDecls, childRules],
  )
  const flatCss = useMemo(
    () => buildFlatCss(parent, parentDecls, childRules),
    [parent, parentDecls, childRules],
  )
  const previewDoc = useMemo(
    () => buildPreviewDoc(previewHtml, support ? nestedCss : flatCss, baseCss),
    [previewHtml, nestedCss, flatCss, baseCss, support],
  )

  const copy = async (text, okMsg) => {
    try {
      await navigator.clipboard.writeText(text)
      message.success(okMsg)
    } catch {
      message.error(t.copyError)
    }
  }

  const sourceBlocks = [
    buildRule.toString(),
    expandChildSelector.toString(),
    buildNestedCss.toString(),
    buildFlatCss.toString(),
    supportsNesting.toString(),
  ]

  return (
    <div>
      <Title level={2}>{t.title}</Title>
      <Paragraph>{t.intro}</Paragraph>

      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Alert
          type="info"
          showIcon
          message={t.noteTitle}
          description={t.noteBody}
        />

        <Alert
          type={support ? 'success' : 'warning'}
          showIcon
          message={
            <Space>
              <Text>{t.supportTitle}:</Text>
              <Tag color={support ? 'green' : 'orange'}>
                {support ? t.supportYes : t.supportNo}
              </Tag>
            </Space>
          }
        />

        <Space wrap>
          <Button onClick={() => applyPreset('card')}>{t.presets}: .card</Button>
          <Button onClick={() => applyPreset('btn')}>{t.presets}: .btn</Button>
          <Button onClick={() => applyPreset('nav')}>{t.presets}: .nav</Button>
          <Button onClick={() => applyPreset('grid')}>{t.presets}: .grid</Button>
          <Button icon={<UndoOutlined />} onClick={resetAll}>
            {t.reset}
          </Button>
        </Space>

        <Row gutter={[16, 16]}>
          <Col xs={24} lg={10}>
            <Card title={t.parentSelector} size="small">
              <Space direction="vertical" style={{ width: '100%' }} size={12}>
                <Input
                  value={parent}
                  placeholder={t.parentSelectorPh}
                  onChange={updateParent}
                  style={{ fontFamily: 'monospace' }}
                />
                <TextArea
                  value={parentDecls}
                  rows={8}
                  placeholder={t.parentDeclsPh}
                  onChange={updateParentDecls}
                  style={{ fontFamily: 'monospace' }}
                />
              </Space>
            </Card>
          </Col>

          <Col xs={24} lg={14}>
            <Card
              size="small"
              title={
                <Space>
                  <Text>{t.childrenTitle}</Text>
                  <Button
                    type="primary"
                    size="small"
                    icon={<PlusOutlined />}
                    onClick={addChild}
                  >
                    {t.addChild}
                  </Button>
                </Space>
              }
              extra={<Text type="secondary">{t.childrenHint}</Text>}
            >
              <Space direction="vertical" size={12} style={{ width: '100%' }}>
                {childRules.map((rule, idx) => (
                  <Row key={rule.id} gutter={[8, 8]} align="middle">
                    <Col flex="220px">
                      <Input
                        value={rule.selector}
                        placeholder={
                          idx === 0 ? t.childSelectorPh : `&, &:hover, & > li`
                        }
                        onChange={(e) => updateChild(rule.id, 'selector', e.target.value)}
                        style={{ fontFamily: 'monospace' }}
                      />
                    </Col>
                    <Col flex="auto">
                      <TextArea
                        autoSize={{ minRows: 1, maxRows: 4 }}
                        value={rule.declarations}
                        placeholder={t.childDeclsPh}
                        onChange={(e) =>
                          updateChild(rule.id, 'declarations', e.target.value)
                        }
                        style={{ fontFamily: 'monospace' }}
                      />
                    </Col>
                    <Col>
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => removeChild(rule.id)}
                      />
                    </Col>
                  </Row>
                ))}
              </Space>
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Card
              size="small"
              title={t.nestedTitle}
              extra={
                <Button
                  size="small"
                  icon={<CopyOutlined />}
                  onClick={() => copy(nestedCss, t.copied)}
                >
                  {t.copyNested}
                </Button>
              }
            >
              <pre
                style={{
                  margin: 0,
                  maxHeight: 420,
                  overflow: 'auto',
                  fontSize: 12,
                  lineHeight: 1.6,
                }}
              >
                <code>{nestedCss || <Text type="secondary">{t.emptyParent}</Text>}</code>
              </pre>
            </Card>
          </Col>

          <Col xs={24} lg={12}>
            <Card
              size="small"
              title={t.expandedTitle}
              extra={
                <Button
                  size="small"
                  icon={<CopyOutlined />}
                  onClick={() => copy(flatCss, t.copied)}
                >
                  {t.copyExpanded}
                </Button>
              }
            >
              <pre
                style={{
                  margin: 0,
                  maxHeight: 420,
                  overflow: 'auto',
                  fontSize: 12,
                  lineHeight: 1.6,
                }}
              >
                <code>{flatCss || <Text type="secondary">{t.emptyParent}</Text>}</code>
              </pre>
            </Card>
          </Col>
        </Row>

        <Card
          size="small"
          title={t.previewTitle}
          extra={
            <Tag color={support ? 'green' : 'orange'}>
              {support ? t.previewTagSupported : t.previewTagFallback}
            </Tag>
          }
        >
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Text strong style={{ display: 'block', marginBottom: 8 }}>
                {t.previewHtmlTitle}
              </Text>
              <TextArea
                value={previewHtml}
                rows={6}
                placeholder={t.previewHtmlPh}
                onChange={(e) => setPreviewHtml(e.target.value)}
                style={{ fontFamily: 'monospace' }}
              />
            </Col>
            <Col xs={24} lg={12}>
              <iframe
                title="preview-css-nesting"
                sandbox="allow-same-origin"
                srcDoc={previewDoc}
                style={{ width: '100%', height: 220, border: '1px solid #f0f0f0', borderRadius: 8 }}
              />
            </Col>
          </Row>
        </Card>

        <Collapse
          items={[
            {
              key: 'source',
              label: t.sourceTitle,
              children: (
                <div>
                  <Paragraph type="secondary">{t.sourceBody}</Paragraph>
                  <pre
                    style={{
                      margin: 0,
                      maxHeight: 480,
                      overflow: 'auto',
                      fontSize: 12,
                      lineHeight: 1.6,
                    }}
                  >
                    <code>{sourceBlocks.join('\n\n')}</code>
                  </pre>
                </div>
              ),
            },
          ]}
        />
      </Space>
    </div>
  )
}