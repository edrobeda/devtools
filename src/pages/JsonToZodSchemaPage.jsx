import React, { useMemo, useState } from 'react'
import { Typography, Card, Space, Input, Button, Alert, Tag, Switch, Collapse } from 'antd'
import { CodeOutlined, CopyOutlined, CheckOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import { buildZodSchema } from '../utils/jsonToZodSchema'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input

const SAMPLES = [
  {
    key: 'usuario',
    label: { pt: 'Usuário', en: 'User' },
    value: JSON.stringify(
      {
        id: 42,
        name: 'Alice',
        email: 'alice@example.com',
        active: true,
        tags: ['admin', 'beta'],
        profile: { url: 'https://example.com/alice', created_at: '2024-01-01T10:00:00Z' },
      },
      null,
      2
    ),
  },
  {
    key: 'produtos',
    label: { pt: 'Lista de produtos', en: 'Products list' },
    value: JSON.stringify(
      [
        { sku: 'A-1', name: 'Teclado', price: 129.9, stock: 12 },
        { sku: 'B-2', name: 'Mouse', price: 49.9, stock: 0 },
        { sku: 'C-3', name: 'Monitor', price: 899, stock: 4 },
      ],
      null,
      2
    ),
  },
  {
    key: 'evento',
    label: { pt: 'Payload de evento', en: 'Event payload' },
    value: JSON.stringify(
      {
        id: 'evt_01',
        type: 'payment',
        payload: {
          amount: 1000,
          currency: 'BRL',
          items: [{ id: 'i1', qty: 2 }, { id: 'i2', qty: 1 }],
        },
        received_at: '2026-01-01T10:00:00Z',
      },
      null,
      2
    ),
  },
]

const SOURCE_SNIPPET = `import { z } from 'zod'

export const User = z.object({
  id: z.number().int(),
  name: z.string(),
  email: z.string().email(),
  active: z.boolean(),
  tags: z.array(z.string()),
  profile: z.object({
    url: z.string().url(),
    created_at: z.string().datetime(),
  }),
})

type User = z.infer<typeof User>
`

const translations = {
  pt: {
    title: 'JSON → Zod Schema',
    intro: (
      <>        Cola um JSON de exemplo e gera um schema{' '}
        <Text code>zod</Text> equivalente: objetos viram{' '}
        <Text code>z.object()</Text>, arrays viram{' '}
        <Text code>z.array()</Text>, strings são inspecionadas pra detectar
        e-mail, URL, UUID e datetime, e números inteiros ganham{' '}
        <Text code>.int()</Text>. O resultado inclui a declaração{' '}
        <Text code>export const</Text> e o tipo inferido. Ideal pra validar
        respostas de API no momento em que você recebe o primeiro exemplo.
        100% local, nada sai do navegador.
      </>
    ),
    input: 'JSON de exemplo',
    sampleLabel: 'Exemplos:',
    options: 'Opções',
    rootName: 'Nome do schema raiz',
    rootNamePlaceholder: 'Root',
    camelKeys: 'Converter chaves para camelCase',
    camelKeysHint: 'Ex.: user_id → userId; chaves inválidas como identificador saem entre aspas.',
    strictObjects: 'Objetos strict',
    strictObjectsHint: 'Adiciona .strict() nos z.object() — rejeita chaves não declaradas.',
    detectFormats: 'Detectar formatos de string',
    detectFormatsHint: 'Tenta reconhecer e-mail, URL, UUID e datetime ISO 8601.',
    nullAsOptional: 'null como .optional()',
    nullAsOptionalHint: 'Por padrão null vira z.null(); com esta opção vira z.optional(z.any()).',
    exportPrefix: 'Exportar schema raiz',
    exportPrefixHint: 'Precede o schema raiz com export.',
    resultTitle: 'Schema Zod gerado',
    emptyHint: 'Cole um JSON válido acima pra gerar o schema.',
    invalidJson: 'JSON inválido — confira chaves, vírgulas e aspas do que foi colado.',
    copy: 'Copiar',
    copied: 'Copiado!',
    stats: (consts, bytes) => `${consts} ${consts === 1 ? 'const' : 'consts'} · ${bytes} ${bytes === 1 ? 'byte' : 'bytes'}`,
    aboutTitle: 'Sobre o resultado',
    aboutBody: (
      <>
        O gerador infere tipos estruturais a partir de um exemplo. Strings são
        classificadas como <Text code>z.string().email()</Text>,{' '}
        <Text code>.url()</Text>, <Text code>.uuid()</Text> ou{' '}
        <Text code>.datetime()</Text> quando o valor bate em um padrão
        reconhecido. Arrays com elementos de formas diferentes viram{' '}
        <Text code>z.union([...])</Text>. Valores <Text code>null</Text> podem
        ser mapeados como <Text code>z.null()</Text> ou{' '}
        <Text code>z.optional(z.any())</Text> conforme a opção escolhida.
      </>
    ),
    algorithmTitle: 'Exemplo de uso',
    algorithmDesc:
      'O schema gerado é código Zod válido. Basta importar zod no projeto, colar a declaração e usar Root.parse(dados) para validar a entrada.',
  },
  en: {
    title: 'JSON → Zod Schema',
    intro: (
      <>        Paste a sample JSON and get the equivalent{' '}
        <Text code>zod</Text> schema: objects become{' '}
        <Text code>z.object()</Text>, arrays become{' '}
        <Text code>z.array()</Text>, strings are inspected to detect e-mail,
        URL, UUID and datetime, and integer numbers get{' '}
        <Text code>.int()</Text>. The output includes the{' '}
        <Text code>export const</Text> declaration and the inferred type.
        Perfect for validating API responses as soon as you get the first
        sample. 100% local, nothing leaves the browser.
      </>
    ),
    input: 'Sample JSON',
    sampleLabel: 'Samples:',
    options: 'Options',
    rootName: 'Root schema name',
    rootNamePlaceholder: 'Root',
    camelKeys: 'Convert keys to camelCase',
    camelKeysHint: 'e.g. "user_id" → "userId"; keys that are not valid identifiers get quoted.',
    strictObjects: 'Strict objects',
    strictObjectsHint: 'Adds .strict() to z.object() schemas — rejects undeclared keys.',
    detectFormats: 'Detect string formats',
    detectFormatsHint: 'Tries to recognise e-mail, URL, UUID and ISO-8601 datetime.',
    nullAsOptional: 'null as .optional()',
    nullAsOptionalHint: 'By default null becomes z.null(); with this option it becomes z.optional(z.any()).',
    exportPrefix: 'Export root schema',
    exportPrefixHint: 'Prepends export to the root schema declaration.',
    resultTitle: 'Generated Zod schema',
    emptyHint: 'Paste valid JSON above to generate the schema.',
    invalidJson: 'Invalid JSON — check the braces, commas and quotes you pasted.',
    copy: 'Copy',
    copied: 'Copied!',
    stats: (consts, bytes) => `${consts} ${consts === 1 ? 'const' : 'consts'} · ${bytes} ${bytes === 1 ? 'byte' : 'bytes'}`,
    aboutTitle: 'About the output',
    aboutBody: (
      <>
        The generator infers structural types from a single example. Strings
        are classified as <Text code>z.string().email()</Text>,{' '}
        <Text code>.url()</Text>, <Text code>.uuid()</Text> or{' '}
        <Text code>.datetime()</Text> when the value matches a known pattern.
        Arrays holding different element shapes become{' '}
        <Text code>z.union([...])</Text>. <Text code>null</Text> values can be
        mapped to <Text code>z.null()</Text> or{' '}
        <Text code>z.optional(z.any())</Text> depending on the selected option.
      </>
    ),
    algorithmTitle: 'Usage example',
    algorithmDesc:
      'The generated schema is valid Zod code. Just import zod in your project, paste the declaration and use Root.parse(data) to validate input.',
  },
}

export default function JsonToZodSchemaPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [input, setInput] = useState(SAMPLES[0].value)
  const [rootName, setRootName] = useState('Root')
  const [camelKeys, setCamelKeys] = useState(false)
  const [strictObjects, setStrictObjects] = useState(false)
  const [detectFormats, setDetectFormats] = useState(true)
  const [nullAsOptional, setNullAsOptional] = useState(false)
  const [exportPrefix, setExportPrefix] = useState(true)
  const [copied, setCopied] = useState(false)

  const parsed = useMemo(() => {
    if (!input.trim()) return { ok: false, error: 'empty' }
    try {
      return { ok: true, value: JSON.parse(input) }
    } catch (e) {
      return { ok: false, error: e.message }
    }
  }, [input])

  const outputText = useMemo(() => {
    if (!parsed.ok) return ''
    return buildZodSchema(parsed.value, {
      rootName: rootName.trim() || 'Root',
      camelKeys,
      strictObjects,
      detectFormats,
      nullAsOptional,
      exportPrefix,
    })
  }, [parsed, rootName, camelKeys, strictObjects, detectFormats, nullAsOptional, exportPrefix])

  const stats = useMemo(() => {
    const consts = (outputText.match(/^export const /gm) || []).length
    const bytes = new TextEncoder().encode(outputText).length
    return { consts, bytes }
  }, [outputText])

  async function handleCopy() {
    if (!outputText) return
    try {
      await navigator.clipboard.writeText(outputText)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }

  const renderSwitch = (checked, onChange, label, hint) => (
    <>
      <Space wrap>
        <Switch checked={checked} onChange={onChange} />
        {label}
      </Space>
      <Text type="secondary" style={{ fontSize: 12, paddingLeft: 40, display: 'block' }}>
        {hint}
      </Text>
    </>
  )

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><CodeOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card title={t.input}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Space wrap>
            <Text type="secondary">{t.sampleLabel}</Text>
            {SAMPLES.map((s) => (
              <Tag
                key={s.key}
                color="blue"
                style={{ cursor: 'pointer' }}
                onClick={() => setInput(s.value)}
              >
                {s.label[lang]}
              </Tag>
            ))}
          </Space>
          <TextArea
            rows={10}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t.input}
            spellCheck={false}
            style={{ fontFamily: 'monospace', fontSize: 13 }}
          />
        </Space>
      </Card>

      <Card title={t.options}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Space wrap align="center">
            <Text type="secondary">{t.rootName}</Text>
            <Input
              value={rootName}
              onChange={(e) => setRootName(e.target.value)}
              placeholder={t.rootNamePlaceholder}
              style={{ width: 160 }}
            />
          </Space>

          {renderSwitch(camelKeys, setCamelKeys, t.camelKeys, t.camelKeysHint)}
          {renderSwitch(strictObjects, setStrictObjects, t.strictObjects, t.strictObjectsHint)}
          {renderSwitch(detectFormats, setDetectFormats, t.detectFormats, t.detectFormatsHint)}
          {renderSwitch(nullAsOptional, setNullAsOptional, t.nullAsOptional, t.nullAsOptionalHint)}
          {renderSwitch(exportPrefix, setExportPrefix, t.exportPrefix, t.exportPrefixHint)}
        </Space>
      </Card>

      <Card
        title={
          <Space size={8}>
            <span>{t.resultTitle}</span>
            {parsed.ok && outputText && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                {t.stats(stats.consts, stats.bytes)}
              </Text>
            )}
          </Space>
        }
        extra={
          parsed.ok && outputText ? (
            <Button
              type="primary"
              size="small"
              icon={copied ? <CheckOutlined /> : <CopyOutlined />}
              onClick={handleCopy}
            >
              {copied ? t.copied : t.copy}
            </Button>
          ) : null
        }
      >
        {!parsed.ok ? (
          <Alert
            type={parsed.error === 'empty' ? 'info' : 'error'}
            showIcon
            message={parsed.error === 'empty' ? t.emptyHint : t.invalidJson}
          />
        ) : (
          <pre style={{ margin: 0, overflowX: 'auto', fontFamily: 'monospace', fontSize: 13 }}>
            <code>{outputText}</code>
          </pre>
        )}
      </Card>

      <Alert type="info" showIcon message={t.aboutTitle} description={t.aboutBody} />

      <Card title={t.algorithmTitle}>
        <Paragraph type="secondary">{t.algorithmDesc}</Paragraph>
        <Collapse
          items={[
            {
              key: 'src',
              label: <Text code>jsonToZodSchema.js</Text>,
              children: (
                <pre style={{ margin: 0, overflowX: 'auto', fontSize: 12, lineHeight: 1.6 }}>
                  <code>{SOURCE_SNIPPET}</code>
                </pre>
              ),
            },
          ]}
        />
      </Card>
    </Space>
  )
}
