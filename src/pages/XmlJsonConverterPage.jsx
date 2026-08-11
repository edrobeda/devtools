import React, { useMemo, useState } from 'react'
import {
  Typography,
  Card,
  Space,
  Input,
  Button,
  Alert,
  Tag,
  Switch,
  Collapse,
  Segmented,
  Tooltip,
} from 'antd'
import { CodeOutlined, CopyOutlined, CheckOutlined, SwapOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import { xmlToJson, jsonToXml } from '../utils/xmlJson'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input

// ─── Exemplos clicáveis ──────────────────────────────────────────────────
const SAMPLES = {
  xml: [
    {
      key: 'config',
      label: { pt: 'Config XML', en: 'XML Config' },
      value: `<?xml version="1.0" encoding="UTF-8"?>
<app>
  <name>devtools</name>
  <version>1.0.0</version>
  <features>
    <feature name="converter">XML ↔ JSON</feature>
    <feature name="safe">100% client-side</feature>
  </features>
  <debug>false</debug>
</app>`,
    },
    {
      key: 'soap',
      label: { pt: 'SOAP-like', en: 'SOAP-like' },
      value: `<?xml version="1.0" encoding="UTF-8"?>
<Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <GetUserResponse>
      <User id="42" active="true">
        <Name>Alice</Name>
        <Email>alice@example.com</Email>
        <Roles>
          <Role>admin</Role>
          <Role>editor</Role>
        </Roles>
      </User>
    </GetUserResponse>
  </soap:Body>
</Envelope>`,
    },
    {
      key: 'mixed',
      label: { pt: 'Texto misto', en: 'Mixed text' },
      value: `<?xml version="1.0" encoding="UTF-8"?>
<note date="2024-03-01">
  <to>Tove</to>
  <from>Jani</from>
  <heading>Reminder</heading>
  <body>Don't forget me this weekend!</body>
</note>`,
    },
  ],
  json: [
    {
      key: 'api',
      label: { pt: 'Response de API', en: 'API response' },
      value: JSON.stringify(
        {
          user: {
            '@id': '42',
            name: 'Alice',
            email: 'alice@example.com',
            roles: { role: ['admin', 'editor'] },
          },
        },
        null,
        2,
      ),
    },
    {
      key: 'config',
      label: { pt: 'Config JSON', en: 'JSON config' },
      value: JSON.stringify(
        {
          app: {
            name: 'devtools',
            version: '1.0.0',
            debug: false,
            features: {
              feature: [
                { '@name': 'converter', '#text': 'XML ↔ JSON' },
                { '@name': 'safe', '#text': '100% client-side' },
              ],
            },
          },
        },
        null,
        2,
      ),
    },
    {
      key: 'array',
      label: { pt: 'Array raiz', en: 'Root array' },
      value: JSON.stringify(
        [
          { '@id': '1', name: 'Alice' },
          { '@id': '2', name: 'Bob' },
        ],
        null,
        2,
      ),
    },
  ],
}

const SOURCE_SNIPPET = `// xmlToJson — percorre a árvore DOM recursivamente.
// Para cada elemento: coleta atributos com prefixo (ex.: "@id"),
// agrupa filhos por nome de tag (repetidos viram array) e guarda
// texto solto sob a chave "#text".
function convertNode(node, opts) {
  const attrs = {}
  for (const attr of node.attributes) {
    attrs[opts.attrPrefix + attr.name] = attr.value
  }

  const children = {}
  let text = ''
  for (const child of node.childNodes) {
    if (child.nodeType === Node.TEXT_NODE) text += child.nodeValue
    else if (child.nodeType === Node.ELEMENT_NODE) {
      const converted = convertNode(child, opts)
      if (child.nodeName in children) {
        if (!Array.isArray(children[child.nodeName])) {
          children[child.nodeName] = [children[child.nodeName]]
        }
        children[child.nodeName].push(converted)
      } else {
        children[child.nodeName] = converted
      }
    }
  }

  if (!Object.keys(children).length && !Object.keys(attrs).length) return text
  return { ...attrs, ...children, ...(text ? { [opts.textKey]: text } : {}) }
}

// jsonToXml — converte objeto em elementos. Chaves com "@" viram
// atributos, "#text" vira conteúdo textual, arrays repetem a tag.
function jsonToXmlValue(value, name, opts, depth) {
  if (typeof value === 'string') return indent(depth) + '<' + name + '>' + escapeXml(value) + '</' + name + '>'
  if (Array.isArray(value)) return value.map(v => jsonToXmlValue(v, name, opts, depth)).join('')
  // objeto: atributos, texto, elementos filhos
  // ...
}`

const translations = {
  pt: {
    title: 'Conversor XML ↔ JSON',
    intro: (
      <>
        Converta XML em JSON e vice-versa direto no navegador. Útil pra
        inspecionar respostas SOAP, configs legadas, feeds RSS/Atom ou
        preparar payloads pra APIs modernas. Tudo acontece client-side — nada
        do seu conteúdo sai daqui.
      </>
    ),
    modeLabel: 'Direção',
    xmlToJson: 'XML → JSON',
    jsonToXml: 'JSON → XML',
    input: 'Entrada',
    output: 'Resultado',
    sampleLabel: 'Exemplos:',
    options: 'Opções',
    indentLabel: 'Indentação',
    declaration: 'Declaração XML',
    declarationHint: 'Adiciona &lt;?xml version="1.0" encoding="UTF-8"?&gt; no topo da saída XML.',
    prettyJson: 'JSON formatado',
    prettyJsonHint: 'Indenta a saída JSON; desligado gera uma linha só.',
    attrPrefixLabel: 'Prefixo de atributos',
    attrPrefixHint: 'XML → JSON: atributos ganham esse prefixo (padrão "@").',
    textKeyLabel: 'Chave de texto',
    textKeyHint: 'XML → JSON: texto solto entre elementos usa essa chave (padrão "#text").',
    alwaysArray: 'Sempre array',
    alwaysArrayHint: 'XML → JSON: todo filho vira array, mesmo que apareça uma única vez.',
    copy: 'Copiar',
    copied: 'Copiado!',
    emptyHint: 'Cole o conteúdo de entrada acima pra ver a conversão.',
    invalidXml: 'XML inválido',
    invalidJson: 'JSON inválido',
    invalidRoot: 'JSON raiz deve ser um objeto com uma única chave (ou array, que será envolvido em &lt;root&gt;).',
    bytes: (n) => `${n} ${n === 1 ? 'byte' : 'bytes'}`,
    alertTitle: 'Sobre a conversão e as pegadinhas',
    alertBody: (
      <>
        A conversão XML ↔ JSON é uma aproximação, não uma tradução perfeita 1:1.
        Atributos e elementos filhos com nomes iguais, namespaces e texto misturado
        com tags precisam de regras convencionadas. Aqui atributos viram chaves
        prefixadas com <Text code>@</Text>, texto solto fica sob{' '}
        <Text code>#text</Text> e tags repetidas viram arrays. Namespaces nos nomes
        de tag são preservados como texto (<Text code>soap:Body</Text>), mas prefixos
        de namespace em atributos ficam no próprio nome. Valores numéricos/booleanos
        em XML são sempre strings; no caminho JSON → XML, numbers/booleans do JS
        são renderizados sem aspas.
      </>
    ),
    algorithmTitle: 'Como funciona (algoritmo)',
    algorithmDesc:
      'XML → JSON usa DOMParser para ler a árvore, depois caminha recursivamente coletando atributos, agrupando filhos por tag e juntando nós de texto. JSON → XML faz o caminho inverso: chaves com @ viram atributos, #text vira conteúdo, arrays repetem a tag e objetos aninhados viram elementos filhos.',
  },
  en: {
    title: 'XML ↔ JSON Converter',
    intro: (
      <>
        Convert XML to JSON and back right in the browser. Handy for inspecting
        SOAP responses, legacy configs, RSS/Atom feeds or preparing payloads for
        modern APIs. Everything happens client-side — none of your content leaves
        this page.
      </>
    ),
    modeLabel: 'Direction',
    xmlToJson: 'XML → JSON',
    jsonToXml: 'JSON → XML',
    input: 'Input',
    output: 'Result',
    sampleLabel: 'Samples:',
    options: 'Options',
    indentLabel: 'Indentation',
    declaration: 'XML declaration',
    declarationHint: 'Adds &lt;?xml version="1.0" encoding="UTF-8"?&gt; at the top of XML output.',
    prettyJson: 'Pretty JSON',
    prettyJsonHint: 'Indents JSON output; off produces a single line.',
    attrPrefixLabel: 'Attribute prefix',
    attrPrefixHint: 'XML → JSON: attributes get this prefix (default "@").',
    textKeyLabel: 'Text key',
    textKeyHint: 'XML → JSON: loose text between elements uses this key (default "#text").',
    alwaysArray: 'Always array',
    alwaysArrayHint: 'XML → JSON: every child becomes an array, even if it appears only once.',
    copy: 'Copy',
    copied: 'Copied!',
    emptyHint: 'Paste the input above to see the conversion.',
    invalidXml: 'Invalid XML',
    invalidJson: 'Invalid JSON',
    invalidRoot: 'Root JSON must be an object with a single key (or an array, which will be wrapped in <root>).',
    bytes: (n) => `${n} ${n === 1 ? 'byte' : 'bytes'}`,
    alertTitle: 'About the conversion and caveats',
    alertBody: (
      <>
        XML ↔ JSON conversion is an approximation, not a perfect 1:1 translation.
        Attributes, repeated child tags, namespaces and mixed text/tags need
        convention rules. Here attributes become keys prefixed with{' '}
        <Text code>@</Text>, loose text lives under <Text code>#text</Text>, and
        repeated tags become arrays. Namespace prefixes in tag names are kept as text
        (<Text code>soap:Body</Text>), while namespace prefixes in attributes stay
        in the attribute name. Numeric/boolean values in XML are always strings; on
        the JSON → XML path JS numbers/booleans are rendered unquoted.
      </>
    ),
    algorithmTitle: 'Under the hood (algorithm)',
    algorithmDesc:
      'XML → JSON uses DOMParser to read the tree, then walks it recursively collecting attributes, grouping children by tag and merging text nodes. JSON → XML reverses the path: @ keys become attributes, #text becomes content, arrays repeat the tag and nested objects become child elements.',
  },
}

export default function XmlJsonConverterPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [mode, setMode] = useState('xml-to-json')
  const [input, setInput] = useState(SAMPLES.xml[0].value)
  const [indent, setIndent] = useState(2)
  const [declaration, setDeclaration] = useState(true)
  const [prettyJson, setPrettyJson] = useState(true)
  const [attrPrefix, setAttrPrefix] = useState('@')
  const [textKey, setTextKey] = useState('#text')
  const [alwaysArray, setAlwaysArray] = useState(false)
  const [copied, setCopied] = useState(false)

  const opts = useMemo(
    () => ({
      indent,
      declaration,
      prettyJson,
      attrPrefix,
      textKey,
      alwaysArray,
    }),
    [indent, declaration, prettyJson, attrPrefix, textKey, alwaysArray],
  )

  const result = useMemo(() => {
    if (!input.trim()) return { ok: false, error: 'empty' }
    try {
      if (mode === 'xml-to-json') {
        const json = xmlToJson(input, {
          attrPrefix,
          textKey,
          trimText: true,
          alwaysArray,
        })
        const out = prettyJson ? JSON.stringify(json, null, indent) : JSON.stringify(json)
        return { ok: true, value: out }
      }
      const parsed = JSON.parse(input)
      const out = jsonToXml(parsed, {
        attrPrefix,
        textKey,
        declaration,
        indent,
      })
      return { ok: true, value: out }
    } catch (err) {
      return { ok: false, error: err.message }
    }
  }, [input, mode, opts])

  const outputSize = useMemo(
    () => (result.ok && result.value ? new TextEncoder().encode(result.value).length : 0),
    [result],
  )

  async function handleCopy() {
    if (!result.ok || !result.value) return
    try {
      await navigator.clipboard.writeText(result.value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }

  const samples = mode === 'xml-to-json' ? SAMPLES.xml : SAMPLES.json
  const inputPlaceholder = mode === 'xml-to-json' ? '<?xml version="1.0"?>...' : '{"root": ...}'
  const isJsonMode = mode === 'json-to-xml'

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}>
        <CodeOutlined /> {t.title}
      </Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card title={t.modeLabel}>
        <Segmented
          value={mode}
          onChange={setMode}
          options={[
            { label: t.xmlToJson, value: 'xml-to-json' },
            { label: t.jsonToXml, value: 'json-to-xml' },
          ]}
        />
      </Card>

      <Card title={t.input}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Space wrap>
            <Text type="secondary">{t.sampleLabel}</Text>
            {samples.map((s) => (
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
            placeholder={inputPlaceholder}
            spellCheck={false}
            style={{ fontFamily: 'monospace', fontSize: 13 }}
          />
        </Space>
      </Card>

      <Card title={t.options}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Space wrap align="center">
            <Text type="secondary">{t.indentLabel}</Text>
            <Segmented value={indent} onChange={setIndent} options={[2, 4]} />
          </Space>

          <Space wrap align="center">
            <Input
              value={attrPrefix}
              onChange={(e) => setAttrPrefix(e.target.value)}
              style={{ width: 90 }}
              maxLength={4}
            />
            <Text>{t.attrPrefixLabel}</Text>
            <Tooltip title={t.attrPrefixHint}>
              <Text type="secondary" style={{ cursor: 'help' }}>ⓘ</Text>
            </Tooltip>
          </Space>

          <Space wrap align="center">
            <Input
              value={textKey}
              onChange={(e) => setTextKey(e.target.value)}
              style={{ width: 90 }}
              maxLength={12}
            />
            <Text>{t.textKeyLabel}</Text>
            <Tooltip title={t.textKeyHint}>
              <Text type="secondary" style={{ cursor: 'help' }}>ⓘ</Text>
            </Tooltip>
          </Space>

          {!isJsonMode && (
            <>
              <Space wrap>
                <Switch checked={alwaysArray} onChange={setAlwaysArray} />
                <Text>{t.alwaysArray}</Text>
                <Tooltip title={t.alwaysArrayHint}>
                  <Text type="secondary" style={{ cursor: 'help' }}>ⓘ</Text>
                </Tooltip>
              </Space>
              <Space wrap>
                <Switch checked={prettyJson} onChange={setPrettyJson} />
                <Text>{t.prettyJson}</Text>
                <Tooltip title={t.prettyJsonHint}>
                  <Text type="secondary" style={{ cursor: 'help' }}>ⓘ</Text>
                </Tooltip>
              </Space>
            </>
          )}

          {isJsonMode && (
            <Space wrap>
              <Switch checked={declaration} onChange={setDeclaration} />
              <Text>{t.declaration}</Text>
              <Tooltip title={t.declarationHint}>
                <Text type="secondary" style={{ cursor: 'help' }}>ⓘ</Text>
              </Tooltip>
            </Space>
          )}
        </Space>
      </Card>

      <Card
        title={
          <Space size={8}>
            <SwapOutlined />
            <span>{t.output}</span>
            {result.ok && result.value && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                {t.bytes(outputSize)}
              </Text>
            )}
          </Space>
        }
        extra={
          result.ok && result.value ? (
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
        {!result.ok ? (
          <Alert
            type={result.error === 'empty' ? 'info' : 'error'}
            showIcon
            message={
              result.error === 'empty'
                ? t.emptyHint
                : mode === 'xml-to-json'
                ? `${t.invalidXml}: ${result.error}`
                : result.error.includes('Root')
                ? t.invalidRoot
                : `${t.invalidJson}: ${result.error}`
            }
          />
        ) : (
          <pre
            style={{
              margin: 0,
              overflowX: 'auto',
              fontFamily: 'monospace',
              fontSize: 13,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
            }}
          >
            <code>{result.value}</code>
          </pre>
        )}
      </Card>

      <Alert type="info" showIcon message={t.alertTitle} description={t.alertBody} />

      <Card title={t.algorithmTitle}>
        <Paragraph type="secondary">{t.algorithmDesc}</Paragraph>
        <Collapse
          items={[
            {
              key: 'src',
              label: <Text code>xmlJson.js</Text>,
              children: (
                <pre
                  style={{
                    margin: 0,
                    overflowX: 'auto',
                    fontSize: 12,
                    lineHeight: 1.6,
                  }}
                >
                  {SOURCE_SNIPPET}
                </pre>
              ),
            },
          ]}
        />
      </Card>
    </Space>
  )
}
