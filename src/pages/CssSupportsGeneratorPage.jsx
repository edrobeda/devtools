import React, { useMemo, useState } from 'react'
import {
  Typography, Card, Space, Select, Switch, Button, message,
  Collapse, Row, Col, Input, Alert, Segmented, Tag, Divider,
} from 'antd'
import {
  BgColorsOutlined, CopyOutlined, UndoOutlined, PlusOutlined,
  DeleteOutlined, CheckCircleOutlined, CloseCircleOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  CONDITION_TYPES,
  OPERATORS,
  COMMON_PROPERTIES,
  COMMON_VALUES,
  DEFAULTS,
  PRESETS,
  buildConditionText,
  buildFeatureQuery,
  buildSupportsRule,
  checkBrowserSupport,
  validateCondition,
  allConditionsValid,
  getPlaceholderByType,
} from '../utils/cssSupportsGenerator'

const { Title, Paragraph, Text } = Typography

const translations = {
  pt: {
    title: 'Gerador de @supports CSS',
    intro:
      'Monte *feature queries* CSS direto no navegador. Adicione condições de propriedade, selector, font-format ou font-tech; combine com `and`/`or` e negações; veja o preview indicando se o navegador atual suporta a regra, copie o CSS gerado e use como *progressive enhancement*.',
    preview: 'Suporte neste navegador',
    supported: 'Suportado',
    notSupported: 'Não suportado',
    unknown: 'Indeterminado',
    error: 'Erro ao testar',
    generatedCss: '@supports gerado',
    copyCss: 'Copiar CSS',
    copiedCss: 'CSS copiado!',
    featureQuery: 'Feature query',
    conditions: 'Condições',
    addCondition: 'Adicionar condição',
    conditionType: 'Tipo',
    property: 'Propriedade / seletor',
    value: 'Valor',
    negate: 'Negar',
    operator: 'Operador entre condições',
    negateGroup: 'Negar o grupo inteiro',
    stylesInside: 'Estilos dentro do @supports',
    presets: 'Presets rápidos',
    reset: 'Restaurar padrões',
    invalidConditions: 'Preencha todas as condições corretamente.',
    supportTitle: 'Suporte nos navegadores',
    supportBody:
      '`@supports` é suportado em todos os navegadores modernos (IE não). As funções `selector()`, `font-format()` e `font-tech()` são mais recentes; teste sempre no target real.',
    sourceTitle: 'Código-fonte do motor',
    sourceBody:
      'O motor monta a string do feature query a partir das condições, do operador e da negação, depois usa `CSS.supports()` para dizer se o navegador atual reconhece a expressão.',
    presetGrid: 'CSS Grid',
    presetContainerQueries: 'Container Queries',
    presetHas: ':has() selector',
    presetScrollDriven: 'Scroll-driven animations',
    presetAnchor: 'Anchor positioning',
    placeholderProperty: 'display',
    placeholderValue: 'grid',
    placeholderSelector: ':has(*)',
    placeholderFontFormat: 'woff2',
    placeholderFontTech: 'color-COLRv1',
  },
  en: {
    title: 'CSS @supports Generator',
    intro:
      'Build CSS feature queries right in the browser. Add property, selector, font-format or font-tech conditions; combine them with `and`/`or` and negations; see a live preview showing whether the current browser supports the rule, copy the generated CSS and use it as progressive enhancement.',
    preview: 'Support in this browser',
    supported: 'Supported',
    notSupported: 'Not supported',
    unknown: 'Unknown',
    error: 'Error testing',
    generatedCss: 'Generated @supports',
    copyCss: 'Copy CSS',
    copiedCss: 'CSS copied!',
    featureQuery: 'Feature query',
    conditions: 'Conditions',
    addCondition: 'Add condition',
    conditionType: 'Type',
    property: 'Property / selector',
    value: 'Value',
    negate: 'Negate',
    operator: 'Operator between conditions',
    negateGroup: 'Negate whole group',
    stylesInside: 'Styles inside @supports',
    presets: 'Quick presets',
    reset: 'Reset defaults',
    invalidConditions: 'Fill in all conditions correctly.',
    supportTitle: 'Browser support',
    supportBody:
      '`@supports` is supported in all modern browsers (not IE). The `selector()`, `font-format()` and `font-tech()` functions are newer; always test on your actual target.',
    sourceTitle: 'Engine source code',
    sourceBody:
      'The engine builds the feature query string from the conditions, operator and negation, then uses `CSS.supports()` to tell whether the current browser recognizes the expression.',
    presetGrid: 'CSS Grid',
    presetContainerQueries: 'Container Queries',
    presetHas: ':has() selector',
    presetScrollDriven: 'Scroll-driven animations',
    presetAnchor: 'Anchor positioning',
    placeholderProperty: 'display',
    placeholderValue: 'grid',
    placeholderSelector: ':has(*)',
    placeholderFontFormat: 'woff2',
    placeholderFontTech: 'color-COLRv1',
  },
}

