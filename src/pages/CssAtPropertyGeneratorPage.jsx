import React, { useMemo, useState } from 'react'
import {
  Typography, Card, Space, Select, Switch, Button, message,
  Collapse, Row, Col, Input, Alert, Segmented,
} from 'antd'
import { BgColorsOutlined, CopyOutlined, UndoOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  SYNTAX_OPTIONS,
  DEFAULTS,
  PRESETS,
  normalizeName,
  isValidPropertyName,
  buildAtPropertyRule,
  buildUsageExample,
  buildPreviewStyle,
} from '../utils/cssAtPropertyGenerator'

const { Title, Paragraph, Text } = Typography

const translations = {
  pt: {
    title: 'Gerador de @property CSS',
    intro:
      'Crie regras CSS @property (Houdini Properties & Values API) direto no navegador. Defina nome, syntax, herança e valor inicial; veja o código gerado, um exemplo de uso e um preview ao vivo — tudo 100% client-side.',
    preview: 'Preview ao vivo',
    propertyName: 'Nome da propriedade',
    propertyNameHint: 'Comece com -- ou deixe o gerador adicionar.',
    syntax: 'Syntax (tipo)',
    inherits: 'Herdada?',
    initialValue: 'Valor inicial',
    initialValueHint: 'Deixe vazio para omitir a declaração.',
    cssOutput: '@property gerado',
    usageOutput: 'Exemplo de uso',
    copyCss: 'Copiar @property',
    copyUsage: 'Copiar uso',
    copiedCss: '@property copiado!',
    copiedUsage: 'Uso copiado!',
    reset: 'Restaurar padrões',
    presets: 'Presets rápidos',
    invalidName: 'Nome inválido — use --nome ou nome, sem espaços.',
    supportTitle: 'Suporte nos navegadores',
    supportBody:
      '@property é suportado em Chrome/Edge 85+ e Opera 71+. Firefox e Safari ainda não implementam a API Properties and Values; em navegadores sem suporte a regra é ignorada, mas não quebra o layout.',
    sourceTitle: 'Código-fonte do motor',
    sourceBody:
      'O motor apenas monta a regra @property a partir do estado. A tipagem forte do syntax permite animações suaves de cores, larguras, ângulos e outros valores que antes não podiam ser interpolados corretamente.',
    presetColor: 'Cor animável',
    presetWidth: 'Largura animável',
    presetRotation: 'Rotação animável',
    presetOpacity: 'Opacidade animável',
    presetRadius: 'Border radius animável',
    yes: 'Sim',
    no: 'Não',
  },
  en: {
    title: 'CSS @property Generator',
    intro:
      'Create CSS @property rules (Houdini Properties & Values API) right in the browser. Set the name, syntax, inheritance and initial value; see the generated code, a usage example and a live preview — all 100% client-side.',
    preview: 'Live preview',
    propertyName: 'Property name',
    propertyNameHint: 'Start with -- or let the generator add it.',
    syntax: 'Syntax (type)',
    inherits: 'Inherits?',
    initialValue: 'Initial value',
    initialValueHint: 'Leave empty to omit the declaration.',
    cssOutput: 'Generated @property',
    usageOutput: 'Usage example',
    copyCss: 'Copy @property',
    copyUsage: 'Copy usage',
    copiedCss: '@property copied!',
    copiedUsage: 'Usage copied!',
    reset: 'Reset defaults',
    presets: 'Quick presets',
    invalidName: 'Invalid name — use --name or name, no spaces.',
    supportTitle: 'Browser support',
    supportBody:
      '@property is supported in Chrome/Edge 85+ and Opera 71+. Firefox and Safari have not yet implemented the Properties and Values API; in unsupported browsers the rule is ignored but does not break the layout.',
    sourceTitle: 'Engine source code',
    sourceBody:
      'The engine only assembles the @property rule from the current state. The strong typing from syntax enables smooth animations of colors, widths, angles and other values that previously could not be interpolated correctly.',
    presetColor: 'Animatable color',
    presetWidth: 'Animatable width',
    presetRotation: 'Animatable rotation',
    presetOpacity: 'Animatable opacity',
    presetRadius: 'Animatable border radius',
    yes: 'Yes',
    no: 'No',
  },
}

