import React, { useMemo, useState } from 'react'
import {
  Typography, Card, Space, Button, Input, Row, Col,
  Collapse, Alert, message, Tooltip,
} from 'antd'
import {
  PartitionOutlined, CopyOutlined, PlusOutlined,
  DeleteOutlined, ArrowUpOutlined, ArrowDownOutlined,
  UndoOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  DEFAULT_LAYERS,
  PRESETS,
  isValidLayerName,
  normalizeLayerName,
  makeLayer,
  buildFullCss,
  buildHtmlExample,
  buildPreviewDocument,
  getLayerSummary,
  reorderLayers,
} from '../utils/cssLayerGenerator'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input

const translations = {
  pt: {
    title: 'Gerador de @layer CSS',
    intro:
      'Monte e experimente Cascade Layers (@layer) 100% no navegador. A ordem das camadas importa mais que a especificidade: regras em camadas posteriores vencem conflitos, mesmo quando uma camada anterior tem seletores mais específicos. Adicione camadas, edite seus blocos CSS, reordene e copie o código gerado.',
    preview: 'Preview ao vivo',
    previewHint: 'O iframe abaixo aplica o CSS gerado em isolamento. Reordene as camadas e veja quem vence.',
    layers: 'Camadas (ordem = prioridade crescente)',
    layerName: 'Nome da camada',
    layerCss: 'CSS da camada',
    addLayer: 'Adicionar camada',
    remove: 'Remover',
    moveUp: 'Mover para cima',
    moveDown: 'Mover para baixo',
    presets: 'Presets rápidos',
    reset: 'Restaurar padrões',
    cssOutput: 'CSS gerado',
    htmlOutput: 'HTML de exemplo',
    copyCss: 'Copiar CSS',
    copyHtml: 'Copiar HTML',
    copiedCss: 'CSS copiado!',
    copiedHtml: 'HTML copiado!',
    copyError: 'Não foi possível copiar',
    invalidName: 'Nome inválido',
    summary: (s) => `${s.total} camada(s), ${s.valid} válida(s)`,
    noteTitle: 'Por que @layer importa?',
    noteBody:
      'Sem @layer, a cascata clássica usa origem, especificidade e ordem. Com @layer, você cria grupos de estilos e a ordem dos grupos vence a especificidade dentro deles. Isso é útil para separar reset, tema, componentes e utilitários sem precisar de !important ou seletores artificiais.',
    supportTitle: 'Suporte nos navegadores',
    supportBody:
      '@layer é suportado em Chrome/Edge 99+, Firefox 97+, Safari 15.4+ e derivados. Navegadores antigos ignoram a regra, então use como melhoria progressiva.',
    sourceTitle: 'Código-fonte do motor',
    sourceBody:
      'O motor em src/utils/cssLayerGenerator.js valida nomes de camada, monta a declaração @layer com a ordem e gera os blocos @layer { ... }. O preview usa um iframe para isolar o CSS gerado do restante da aplicação.',
    presetItcss: 'ITCSS (settings → utilities)',
    presetFramework: 'Framework + overrides',
    presetDarkmode: 'Tema claro/escuro',
    presetSpecificity: 'Demo de especificidade',
    presetMinimal: 'Mínimo',
    placeholderName: 'nome-da-camada',
    placeholderCss: 'seletor {\n  propriedade: valor;\n}',
  },
  en: {
    title: 'CSS @layer Generator',
    intro:
      'Build and experiment with Cascade Layers (@layer) 100% in the browser. Layer order matters more than specificity: rules in later layers win conflicts, even when an earlier layer has more specific selectors. Add layers, edit their CSS blocks, reorder them and copy the generated code.',
    preview: 'Live preview',
    previewHint: 'The iframe below applies the generated CSS in isolation. Reorder layers and see who wins.',
    layers: 'Layers (order = increasing priority)',
    layerName: 'Layer name',
    layerCss: 'Layer CSS',
    addLayer: 'Add layer',
    remove: 'Remove',
    moveUp: 'Move up',
    moveDown: 'Move down',
    presets: 'Quick presets',
    reset: 'Reset defaults',
    cssOutput: 'Generated CSS',
    htmlOutput: 'Sample HTML',
    copyCss: 'Copy CSS',
    copyHtml: 'Copy HTML',
    copiedCss: 'CSS copied!',
    copiedHtml: 'HTML copied!',
    copyError: 'Could not copy',
    invalidName: 'Invalid name',
    summary: (s) => `${s.total} layer(s), ${s.valid} valid`,
    noteTitle: 'Why @layer matters',
    noteBody:
      'Without @layer, the classic cascade uses origin, specificity and order. With @layer you create style groups and the order of groups beats specificity within them. This is useful to separate resets, themes, components and utilities without !important or artificial selectors.',
    supportTitle: 'Browser support',
    supportBody:
      '@layer is supported in Chrome/Edge 99+, Firefox 97+, Safari 15.4+ and derivatives. Older browsers ignore the rule, so use it as progressive enhancement.',
    sourceTitle: 'Engine source code',
    sourceBody:
      'The engine in src/utils/cssLayerGenerator.js validates layer names, builds the @layer declaration with order and generates the @layer { ... } blocks. The preview uses an iframe to isolate the generated CSS from the rest of the app.',
    presetItcss: 'ITCSS (settings → utilities)',
    presetFramework: 'Framework + overrides',
    presetDarkmode: 'Light/dark theme',
    presetSpecificity: 'Specificity demo',
    presetMinimal: 'Minimal',
    placeholderName: 'layer-name',
    placeholderCss: 'selector {\n  property: value;\n}',
  },
}