export default function CssSupportsGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [state, setState] = useState(DEFAULTS)

  const updateCondition = (id, patch) => {
    setState((prev) => ({
      ...prev,
      conditions: prev.conditions.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    }))
  }

  const removeCondition = (id) => {
    setState((prev) => ({
      ...prev,
      conditions: prev.conditions.filter((c) => c.id !== id),
    }))
  }

  const addCondition = () => {
    setState((prev) => ({
      ...prev,
      conditions: [
        ...prev.conditions,
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          type: 'property',
          property: '',
          value: '',
          negate: false,
        },
      ],
    }))
  }

  const setField = (key, value) => setState((prev) => ({ ...prev, [key]: value }))

  const applyPreset = (key) => {
    const preset = PRESETS.find((p) => p.key === key)
    if (!preset) return
    setState((prev) => ({ ...prev, ...preset.state }))
  }

  const reset = () => setState(DEFAULTS)

  const validConditions = useMemo(() => allConditionsValid(state.conditions), [state.conditions])
  const featureQuery = useMemo(() => buildFeatureQuery(state), [state])
  const cssOutput = useMemo(() => buildSupportsRule(state), [state])
  const supportResult = useMemo(() => checkBrowserSupport(state), [state])

  const copyCss = () => {
    navigator.clipboard.writeText(cssOutput)
    message.success(t.copiedCss)
  }

  const renderPreviewTag = () => {
    if (!validConditions) {
      return <Tag icon={<CloseCircleOutlined />} color="warning">{t.invalidConditions}</Tag>
    }
    if (supportResult.error) {
      return <Tag icon={<CloseCircleOutlined />} color="error">{t.error}: {supportResult.error}</Tag>
    }
    if (supportResult.supported) {
      return <Tag icon={<CheckCircleOutlined />} color="success">{t.supported}</Tag>
    }
    return <Tag icon={<CloseCircleOutlined />} color="error">{t.notSupported}</Tag>
  }

  const valueOptions = useMemo(() => {
    const map = {}
    state.conditions.forEach((c) => {
      if (c.type === 'property') {
        map[c.id] = (COMMON_VALUES[c.property] || []).map((v) => ({ value: v, label: v }))
      }
    })
    return map
  }, [state.conditions])

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><BgColorsOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title={t.preview}>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <div style={{ fontSize: 16 }}>{renderPreviewTag()}</div>
              <pre style={{ margin: 0, overflowX: 'auto' }}>
                <code>{featureQuery || '—'}</code>
              </pre>
            </Space>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card
            title={t.generatedCss}
            extra={<Button size="small" icon={<CopyOutlined />} onClick={copyCss}>{t.copyCss}</Button>}
          >
            <pre style={{ margin: 0, overflowX: 'auto' }}>
              <code>{validConditions ? cssOutput : `/* ${t.invalidConditions} */`}</code>
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

      <Card title={t.conditions}>
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          {state.conditions.map((condition, index) => (
            <Row key={condition.id} gutter={[16, 16]} align="middle">
              <Col xs={24} sm={6}>
                <Select
                  value={condition.type}
                  onChange={(v) => updateCondition(condition.id, { type: v, value: '' })}
                  options={CONDITION_TYPES}
                  style={{ width: '100%' }}
                />
              </Col>
              <Col xs={24} sm={condition.type === 'property' ? 6 : 10}>
                <Input
                  value={condition.property}
                  onChange={(e) => updateCondition(condition.id, { property: e.target.value })}
                  placeholder={
                    condition.type === 'property'
                      ? t.placeholderProperty
                      : condition.type === 'selector'
                        ? t.placeholderSelector
                        : condition.type === 'font-format'
                          ? t.placeholderFontFormat
                          : t.placeholderFontTech
                  }
                  status={validateCondition(condition) ? '' : 'error'}
                />
              </Col>
              {condition.type === 'property' && (
                <Col xs={24} sm={6}>
                  <Input
                    value={condition.value}
                    onChange={(e) => updateCondition(condition.id, { value: e.target.value })}
                    placeholder={t.placeholderValue}
                    status={validateCondition(condition) ? '' : 'error'}
                  />
                </Col>
              )}
              <Col xs={12} sm={3}>
                <Space>
                  <Switch
                    size="small"
                    checked={condition.negate}
                    onChange={(v) => updateCondition(condition.id, { negate: v })}
                  />
                  <Text>{t.negate}</Text>
                </Space>
              </Col>
              <Col xs={12} sm={3} style={{ textAlign: 'right' }}>
                <Button
                  danger
                  size="small"
                  icon={<DeleteOutlined />}
                  onClick={() => removeCondition(condition.id)}
                  disabled={state.conditions.length <= 1}
                />
              </Col>
              {condition.type === 'property' && valueOptions[condition.id]?.length > 0 && (
                <Col xs={24}>
                  <Space wrap size="small">
                    <Text type="secondary" style={{ fontSize: 12 }}>Valores comuns:</Text>
                    {valueOptions[condition.id].map((opt) => (
                      <Button
                        key={opt.value}
                        size="small"
                        type="dashed"
                        onClick={() => updateCondition(condition.id, { value: opt.value })}
                      >
                        {opt.label}
                      </Button>
                    ))}
                  </Space>
                </Col>
              )}
              {index < state.conditions.length - 1 && (
                <Col xs={24}>
                  <Divider style={{ margin: '8px 0' }}>
                    <Segmented
                      value={state.operator}
                      onChange={(v) => setField('operator', v)}
                      options={OPERATORS}
                      size="small"
                    />
                  </Divider>
                </Col>
              )}
            </Row>
          ))}
          <Button icon={<PlusOutlined />} onClick={addCondition}>{t.addCondition}</Button>
        </Space>
      </Card>

      <Card title={t.stylesInside}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Input.TextArea
            value={state.styles}
            onChange={(e) => setField('styles', e.target.value)}
            rows={8}
            style={{ fontFamily: 'monospace' }}
          />
          <Alert
            type="info"
            showIcon
            message={t.featureQuery}
            description={featureQuery || '—'}
          />
          <Space>
            <Text strong>{t.negateGroup}</Text>
            <Switch checked={state.negateGroup} onChange={(v) => setField('negateGroup', v)} />
          </Space>
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
                  <code>{`// src/utils/cssSupportsGenerator.js

export const CONDITION_TYPES = ${JSON.stringify(CONDITION_TYPES, null, 2)};

export const OPERATORS = ${JSON.stringify(OPERATORS, null, 2)};

export function buildConditionText(condition) {
  const { type, property, value } = condition;
  switch (type) {
    case 'selector':
      return \`selector(\${(property || ':has(*)').trim()})\`;
    case 'font-format':
      return \`font-format(\${(property || 'woff2').trim()})\`;
    case 'font-tech':
      return \`font-tech(\${(property || 'color-COLRv1').trim()})\`;
    default:
      return \`\${(property || 'display').trim()}: \${(value || 'grid').trim()}\`;
  }
}

export function buildFeatureQuery(state) {
  const { conditions, operator, negateGroup } = state;
  if (!conditions || conditions.length === 0) return '';
  const parts = conditions.map((c) => {
    const text = buildConditionText(c);
    return c.negate ? \`not (\${text})\` : \`(\${text})\`;
  });
  let inner = parts.join(\` \${operator} \`);
  if (conditions.length > 1 && !negateGroup) inner = \`(\${inner})\`;
  return negateGroup ? \`not \${inner}\` : inner;
}

export function buildSupportsRule(state) {
  const query = buildFeatureQuery(state);
  if (!query) return '';
  const styles = (state.styles || '').trim();
  const body = styles ? '\\n' + styles + '\\n' : '\\n';
  return \`@supports \${query} {\${body}}\`;
}

export function checkBrowserSupport(state) {
  const query = buildFeatureQuery(state);
  if (!query) return { supported: false, error: 'empty query' };
  try {
    const rawQuery = state.negateGroup ? query.replace(/^not\\s+/, '') : query;
    const supports = typeof CSS !== 'undefined' && CSS.supports(rawQuery);
    return { supported: state.negateGroup ? !supports : supports };
  } catch (err) {
    return { supported: false, error: err.message };
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
