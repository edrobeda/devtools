import React, { useMemo, useState } from 'react'
import { Typography, Card, Space, Input, Select, Segmented, Slider, Alert, Tag, Row, Col } from 'antd'
import { SplitCellsOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import { chunkText, DEFAULT_SEPARATORS, SEPARATOR_OPTIONS } from '../utils/ragChunker'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input

const translations = {
  pt: {
    title: 'Visualizador de Chunking RAG',
    intro: (
      <>
        Mostra como pipelines de RAG fatiariam o texto antes de embeddar:
        janelas fixas, janelas com <Text code>overlap</Text> ou o splitter
        recursivo no estilo LangChain (desce por parágrafo → linha → espaço →
        string vazia). Ajuste tamanho, sobreposição e unidade e veja os
        pedaços com posição, proporção e custo estimado de tokens — 100% no
        navegador.
      </>
    ),
    inputLabel: 'Texto de exemplo',
    inputPlaceholder: 'Cole ou digite o texto a fatiar...',
    strategy: 'Estratégia',
    methodFixed: 'Janelas fixas',
    methodOverlap: 'Janelas com overlap',
    methodRecursive: 'Recursivo (LangChain)',
    unit: 'Unidade',
    unitChars: 'caracteres',
    unitTokens: 'tokens',
    size: 'Tamanho do chunk',
    overlapLabel: 'Overlap',
    overlapDisabledHintPt: ' (só em overlap/recursivo)',
    separators: 'Separadores (ordem de prioridade)',
    sepNone: 'string vazia',
    stats: 'Resumo da fatiação',
    chunks: 'Chunks',
    originalChars: 'Texto original',
    totalChars: 'Soma dos chunks',
    totalTokens: 'Tokens estimados',
    overhead: 'Overhead de overlap',
    avgTokens: 'Média de tokens/chunk',
    listTitle: 'Chunks gerados',
    emptyText: 'Cole um texto para começar.',
    pos: 'posição',
    approx: 'aprox.',
    dupPrefix: (n) => `${n} chars duplicados`,
    noteTitle: 'Como ler',
    note: (
      <>
        A estimativa de tokens usa a heurística do{' '}
        <Text code>/ai/token-counter</Text>: latim ≈ 1 token a cada 4 caracteres;
        scripts de alta densidade (CJK/emoji) ≈ 1 token por caractere. No modo
        <Text code>overlap</Text>, a parte em laranja no início de cada chunk é o
        trecho repetido da fronteira anterior. No modo recursivo, as posições
        são aproximadas porque os separadores são removidos dos pedaços
        (o texto dos chunks não é contíguo no original).
      </>
    ),
    legendFresh: 'Conteúdo novo do chunk',
    legendOverlap: 'Sobreposição (começo repetido)',
  },
  en: {
    title: 'RAG Chunking Visualizer',
    intro: (
      <>
        Shows how a RAG pipeline would slice a document before embedding:
        fixed windows, windows with <Text code>overlap</Text>, or the
        LangChain-style recursive splitter (paragraph → line → space → empty
        string). Tune size, overlap and unit, then inspect each chunk's
        position and estimated token cost — 100% client-side.
      </>
    ),
    inputLabel: 'Sample text',
    inputPlaceholder: 'Paste or type the text to chunk...',
    strategy: 'Strategy',
    methodFixed: 'Fixed windows',
    methodOverlap: 'Overlapping windows',
    methodRecursive: 'Recursive (LangChain)',
    unit: 'Unit',
    unitChars: 'chars',
    unitTokens: 'tokens',
    size: 'Chunk size',
    overlapLabel: 'Overlap',
    overlapDisabledHintPt: ' (overlap/recursive only)',
    separators: 'Separators (priority order)',
    sepNone: 'empty string',
    stats: 'Slicing summary',
    chunks: 'Chunks',
    originalChars: 'Original text',
    totalChars: 'Chunks total',
    totalTokens: 'Estimated tokens',
    overhead: 'Overlap overhead',
    avgTokens: 'Avg tokens/chunk',
    listTitle: 'Generated chunks',
    emptyText: 'Paste some text to start.',
    pos: 'position',
    approx: 'approx.',
    dupPrefix: (n) => `${n} duplicated chars`,
    noteTitle: 'How to read',
    note: (
      <>
        Token estimation follows the heuristic from the token counter page:
        Latin ≈ 1 token per 4 chars; high-density scripts (CJK/emoji) ≈ 1
        token per char. In <Text code>overlap</Text> mode, the orange part at
        the start of each chunk is the duplicated tail of the previous chunk.
        In recursive mode, positions are approximate because separators are
        stripped from pieces (chunk texts are not contiguous in the original).
      </>
    ),
    legendFresh: 'New chunk content',
    legendOverlap: 'Overlap (repeated start)',
  },
}

const DEFAULT_TEXT =
  'O RecursiveCharacterTextSplitter funciona de um jeito simples: tenta primeiro os separadores mais longos, como parágrafo e quebra de linha, e só desce para o espaço — e depois para a string vazia — quando um trecho ainda for grande demais.\n\nEm RAG, o documento é fatiado em pedaços, cada pedaço vira um vetor via embedding, e na hora da pergunta a busca retorna os pedaços mais parecidos para o modelo responder com contexto. O tamanho do chunk e o tamanho do overlap, quando há, mudam tanto a qualidade da busca quanto o custo de tokens.\n\nEsse terceiro parágrafo é mais longo e serve para demonstrar como o splitter recursivo vai cortando no nível do espaço e, quando ainda estoura o limite definido, serra o trecho em fatias regulares — mantendo o overlap como âncora entre um chunk e outro para não perder o contexto da fronteira.'

const BLOCK_COLORS = ['#e6f4ff', '#f6ffed', '#fff7e6', '#f9f0ff', '#fff1f0']

export default function RagChunkVisualizerPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [text, setText] = useState(DEFAULT_TEXT)
  const [method, setMethod] = useState('overlap')
  const [unit, setUnit] = useState('chars')
  const [size, setSize] = useState(40)
  const [overlap, setOverlap] = useState(8)
  const [separators, setSeparators] = useState(DEFAULT_SEPARATORS)

  const showOverlap = method !== 'fixed'

  const { chunks, stats } = useMemo(() => {
    const sepList =
      method === 'recursive' && (!separators || separators.length === 0)
        ? DEFAULT_SEPARATORS
        : separators
    const list = chunkText(text ?? '', { method, size, overlap, separators: sepList, unit })
    const totalTokens = list.reduce((s, c) => s + c.tokens, 0)
    const totalChars = list.reduce((s, c) => s + c.chars, 0)
    const dupChars = list.reduce((s, c) => s + c.dup, 0)
    const originalChars = (text ?? '').length
    const overhead = originalChars > 0 ? (dupChars / originalChars) * 100 : 0
    return {
      chunks: list,
      stats: {
        count: list.length,
        originalChars,
        totalChars,
        totalTokens,
        dupChars,
        overhead,
        avgTokens: list.length ? totalTokens / list.length : 0,
      },
    }
  }, [text, method, size, overlap, separators, unit])

  const separatorOptions = SEPARATOR_OPTIONS.map((s) => ({
    value: s.value,
    label: s.value === '' ? `"${t.sepNone}"` : JSON.stringify(s.value),
  }))

  const renderChunkText = (chunk) => {
    const dup = Math.min(chunk.dup, chunk.chars)
    if (dup === 0) return chunk.text
    const fresh = chunk.text.slice(dup)
    return (
      <>
        <span style={{ background: '#ffd666', borderRadius: 3, padding: '0 2px' }}>
          {chunk.text.slice(0, dup)}
        </span>
        {fresh}
      </>
    )
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}>
        <SplitCellsOutlined /> {t.title}
      </Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card title={t.inputLabel}>
        <TextArea
          rows={7}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t.inputPlaceholder}
        />
      </Card>

      <Card>
        <Row gutter={[24, 24]}>
          <Col xs={24} md={12}>
            <Text type="secondary" style={{ fontSize: 12 }}>{t.strategy}</Text>
            <div style={{ marginTop: 4 }}>
              <Segmented
                value={method}
                onChange={setMethod}
                options={[
                  { label: t.methodFixed, value: 'fixed' },
                  { label: t.methodOverlap, value: 'overlap' },
                  { label: t.methodRecursive, value: 'recursive' },
                ]}
              />
            </div>
          </Col>
          <Col xs={24} md={12}>
            <Text type="secondary" style={{ fontSize: 12 }}>{t.unit}</Text>
            <div style={{ marginTop: 4 }}>
              <Segmented
                value={unit}
                onChange={setUnit}
                options={[
                  { label: t.unitChars, value: 'chars' },
                  { label: t.unitTokens, value: 'tokens' },
                ]}
              />
            </div>
          </Col>
          <Col xs={24} md={12}>
            <Text type="secondary" style={{ fontSize: 12 }}>{t.size}</Text>
            <Slider
              min={10}
              max={200}
              marks={undefined}
              value={size}
              onChange={setSize}
              tooltip={{ open: false }}
            />
            <Text style={{ fontSize: 16, fontWeight: 600 }}>
              {size} {unit === 'chars' ? t.unitChars : t.unitTokens}
            </Text>
          </Col>
          <Col xs={24} md={12}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {t.overlapLabel}
              {!showOverlap && t.overlapDisabledHintPt}
            </Text>
            <Slider
              min={0}
              max={50}
              value={overlap}
              onChange={setOverlap}
              disabled={!showOverlap}
              tooltip={{ open: false }}
            />
            <Text style={{ fontSize: 16, fontWeight: 600 }}>
              {showOverlap ? overlap : '—'} {unit === 'chars' ? t.unitChars : t.unitTokens}
            </Text>
          </Col>
          {method === 'recursive' && (
            <Col xs={24}>
              <Text type="secondary" style={{ fontSize: 12 }}>{t.separators}</Text>
              <div style={{ marginTop: 4 }}>
                <Select
                  mode="multiple"
                  allowClear
                  value={separators}
                  onChange={setSeparators}
                  options={separatorOptions}
                  style={{ width: '100%' }}
                  placeholder={t.separators}
                />
              </div>
            </Col>
          )}
        </Row>
      </Card>

      <Card size="small" style={{ background: '#fafafa' }}>
        <Space wrap size="large">
          <div style={{ textAlign: 'center', minWidth: 110 }}>
            <Text strong style={{ fontSize: 28 }}>{stats.count.toLocaleString()}</Text>
            <div style={{ color: '#999', fontSize: 12 }}>{t.chunks}</div>
          </div>
          <div style={{ textAlign: 'center', minWidth: 110 }}>
            <Text strong style={{ fontSize: 20 }}>{stats.originalChars.toLocaleString()}</Text>
            <div style={{ color: '#999', fontSize: 12 }}>{t.originalChars}</div>
          </div>
          <div style={{ textAlign: 'center', minWidth: 110 }}>
            <Text strong style={{ fontSize: 20 }}>{stats.totalChars.toLocaleString()}</Text>
            <div style={{ color: '#999', fontSize: 12 }}>{t.totalChars}</div>
          </div>
          <div style={{ textAlign: 'center', minWidth: 110 }}>
            <Text strong style={{ fontSize: 20 }}>{stats.totalTokens.toLocaleString()}</Text>
            <div style={{ color: '#999', fontSize: 12 }}>{t.totalTokens}</div>
          </div>
          <div style={{ textAlign: 'center', minWidth: 110 }}>
            <Text strong style={{ fontSize: 20 }}>{stats.avgTokens.toFixed(1)}</Text>
            <div style={{ color: '#999', fontSize: 12 }}>{t.avgTokens}</div>
          </div>
          <div style={{ textAlign: 'center', minWidth: 110 }}>
            <Text strong style={{ fontSize: 20 }}>{stats.overhead.toFixed(1)}%</Text>
            <div style={{ color: '#999', fontSize: 12 }}>{t.overhead}</div>
          </div>
        </Space>
      </Card>

      <Card
        title={t.listTitle}
        extra={
          <Space size={8} wrap>
            <Tag color="blue">{t.legendFresh}</Tag>
            <Tag color="orange">{t.legendOverlap}</Tag>
          </Space>
        }
      >
        {chunks.length === 0 ? (
          <Text type="secondary">{t.emptyText}</Text>
        ) : (
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            {chunks.map((c, i) => (
              <div
                key={i}
                data-chunk="true"
                style={{
                  border: '1px solid #f0f0f0',
                  borderRadius: 8,
                  background: (BLOCK_COLORS[i % BLOCK_COLORS.length] || '#ffffff') + '',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '6px 10px',
                    borderBottom: '1px solid rgba(0,0,0,0.06)',
                    flexWrap: 'wrap',
                  }}
                >
                  <Text strong>#{i + 1}</Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {t.pos} [{c.start}–{c.end}){method === 'recursive' && ` ${t.approx}`}
                  </Text>
                  <Tag>{c.chars} {t.unitChars}</Tag>
                  <Tag color="purple">~{c.tokens} {t.unitTokens}</Tag>
                  {c.dup > 0 && <Tag color="orange">{t.dupPrefix(c.dup)}</Tag>}
                </div>
                <div
                  style={{
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    fontFamily: "'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace",
                    fontSize: 13,
                    padding: '10px 12px',
                  }}
                >
                  {renderChunkText(c)}
                </div>
              </div>
            ))}
          </Space>
        )}
      </Card>

      <Alert type="info" title={t.noteTitle} message={t.note} showIcon />
    </Space>
  )
}