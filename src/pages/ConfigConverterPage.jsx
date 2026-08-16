import React, { useMemo, useState } from 'react'
import {
  Typography,
  Card,
  Space,
  Input,
  Select,
  Button,
  Alert,
  Tag,
  Segmented,
  Collapse,
  message,
} from 'antd'
import { SwapOutlined, CopyOutlined, CheckOutlined, ClearOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import { FORMATS, FORMAT_LABELS, convertConfig, parseConfig } from '../utils/configConverter'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input

const SAMPLES = {
  json: {
    pt: 'Config de app',
    en: 'App config',
    value: JSON.stringify(
      {
        app: {
          name: 'devtools',
          port: 3000,
          debug: false,
        },
        database: {
          host: 'localhost',
          port: 5432,
          pool: [10, 20, 30],
        },
        features: {
          auth: true,
          cache: null,
        },
      },
      null,
      2
    ),
  },
  yaml: {
    pt: 'Compose simples',
    en: 'Simple Compose',
    value: `services:
  web:
    image: nginx:alpine
    ports:
      - "80:80"
    environment:
      DEBUG: "false"
  api:
    image: node:20
    command: npm start`,
  },
  toml: {
    pt: 'pyproject.toml',
    en: 'pyproject.toml',
    value: `[tool.poetry]
name = "devtools"
version = "0.1.0"
description = "Internal dev tools"
authors = ["team@example.com"]

[tool.poetry.dependencies]
python = "^3.11"
requests = "^2.31"`,
  },
  ini: {
    pt: 'Config de servidor',
    en: 'Server config',
    value: `[server]
host = 0.0.0.0
port = 8080
workers = 4

[logging]
level = info
format = json`,
  },
  properties: {
    pt: 'application.properties',
    en: 'application.properties',
    value: `spring.application.name=devtools
server.port=8080
spring.datasource.url=jdbc:postgresql://localhost/devtools
spring.datasource.username=admin
spring.datasource.password=secret`,
  },
}

const SOURCE_SNIPPET = `// Conversor genérico: parseia o formato de origem para um objeto JS
// intermediário e serializa para o formato de destino.
const PARSERS = { json: parseJson, yaml: parseYaml, toml: parseToml, ini: parseIni, properties: parseProperties }
const SERIALIZERS = { json: stringifyJson, yaml: stringifyYaml, toml: stringifyToml, ini: stringifyIni, properties: stringifyProperties }

export function convertConfig(text, from, to, opts) {
  const parsed = PARSERS[from](text)
  if (!parsed.ok) return parsed
  return SERIALIZERS[to](parsed.value, opts)
}

// Cada parser retorna { ok, value } e cada serializer retorna { ok, text };
// a serialização do YAML é recursiva com indentação crescente; o parser do
// YAML usa tokens por indentação e lida com blocos, arrays e inline objects.`

const translations = {
  pt: {
    title: 'Conversor de Arquivos de Configuração',
    intro:
      'Converta arquivos de configuração entre JSON, YAML, TOML, INI e Properties 100% no navegador. Ideal para migrar settings entre stacks — por exemplo, application.properties para application.yml, ou docker-compose.yml para um .env estruturado. O motor é próprio e cobre o dia a dia: objetos, arrays, strings, números, booleanos e null.',
    from: 'De',
    to: 'Para',
    inputTitle: 'Entrada',
    outputTitle: 'Saída',
    options: 'Opções',
    indent: 'Indentação',
    sample: 'Exemplos rápidos',
    empty: 'Cole uma config no formato escolhido para converter.',
    error: 'Não foi possível converter:',
    copy: 'Copiar',
    copied: 'Copiado!',
    clear: 'Limpar',
    bytes: (n) => `${n} bytes`,
    noteTitle: 'Limitações e convenções',
    noteBody:
      'YAML: sem tags, anchors e aliases. TOML: sem arrays de tabelas e datas (são tratadas como strings). INI e Properties: chaves repetidas viram arrays; dots em chaves criam objetos aninhados; arrays em INI são salvos como lista separada por vírgula. A conversão foca em configs comuns — estruturas muito exóticas podem precisar de ajuste manual.',
    sourceTitle: 'Código-fonte do motor',
  },
  en: {
    title: 'Config File Converter',
    intro:
      'Convert config files between JSON, YAML, TOML, INI and Properties 100% in the browser. Useful for migrating settings across stacks — e.g. application.properties to application.yml, or docker-compose.yml to a structured .env. The engine is self-contained and covers everyday use: objects, arrays, strings, numbers, booleans and null.',
    from: 'From',
    to: 'To',
    inputTitle: 'Input',
    outputTitle: 'Output',
    options: 'Options',
    indent: 'Indentation',
    sample: 'Quick samples',
    empty: 'Paste a config in the selected format to convert.',
    error: 'Could not convert:',
    copy: 'Copy',
    copied: 'Copied!',
    clear: 'Clear',
    bytes: (n) => `${n} bytes`,
    noteTitle: 'Limitations and conventions',
    noteBody:
      'YAML: no custom tags, anchors or aliases. TOML: no table arrays and dates (treated as strings). INI and Properties: repeated keys become arrays; dots in keys create nested objects; INI arrays are emitted as comma-separated lists. The converter targets common config files — very exotic structures may need manual tweaking.',
    sourceTitle: 'Engine source code',
  },
}

export default function ConfigConverterPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const labels = FORMAT_LABELS[lang]

  const [fromFmt, setFromFmt] = useState('json')
  const [toFmt, setToFmt] = useState('yaml')
  const [input, setInput] = useState(SAMPLES.json.value)
  const [indent, setIndent] = useState(2)
  const [copied, setCopied] = useState(false)

  const formatOptions = useMemo(
    () => FORMATS.map((f) => ({ value: f, label: labels[f] })),
    [labels]
  )

  const parsed = useMemo(() => {
    if (!input.trim()) return { ok: false, error: 'empty' }
    try {
      return parseConfig(input, fromFmt)
    } catch (e) {
      return { ok: false, error: e.message }
    }
  }, [input, fromFmt])

  const outputResult = useMemo(() => {
    if (!parsed.ok) return { ok: false, error: parsed.error }
    return convertConfig(input, fromFmt, toFmt, { indent })
  }, [input, fromFmt, toFmt, indent, parsed.ok, parsed.error])

  const bytes = useMemo(() => {
    return outputResult.ok && outputResult.text ? new TextEncoder().encode(outputResult.text).length : 0
  }, [outputResult])

  async function handleCopy() {
    if (!outputResult.ok || !outputResult.text) return
    try {
      await navigator.clipboard.writeText(outputResult.text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      message.error('Erro ao copiar')
    }
  }

  function swapFormats() {
    setFromFmt(toFmt)
    setToFmt(fromFmt)
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><SwapOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card title={t.options}>
        <Space wrap size="large" align="center">
          <Space>
            <Text type="secondary">{t.from}</Text>
            <Select
              value={fromFmt}
              onChange={setFromFmt}
              options={formatOptions}
              style={{ width: 140 }}
            />
          </Space>
          <Button icon={<SwapOutlined />} onClick={swapFormats} />
          <Space>
            <Text type="secondary">{t.to}</Text>
            <Select
              value={toFmt}
              onChange={setToFmt}
              options={formatOptions}
              style={{ width: 140 }}
            />
          </Space>
          <Space>
            <Text type="secondary">{t.indent}</Text>
            <Segmented value={indent} onChange={setIndent} options={[2, 4]} />
          </Space>
        </Space>
      </Card>

      <Card title={t.inputTitle}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Space wrap>
            <Text type="secondary">{t.sample}</Text>
            {FORMATS.map((f) => (
              <Tag
                key={f}
                color="blue"
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  setFromFmt(f)
                  setInput(SAMPLES[f].value)
                }}
              >
                {SAMPLES[f][lang]}
              </Tag>
            ))}
          </Space>
          <TextArea
            rows={10}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t.empty}
            spellCheck={false}
            style={{ fontFamily: 'monospace', fontSize: 13 }}
          />
        </Space>
      </Card>

      <Card
        title={
          <Space size={8}>
            <span>{t.outputTitle}</span>
            {outputResult.ok && outputResult.text && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                {t.bytes(bytes)}
              </Text>
            )}
          </Space>
        }
        extra={
          <Space>
            <Button size="small" icon={<ClearOutlined />} onClick={() => setInput('')}>
              {t.clear}
            </Button>
            {outputResult.ok && outputResult.text && (
              <Button
                type="primary"
                size="small"
                icon={copied ? <CheckOutlined /> : <CopyOutlined />}
                onClick={handleCopy}
              >
                {copied ? t.copied : t.copy}
              </Button>
            )}
          </Space>
        }
      >
        {!outputResult.ok ? (
          <Alert
            type={parsed.error === 'empty' ? 'info' : 'error'}
            showIcon
            message={parsed.error === 'empty' ? t.empty : `${t.error} ${outputResult.error || parsed.error}`}
          />
        ) : (
          <pre style={{ margin: 0, overflowX: 'auto', fontFamily: 'monospace', fontSize: 13 }}>
            <code>{outputResult.text}</code>
          </pre>
        )}
      </Card>

      <Alert type="info" showIcon message={t.noteTitle} description={t.noteBody} />

      <Card title={t.sourceTitle}>
        <Collapse
          items={[
            {
              key: 'src',
              label: <Text code>configConverter.js</Text>,
              children: (
                <pre style={{ margin: 0, overflowX: 'auto', fontSize: 12, lineHeight: 1.6 }}>{SOURCE_SNIPPET}</pre>
              ),
            },
          ]}
        />
      </Card>
    </Space>
  )
}
