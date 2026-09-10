import React, { useState, useMemo } from 'react'
import { Typography, Card, Space, Select, InputNumber, Descriptions, Switch, Tag } from 'antd'
import { RobotOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

// Preços em USD por milhão de tokens (referência: openai.com/api/pricing, cache 2026-06-24)
const MODELS = [
  { id: 'gpt-4.1', label: 'GPT-4.1', input: 2.0, output: 8.0, cachedInput: 0.5 },
  { id: 'gpt-4.1-mini', label: 'GPT-4.1 mini', input: 0.4, output: 1.6, cachedInput: 0.1 },
  { id: 'gpt-4o', label: 'GPT-4o', input: 2.5, output: 10.0, cachedInput: 1.25 },
  { id: 'gpt-4o-mini', label: 'GPT-4o mini', input: 0.15, output: 0.6, cachedInput: 0.075 },
  { id: 'o3', label: 'o3', input: 2.0, output: 8.0, cachedInput: 0.5 },
  { id: 'o3-mini', label: 'o3-mini', input: 1.1, output: 4.4, cachedInput: 0.275 },
  { id: 'o4-mini', label: 'o4-mini', input: 1.1, output: 4.4, cachedInput: 0.275 },
  { id: 'gpt-4-turbo', label: 'GPT-4 Turbo', input: 10.0, output: 30.0, cachedInput: 7.5 },
]

const translations = {
  pt: {
    title: 'Calculadora de Custo OpenAI (GPT)',
    intro: (
      <>
        Estima o custo de uma requisição à API da OpenAI a partir do modelo,
        da quantidade de tokens e de opções como prompt caching e Batch API —
        preços fixos por milhão de tokens embutidos na página (podem ficar
        desatualizados; confira{' '}
        <Text code>openai.com/api/pricing</Text> pro valor oficial atual).
        Cálculo 100% local, nenhum token é enviado. O par da {' '}
        <Text code>anthropic-cost-calculator</Text> pra comparar provedores.
      </>
    ),
    model: 'Modelo',
    inputTokens: 'Tokens de entrada (input)',
    outputTokens: 'Tokens de saída (output)',
    outputTokensHint: 'Inclui reasoning tokens nos modelos da série o-series.',
    cache: 'Prompt caching (input em cache)',
    cacheTokens: 'Tokens de entrada em cache',
    cacheHint: 'Tokens servidos do cache custam bem menos que o input normal.',
    batch: 'Batch API (50% de desconto)',
    batchHint: 'O Batch API da OpenAI processa requisições em até 24h com 50% de desconto.',
    inputCost: 'Custo de entrada',
    outputCost: 'Custo de saída',
    batchDiscount: 'Desconto Batch (50%)',
    totalCost: 'Custo total estimado',
    perMillion: '/ 1M tokens',
    disclaimer: 'Estimativa aproximada com preços cacheados na página — não reflete contratos enterprise, flutuações de preço ou mudanças recentes de tabela. Para o-series, considera os reasoning tokens como saída.',
  },
  en: {
    title: 'OpenAI (GPT) Cost Calculator',
    intro: (
      <>
        Estimates the cost of an OpenAI API request from the model, token
        counts and options like prompt caching and the Batch API — flat
        per-million-token prices embedded in the page (may go stale; check{' '}
        <Text code>openai.com/api/pricing</Text> for the current official
        rate). 100% local calculation, no tokens are sent anywhere. The
        counterpart to the {' '}
        <Text code>anthropic-cost-calculator</Text> so you can compare
        providers.
      </>
    ),
    model: 'Model',
    inputTokens: 'Input tokens',
    outputTokens: 'Output tokens',
    outputTokensHint: 'Includes reasoning tokens on the o-series models.',
    cache: 'Prompt caching (cached input)',
    cacheTokens: 'Cached input tokens',
    cacheHint: 'Tokens served from cache cost far less than fresh input.',
    batch: 'Batch API (50% off)',
    batchHint: 'OpenAI Batch API processes requests within 24h at 50% off.',
    inputCost: 'Input cost',
    outputCost: 'Output cost',
    batchDiscount: 'Batch discount (50%)',
    totalCost: 'Estimated total cost',
    perMillion: '/ 1M tokens',
    disclaimer: 'Rough estimate using prices cached on this page — does not reflect enterprise contracts, price fluctuations, or recent pricing changes. o-series reasoning tokens are counted as output.',
  },
}

function formatUsd(n) {
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 6 })}`
}

export default function OpenAiCostCalculatorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [modelId, setModelId] = useState('gpt-4o')
  const [inputTokens, setInputTokens] = useState(10000)
  const [outputTokens, setOutputTokens] = useState(2000)
  const [useCache, setUseCache] = useState(false)
  const [cacheTokens, setCacheTokens] = useState(0)
  const [batch, setBatch] = useState(false)

  const model = MODELS.find((m) => m.id === modelId) || MODELS[0]

  const result = useMemo(() => {
    const cached = useCache ? Math.min(Math.max(0, cacheTokens), inputTokens) : 0
    const plainInput = Math.max(0, inputTokens - cached)
    const inputCost = (plainInput / 1e6) * model.input + (cached / 1e6) * model.cachedInput
    const outputCost = (outputTokens / 1e6) * model.output
    const subTotal = inputCost + outputCost
    const batchDiscount = batch ? subTotal * 0.5 : 0
    return { inputCost, outputCost, batchDiscount, total: subTotal - batchDiscount, cached }
  }, [model, inputTokens, outputTokens, useCache, cacheTokens, batch])

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
                style={{ width: 340 }}
                options={MODELS.map((m) => ({
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
              <Text type="secondary" style={{ fontSize: 12 }}>{t.outputTokensHint}</Text>
            </div>
          </Space>

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

          {useCache && (
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
            {result.cached > 0 && (
              <Tag color="blue" style={{ marginLeft: 8 }}>{result.cached.toLocaleString()} cached</Tag>
            )}
          </Descriptions.Item>
          <Descriptions.Item label={t.outputCost}>{formatUsd(result.outputCost)}</Descriptions.Item>
          <Descriptions.Item label={t.batchDiscount}>{batch ? formatUsd(result.batchDiscount) : '$0.0000'}</Descriptions.Item>
          <Descriptions.Item label={t.totalCost}><Text strong style={{ fontSize: 16 }}>{formatUsd(result.total)}</Text></Descriptions.Item>
        </Descriptions>
      </Card>

      <Paragraph type="secondary" style={{ fontSize: 12 }}>{t.disclaimer}</Paragraph>
    </Space>
  )
}