export default function CssAtPropertyGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [state, setState] = useState(DEFAULTS)

  const setField = (key, value) => setState((prev) => ({ ...prev, [key]: value }))

  const applyPreset = (key) => {
    const preset = PRESETS.find((p) => p.key === key)
    if (!preset) return
    setState((prev) => ({ ...prev, ...preset.state }))
  }

  const reset = () => setState(DEFAULTS)

  const validName = isValidPropertyName(state.name)
  const normalizedName = useMemo(() => normalizeName(state.name), [state.name])
  const cssOutput = useMemo(() => buildAtPropertyRule(state), [state])
  const usageOutput = useMemo(() => buildUsageExample(state), [state])
  const previewStyle = useMemo(() => buildPreviewStyle(state), [state])

  const copyCss = () => {
    navigator.clipboard.writeText(cssOutput)
    message.success(t.copiedCss)
  }

  const copyUsage = () => {
    navigator.clipboard.writeText(usageOutput)
    message.success(t.copiedUsage)
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><BgColorsOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title={t.preview}>
            {!validName ? (
              <div
                style={{
                  width: '100%',
                  height: 220,
                  borderRadius: 12,
                  border: '1px solid #d9d9d9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 16,
                }}
              >
                <Text type="danger">{t.invalidName}</Text>
              </div>
            ) : (
              <div
                style={{
                  width: '100%',
                  height: 220,
                  borderRadius: 12,
                  border: '1px solid #d9d9d9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 16,
                  transition: 'all 0.3s ease',
                  ...previewStyle,
                }}
              >
                <Text style={{ color: state.syntax === '<color>' ? '#fff' : undefined, fontWeight: 600 }}>
                  {state.previewText}
                </Text>
              </div>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title={t.cssOutput} extra={<Button size="small" icon={<CopyOutlined />} onClick={copyCss}>{t.copyCss}</Button>}>
            <pre style={{ margin: 0, overflowX: 'auto' }}>
              <code>{validName ? cssOutput : `/* ${t.invalidName} */`}</code>
            </pre>
          </Card>

          <Card
            title={t.usageOutput}
            extra={<Button size="small" icon={<CopyOutlined />} onClick={copyUsage}>{t.copyUsage}</Button>}
            style={{ marginTop: 16 }}
          >
            <pre style={{ margin: 0, overflowX: 'auto' }}>
              <code>{validName ? usageOutput : `/* ${t.invalidName} */`}</code>
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

      <Card>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Row gutter={[24, 24]}>
            <Col xs={24} sm={12}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text strong>{t.propertyName}</Text>
                <Input
                  value={state.name}
                  onChange={(e) => setField('name', e.target.value)}
                  status={validName ? '' : 'error'}
                  placeholder="--my-color"
                />
                {!validName && <Text type="danger" style={{ fontSize: 12 }}>{t.invalidName}</Text>}
                <Text type="secondary" style={{ fontSize: 12 }}>{t.propertyNameHint}</Text>
              </Space>
            </Col>
            <Col xs={24} sm={12}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text strong>{t.syntax}</Text>
                <Select
                  value={state.syntax}
                  onChange={(v) => setField('syntax', v)}
                  options={SYNTAX_OPTIONS}
                  style={{ width: '100%' }}
                />
              </Space>
            </Col>
          </Row>

          <Row gutter={[24, 24]}>
            <Col xs={24} sm={12}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text strong>{t.initialValue}</Text>
                <Input
                  value={state.initialValue}
                  onChange={(e) => setField('initialValue', e.target.value)}
                  placeholder="#1677ff"
                />
                <Text type="secondary" style={{ fontSize: 12 }}>{t.initialValueHint}</Text>
              </Space>
            </Col>
            <Col xs={24} sm={12}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text strong>{t.inherits}</Text>
                <Segmented
                  value={state.inherits}
                  onChange={(v) => setField('inherits', v)}
                  options={[
                    { value: true, label: t.yes },
                    { value: false, label: t.no },
                  ]}
                />
              </Space>
            </Col>
          </Row>

          {validName && (
            <Alert
              type="info"
              showIcon
              message={normalizedName}
              description={`syntax: ${state.syntax} | inherits: ${state.inherits} | initial-value: ${state.initialValue || '-'}`}
            />
          )}
        </Space>
      </Card>

      <Alert type="warning" showIcon message={t.supportTitle} description={t.supportBody} />

      <Collapse
        items={[
          {
            key: 'source',
            label: t.sourceTitle,
            children: (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Paragraph type="secondary">{t.sourceBody}</Paragraph>
                <pre style={{ margin: 0, overflowX: 'auto', maxHeight: 360 }}>
                  <code>{`// src/utils/cssAtPropertyGenerator.js

export const SYNTAX_OPTIONS = ${JSON.stringify(SYNTAX_OPTIONS, null, 2)};

export const DEFAULTS = ${JSON.stringify(DEFAULTS, null, 2)};

export function normalizeName(name) {
  const trimmed = (name || '').trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('--')) return trimmed;
  return \`--\${trimmed}\`;
}

export function isValidPropertyName(name) {
  const normalized = normalizeName(name);
  if (normalized.length < 3) return false;
  return /^--[a-zA-Z_-][a-zA-Z0-9_-]*$/.test(normalized);
}

export function buildAtPropertyRule(state) {
  const { name, syntax, inherits, initialValue } = state;
  const normalized = normalizeName(name);
  const hasInitial = (initialValue || '').trim() !== '';
  const inheritsLine = \`inherits: \${inherits};\`;
  const initialLine = hasInitial
    ? \`  initial-value: \${initialValue.trim()};\\n\`
    : '';
  return \`@property \${normalized} {\\n  syntax: "\${syntax}";\\n  \${inheritsLine}\\n\${initialLine}}\`;
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
