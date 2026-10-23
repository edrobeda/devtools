import React, { useMemo, useState } from 'react'
import {
  Typography,
  Card,
  Space,
  Input,
  Button,
  Upload,
  Table,
  Tag,
  Statistic,
  Row,
  Col,
  Tree,
  Tabs,
  Alert,
  Collapse,
  Segmented,
  Switch,
  Descriptions,
  Empty,
  message,
} from 'antd'
import {
  ApiOutlined,
  UploadOutlined,
  FileTextOutlined,
  ClearOutlined,
  CopyOutlined,
  FolderOutlined,
  SearchOutlined,
  WarningOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import useCopyText from '../hooks/useCopyText'
import * as pc from '../utils/postmanCollection'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input

const SOURCE_SNIPPET = Object.values(pc)
  .filter((f) => typeof f === 'function')
  .map((f) => f.toString())
  .join('\n\n')

function buildExample() {
  return {
    info: {
      _postman_id: '6f1d0a2c-4f1a-4c7e-9a3d-0b1c2d3e4f50',
      name: 'Billing API',
      description: 'Coleção de exemplo: auth herdado da coleção, pastas, scripts e alguns problemas típicos.',
      schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
    },
    auth: {
      type: 'bearer',
      bearer: [{ key: 'token', value: '{{accessToken}}', type: 'string' }],
    },
    event: [
      {
        listen: 'prerequest',
        script: { type: 'text/javascript', exec: ["pm.environment.set('requestId', pm.variables.replaceIn('{{$guid}}'))"] },
      },
    ],
    item: [
      {
        name: 'Auth',
        item: [
          {
            name: 'Login',
            event: [
              {
                listen: 'test',
                script: {
                  exec: [
                    "pm.test('responde 200', () => pm.response.to.have.status(200))",
                    "const body = pm.response.json()",
                    "pm.environment.set('accessToken', body.token)",
                  ],
                },
              },
            ],
            request: {
              method: 'POST',
              auth: { type: 'noauth' },
              header: [{ key: 'Content-Type', value: 'application/json' }],
              body: {
                mode: 'raw',
                raw: '{\n  "email": "{{userEmail}}",\n  "password": "{{userPassword}}"\n}',
                options: { raw: { language: 'json' } },
              },
              url: {
                raw: '{{baseUrl}}/auth/login',
                protocol: 'https',
                host: ['{{baseUrl}}'],
                path: ['auth', 'login'],
              },
            },
          },
        ],
      },
      {
        name: 'Invoices',
        item: [
          {
            name: 'List invoices',
            request: {
              method: 'GET',
              header: [{ key: 'X-Api-Key', value: 'sk_live_9f8e7d6c5b4a3210' }],
              url: {
                raw: '{{baseUrl}}/invoices',
                host: ['{{baseUrl}}'],
                path: ['invoices'],
                query: [
                  { key: 'status', value: 'open' },
                  { key: 'page', value: '1', disabled: true },
                ],
              },
            },
          },
          {
            name: 'Create invoice',
            request: {
              method: 'POST',
              header: [{ key: 'Content-Type', value: 'application/json' }],
              body: {
                mode: 'raw',
                raw: '{\n  "amount": 14990,\n  "customer": { "id": 42 },\n  "dueDays": 30\n}',
                options: { raw: { language: 'json' } },
              },
              url: 'https://api.billing.example.com/invoices',
            },
          },
          {
            name: 'Import CSV',
            request: {
              method: 'POST',
              body: {
                mode: 'formdata',
                formdata: [
                  { key: 'file', type: 'file', src: '/tmp/invoices-2026-10.csv' },
                  { key: 'notify', value: 'true', type: 'text' },
                ],
              },
              url: 'https://api.billing.example.com/invoices/import',
            },
          },
          {
            name: 'GraphQL totals',
            request: {
              method: 'POST',
              body: {
                mode: 'graphql',
                graphql: { query: 'query Totais($mes: String!) {\n  totals(mes: $mes) { aberto vencido }\n}', variables: '{ "mes": "2026-10" }' },
              },
              url: 'https://api.billing.example.com/graphql',
            },
          },
          {
            name: 'Update invoice (JSON inválido)',
            request: {
              method: 'PUT',
              body: { mode: 'raw', raw: '{\n  "status": "paid",\n}', options: { raw: { language: 'json' } } },
              url: 'https://api.billing.example.com/invoices/1',
            },
          },
        ],
      },
      {
        name: 'Health',
        item: [
          {
            name: 'Ping',
            request: {
              method: 'GET',
              url: 'https://api.billing.example.com/health?token=9f8e7d6c5b4a',
            },
          },
        ],
      },
    ],
    variable: [
      { key: 'baseUrl', value: 'https://api.billing.example.com', type: 'string' },
      { key: 'userEmail', value: 'dev@example.com', type: 'string' },
      { key: 'userPassword', value: 'change-me', type: 'string' },
      { key: 'ambiente', value: 'staging', type: 'string' },
    ],
  }
}

const EXAMPLE_COLLECTION = JSON.stringify(buildExample(), null, 2)

const METHOD_COLORS = {
  GET: 'blue',
  POST: 'green',
  PUT: 'orange',
  PATCH: 'gold',
  DELETE: 'red',
  HEAD: 'cyan',
  OPTIONS: 'purple',
}

const translations = {
  pt: {
    title: 'Visualizador de Coleção Postman',
    intro: (
      <>
        Cole o JSON de uma coleção exportada do Postman (schema <Text code>v2.0</Text> ou{' '}
        <Text code>v2.1</Text>) e navegue pelas pastas e requisições: URL montada, headers, query,
        corpo, scripts e <Text code>auth</Text> herdado de coleção ou pasta. A página também aponta
        <Text strong> o que está errado ou perigoso na coleção</Text> — JSON de corpo quebrado,
        credenciais literais no lugar de variáveis, query params desabilitados, nomes repetidos — e
        gera o código (cURL, fetch, Python requests, requisição HTTP crua) de cada request.
        100% no navegador: a coleção nunca sai da sua máquina.
      </>
    ),
    inputLabel: 'Cole aqui o JSON da coleção',
    inputPlaceholder: '{ "info": { "name": "Minha API", "schema": ".../v2.1.0/collection.json" }, "item": [ ... ] }',
    upload: 'Enviar arquivo .json',
    loadExample: 'Carregar exemplo',
    clear: 'Limpar',
    parseError: 'Erro ao ler a coleção',
    statRequests: 'Requisições',
    statFolders: 'Pastas',
    statVariables: 'Variáveis declaradas',
    statTests: 'Scripts de teste',
    statIssues: 'Problemas',
    treeTitle: 'Estrutura da coleção',
    treeHint: 'Clique numa requisição para inspecionar o detalhe.',
    treeSearch: 'Filtrar por nome, método ou url',
    selectRequest: 'Selecione uma requisição na árvore para ver o detalhe',
    tabRequest: 'Requisição',
    tabBody: 'Corpo',
    tabAuth: 'Autenticação',
    tabScripts: 'Scripts',
    tabCode: 'Código',
    colKey: 'Chave',
    colValue: 'Valor',
    colWhere: 'Onde',
    noHeaders: 'Nenhum header na requisição',
    noQuery: 'Nenhum query param',
    noParams: 'Nenhum parâmetro',
    noBody: 'Requisição sem corpo',
    noScripts: 'Nenhum script (prerequest/test) nesta requisição',
    noAuth: 'Nenhuma autenticação definida (nem na requisição, nem na pasta, nem na coleção)',
    authInherited: ' herdado de ',
    scriptUses: 'usado em {count} requisições',
    resolvedUrl: 'URL resolvida',
    codeLangCurl: 'cURL',
    codeLangFetch: 'fetch',
    codeLangPython: 'Python',
    codeLangHttp: 'HTTP cru',
    resolveVars: 'Resolver {{variáveis}}',
    copyCode: 'Copiar código',
    varsTitle: 'Variáveis',
    varsHint:
      'O Postman resolve {{var}} na execução. A tabela mostra o que está declarado na coleção, o que é usado sem estar declarado (normalmente vem do environment) e o que foi declarado e nunca usado.',
    varsDeclared: 'Declaradas',
    varsMissing: 'Usadas sem declaração',
    varsUnused: 'Declaradas e não usadas',
    varsDynamic: 'Variáveis dinâmicas',
    varsCount: 'Usos',
    varsNoneDeclared: 'A coleção não declara variáveis',
    varsNoneMissing: 'Nenhuma variável usada sem declaração',
    varsNoneUnused: 'Nenhuma variável declarada sem uso',
    varsNoneDynamic: 'Nenhuma variável dinâmica ({{$timestamp}}, {{$guid}}...) em uso',
    lintTitle: 'Laudo da coleção',
    lintHint: 'Regras aplicadas à coleção inteira — cada linha aponta a requisição afetada.',
    lintFilterAll: 'Todos',
    lintFilterError: 'Erros',
    lintFilterWarn: 'Avisos',
    lintFilterInfo: 'Informativo',
    lintNone: 'Nenhum problema encontrado com as regras atuais.',
    colSeverity: 'Severidade',
    severityError: 'Erro',
    severityWarn: 'Aviso',
    severityInfo: 'Info',
    invalidBody: 'O corpo não é um JSON válido',
    missingVarsNote: 'Variáveis que só existem no environment selecionado durante a execução:',
    colRule: 'Regra',
    colMessage: 'Mensagem',
    colDetail: 'Trecho',
    sourceTitle: 'Algoritmo',
    sourceBody:
      'O motor em src/utils/postmanCollection.js faz o parsing do JSON, achata a árvore de itens resolvendo auth e scripts herdados, monta a URL final, analisa uso de variáveis, aplica as regras do laudo e gera o código de cada requisição. Tudo local, nenhuma chamada de rede.',
    sourceTab: 'postmanCollection.js',
    copied: 'Copiado!',
    copiedError: 'Erro',
    collectedAt: 'Analisado no navegador — nada foi enviado',
    issuesCount: '{count} achados',
  },
  en: {
    title: 'Postman Collection Viewer',
    intro: (
      <>
        Paste the JSON of a collection exported from Postman (schema <Text code>v2.0</Text> or{' '}
        <Text code>v2.1</Text>) and browse the folders and requests: final URL, headers, query,
        body, scripts and <Text code>auth</Text> inherited from the collection or folder. The page
        also flags <Text strong>what is wrong or risky</Text> in the collection — broken body JSON,
        literal credentials instead of variables, disabled query params, duplicated names — and
        generates the code (cURL, fetch, Python requests, raw HTTP request) for each request.
        100% in the browser: the collection never leaves your machine.
      </>
    ),
    inputLabel: 'Paste the collection JSON here',
    inputPlaceholder: '{ "info": { "name": "My API", "schema": ".../v2.1.0/collection.json" }, "item": [ ... ] }',
    upload: 'Upload .json file',
    loadExample: 'Load example',
    clear: 'Clear',
    parseError: 'Error reading the collection',
    statRequests: 'Requests',
    statFolders: 'Folders',
    statVariables: 'Declared variables',
    statTests: 'Test scripts',
    statIssues: 'Issues',
    treeTitle: 'Collection structure',
    treeHint: 'Click a request to inspect its details.',
    treeSearch: 'Filter by name, method or url',
    selectRequest: 'Select a request in the tree to see the details',
    tabRequest: 'Request',
    tabBody: 'Body',
    tabAuth: 'Authentication',
    tabScripts: 'Scripts',
    tabCode: 'Code',
    colKey: 'Key',
    colValue: 'Value',
    colWhere: 'Where',
    noHeaders: 'No headers in this request',
    noQuery: 'No query params',
    noParams: 'No parameters',
    noBody: 'Request without body',
    noScripts: 'No scripts (prerequest/test) on this request',
    noAuth: 'No auth defined (neither on the request, nor the folder, nor the collection)',
    authInherited: ' inherited from ',
    scriptUses: 'used by {count} requests',
    resolvedUrl: 'Resolved URL',
    codeLangCurl: 'cURL',
    codeLangFetch: 'fetch',
    codeLangPython: 'Python',
    codeLangHttp: 'Raw HTTP',
    resolveVars: 'Resolve {{variables}}',
    copyCode: 'Copy code',
    varsTitle: 'Variables',
    varsHint:
      'Postman resolves {{var}} at runtime. The tables below show what the collection declares, what is used without being declared (usually provided by an environment) and what was declared but never used.',
    varsDeclared: 'Declared',
    varsMissing: 'Used without declaration',
    varsUnused: 'Declared and unused',
    varsDynamic: 'Dynamic variables',
    varsCount: 'Uses',
    varsNoneDeclared: 'The collection declares no variables',
    varsNoneMissing: 'No variable used without a declaration',
    varsNoneUnused: 'No declared variable is unused',
    varsNoneDynamic: 'No dynamic variable ({{$timestamp}}, {{$guid}}...) in use',
    lintTitle: 'Collection report',
    lintHint: 'Rules applied to the whole collection — each row points to the affected request.',
    lintFilterAll: 'All',
    lintFilterError: 'Errors',
    lintFilterWarn: 'Warnings',
    lintFilterInfo: 'Informational',
    lintNone: 'No problem found with the current rules.',
    colSeverity: 'Severity',
    severityError: 'Error',
    severityWarn: 'Warning',
    severityInfo: 'Info',
    invalidBody: 'The body is not valid JSON',
    missingVarsNote: 'Variables that only exist in the environment selected at runtime:',
    colRule: 'Rule',
    colMessage: 'Message',
    colDetail: 'Snippet',
    sourceTitle: 'Algorithm',
    sourceBody:
      'The engine in src/utils/postmanCollection.js parses the JSON, flattens the item tree resolving inherited auth and scripts, builds the final URL, analyses variable usage, applies the report rules and generates the code for each request. Everything local, no network call.',
    sourceTab: 'postmanCollection.js',
    copied: 'Copied!',
    copiedError: 'Error',
    collectedAt: 'Analysed in the browser — nothing was sent',
    issuesCount: '{count} findings',
  },
}

function filterTree(nodes, query) {
  if (!query) return nodes
  const q = query.toLowerCase()
  const walk = (list) => list
    .map((node) => {
      const children = node.kind === 'folder' ? walk(node.children) : []
      const haystack = node.kind === 'request'
        ? `${node.name} ${node.method} ${pc.rawUrl(node.data?.request)}`.toLowerCase()
        : node.name.toLowerCase()
      if (haystack.includes(q) || children.length > 0) return { ...node, children }
      return null
    })
    .filter(Boolean)
  return walk(nodes)
}

function methodTag(method) {
  return <Tag color={METHOD_COLORS[method] || 'default'} style={{ marginInlineEnd: 0 }}>{method}</Tag>
}

function KeyValueTable({ rows, emptyText, keyTitle, valueTitle }) {
  if (!rows || rows.length === 0) return <Text type="secondary">{emptyText}</Text>
  return (
    <Table
      size="small"
      rowKey={(_, index) => `kv-${index}`}
      pagination={false}
      dataSource={rows}
      scroll={{ y: 220 }}
      columns={[
        { title: keyTitle, dataIndex: 'key', width: 180, render: (v, row) => (row.disabled ? <Text type="secondary">{v}</Text> : <Text code>{v}</Text>) },
        {
          title: valueTitle,
          dataIndex: 'value',
          render: (v) => <Text style={{ wordBreak: 'break-all' }}>{v}</Text>,
        },
        { title: '', dataIndex: 'disabled', width: 70, render: (v) => (v ? <Tag>off</Tag> : null) },
      ]}
    />
  )
}

export default function PostmanCollectionViewerPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [messageApi, messageContextHolder] = message.useMessage()
  const copyText = useCopyText(t, messageApi)

  const [input, setInput] = useState(EXAMPLE_COLLECTION)
  const [selectedKey, setSelectedKey] = useState(null)
  const [treeQuery, setTreeQuery] = useState('')
  const [resolveVars, setResolveVars] = useState(true)
  const [codeLang, setCodeLang] = useState('curl')
  const [issueFilter, setIssueFilter] = useState('all')

  const parsed = useMemo(() => pc.parseCollection(input), [input])
  const nodes = useMemo(() => (parsed.ok ? pc.flattenCollection(parsed.data) : []), [parsed])
  const treeData = useMemo(() => pc.buildTreeData(nodes), [nodes])
  const summary = useMemo(() => (parsed.ok ? pc.summarizeCollection(parsed.data, nodes) : null), [parsed, nodes])
  const variables = useMemo(() => pc.analyzeVariables(parsed.ok ? parsed.data : {}, nodes), [parsed, nodes])
  const issues = useMemo(() => (parsed.ok ? pc.lintCollection(parsed.data, nodes, parsed.meta) : []), [parsed, nodes])
  const counts = useMemo(() => pc.countBySeverity(issues), [issues])
  const varMap = useMemo(() => (parsed.ok ? pc.variablesToMap(parsed.data) : {}), [parsed])
  const filteredTree = useMemo(() => filterTree(treeData, treeQuery), [treeData, treeQuery])
  const selectedNode = useMemo(
    () => (selectedKey ? nodes.find((n) => n.treeKey === selectedKey && n.kind === 'request') || null : null),
    [nodes, selectedKey]
  )
  const filteredIssues = useMemo(
    () => (issueFilter === 'all' ? issues : issues.filter((i) => i.severity === issueFilter)),
    [issues, issueFilter]
  )

  function handleUpload({ file }) {
    const reader = new FileReader()
    reader.onload = (e) => {
      setInput(e.target.result)
      setSelectedKey(null)
    }
    reader.readAsText(file)
    return false
  }

  function loadExample() {
    setInput(EXAMPLE_COLLECTION)
    setSelectedKey(null)
  }

  function clearAll() {
    setInput('')
    setSelectedKey(null)
  }

  const codeOptions = { variables: varMap, resolve: resolveVars }
  const generatedCode = useMemo(() => {
    if (!selectedNode) return ''
    if (codeLang === 'curl') return pc.toCurl(selectedNode, codeOptions)
    if (codeLang === 'fetch') return pc.toFetch(selectedNode, codeOptions)
    if (codeLang === 'python') return pc.toPython(selectedNode, codeOptions)
    return pc.toHttpFile(selectedNode, codeOptions)
  }, [selectedNode, codeLang, varMap, resolveVars])

  const missingInUrl = useMemo(() => {
    if (!selectedNode) return []
    return pc.resolveTemplate(pc.buildUrl(selectedNode.request), varMap).missing
  }, [selectedNode, varMap])

  const detailTabs = useMemo(() => {
    if (!selectedNode) return []
    const request = selectedNode.request || {}
    const headers = pc.requestHeaders(request)
    const query = pc.requestQuery(request)
    const body = pc.describeBody(request.body)
    const auth = pc.effectiveAuth(selectedNode)
    const scripts = pc.scriptLines(selectedNode.events)
    const resolved = pc.resolveTemplate(pc.buildUrl(request), varMap)

    return [
      {
        key: 'request',
        label: t.tabRequest,
        children: (
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Descriptions bordered size="small" column={1}>
              <Descriptions.Item label={t.colKey}>{selectedNode.name}</Descriptions.Item>
              <Descriptions.Item label="Method">{methodTag(selectedNode.method)}</Descriptions.Item>
              <Descriptions.Item label="Folder">{selectedNode.path || '—'}</Descriptions.Item>
              <Descriptions.Item label="URL">
                <Text copyable style={{ wordBreak: 'break-all' }}>{pc.buildUrl(request)}</Text>
              </Descriptions.Item>
              <Descriptions.Item label={t.resolvedUrl}>
                <Text code style={{ wordBreak: 'break-all' }}>{resolved.text}</Text>
                {missingInUrl.length > 0 && (
                  <div style={{ marginTop: 4 }}>
                    <Tag color="orange">{missingInUrl.map((name) => `{{${name}}}`).join(', ')}</Tag>
                  </div>
                )}
              </Descriptions.Item>
            </Descriptions>
            <div>
              <Text strong>Headers</Text>
              <KeyValueTable rows={headers} emptyText={t.noHeaders} keyTitle={t.colKey} valueTitle={t.colValue} />
            </div>
            <div>
              <Text strong>Query</Text>
              <KeyValueTable rows={query} emptyText={t.noQuery} keyTitle={t.colKey} valueTitle={t.colValue} />
            </div>
          </Space>
        ),
      },
      {
        key: 'body',
        label: (
          <Space size={4}>
            {t.tabBody}
            {body.mode !== 'none' && <Tag>{body.label}</Tag>}
          </Space>
        ),
        children: (
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            {body.mode === 'none' && <Text type="secondary">{t.noBody}</Text>}
            {body.mode !== 'none' && !body.valid && <Alert type="error" showIcon message={t.invalidBody} />}
            {body.params.length > 0 && (
              <KeyValueTable rows={body.params} emptyText={t.noParams} keyTitle={t.colKey} valueTitle={t.colValue} />
            )}
            {body.text && (
              <pre style={{ margin: 0, maxHeight: 320, overflow: 'auto', background: 'rgba(127,127,127,0.08)', padding: 12, borderRadius: 6, fontSize: 12 }}>
                <code>{body.text}</code>
              </pre>
            )}
          </Space>
        ),
      },
      {
        key: 'auth',
        label: (
          <Space size={4}>
            {t.tabAuth}
            {auth.type !== 'nenhuma' && <Tag color="blue">{auth.type}</Tag>}
          </Space>
        ),
        children: (
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            {auth.type === 'nenhuma' ? (
              <Alert type="info" showIcon message={t.noAuth} />
            ) : (
              <>
                <Space wrap>
                  <Tag color="blue">{auth.type}</Tag>
                  {auth.source && (
                    <Text type="secondary">
                      {auth.type === 'noauth' ? '' : `${t.authInherited}${auth.source}`}
                    </Text>
                  )}
                </Space>
                <KeyValueTable rows={auth.params} emptyText={t.noParams} keyTitle={t.colKey} valueTitle={t.colValue} />
              </>
            )}
          </Space>
        ),
      },
      {
        key: 'scripts',
        label: (
          <Space size={4}>
            {t.tabScripts}
            {scripts.length > 0 && <Tag color="purple">{scripts.length}</Tag>}
          </Space>
        ),
        children:
          scripts.length === 0 ? (
            <Text type="secondary">{t.noScripts}</Text>
          ) : (
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              {scripts.map((script, index) => (
                <Card
                  key={`${script.listen}-${index}`}
                  size="small"
                  title={
                    <Space>
                      <Tag color={script.listen === 'test' ? 'green' : 'blue'}>{script.listen}</Tag>
                      <Text type="secondary">{t.scriptUses.replace('{count}', script.uses)}</Text>
                    </Space>
                  }
                >
                  <pre style={{ margin: 0, maxHeight: 260, overflow: 'auto', fontSize: 12 }}>
                    <code>{script.lines.join('\n')}</code>
                  </pre>
                </Card>
              ))}
            </Space>
          ),
      },
      {
        key: 'code',
        label: t.tabCode,
        children: (
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Space wrap>
              <Segmented
                size="small"
                value={codeLang}
                onChange={(v) => setCodeLang(v)}
                options={[
                  { label: t.codeLangCurl, value: 'curl' },
                  { label: t.codeLangFetch, value: 'fetch' },
                  { label: t.codeLangPython, value: 'python' },
                  { label: t.codeLangHttp, value: 'http' },
                ]}
              />
              <Space size={6}>
                <Switch size="small" checked={resolveVars} onChange={setResolveVars} />
                <Text>{t.resolveVars}</Text>
              </Space>
              <Button icon={<CopyOutlined />} onClick={() => copyText(generatedCode, t.copied)}>
                {t.copyCode}
              </Button>
            </Space>
            <pre style={{ margin: 0, maxHeight: 340, overflow: 'auto', background: 'rgba(127,127,127,0.08)', padding: 12, borderRadius: 6, fontSize: 12 }}>
              <code>{generatedCode}</code>
            </pre>
          </Space>
        ),
      },
    ]
  }, [selectedNode, t, varMap, resolveVars, codeLang, missingInUrl, generatedCode])

  const severityColor = { error: 'red', warn: 'orange', info: 'blue' }
  const severityLabel = { error: t.severityError, warn: t.severityWarn, info: t.severityInfo }

  const issueColumns = [
    {
      title: t.colSeverity,
      dataIndex: 'severity',
      width: 110,
      render: (severity) => (
        <Tag color={severityColor[severity]}>{severityLabel[severity] || severity}</Tag>
      ),
    },
    { title: t.colRule, dataIndex: 'rule', width: 190 },
    { title: t.colMessage, dataIndex: 'message', ellipsis: true },
    { title: t.colWhere, dataIndex: 'where', width: 260, ellipsis: true },
  ]

  const usageColumns = [
    { title: t.colKey, dataIndex: 'name', width: 220, render: (v) => <Text code>{`{{${v}}}`}</Text> },
    { title: t.varsCount, dataIndex: 'count', width: 80 },
    { title: t.colWhere, dataIndex: 'places', render: (places) => (places || []).join(' · ') },
  ]

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {messageContextHolder}
      <Title level={2}><ApiOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <div>
            <Text strong>{t.inputLabel}</Text>
            <TextArea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t.inputPlaceholder}
              autoSize={{ minRows: 6, maxRows: 14 }}
              style={{ fontFamily: 'monospace', fontSize: 12 }}
              status={!parsed.ok && input.trim() ? 'error' : ''}
            />
          </div>
          <Space wrap>
            <Upload accept=".json" showUploadList={false} beforeUpload={() => false} onChange={handleUpload}>
              <Button icon={<UploadOutlined />}>{t.upload}</Button>
            </Upload>
            <Button icon={<FileTextOutlined />} onClick={loadExample}>{t.loadExample}</Button>
            <Button icon={<ClearOutlined />} onClick={clearAll}>{t.clear}</Button>
            <Text type="secondary">{t.collectedAt}</Text>
          </Space>
          {input.trim() && !parsed.ok && (
            <Alert type="error" showIcon message={`${t.parseError}: ${parsed.error}`} />
          )}
        </Space>
      </Card>

      {parsed.ok && summary && (
        <>
          <Row gutter={[16, 16]}>
            <Col xs={12} md={4}>
              <Card><Statistic title={t.statRequests} value={summary.requests} /></Card>
            </Col>
            <Col xs={12} md={4}>
              <Card><Statistic title={t.statFolders} value={summary.folders} /></Card>
            </Col>
            <Col xs={12} md={4}>
              <Card><Statistic title={t.statVariables} value={summary.variables} /></Card>
            </Col>
            <Col xs={12} md={4}>
              <Card><Statistic title={t.statTests} value={summary.testScripts} suffix={`/ ${summary.preScripts}`} /></Card>
            </Col>
            <Col xs={12} md={4}>
              <Card>
                <Statistic
                  title={t.statIssues}
                  value={counts.error + counts.warn + counts.info}
                  valueStyle={counts.error > 0 ? { color: '#cf1322' } : undefined}
                />
              </Card>
            </Col>
            <Col xs={12} md={4}>
              <Card>
                <Space direction="vertical" size={2}>
                  {Object.entries(summary.methods).sort((a, b) => b[1] - a[1]).map(([method, count]) => (
                    <Space key={method} size={6}>{methodTag(method)}<Text>{count}</Text></Space>
                  ))}
                </Space>
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} lg={9}>
              <Card title={t.treeTitle} size="small">
                <Paragraph type="secondary" style={{ marginBottom: 8 }}>{t.treeHint}</Paragraph>
                <Input
                  size="small"
                  allowClear
                  prefix={<SearchOutlined />}
                  placeholder={t.treeSearch}
                  value={treeQuery}
                  onChange={(e) => setTreeQuery(e.target.value)}
                  style={{ marginBottom: 8 }}
                />
                <div style={{ maxHeight: 520, overflow: 'auto' }}>
                  <Tree
                    key={treeQuery.trim() ? 'filtered' : 'full'}
                    treeData={filteredTree}
                    showLine
                    switcherIcon={<span />}
                    selectedKeys={selectedKey ? [selectedKey] : []}
                    onSelect={(keys) => setSelectedKey(keys.length ? keys[0] : null)}
                    defaultExpandAll
                    titleRender={(nodeData) =>
                      nodeData.kind === 'folder' ? (
                        <Space size={6}>
                          <FolderOutlined />
                          <Text strong style={{ fontSize: 13 }}>{nodeData.name}</Text>
                          <Text type="secondary">{nodeData.children.length}</Text>
                        </Space>
                      ) : (
                        <Space size={6}>
                          {methodTag(nodeData.method)}
                          <Text style={{ fontSize: 13 }}>{nodeData.name}</Text>
                        </Space>
                      )
                    }
                  />
                </div>
              </Card>
            </Col>
            <Col xs={24} lg={15}>
              <Card size="small" style={{ minHeight: 320 }}>
                {selectedNode ? (
                  <Tabs items={detailTabs} />
                ) : (
                  <Empty description={t.selectRequest} image={<ApiOutlined style={{ fontSize: 42 }} />} />
                )}
              </Card>
            </Col>
          </Row>

          <Card title={t.varsTitle} size="small">
            <Paragraph type="secondary">{t.varsHint}</Paragraph>
            <Tabs
              items={[
                {
                  key: 'declared',
                  label: `${t.varsDeclared} (${variables.declared.length})`,
                  children: variables.declared.length === 0 ? (
                    <Text type="secondary">{t.varsNoneDeclared}</Text>
                  ) : (
                    <Table
                      size="small"
                      pagination={false}
                      rowKey={(row) => row.name}
                      dataSource={variables.declared.map((v) => ({ ...v, key: v.name }))}
                      columns={[
                        { title: t.colKey, dataIndex: 'name', width: 220, render: (v) => <Text code>{`{{${v}}}`}</Text> },
                        { title: t.colValue, dataIndex: 'value', render: (v) => <Text style={{ wordBreak: 'break-all' }}>{v}</Text> },
                        { title: 'Type', dataIndex: 'type', width: 90 },
                        {
                          title: t.varsCount,
                          dataIndex: 'name',
                          width: 90,
                          render: (name) => (variables.usage.find((u) => u.name === name)?.count ?? 0),
                        },
                      ]}
                    />
                  ),
                },
                {
                  key: 'missing',
                  label: `${t.varsMissing} (${variables.missing.length})`,
                  children:
                    variables.missing.length === 0 ? (
                      <Text type="secondary">{t.varsNoneMissing}</Text>
                    ) : (
                      <Space direction="vertical" size="small" style={{ width: '100%' }}>
                        <Alert type="info" showIcon message={t.missingVarsNote} />
                        <Table size="small" pagination={false} rowKey="name" dataSource={variables.missing} columns={usageColumns} />
                      </Space>
                    ),
                },
                {
                  key: 'unused',
                  label: `${t.varsUnused} (${variables.unused.length})`,
                  children:
                    variables.unused.length === 0 ? (
                      <Text type="secondary">{t.varsNoneUnused}</Text>
                    ) : (
                      <Space wrap>
                        {variables.unused.map((v) => (
                          <Tag key={v.name}>{`{{${v.name}}}`} = {v.value}</Tag>
                        ))}
                      </Space>
                    ),
                },
                {
                  key: 'dynamic',
                  label: `${t.varsDynamic} (${variables.dynamic.length})`,
                  children:
                    variables.dynamic.length === 0 ? (
                      <Text type="secondary">{t.varsNoneDynamic}</Text>
                    ) : (
                      <Table size="small" pagination={false} rowKey="name" dataSource={variables.dynamic} columns={usageColumns} />
                    ),
                },
              ]}
            />
          </Card>

          <Card
            title={
              <Space>
                <WarningOutlined />
                {t.lintTitle}
                <Tag color={counts.error > 0 ? 'red' : counts.warn > 0 ? 'orange' : 'green'}>
                  {t.issuesCount.replace('{count}', counts.error + counts.warn + counts.info)}
                </Tag>
              </Space>
            }
            size="small"
            extra={
              <Segmented
                size="small"
                value={issueFilter}
                onChange={setIssueFilter}
                options={[
                  { label: `${t.lintFilterAll} (${issues.length})`, value: 'all' },
                  { label: `${t.lintFilterError} (${counts.error})`, value: 'error' },
                  { label: `${t.lintFilterWarn} (${counts.warn})`, value: 'warn' },
                  { label: `${t.lintFilterInfo} (${counts.info})`, value: 'info' },
                ]}
              />
            }
          >
            <Paragraph type="secondary">{t.lintHint}</Paragraph>
            {filteredIssues.length === 0 ? (
              <Alert type="success" showIcon message={t.lintNone} />
            ) : (
              <Table
                size="small"
                rowKey={(_, index) => `issue-${index}`}
                dataSource={filteredIssues}
                columns={issueColumns}
                pagination={{ pageSize: 12, showSizeChanger: true, pageSizeOptions: [12, 25, 50, 100] }}
                expandable={{
                  expandedRowRender: (issue) =>
                    issue.detail ? (
                      <pre style={{ margin: 0, fontSize: 12, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                        <code>{issue.detail}</code>
                      </pre>
                    ) : (
                      <Text type="secondary">—</Text>
                    ),
                }}
              />
            )}
          </Card>
        </>
      )}

      <Card title={t.sourceTitle}>
        <Paragraph type="secondary">{t.sourceBody}</Paragraph>
        <Collapse
          items={[
            {
              key: 'src',
              label: <Text code>{t.sourceTab}</Text>,
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