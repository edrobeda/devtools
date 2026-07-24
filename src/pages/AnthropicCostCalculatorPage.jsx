import React, { useState, useMemo } from 'react'
import { Typography, Card, Space, Select, InputNumber, Descriptions, Radio } from 'antd'
import { RobotOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

// Preços em USD por milhão de tokens (referência: platform.claude.com/docs/en/pricing, cache 2026-06-24)
const MODELS = [
  { id: 'claude-fable-5', label: 'Claude Fable 5', input: 10, output: 50 },
  { id: 'claude-opus-4-8', label: 'Claude Opus 4.8', input: 5, output: 25 },
  { id: 'claude-opus-4-7', label: 'Claude Opus 4.7', input: 5, output: 25 },
  { id: 'claude-opus-4-6', label: 'Claude Opus 4.6', input: 5, output: 25 },
  { id: 'claude-sonnet-5', label: 'Claude Sonnet 5', input: 3, output: 15 },
  { id: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6', input: 3, output: 15 },
  { id: 'claude-haiku-4-5', label: 'Claude Haiku 4.5', input: 1, output: 5 },
]

const translations = {
  pt: {
    title: 'Calculadora de Custo Anthropic (Claude)',
    intro: (
      <>
        Estima o custo de uma requisição à API da Anthropic a partir do
        modelo e da quantidade de tokens — preços fixos por milhão de
        tokens embutidos na página (podem ficar desatualizados; confira{' '}
        <Text code>platform.claude.com/docs/en/pricing</Text> pro valor
        oficial atual). Cálculo 100% local, nenhum token é enviado.
      </>
    ),
    model: 'Modelo',
    inputTokens: 'Tokens de entrada (input)',
    outputTokens: 'Tokens de saída (output)',
    cacheMode: 'Prompt caching',
    cacheNone: 'Sem cache',
    cacheWrite5m: 'Escrita de cache (5 min, 1.25×)',
    cacheWrite1h: 'Escrita de cache (1 hora, 2×)',
    cacheRead: 'Leitura de cache (0.1×)',
    cacheTokens: 'Tokens envolvidos no cache',
    inputCost: 'Custo de entrada',
    outputCost: 'Custo de saída',
    totalCost: 'Custo total estimado',
    perMillion: '/ 1M tokens',
    disclaimer: 'Estimativa aproximada com preços cacheados na página — não reflete descontos, batch API (50% off) ou mudanças recentes de tabela.',
  },
  en: {
    title: 'Anthropic (Claude) Cost Calculator',
    intro: (
      <>
        Estimates the cost of an Anthropic API request from the model and
        token counts — flat per-million-token prices embedded in the page
        (may go stale; check{' '}
        <Text code>platform.claude.com/docs/en/pricing</Text> for the
        current official rate). 100% local calculation, no tokens are sent
        anywhere.
      </>
    ),
    model: 'Model',
    inputTokens: 'Input tokens',
    outputTokens: 'Output tokens',
    cacheMode: 'Prompt caching',
    cacheNone: 'No cache',
    cacheWrite5m: 'Cache write (5 min, 1.25×)',
    cacheWrite1h: 'Cache write (1 hour, 2×)',
    cacheRead: 'Cache read (0.1×)',
    cacheTokens: 'Tokens involved in caching',
    inputCost: 'Input cost',
    outputCost: 'Output cost',
    totalCost: 'Estimated total cost',
    perMillion: '/ 1M tokens',
    disclaimer: 'Rough estimate using prices cached on this page — does not reflect discounts, Batch API (50% off), or recent pricing changes.',
  },
}

function formatUsd(n) {
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 6 })}`
}

export default function AnthropicCostCalculatorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [modelId, setModelId] = useState('claude-sonnet-5')
  const [inputTokens, setInputTokens] = useState(10000)
  const [outputTokens, setOutputTokens] = useState(2000)
  const [cacheMode, setCacheMode] = useState('none')
  const [cacheTokens, setCacheTokens] = useState(0)

  const model = MODELS.find((m) => m.id === modelId)

  const result = useMemo(() => {
    const inputRate = model.input
    const outputRate = model.output
    let cacheMultiplier = 0
    if (cacheMode === 'write5m') cacheMultiplier = 1.25
    else if (cacheMode === 'write1h') cacheMultiplier = 2
    else if (cacheMode === 'read') cacheMultiplier = 0.1

    const plainInputTokens = Math.max(0, inputTokens - (cacheMode !== 'none' ? cacheTokens : 0))
    const cacheCost = cacheMode !== 'none' ? (cacheTokens / 1e6) * inputRate * cacheMultiplier : 0
    const inputCost = (plainInputTokens / 1e6) * inputRate + cacheCost
    const outputCost = (outputTokens / 1e6) * outputRate
    return { inputCost, outputCost, total: inputCost + outputCost }
  }, [model, inputTokens, outputTokens, cacheMode, cacheTokens])

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><RobotOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <div>
            <Text strong>{t.model}</Text>
            <div>
              <Select
                value={modelId}
                onChange={setModelId}
                style={{ width: 320 }}
                options={MODELS.map((m) => ({ value: m.id, label: `${m.label} — $${m.input}/$${m.output} ${t.perMillion}` }))}
              />
            </div>
          </div>

          <Space wrap size="middle">
            <div>
              <Text strong>{t.inputTokens}</Text>
              <div><InputNumber min={0} value={inputTokens} onChange={setInputTokens} style={{ width: 160 }} /></div>
            </div>
            <div>
              <Text strong>{t.outputTokens}</Text>
              <div><InputNumber min={0} value={outputTokens} onChange={setOutputTokens} style={{ width: 160 }} /></div>
            </div>
          </Space>

          <div>
            <Text strong>{t.cacheMode}</Text>
            <div>
              <Radio.Group value={cacheMode} onChange={(e) => setCacheMode(e.target.value)}>
                <Radio.Button value="none">{t.cacheNone}</Radio.Button>
                <Radio.Button value="write5m">{t.cacheWrite5m}</Radio.Button>
                <Radio.Button value="write1h">{t.cacheWrite1h}</Radio.Button>
                <Radio.Button value="read">{t.cacheRead}</Radio.Button>
              </Radio.Group>
            </div>
          </div>

          {cacheMode !== 'none' && (
            <div>
              <Text strong>{t.cacheTokens}</Text>
              <div><InputNumber min={0} max={inputTokens} value={cacheTokens} onChange={setCacheTokens} style={{ width: 160 }} /></div>
            </div>
          )}
        </Space>
      </Card>

      <Card>
        <Descriptions bordered size="small" column={1}>
          <Descriptions.Item label={t.inputCost}>{formatUsd(result.inputCost)}</Descriptions.Item>
          <Descriptions.Item label={t.outputCost}>{formatUsd(result.outputCost)}</Descriptions.Item>
          <Descriptions.Item label={t.totalCost}><Text strong style={{ fontSize: 16 }}>{formatUsd(result.total)}</Text></Descriptions.Item>
        </Descriptions>
      </Card>

      <Paragraph type="secondary" style={{ fontSize: 12 }}>{t.disclaimer}</Paragraph>
    </Space>
  )
}
