import React, { useState, useMemo } from 'react'
import {
  Typography,
  Card,
  Space,
  Input,
  Button,
  Tag,
  Table,
  Alert,
  Row,
  Col,
  Statistic,
  Tabs,
  List,
} from 'antd'
import {
  SafetyOutlined,
  SearchOutlined,
  ClearOutlined,
  CodeOutlined,
  ReadOutlined,
  CopyOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  identifyHash,
  getConfidenceColor,
  QUICK_EXAMPLES,
  ALGORITHMS,
  HASH_CATEGORIES,
} from '../utils/hashIdentifier'

const { Title, Paragraph, Text } = Typography
const { TabPane } = Tabs

const sourceCode = `// src/utils/hashIdentifier.js (resumo)
export const ALGORITHMS = [
  { id: 'md5', name: 'MD5', bits: 128, hexLength: 32,
    test: (clean) => clean.length === 32 && /^[0-9a-f]+$/.test(clean) },
  { id: 'sha1', name: 'SHA-1', bits: 160, hexLength: 40,
    test: (clean) => clean.length === 40 && /^[0-9a-f]+$/.test(clean) },
  { id: 'sha256', name: 'SHA-256', bits: 256, hexLength: 64,
    test: (clean) => clean.length === 64 && /^[0-9a-f]+$/.test(clean) },
  { id: 'sha512', name: 'SHA-512', bits: 512, hexLength: 128,
    test: (clean) => clean.length === 128 && /^[0-9a-f]+$/.test(clean) },
  { id: 'bcrypt', name: 'bcrypt', category: 'password',
    test: (_, raw) => /^\\$2[aby]\\$\\d{2}\\$[./0-9A-Za-z]{53}$/.test(raw) },
  { id: 'argon2id', name: 'Argon2id', category: 'password',
    test: (_, raw) => /^\\$argon2id\\$v=\\d+\\$m=\\d+,t=\\d+,p=\\d+\\$[A-Za-z0-9+/=]+\\$[A-Za-z0-9+/=]+$/.test(raw) },
  { id: 'scrypt', name: 'scrypt', category: 'password',
    test: (_, raw) => /^\\$scrypt\\$N=\\d+,r=\\d+,p=\\d+\\$[A-Za-z0-9+/=]+\\$[A-Za-z0-9+/=]+$/.test(raw) },
]

export function identifyHash(input) {
  const raw = (input || '').trim()
  const clean = raw.toLowerCase().replace(/[^0-9a-f]/g, '')
  const isHex = /^[0-9a-f]+$/i.test(raw)
  const candidates = ALGORITHMS.filter((alg) => alg.test(clean, raw))
  return { raw, clean, length: raw.length, hexLength: clean.length, isHex, candidates }
}`

const categoryColors = {
  [HASH_CATEGORIES.hex]: 'blue',
  [HASH_CATEGORIES.password]: 'purple',
  [HASH_CATEGORIES.checksum]: 'cyan',
  [HASH_CATEGORIES.crypt]: 'volcano',
  [HASH_CATEGORIES.unknown]: 'default',
}

const categoryLabelsPt = {
  [HASH_CATEGORIES.hex]: 'Hash hexadecimal',
  [HASH_CATEGORIES.password]: 'Derivação de senha',
  [HASH_CATEGORIES.checksum]: 'Checksum',
  [HASH_CATEGORIES.crypt]: 'Unix crypt',
  [HASH_CATEGORIES.unknown]: 'Desconhecido',
}

const categoryLabelsEn = {
  [HASH_CATEGORIES.hex]: 'Hex digest',
  [HASH_CATEGORIES.password]: 'Password hashing',
  [HASH_CATEGORIES.checksum]: 'Checksum',
  [HASH_CATEGORIES.crypt]: 'Unix crypt',
  [HASH_CATEGORIES.unknown]: 'Unknown',
}

const confidenceLabelsPt = {
  high: 'Alta',
  medium: 'Média',
  low: 'Baixa',
}

const confidenceLabelsEn = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
}

