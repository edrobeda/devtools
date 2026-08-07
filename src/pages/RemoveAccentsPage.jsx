import React, { useMemo, useState } from 'react'
import { Typography, Card, Space, Input, Button, Alert, Statistic, Row, Col } from 'antd'
import { FontSizeOutlined, CopyOutlined, CheckOutlined, ClearOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

// A técnica inteira vive nestas poucas linhas: normalizar para NFD separa
// o caractere base das marcas de combinação (diacríticos), e a regex remove
// apenas as marcas no bloco U+0300-U+036F, preservando o texto base intacto.
const NFD_SNIPPET = `function removeAccents(text) {
  return text
    .normalize('NFD')                  // separa base + marca de combinação
    .replace(/[\\u0300-\\u036f]/g, '') // remove apenas as marcas
}

// 'João da Silva Pólya' -> 'Joao da Silva Polya'`

const SAMPLES = [
  'Renée está no início — a ação refletiu na descrição! Café, açaí, pós e ângulos para o coração.',
  'Français, español, português — déjà vu, crème brûlée & señor.',
  'São João, açaí, joão-de-barro, órbitas, vôo e pavês.',
  'Árvore corticosa: íris, êxodo, críquete e óculos de ópio.',
]

const translations = {
  pt: {
    title: 'Remover Acentos',
    intro: 'Tira acentos e diacríticos de qualquer texto (á, ç, ã, è, û, ...) em tempo real, tudo no navegador. Útil pra normalizar entradas de busca, gerar logins/nomes de arquivo ou uniformizar dados com acentuação inconsistente. O texto nunca sai da sua máquina.',
    inputPlaceholder: 'Cole aqui o texto com acentos...',
    resultTitle: 'Resultado (sem acentos)',
    accentCount: 'diacrítico(s) removido(s)',
    charsCount: 'caracteres',
    copy: 'Copiar resultado',
    copied: 'Copiado!',
    clear: 'Limpar',
    examples: 'Exemplo aleatório',
    empty: 'Nenhum acento no texto — o resultado fica igual.',
    marksTitle: 'Diacríticos encontrados',
    markBadge: (mark) => `U+${mark.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0')} × `,
    note: 'A remoção preserva maiúsculas/minúsculas e a pontuação — só tira o diacrítico em si.',
    explainTitle: 'Por que funciona',
    explainBody: (
      <>
        O JavaScript normaliza o texto em Unicode NFD, que separa um caractere
        acentuado (<Text code>á</Text>) em dois: o símbolo base (<Text code>a</Text>)
        e uma <Text strong>marca de combinação</Text>. Basta remover cada marca no
        bloco <Text code>U+0300–U+036F</Text> e o texto fica sem acento. A
        paginação aí em cima percorre code points via <Text code>for...of</Text>
        (não units UTF-16), então caracteres compostos e emojis também passam
        intactos.
      </>
    ),
    sourceTitle: 'Como funciona',
  },
  en: {
    title: 'Remove Accents',
    intro: 'Strips accents and diacritics (á, ç, ã, è, ...) from text in real time, entirely in the browser. Handy for normalizing search keys, building usernames/filenames, or unifying data with inconsistent accents. Nothing leaves your machine.',
    inputPlaceholder: 'Paste the accented text here...',
    resultTitle: 'Result (accent-free)',
    accentCount: 'diacritic(s) removed',
    charsCount: 'characters',
    copy: 'Copy result',
    copied: 'Copied!',
    clear: 'Clear',
    examples: 'Random sample',
    empty: 'No accented characters — the result stays the same.',
    marksTitle: 'Diacritics found',
    markBadge: (mark) => `U+${mark.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0')} × `,
    note: 'This preserves case and punctuation — it only removes the diacritic itself.',
    explainTitle: 'Why it works',
    explainBody: (
      <>
        The JS engine normalizes text as Unicode NFD, which splits an accented
        character like <Text code>é</Text> into two: the base symbol ({' '}
        <Text code>e</Text>) plus a <Text strong>combining mark</Text>. Removing
        the marks in the <Text code>U+0300–U+036F</Text> range yields accent-free
        text. The parser above walks the string by code point using a{' '}
        <Text code>for...of</Text> loop (not UTF-16 units), so compound letters
        and emoji also pass through intact.
      </>
    ),
    sourceTitle: 'Under the hood',
  },
}

const t_pt = translations.pt
const t_en = translations.en

export default function RemoveAccentsPage() {
  const { lang } = useLanguage()
  const t = lang === 'pt' ? t_pt : t_en
  const [input, setInput] = useState('')
  const [copied, setCopied] = useState(false)

  // Varredura única: percorre code points e, pra cada caractere que se
  // decompõe em base + marca, mantém só a base e conta a marca removida.
  const result = useMemo(() => {
    if (!input) return { text: '', removed: 0, marks: [] }
    let removed = 0
    const out = []
    const markCount = new Map()
    for (const raw of input) {
      const ch = raw
      const decomposed = ch.normalize('NFD')
      if (decomposed.length > 1) {
        removed++
        out.push(decomposed[0])
        const mark = decomposed[1]
        markCount.set(mark, (markCount.get(mark) || 0) + 1)
      } else {
        out.push(ch)
      }
    }
    return { text: out.join(''), removed, marks: [...markCount.entries()] }
  }, [input])

  async function handleCopy() {
    if (!result.text) return
    try {
      await navigator.clipboard.writeText(result.text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><FontSizeOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card>
        <Input.TextArea
          rows={6}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t.inputPlaceholder}
        />
      </Card>

      <Card
        title={t.resultTitle}
        extra={
          <Space wrap>
            <Button
              size="small"
              onClick={() => setInput(SAMPLES[Math.floor(Math.random() * SAMPLES.length)])}
            >
              {t.examples}
            </Button>
            <Button
              size="small"
              icon={<ClearOutlined />}
              onClick={() => { setInput(''); setCopied(false) }}
              disabled={!input}
            >
              {t.clear}
            </Button>
            <Button
              size="small"
              type="primary"
              icon={copied ? <CheckOutlined /> : <CopyOutlined />}
              onClick={handleCopy}
              disabled={!result.text}
            >
              {copied ? t.copied : t.copy}
            </Button>
          </Space>
        }
      >
        <Text>{result.text || <Text type="secondary">{t.empty}</Text>}</Text>
      </Card>

      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Card>
            <Statistic title={t.charsCount} value={result.text.length} />
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card>
            <Statistic title={t.accentCount} value={result.removed} />
          </Card>
        </Col>
      </Row>

      {result.marks.length > 0 && (
        <Card title={t.marksTitle}>
          <Space size={[8, 8]} wrap>
            {result.marks.map(([mark, count]) => (
              <Text key={mark} code>
                {t.markBadge(mark)}{count}
              </Text>
            ))}
          </Space>
        </Card>
      )}

      <Alert type="info" message={t.note} showIcon />

      <Card title={t.explainTitle}>
        <Paragraph type="secondary">{t.explainBody}</Paragraph>
      </Card>

      <Card title={t.sourceTitle}>
        <pre style={{ margin: 0, overflowX: 'auto' }}>
          <code>{NFD_SNIPPET}</code>
        </pre>
      </Card>
    </Space>
  )
}