export default function CssLayerGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [messageApi, messageContextHolder] = message.useMessage()

  const [layers, setLayers] = useState(DEFAULT_LAYERS)

  const cssOutput = useMemo(() => buildFullCss(layers), [layers])
  const htmlOutput = useMemo(() => buildHtmlExample(layers), [layers])
  const previewDoc = useMemo(() => buildPreviewDocument(layers), [layers])
  const summary = useMemo(() => getLayerSummary(layers), [layers])

  const copy = async (text, successText) => {
    try {
      await navigator.clipboard.writeText(text)
      messageApi.success(successText)
    } catch {
      messageApi.error(t.copyError)
    }
  }

  const updateLayer = (id, patch) => {
    setLayers((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)))
  }

  const addLayer = () => {
    setLayers((prev) => [...prev, makeLayer()])
  }

  const removeLayer = (id) => {
    setLayers((prev) => prev.filter((l) => l.id !== id))
  }

  const moveLayer = (id, direction) => {
    setLayers((prev) => {
      const idx = prev.findIndex((l) => l.id === id)
      if (idx < 0) return prev
      const target = idx + direction
      if (target < 0 || target >= prev.length) return prev
      return reorderLayers(prev, idx, target)
    })
  }

  const applyPreset = (key) => {
    const preset = PRESETS.find((p) => p.key === key)
    if (!preset) return
    setLayers(preset.layers.map((l) => ({ ...l })))
  }

  const reset = () => setLayers(DEFAULT_LAYERS.map((l) => ({ ...l })))

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {messageContextHolder}

      <Title level={2}><PartitionOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title={t.preview}>
            <Paragraph type="secondary" style={{ fontSize: 12, marginTop: -8 }}>{t.previewHint}</Paragraph>
            <iframe
              title="@layer preview"
              srcDoc={previewDoc}
              style={{
                width: '100%',
                height: 260,
                border: '1px solid #d9d9d9',
                borderRadius: 8,
                background: '#fff',
              }}
              sandbox="allow-same-origin"
            />
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            title={t.cssOutput}
            extra={
              <Button size="small" icon={<CopyOutlined />} onClick={() => copy(cssOutput, t.copiedCss)}>
                {t.copyCss}
              </Button>
            }
          >
            <pre style={{ margin: 0, overflowX: 'auto', maxHeight: 220 }}>
              <code>{cssOutput || `/* ${t.invalidName} */`}</code>
            </pre>
          </Card>

          <Card
            title={t.htmlOutput}
            style={{ marginTop: 16 }}
            extra={
              <Button size="small" icon={<CopyOutlined />} onClick={() => copy(htmlOutput, t.copiedHtml)}>
                {t.copyHtml}
              </Button>
            }
          >
            <pre style={{ margin: 0, overflowX: 'auto', maxHeight: 120 }}>
              <code>{htmlOutput}</code>
            </pre>
          </Card>
        </Col>
      </Row>

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

      <Card title={`${t.layers} (${t.summary(summary)})`}>
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          {layers.map((layer, index) => {
            const valid = isValidLayerName(layer.name)
            return (
              <Row key={layer.id} gutter={[16, 8]} align="top">
                <Col xs={24} sm={6}>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Text strong>{t.layerName}</Text>
                    <Input
                      value={layer.name}
                      placeholder={t.placeholderName}
                      status={valid ? '' : 'error'}
                      onChange={(e) => updateLayer(layer.id, { name: normalizeLayerName(e.target.value) })}
                    />
                    {!valid && <Text type="danger" style={{ fontSize: 12 }}>{t.invalidName}</Text>}
                  </Space>
                </Col>
                <Col xs={24} sm={16}>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Text strong>{t.layerCss}</Text>
                    <TextArea
                      value={layer.css}
                      placeholder={t.placeholderCss}
                      rows={5}
                      onChange={(e) => updateLayer(layer.id, { css: e.target.value })}
                    />
                  </Space>
                </Col>
                <Col xs={24} sm={2}>
                  <Space direction="vertical" size="small">
                    <Tooltip title={t.moveUp}>
                      <Button
                        size="small"
                        icon={<ArrowUpOutlined />}
                        disabled={index === 0}
                        onClick={() => moveLayer(layer.id, -1)}
                      />
                    </Tooltip>
                    <Tooltip title={t.moveDown}>
                      <Button
                        size="small"
                        icon={<ArrowDownOutlined />}
                        disabled={index === layers.length - 1}
                        onClick={() => moveLayer(layer.id, 1)}
                      />
                    </Tooltip>
                    <Tooltip title={t.remove}>
                      <Button
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => removeLayer(layer.id)}
                      />
                    </Tooltip>
                  </Space>
                </Col>
              </Row>
            )
          })}
          <Button type="dashed" icon={<PlusOutlined />} onClick={addLayer} block>
            {t.addLayer}
          </Button>
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
                  <code>{`// src/utils/cssLayerGenerator.js

export const DEFAULT_LAYERS = ${JSON.stringify(DEFAULT_LAYERS, null, 2)};

export const PRESETS = ${JSON.stringify(PRESETS, null, 2)};

const IDENTIFIER_RE = /^[a-zA-Z_-][a-zA-Z0-9_-]*$/;

export function isValidLayerName(name) {
  const trimmed = (name || '').trim();
  if (!trimmed) return false;
  return IDENTIFIER_RE.test(trimmed);
}

export function normalizeLayerName(name) {
  return (name || '').trim().replace(/\\s+/g, '-');
}

export function buildLayerDeclaration(layers) {
  const names = (layers || [])
    .map((l) => normalizeLayerName(l.name))
    .filter(Boolean);
  if (names.length === 0) return '';
  return '@layer ' + names.join(', ') + ';';
}

export function buildLayerBlocks(layers) {
  const valid = (layers || []).filter((l) => isValidLayerName(l.name));
  if (valid.length === 0) return '';
  return valid
    .map((l) => {
      const name = normalizeLayerName(l.name);
      const body = (l.css || '').trim();
      if (!body) return '@layer ' + name + ' {\\n}';
      const indented = body
        .split('\\n')
        .map((line) => (line.trim() ? '  ' + line : line))
        .join('\\n');
      return '@layer ' + name + ' {\\n' + indented + '\\n}';
    })
    .join('\\n\\n');
}

export function buildFullCss(layers) {
  const declaration = buildLayerDeclaration(layers);
  const blocks = buildLayerBlocks(layers);
  const parts = [declaration, blocks].filter(Boolean);
  return parts.join('\\n\\n');
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
