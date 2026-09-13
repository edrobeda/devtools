import React, { useState, useMemo } from 'react'
import { Typography, Card, Space, Select, InputNumber, Descriptions, Switch, Radio, Segmented, Tag } from 'antd'
import { RobotOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

// Preços em USD por milhão de tokens (referência: openai.com/api/pricing, cache 2026-06-24)
const OPENAI_MODELS = [
  { id: 'gpt-4.1', label: 'GPT-4.1', input: 2.0, output: 8.0, cachedInput: 0.5 },
  { id: 'gpt-4.1-mini', label: 'GPT-4.1 mini', input: 0.4, output: 1.6, cachedInput: 0.1 },
  { id: 'gpt-4o', label: 'GPT-4o', input: 2.5, output: 10.0, cachedInput: 1.25 },
  { id: 'gpt-4o-mini', label: 'GPT-4o mini', input: 0.15, output: 0.6, cachedInput: 0.075 },
  { id: 'o3', label: 'o3', input: 2.0, output: 8.0, cachedInput: 0.5 },
  { id: 'o3-mini', label: 'o3-mini', input: 1.1, output: 4.4, cachedInput: 0.275 },
  { id: 'o4-mini', label: 'o4-mini', input: 1.1, output: 4.4, cachedInput: 0.275 },
  { id: 'gpt-4-turbo', label: 'GPT-4 Turbo', input: 10.0, output: 30.0, cachedInput: 7.5 },
]

// Preços em USD por milhão de tokens (referência: platform.claude.com/docs/en/pricing, cache 2026-06-24)
const ANTHROPIC_MODELS = [
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
    title: 'Calculadora de Custo de LLM (OpenAI/Anthropic)',
    intro: (
      <>
        Estima o custo de uma requisição a uma API de LLM — OpenAI ou{' '}
        Anthropic — a partir do modelo e da quantidade de tokens, com as
        opções específicas de cada provedor. Preços fixos por milhão de
        tokens embutidos na página (podem ficar desatualizados; confira{' '}
        <Text code>openai.com/api/pricing</Text> e{' '}
        <Text code>platform.claude.com/docs/en/pricing</Text> pros valores
        oficiais atuais). Cálculo 100% local, nenhum token é enviado.
      </>
    ),
    provider: 'Provedor',
    model: 'Modelo',
    inputTokens: 'Tokens de entrada (input)',
    outputTokens: 'Tokens de saída (output)',
    outputTokensHint: 'Inclui reasoning tokens nos modelos da série o-series.',
    cache: 'Prompt caching (input em cache)',
    cacheTokens: 'Tokens envolvidos no cache',
    cacheHint: 'Tokens servidos do cache custam bem menos que o input normal.',
    batch: 'Batch API (50% de desconto)',
    batchHint: 'O Batch API da OpenAI processa requisições em até 24h com 50% de desconto.',
    cacheMode: 'Prompt caching',
    cacheNone: 'Sem cache',
    cacheWrite5m: 'Escrita de cache (5 min, 1.25×)',
    cacheWrite1h: 'Escrita de cache (1 hora, 2×)',
    cacheRead: 'Leitura de cache (0.1×)',
    inputCost: 'Custo de entrada',
    outputCost: 'Custo de saída',
    batchDiscount: 'Desconto Batch (50%)',
    totalCost: 'Custo total estimado',
    perMillion: '/ 1M tokens',
    disclaimer: 'Estimativa aproximada com preços cacheados na página — não reflete contratos enterprise, descontos, flutuações de preço ou mudanças recentes de tabela. Nos modelos o-series da OpenAI, os reasoning tokens contam como saída.',
  },
  en: {
    title: 'LLM Cost Calculator (OpenAI/Anthropic)',
    intro: (
      <>
        Estimates the cost of an LLM API request — OpenAI or Anthropic —
        from the model and token counts, with each provider's own pricing
        options. Flat per-million-token prices embedded in the page (may go
        stale; check <Text code>openai.com/api/pricing</Text> and{' '}
        <Text code>platform.claude.com/docs/en/pricing</Text> for the
        current official rates). 100% local calculation, no tokens are sent
        anywhere.
      </>
    ),
    provider: 'Provider',
    model: 'Model',
    inputTokens: 'Input tokens',
    outputTokens: 'Output tokens',
    outputTokensHint: 'Includes reasoning tokens on the o-series models.',
    cache: 'Prompt caching (cached input)',
    cacheTokens: 'Tokens involved in caching',
    cacheHint: 'Tokens served from cache cost far less than fresh input.',
    batch: 'Batch API (50% off)',
    batchHint: 'OpenAI Batch API processes requests within 24h at 50% off.',
    cacheMode: 'Prompt caching',
    cacheNone: 'No cache',
    cacheWrite5m: 'Cache write (5 min, 1.25×)',
    cacheWrite1h: 'Cache write (1 hour, 2×)',
    cacheRead: 'Cache read (0.1×)',
    inputCost: 'Input cost',
    outputCost: 'Output cost',
    batchDiscount: 'Batch discount (50%)',
    totalCost: 'Estimated total cost',
    perMillion: '/ 1M tokens',
    disclaimer: 'Rough estimate using prices cached on this page — does not reflect enterprise contracts, discounts, price fluctuations, or recent pricing changes. OpenAI o-series reasoning tokens are counted as output.',
  },
}

