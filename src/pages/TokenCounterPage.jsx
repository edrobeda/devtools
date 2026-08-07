import React, { useMemo, useState } from 'react'
import { Typography, Card, Space, Input, Select, Progress, Segmented, Descriptions, Alert } from 'antd'
import { RobotOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input

// As heurísticas abaixo são calculadas em varredura única e sem alocar
// arrays/strings intermediárias (ex.: `text.split(/\s+/)` ou
// `text.replace(...)` criam cópias proporcionais ao tamanho do input). Isso
// evita que colar um texto muito grande sobrecarregue a memória e derrube a
// página (tela branca), mantendo o cálculo O(n) mesmo para entradas grandes.

// `\s` sem flag `u`/`g`, usado em `.test()` por caractere — seguro reutilizar.
const WS_RE = /\s/

// Comprimento do texto descontando espaços nas bordas, sem copiar a string.
function trimLength(text) {
  let start = 0
  let end = text.length
  while (start < end && WS_RE.test(text[start])) start++
  while (end > start && WS_RE.test(text[end - 1])) end--
  return end - start
}

function countTokensChars4(text) {
  if (!text) return 0
  return Math.ceil(trimLength(text) / 4)
}

function countWords(text) {
  if (trimLength(text) === 0) return 0
  let count = 0
  let inWord = false
  for (let i = 0; i < text.length; i++) {
    if (WS_RE.test(text[i])) inWord = false
    else if (!inWord) {
      inWord = true
      count++
    }
  }
  return count
}

function countCharsNoSpace(text) {
  if (!text) return 0
  let count = 0
  for (let i = 0; i < text.length; i++) {
    if (!WS_RE.test(text[i])) count++
  }
  return count
}

const CJK_RE = /[\u4e00-\u9fff\u3040-\u30ff\uac00-\ud7af\u3400-\u4dbf\u20000-\u2a6df\uf900-\ufaff\u{1F300}-\u{1FAFF}]/u
const PUNCT_RE = /[.,;:!?()\[\]{}"']/
const WORD_RE = /\S+/g

// Regra mais conservadora usada pelos "rough counters" do mercado:
// palavra em latim ~= 1 token a cada 4 chars; scripts de alta densidade
// (ex.: caractere CJK/emoji) contam ~1 token por caractere. Percorre as
// palavras com regex (sem montar um array delas).
function estimateTokensCJK(text) {
  if (!text) return 0
  let total = 0
  WORD_RE.lastIndex = 0
  let m
  while ((m = WORD_RE.exec(text))) {
    const word = m[0]
    if (CJK_RE.test(word)) total += Math.ceil(word.length * 1.1)
    else {
      let letters = 0
      for (let i = 0; i < word.length; i++) {
        if (!PUNCT_RE.test(word[i])) letters++
      }
      total += Math.max(1, Math.ceil(letters / 4))
    }
  }
  return total
}

const translations = {
  pt: {
    title: 'Contador de Tokens',
    intro: (
      <>
        Estima quantos <Text code>tokens</Text> um texto ocuparia num modelo
        de linguagem — a mesma unidade de contexto usada por modelos tipo
        GPT/Claude. Escolha o tamanho do contexto do modelo (ex.: 128k) e vê
        a proporção que o texto preencheria. Complementa a{' '}
        <Text code>/ai/anthropic-cost-calculator</Text>, que precisa do
        número de tokens pra estimar custo.
      </>
    ),
    placeholder: 'Cole ou digite o texto aqui... (modo de exemplo)',
    tokens: 'Tokens estimados',
    chars: 'Caracteres',
    charsNoSpace: 'Caracteres (sem espaço)',
    words: 'Palavras',
    method: 'Método de estimativa',
    methodChars4: 'Chars / 4 (padrão)',
    methodCJK: 'Consciente de I18N',
    context: 'Contexto do modelo',
    contextFill: 'Preenchimento do contexto',
    contextFillHint: (p) => `O texto ocupa aproximadamente ${p}% do contexto.`,
    emptyHint: 'de',
    models: {
      'claude-sonnet-4-5': 'Claude Sonnet 4.5',
      'gpt-4o': 'GPT-4o',
      'gpt-4o-mini': 'GPT-4o mini',
      'llama-3-1-405b': 'Llama 3.1 405B',
      'llama-3-1-8b': 'Llama 3.1 8B',
      'command-2': 'Command R+',
      'gemini-flash': 'Gemini Flash',
    },
    note: 'Estimativa local aproximada — não envia nenhum dado. O número real de tokens só o tokenizer do próprio modelo garante; isso aqui serve pra conferência de ordem de grandeza (ex.: ao montar um prompt ou decidir entre um modelo de contexto maior).',
    tipsTitle: 'Dicas',
    tips: [
      'Textos longos em inglês costumam ficar perto de 1 token a cada 4 caracteres (incluindo espaços).',
      'Escritas (scripts) com muitos caracteres por palavra (áreas CJK, emoji) tendem a custar mais tokens por caractere.',
      'Para um modelo com contexto de N tokens, tente deixar espaço pro prompt e ferramentas de sistema.',
    ],
  },
  en: {
    title: 'Token Counter',
    intro: (
      <>
        Estimates how many <Text code>tokens</Text> a piece of text would
        occupy in a language model — the same unit of context usage used by
        GPT/Claude-class models. Pick a model context window, and it shows
        how much of it the text would fill. Complements the Anthropic cost
        calculator page, which needs a token count to estimate price.
      </>
    ),
    placeholder: 'Paste or type text here...',
    tokens: 'Estimated tokens',
    chars: 'Characters',
    charsNoSpace: 'Characters (no spaces)',
    words: 'Words',
    method: 'Estimation method',
    methodChars4: 'chars / 4 (default)',
    methodCJK: 'I18N-aware',
    context: 'Model context',
    contextFill: 'Context usage',
    contextFillHint: (p) => `Text roughly fills about ${p}% of the context.`,
    emptyHint: 'of',
    models: {
      'claude-sonnet-4-5': 'Claude Sonnet 4.5',
      'gpt-4o': 'GPT-4o',
      'gpt-4o-mini': 'GPT-4o mini',
      'llama-3-1-405b': 'Llama 3.1 405B',
      'llama-3-1-8b': 'Llama 3.1 8B',
      'command-2': 'Command R+',
      'gemini-flash': 'Gemini Flash',
    },
    note:
      'Heuristic estimate — nothing is sent anywhere. Only the real tokenizer of each model gives an exact number; this is for a ballpark size (e.g. for building a prompt or deciding on a larger model).',
    tipsTitle: 'Tips',
    tips: [
      'English text usually lands close to 1 token per ~4 characters (spaces included).',
      'Scripts with many characters per word (CJK, emoji) usually cost more tokens per character.',
      'For a small context model, leave room for the system prompt and tools in the N-token window.',
    ],
  },
}

const CONTEXT_SIZES = {
  'claude-sonnet-4-5': 200000,
  'gpt-4o': 128000,
  'gpt-4o-mini': 128000,
  'llama-3-1-405b': 131072,
  'llama-3-1-8b': 128000,
  'command-2': 128000,
  'gemini-flash': 1048576,
}

const DEFAULT_TEXT =
  'O próximo passo é abrir um processo de revisão, priorizar as tarefas pequenas e iterar com feedback rápido. Capacidade de feedback é tão valiosa quanto a velocidade, por isso a gente testa em lotes pequenos e aprende com cada deploy.'

export default function TokenCounterPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [text, setText] = useState(DEFAULT_TEXT)
  const [method, setMethod] = useState('chars4')
  const [model, setModel] = useState('claude-sonnet-4-5')

  const stats = useMemo(() => {
    const chars = text.length
    const charsNoSpace = countCharsNoSpace(text)
    const words = countWords(text)
    const tokens = method === 'cjk' ? estimateTokensCJK(text) : countTokensChars4(text)
    return { words, chars, charsNoSpace, tokens }
  }, [text, method])

  const used = CONTEXT_SIZES[model]
  const percent = used ? Math.min(100, (stats.tokens / used) * 100) : 0

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><RobotOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card>
        <TextArea
          rows={8}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t.placeholder}
        />
      </Card>

      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Space wrap size="large">
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>{t.method}</Text>
              <div style={{ marginTop: 4 }}>
                <Segmented
                  value={method}
                  onChange={setMethod}
                  options={[
                    { label: t.methodChars4, value: 'chars4' },
                    { label: t.methodCJK, value: 'cjk' },
                  ]}
                />
              </div>
            </div>
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>{t.context}</Text>
              <div style={{ marginTop: 4 }}>
                <Select
                  value={model}
                  onChange={setModel}
                  style={{ width: 240 }}
                  options={Object.keys(CONTEXT_SIZES).map((m) => ({
                    value: m,
                    label: `${t.models[m] || m} — ${(CONTEXT_SIZES[m] / 1000).toLocaleString()}k`,
                  }))}
                />
              </div>
            </div>
          </Space>

          <Card size="small" style={{ background: '#fafafa' }}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Space wrap size="large">
                <div style={{ textAlign: 'center', minWidth: 110 }}>
                  <Text strong style={{ fontSize: 32 }}>{stats.tokens.toLocaleString()}</Text>
                  <div style={{ color: '#999', fontSize: 12 }}>{t.tokens}</div>
                </div>
                <div style={{ textAlign: 'center', minWidth: 90 }}>
                  <Text strong style={{ fontSize: 20 }}>{stats.chars.toLocaleString()}</Text>
                  <div style={{ color: '#999', fontSize: 12 }}>{t.chars}</div>
                </div>
                <div style={{ textAlign: 'center', minWidth: 90 }}>
                  <Text strong style={{ fontSize: 20 }}>{stats.charsNoSpace.toLocaleString()}</Text>
                  <div style={{ color: '#999', fontSize: 12 }}>{t.charsNoSpace}</div>
                </div>
                <div style={{ textAlign: 'center', minWidth: 90 }}>
                  <Text strong style={{ fontSize: 20 }}>{stats.words.toLocaleString()}</Text>
                  <div style={{ color: '#999', fontSize: 12 }}>{t.words}</div>
                </div>
              </Space>

              <div>
                <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                  <Text strong>{t.contextFill}</Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {stats.tokens.toLocaleString()} {t.emptyHint} {used.toLocaleString()}
                  </Text>
                </Space>
                <Progress
                  percent={Number(percent.toFixed(1))}
                  strokeColor={percent > 90 ? '#ff4d4f' : percent > 60 ? '#faad14' : '#1677ff'}
                  style={{ marginTop: 4 }}
                />
                <Text type="secondary" style={{ fontSize: 12 }}>{t.contextFillHint(percent.toFixed(1))}</Text>
              </div>
            </Space>
          </Card>
        </Space>
      </Card>

      <Alert type="info" message={t.note} showIcon />

      <Card title={t.tipsTitle}>
        <ul style={{ margin: 0, paddingLeft: 20 }}>
          {t.tips.map((tip) => (
            <li key={tip}><Text>{tip}</Text></li>
          ))}
        </ul>
      </Card>
    </Space>
  )
}