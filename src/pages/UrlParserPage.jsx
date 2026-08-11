import React, { useMemo, useState } from 'react'
import {
  Typography,
  Card,
  Space,
  Input,
  Button,
  Alert,
  Collapse,
  Table,
  Tag,
  message,
} from 'antd'
import {
  LinkOutlined,
  CopyOutlined,
  CheckOutlined,
  ClearOutlined,
  ThunderboltOutlined,
  PlusOutlined,
  DeleteOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const EXAMPLE_SIMPLE = 'https://example.com/products?id=42&sort=price#reviews'
const EXAMPLE_AUTH = 'https://admin:secret@api.example.com:8443/v1/users?active=true'
const EXAMPLE_MAILTO = 'mailto:team@example.com?subject=Hello&body=How are you'

// Resumo legível do algoritmo usado para parsear e reconstruir a URL.
const SOURCE_SNIPPET = `// Parse: new URL(input)
//   A API nativa do navegador quebra a URL em partes:
//   protocol, username, password, host, hostname, port,
//   pathname, search (com ?), hash (com #) e searchParams.
//   Qualquer URL absoluta válida funciona — http, https,
//   mailto, ftp, file etc.

// Query params: URLSearchParams.entries()
//   Devolve pares [key, value] já decodificados. Ao editar,
//   reconstruímos com new URLSearchParams() que re-escapa
//   os caracteres reservados automaticamente.

// Rebuild (buildUrl):
//   1. protocol + '//'
//   2. username:password@ (se houver)
//   3. host
//   4. pathname (garante '/' no início)
//   5. '?' + query string (se houver parâmetro)
//   6. '#' + hash (se houver, garantindo '#')`

const translations = {
  pt: {
    title: 'URL Parser & Query Editor',
    intro: (
      <>
        Cole uma URL e veja cada componente separado — ou monte/edit a URL
        trocando protocolo, host, caminho, query params e hash. Tudo local,
        nada é enviado para lugar nenhum.
      </>
    ),
    inputLabel: 'URL de entrada',
    inputPlaceholder: 'Cole uma URL absoluta aqui, ex.: https://example.com?foo=bar',
    invalid: 'URL inválida — certifique-se de que começa com um protocolo (http://, https://, mailto: etc.).',
    examples: 'Exemplos',
    simple: 'Simples',
    withAuth: 'Com autenticação',
    mailto: 'mailto',
    clear: 'Limpar',
    rebuiltTitle: 'URL reconstruída',
    copy: 'Copiar',
    copied: 'Copiado!',
    componentsTitle: 'Componentes',
    protocol: 'Protocolo',
    username: 'Usuário',
    password: 'Senha',
    host: 'Host',
    hostname: 'Hostname',
    port: 'Porta',
    pathname: 'Caminho',
    search: 'Query string (raw)',
    hash: 'Hash',
    queryParamsTitle: 'Query params',
    key: 'Chave',
    value: 'Valor',
    addParam: 'Adicionar parâmetro',
    remove: 'Remover',
    emptyParams: 'Nenhum parâmetro na query string.',
    statsParts: 'partes',
    statsParams: 'params',
    alertTitle: 'Pegadinhas de URL',
    alertBody: (
      <>
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          <li>
            <Text code>search</Text> sempre inclui o <Text code>?</Text> e{' '}
            <Text code>hash</Text> sempre inclui o <Text code>#</Text>. Se você
            digitar sem eles, a ferramenta adiciona automaticamente na
            reconstrução.
          </li>
          <li>
            Query strings usam <Text code>application/x-www-form-urlencoded</Text>:
            espaços viram <Text code>+</Text> (ou <Text code>%20</Text>) e
            caracteres reservados são escapados. O painel de params mostra o
            valor decodificado, mas a URL reconstruída fica corretamente
            escapada.
          </li>
          <li>
            Autenticação em URL (<Text code>user:pass@host</Text>) está
            obsoleta em navegadores modernos por segurança, mas ainda é útil
            para logs, APIs legadas e testes locais.
          </li>
          <li>
            Protocolos não-HTTP (como <Text code>mailto:</Text>,{' '}
            <Text code>file:</Text> ou <Text code>ftp:</Text>) são aceitos pela
            API <Text code>URL</Text>, embora alguns campos fiquem vazios.
          </li>
        </ul>
      </>
    ),
    sourceTitle: 'Como funciona (algoritmo)',
  },
  en: {
    title: 'URL Parser & Query Editor',
    intro: (
      <>
        Paste a URL and see every component split apart — or build/edit the URL
        by changing protocol, host, path, query params and hash. Fully local,
        nothing is ever sent anywhere.
      </>
    ),
    inputLabel: 'Input URL',
    inputPlaceholder: 'Paste an absolute URL here, e.g. https://example.com?foo=bar',
    invalid: 'Invalid URL — make sure it starts with a protocol (http://, https://, mailto:, etc.).',
    examples: 'Examples',
    simple: 'Simple',
    withAuth: 'With auth',
    mailto: 'mailto',
    clear: 'Clear',
    rebuiltTitle: 'Rebuilt URL',
    copy: 'Copy',
    copied: 'Copied!',
    componentsTitle: 'Components',
    protocol: 'Protocol',
    username: 'Username',
    password: 'Password',
    host: 'Host',
    hostname: 'Hostname',
    port: 'Port',
    pathname: 'Pathname',
    search: 'Query string (raw)',
    hash: 'Hash',
    queryParamsTitle: 'Query params',
    key: 'Key',
    value: 'Value',
    addParam: 'Add parameter',
    remove: 'Remove',
    emptyParams: 'No parameters in the query string.',
    statsParts: 'parts',
    statsParams: 'params',
    alertTitle: 'URL gotchas',
    alertBody: (
      <>
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          <li>
            <Text code>search</Text> always includes the <Text code>?</Text> and{' '}
            <Text code>hash</Text> always includes the <Text code>#</Text>. If
            you type without them, the tool adds them automatically during
            rebuild.
          </li>
          <li>
            Query strings use <Text code>application/x-www-form-urlencoded</Text>:
            spaces become <Text code>+</Text> (or <Text code>%20</Text>) and
            reserved characters are escaped. The params panel shows decoded
            values, but the rebuilt URL is correctly escaped.
          </li>
          <li>
            URL authentication (<Text code>user:pass@host</Text>) is deprecated
            in modern browsers for security, but it is still handy for logs,
            legacy APIs and local tests.
          </li>
          <li>
            Non-HTTP protocols (such as <Text code>mailto:</Text>,{' '}
            <Text code>file:</Text> or <Text code>ftp:</Text>) are accepted by
            the <Text code>URL</Text> API, although some fields may be empty.
          </li>
        </ul>
      </>
    ),
    sourceTitle: 'Under the hood (algorithm)',
  },
}

function parseUrl(input) {
  try {
    const url = new URL(input)
    return {
      ok: true,
      href: url.href,
      protocol: url.protocol,
      username: url.username,
      password: url.password,
      host: url.host,
      hostname: url.hostname,
      port: url.port,
      pathname: url.pathname,
      search: url.search,
      hash: url.hash,
      params: Array.from(url.searchParams.entries()).map(([key, value], id) => ({
        id,
        key,
        value,
      })),
    }
  } catch {
    return { ok: false }
  }
}

function buildUrl(fields, params) {
  try {
    let url = `${fields.protocol}//`
    if (fields.username || fields.password) {
      if (fields.username) url += encodeURIComponent(fields.username)
      if (fields.password) url += `:${encodeURIComponent(fields.password)}`
      url += '@'
    }
    url += fields.host

    let pathname = fields.pathname
    if (pathname && !pathname.startsWith('/')) pathname = `/${pathname}`
    url += pathname

    const sp = new URLSearchParams()
    params.forEach((p) => {
      if (p.key || p.value) sp.append(p.key, p.value)
    })
    const search = sp.toString()
    if (search) url += `?${search}`

    if (fields.hash) {
      let hash = fields.hash
      if (!hash.startsWith('#')) hash = `#${hash}`
      url += hash
    }

    // Sanity check: se a URL resultante for inválida, devolve string vazia.
    new URL(url)
    return url
  } catch {
    return ''
  }
}

export default function UrlParserPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [messageApi, messageContextHolder] = message.useMessage()

  const [input, setInput] = useState(EXAMPLE_SIMPLE)
  const [fields, setFields] = useState(() => {
    const p = parseUrl(EXAMPLE_SIMPLE)
    return p.ok ? p : {}
  })
  const [params, setParams] = useState(() => {
    const p = parseUrl(EXAMPLE_SIMPLE)
    return p.ok ? p.params : []
  })
  const [copied, setCopied] = useState(false)

  const parsed = useMemo(() => parseUrl(input), [input])

  // Sincroniza fields e params quando o input muda por digitação/exemplo.
  React.useEffect(() => {
    if (parsed.ok) {
      setFields({
        href: parsed.href,
        protocol: parsed.protocol,
        username: parsed.username,
        password: parsed.password,
        host: parsed.host,
        hostname: parsed.hostname,
        port: parsed.port,
        pathname: parsed.pathname,
        search: parsed.search,
        hash: parsed.hash,
      })
      setParams(parsed.params)
    }
  }, [input])

  const rebuiltUrl = useMemo(() => {
    if (!parsed.ok || !fields.protocol) return ''
    return buildUrl(fields, params)
  }, [fields, params, parsed.ok])

  function updateField(key, value) {
    setFields((prev) => ({ ...prev, [key]: value }))
  }

  function updateParam(id, key, value) {
    setParams((prev) => prev.map((p) => (p.id === id ? { ...p, [key]: value } : p)))
  }

  function addParam() {
    setParams((prev) => [...prev, { id: Date.now(), key: '', value: '' }])
  }

  function removeParam(id) {
    setParams((prev) => prev.filter((p) => p.id !== id))
  }

  async function handleCopy() {
    if (!rebuiltUrl) return
    try {
      await navigator.clipboard.writeText(rebuiltUrl)
      setCopied(true)
      messageApi.success(t.copied)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      messageApi.error('Erro ao copiar / Copy failed')
    }
  }

  function loadExample(value) {
    setInput(value)
  }

  const componentRows = [
    { key: 'protocol', label: t.protocol },
    { key: 'username', label: t.username },
    { key: 'password', label: t.password },
    { key: 'host', label: t.host },
    { key: 'hostname', label: t.hostname },
    { key: 'port', label: t.port },
    { key: 'pathname', label: t.pathname },
    { key: 'search', label: t.search },
    { key: 'hash', label: t.hash },
  ]

  const paramColumns = [
    {
      title: t.key,
      dataIndex: 'key',
      key: 'key',
      render: (_, record) => (
        <Input
          value={record.key}
          onChange={(e) => updateParam(record.id, 'key', e.target.value)}
          placeholder={t.key}
          size="small"
        />
      ),
    },
    {
      title: t.value,
      dataIndex: 'value',
      key: 'value',
      render: (_, record) => (
        <Input
          value={record.value}
          onChange={(e) => updateParam(record.id, 'value', e.target.value)}
          placeholder={t.value}
          size="small"
        />
      ),
    },
    {
      title: '',
      key: 'action',
      width: 60,
      render: (_, record) => (
        <Button
          danger
          size="small"
          icon={<DeleteOutlined />}
          onClick={() => removeParam(record.id)}
          aria-label={t.remove}
        />
      ),
    },
  ]

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {messageContextHolder}
      <Title level={2}><LinkOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card title={t.inputLabel}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t.inputPlaceholder}
            spellCheck={false}
            style={{ fontFamily: 'monospace' }}
          />
          <Space wrap>
            <Button size="small" icon={<ThunderboltOutlined />} onClick={() => loadExample(EXAMPLE_SIMPLE)}>
              {t.simple}
            </Button>
            <Button size="small" icon={<ThunderboltOutlined />} onClick={() => loadExample(EXAMPLE_AUTH)}>
              {t.withAuth}
            </Button>
            <Button size="small" icon={<ThunderboltOutlined />} onClick={() => loadExample(EXAMPLE_MAILTO)}>
              {t.mailto}
            </Button>
            <Button danger size="small" icon={<ClearOutlined />} onClick={() => setInput('')}>
              {t.clear}
            </Button>
          </Space>
        </Space>
      </Card>

      {!parsed.ok && input.trim() && (
        <Alert type="error" message={t.invalid} showIcon />
      )}

      {parsed.ok && (
        <>
          <Card
            title={t.rebuiltTitle}
            extra={
              <Button
                type="primary"
                size="small"
                icon={copied ? <CheckOutlined /> : <CopyOutlined />}
                onClick={handleCopy}
                disabled={!rebuiltUrl}
              >
                {copied ? t.copied : t.copy}
              </Button>
            }
          >
            <pre
              style={{
                margin: 0,
                wordBreak: 'break-all',
                whiteSpace: 'pre-wrap',
                fontFamily: 'monospace',
                fontSize: 13,
                lineHeight: 1.6,
                background: '#f5f5f5',
                padding: 12,
                borderRadius: 6,
              }}
            >
              {rebuiltUrl || fields.href}
            </pre>
          </Card>

          <Card
            title={
              <Space size={12}>
                <span>{t.componentsTitle}</span>
                <Tag color="blue">{componentRows.length} {t.statsParts}</Tag>
              </Space>
            }
          >
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              {componentRows.map((row) => (
                <div key={row.key} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Text style={{ width: 140, flexShrink: 0 }}>{row.label}</Text>
                  <Input
                    value={fields[row.key] || ''}
                    onChange={(e) => updateField(row.key, e.target.value)}
                    style={{ fontFamily: 'monospace', flex: 1 }}
                    size="small"
                  />
                </div>
              ))}
            </Space>
          </Card>

          <Card
            title={
              <Space size={12}>
                <span>{t.queryParamsTitle}</span>
                <Tag color="blue">{params.length} {t.statsParams}</Tag>
              </Space>
            }
            extra={
              <Button size="small" icon={<PlusOutlined />} onClick={addParam}>
                {t.addParam}
              </Button>
            }
          >
            {params.length === 0 ? (
              <Text type="secondary">{t.emptyParams}</Text>
            ) : (
              <Table
                dataSource={params}
                columns={paramColumns}
                rowKey="id"
                pagination={false}
                size="small"
                bordered
              />
            )}
          </Card>
        </>
      )}

      <Alert type="info" showIcon message={t.alertTitle} description={t.alertBody} />

      <Collapse
        items={[
          {
            key: 'src',
            label: t.sourceTitle,
            children: (
              <pre
                style={{
                  margin: 0,
                  fontSize: 12.5,
                  lineHeight: 1.6,
                  background: '#f5f5f5',
                  padding: 12,
                  borderRadius: 6,
                  overflowX: 'auto',
                  fontFamily: 'monospace',
                }}
              >
                {SOURCE_SNIPPET}
              </pre>
            ),
          },
        ]}
      />
    </Space>
  )
}