const translations = {
  pt: {
    title: 'Identificador de Hash',
    intro: (
      <>Cole um hash, digest ou senha derivada e descubra qual algoritmo ela provavelmente usa — tudo pelo padrão textual (comprimento, prefixo, alfabeto). Nenhum dado sai do navegador e nenhum ataque real é realizado.</>
    ),
    identifyTab: 'Identificar',
    referenceTab: 'Referência',
    sourceTab: 'Código-fonte',
    placeholder: 'Cole aqui MD5, SHA, bcrypt, Argon2, scrypt...',
    identifyBtn: 'Identificar',
    clearBtn: 'Limpar',
    examplesTitle: 'Exemplos rápidos',
    statsTitle: 'Estatísticas do texto',
    length: 'Comprimento total',
    hexLength: 'Caracteres hexadecimais',
    isHex: 'É hex puro',
    isBase64: 'Parece Base64',
    yes: 'Sim',
    no: 'Não',
    candidatesTitle: 'Candidatos identificados',
    noCandidates: 'Nenhum algoritmo conhecido corresponde a esse padrão.',
    unknownHint: 'Verifique se há espaços, quebras de linha ou caracteres estranhos.',
    algorithmCol: 'Algoritmo',
    bitsCol: 'Bits',
    categoryCol: 'Categoria',
    confidenceCol: 'Confiança',
    prefixCol: 'Padrão / prefixo',
    notesTitle: 'Notas',
    noteHex: 'Hashes hexadecimais de mesmo comprimento podem ser de algoritmos diferentes (ex.: SHA-256 e SHA3-256 têm 64 caracteres hex).',
    notePassword: 'bcrypt, Argon2, scrypt e PBKDF2 trazem seus próprios parâmetros no próprio texto — isso permite identificação quase certa.',
    copied: 'Copiado!',
    copy: 'Copiar',
    referenceIntro: 'Tabela de padrões reconhecidos pelo identificador.',
  },
  en: {
    title: 'Hash Identifier',
    intro: (
      <>Paste a hash, digest, or derived password to discover which algorithm it likely uses — based only on textual patterns (length, prefix, alphabet). Nothing leaves the browser and no real attack is performed.</>
    ),
    identifyTab: 'Identify',
    referenceTab: 'Reference',
    sourceTab: 'Source code',
    placeholder: 'Paste MD5, SHA, bcrypt, Argon2, scrypt...',
    identifyBtn: 'Identify',
    clearBtn: 'Clear',
    examplesTitle: 'Quick examples',
    statsTitle: 'Text statistics',
    length: 'Total length',
    hexLength: 'Hex characters',
    isHex: 'Pure hex',
    isBase64: 'Looks like Base64',
    yes: 'Yes',
    no: 'No',
    candidatesTitle: 'Identified candidates',
    noCandidates: 'No known algorithm matches this pattern.',
    unknownHint: 'Check for spaces, line breaks, or odd characters.',
    algorithmCol: 'Algorithm',
    bitsCol: 'Bits',
    categoryCol: 'Category',
    confidenceCol: 'Confidence',
    prefixCol: 'Pattern / prefix',
    notesTitle: 'Notes',
    noteHex: 'Hex digests of the same length may belong to different algorithms (e.g., SHA-256 and SHA3-256 are both 64 hex chars).',
    notePassword: 'bcrypt, Argon2, scrypt and PBKDF2 embed their own parameters in the text, allowing near-certain identification.',
    copied: 'Copied!',
    copy: 'Copy',
    referenceIntro: 'Table of patterns the identifier recognizes.',
  },
}

function patternSummary(alg) {
  if (alg.category === HASH_CATEGORIES.password || alg.category === HASH_CATEGORIES.crypt) {
    switch (alg.id) {
      case 'crypt-bcrypt': return '$2a$/$2b$/$2y$...'
      case 'argon2id': return '$argon2id$v=...'
      case 'argon2i': return '$argon2i$v=...'
      case 'argon2d': return '$argon2d$v=...'
      case 'scrypt': return '$scrypt$N=...,r=...,p=...'
      case 'pbkdf2-sha256': return '$pbkdf2-sha256$...'
      case 'pbkdf2-sha512': return '$pbkdf2-sha512$...'
      case 'django-pbkdf2': return 'pbkdf2_sha256$...'
      case 'crypt-md5': return '$1$...$...'
      case 'crypt-sha256': return '$5$...$...'
      case 'crypt-sha512': return '$6$...$...'
      case 'crypt-yescrypt': return '$y$...'
      case 'crypt-gost': return '$gy$...'
      default: return alg.hexLength ? `${alg.hexLength} hex chars` : '-'
    }
  }
  if (alg.hexLength) return `${alg.hexLength} hex chars`
  if (alg.id === 'base64-hash') return 'Base64 string'
  return '-'
}