function formatUsd(n) {
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 6 })}`
}

export default function OpenAiCostCalculatorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [provider, setProvider] = useState('openai')
  const [modelId, setModelId] = useState('gpt-4o')
  const [inputTokens, setInputTokens] = useState(10000)
  const [outputTokens, setOutputTokens] = useState(2000)
  const [useCache, setUseCache] = useState(false)
  const [cacheTokens, setCacheTokens] = useState(0)
  const [batch, setBatch] = useState(false)
  const [cacheMode, setCacheMode] = useState('none')

  const currentModels = provider === 'openai' ? OPENAI_MODELS : ANTHROPIC_MODELS
  const model = currentModels.find((m) => m.id === modelId) || currentModels[0]

  const handleProviderChange = (p) => {
    setProvider(p)
    setModelId(p === 'openai' ? 'gpt-4o' : 'claude-sonnet-5')
    setUseCache(false)
    setBatch(false)
    setCacheMode('none')
    setCacheTokens(0)
  }

  const showCacheTokens = provider === 'openai' ? useCache : cacheMode !== 'none'

  const result = useMemo(() => {
    if (provider === 'anthropic') {
      let cacheMultiplier = 0
      if (cacheMode === 'write5m') cacheMultiplier = 1.25
      else if (cacheMode === 'write1h') cacheMultiplier = 2
      else if (cacheMode === 'read') cacheMultiplier = 0.1
      const plainInputTokens = Math.max(0, inputTokens - (cacheMode !== 'none' ? cacheTokens : 0))
      const cacheCost = cacheMode !== 'none' ? (cacheTokens / 1e6) * model.input * cacheMultiplier : 0
      const inputCost = (plainInputTokens / 1e6) * model.input + cacheCost
      const outputCost = (outputTokens / 1e6) * model.output
      return { inputCost, outputCost, batchDiscount: 0, total: inputCost + outputCost, cached: 0 }
    }
    const cached = useCache ? Math.min(Math.max(0, cacheTokens), inputTokens) : 0
    const plainInput = Math.max(0, inputTokens - cached)
    const inputCost = (plainInput / 1e6) * model.input + (cached / 1e6) * model.cachedInput
    const outputCost = (outputTokens / 1e6) * model.output
    const batchDiscount = batch ? (inputCost + outputCost) * 0.5 : 0
    return { inputCost, outputCost, batchDiscount, total: inputCost + outputCost - batchDiscount, cached }
  }, [provider, model, inputTokens, outputTokens, useCache, cacheTokens, batch, cacheMode])

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><RobotOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <div>
            <Text strong>{t.provider}</Text>
            <div>
              <Segmented
                value={provider}
                onChange={handleProviderChange}
                options={[
                  { label: 'OpenAI', value: 'openai' },
                  { label: 'Anthropic', value: 'anthropic' },
                ]}
              />
            </div>
          </div>

          <div>
            <Text strong>{t.model}</Text>
            <div>
              <Select
                value={modelId}
                onChange={setModelId}
                style={{ width: 340 }}
                options={currentModels.map((m) => ({
                  value: m.id,
                  label: `${m.label} — $${m.input}/$${m.output} ${t.perMillion}`,
                }))}
              />
            </div>
          </div>

          <Space wrap size="large">
            <div>
              <Text strong>{t.inputTokens}</Text>
              <div><InputNumber min={0} value={inputTokens} onChange={setInputTokens} style={{ width: 160 }} /></div>
            </div>
            <div>
              <Text strong>{t.outputTokens}</Text>
              <div><InputNumber min={0} value={outputTokens} onChange={setOutputTokens} style={{ width: 160 }} /></div>
              {provider === 'openai' && (
                <Text type="secondary" style={{ fontSize: 12 }}>{t.outputTokensHint}</Text>
              )}
            </div>
          </Space>

          {provider === 'openai' ? (
            <Space wrap size="large">
              <div>
                <Text strong>{t.cache}</Text>
                <div>
                  <Switch checked={useCache} onChange={setUseCache} />
                </div>
                <Text type="secondary" style={{ fontSize: 12 }}>{t.cacheHint}</Text>
              </div>
              <div>
                <Text strong>{t.batch}</Text>
                <div>
                  <Switch checked={batch} onChange={setBatch} />
                </div>
                <Text type="secondary" style={{ fontSize: 12 }}>{t.batchHint}</Text>
              </div>
            </Space>
          ) : (
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
          )}

          {showCacheTokens && (
            <div>
              <Text strong>{t.cacheTokens}</Text>
              <div><InputNumber min={0} max={inputTokens} value={cacheTokens} onChange={setCacheTokens} style={{ width: 160 }} /></div>
            </div>
          )}
        </Space>
      </Card>

      <Card>
        <Descriptions bordered size="small" column={1}>
          <Descriptions.Item label={t.inputCost}>
            {formatUsd(result.inputCost)}
            {provider === 'openai' && result.cached > 0 && (
              <Tag color="blue" style={{ marginLeft: 8 }}>{result.cached.toLocaleString()} cached</Tag>
            )}
          </Descriptions.Item>
          <Descriptions.Item label={t.outputCost}>{formatUsd(result.outputCost)}</Descriptions.Item>
          {provider === 'openai' && (
            <Descriptions.Item label={t.batchDiscount}>{batch ? formatUsd(result.batchDiscount) : '$0.0000'}</Descriptions.Item>
          )}
          <Descriptions.Item label={t.totalCost}><Text strong style={{ fontSize: 16 }}>{formatUsd(result.total)}</Text></Descriptions.Item>
        </Descriptions>
      </Card>

      <Paragraph type="secondary" style={{ fontSize: 12 }}>{t.disclaimer}</Paragraph>
    </Space>
  )
}