function IdentifySection({ t, lang }) {
  const [input, setInput] = useState('')
  const [copied, setCopied] = useState(false)

  const result = useMemo(() => identifyHash(input), [input])

  const handleExample = (value) => setInput(value)
  const handleClear = () => setInput('')
  const handleCopy = () => {
    navigator.clipboard.writeText(input)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const exampleEntries = Object.entries(QUICK_EXAMPLES)

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Space.Compact style={{ width: '100%' }}>
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t.placeholder}
          prefix={<SearchOutlined />}
          allowClear
          size="large"
        />
        <Button icon={<CopyOutlined />} onClick={handleCopy} disabled={!input}>
          {copied ? t.copied : t.copy}
        </Button>
        <Button icon={<ClearOutlined />} onClick={handleClear} disabled={!input}>
          {t.clearBtn}
        </Button>
      </Space.Compact>

      <Card title={t.examplesTitle} size="small">
        <Space wrap>
          {exampleEntries.map(([key, value]) => (
            <Button key={key} size="small" onClick={() => handleExample(value)}>
              {key.toUpperCase()}
            </Button>
          ))}
        </Space>
      </Card>

      {input && (
        <>
          <Card title={t.statsTitle} size="small">
            <Row gutter={[16, 16]}>
              <Col xs={12} sm={6}>
                <Statistic title={t.length} value={result.length} />
              </Col>
              <Col xs={12} sm={6}>
                <Statistic title={t.hexLength} value={result.hexLength} />
              </Col>
              <Col xs={12} sm={6}>
                <Statistic title={t.isHex} value={result.isHex ? t.yes : t.no} />
              </Col>
              <Col xs={12} sm={6}>
                <Statistic title={t.isBase64} value={result.isBase64 ? t.yes : t.no} />
              </Col>
            </Row>
          </Card>

          <Card title={t.candidatesTitle} size="small">
            {result.candidates.length > 0 ? (
              <List
                dataSource={result.candidates}
                renderItem={(alg) => (
                  <List.Item>
                    <Space wrap style={{ width: '100%', justifyContent: 'space-between' }}>
                      <Space>
                        <Text strong>{lang === 'pt' ? alg.namePt : alg.name}</Text>
                        <Tag color={categoryColors[alg.category] || 'default'}>
                          {lang === 'pt' ? categoryLabelsPt[alg.category] : categoryLabelsEn[alg.category]}
                        </Tag>
                        {alg.bits && <Tag>{alg.bits} bits</Tag>}
                      </Space>
                      <Tag color={getConfidenceColor(alg.confidence)}>
                        {lang === 'pt' ? confidenceLabelsPt[alg.confidence] : confidenceLabelsEn[alg.confidence]}
                      </Tag>
                    </Space>
                  </List.Item>
                )}
              />
            ) : (
              <Alert
                type="warning"
                showIcon
                message={t.noCandidates}
                description={t.unknownHint}
              />
            )}
          </Card>
        </>
      )}

      <Card title={t.notesTitle} size="small">
        <Space direction="vertical" size="small">
          <Paragraph type="secondary" style={{ margin: 0 }}>{t.noteHex}</Paragraph>
          <Paragraph type="secondary" style={{ margin: 0 }}>{t.notePassword}</Paragraph>
        </Space>
      </Card>
    </Space>
  )
}

function ReferenceSection({ t, lang }) {
  const dataSource = ALGORITHMS.map((alg) => ({
    key: alg.id,
    name: lang === 'pt' ? alg.namePt : alg.name,
    bits: alg.bits || '-',
    category: lang === 'pt' ? categoryLabelsPt[alg.category] : categoryLabelsEn[alg.category],
    categoryKey: alg.category,
    pattern: patternSummary(alg),
  }))

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Paragraph type="secondary">{t.referenceIntro}</Paragraph>
      <Table
        dataSource={dataSource}
        pagination={false}
        size="small"
        columns={[
          {
            title: t.algorithmCol,
            dataIndex: 'name',
            key: 'name',
          },
          {
            title: t.bitsCol,
            dataIndex: 'bits',
            key: 'bits',
          },
          {
            title: t.categoryCol,
            dataIndex: 'category',
            key: 'category',
            render: (text, record) => (
              <Tag color={categoryColors[record.categoryKey] || 'default'}>{text}</Tag>
            ),
          },
          {
            title: t.prefixCol,
            dataIndex: 'pattern',
            key: 'pattern',
            render: (text) => <Text code>{text}</Text>,
          },
        ]}
      />
    </Space>
  )
}

export default function HashIdentifierPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><SafetyOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Tabs defaultActiveKey="identify" type="card">
        <TabPane tab={<><SearchOutlined /> {t.identifyTab}</>} key="identify">
          <IdentifySection t={t} lang={lang} />
        </TabPane>
        <TabPane tab={<><ReadOutlined /> {t.referenceTab}</>} key="reference">
          <ReferenceSection t={t} lang={lang} />
        </TabPane>
        <TabPane tab={<><CodeOutlined /> {t.sourceTab}</>} key="source">
          <Card>
            <pre style={{ margin: 0, overflowX: 'auto' }}>
              <code>{sourceCode}</code>
            </pre>
          </Card>
        </TabPane>
      </Tabs>
    </Space>
  )
}
