import React, { useMemo, useState } from 'react'
import { Typography, Card, Space, Input, Radio, Tag, Descriptions, Empty, Alert } from 'antd'
import { ReadOutlined, SearchOutlined, SwapOutlined, SafetyOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const METHODS = [
  {
    method: 'GET',
    cat: 'read',
    pt: 'Recupera um recurso (ou uma coleção) existente. Não tem corpo de requisição e nunca deve ter efeito colateral no servidor — é o método "só leitura" por excelência.',
    en: 'Retrieves an existing resource (or a collection). Has no request body and must never have side effects on the server — the "read-only" method par excellence.',
    whenPt: 'Ler/consultar um recurso, listar coleções, buscar com query params, carregar uma página.',
    whenEn: 'Read/query a resource, list collections, search with query params, load a page.',
    example: 'GET /users?active=true',
    safe: true,
    idempotent: true,
    body: false,
    cacheable: true,
    success: [200, 206],
  },
  {
    method: 'HEAD',
    cat: 'read',
    pt: 'Idêntico ao GET, mas a resposta não traz corpo — só os cabeçalhos. Útil pra conferir existência, tamanho (Content-Length), tipo ou a última modificação de um recurso sem baixá-lo.',
    en: 'Identical to GET, but the response carries no body — headers only. Useful to check existence, size (Content-Length), type or last-modified of a resource without downloading it.',
    whenPt: 'Checar se um recurso existe, conferir headers, pré-validar um download, health checks.',
    whenEn: 'Check whether a resource exists, inspect headers, pre-validate a download, health checks.',
    example: 'HEAD /releases/app.zip',
    safe: true,
    idempotent: true,
    body: false,
    cacheable: true,
    success: [200, 404],
  },
  {
    method: 'OPTIONS',
    cat: 'read',
    pt: 'Descreve as capacidades de comunicação do recurso — quais métodos o servidor aceita. É o método do "preflight" automático do CORS.',
    en: 'Describes the communication capabilities of the resource — which methods the server accepts. This is the method behind automatic CORS preflight requests.',
    whenPt: 'Descobrir o que um endpoint aceita (Allow header), preflight CORS disparado pelo navegador.',
    whenEn: 'Discover what an endpoint accepts (Allow header), browser-triggered CORS preflight.',
    example: 'OPTIONS /api/*',
    safe: true,
    idempotent: true,
    body: false,
    cacheable: false,
    success: [204, 200],
  },
  {
    method: 'POST',
    cat: 'write',
    pt: 'Envia dados ao servidor pra criar um recurso novo ou disparar uma ação/processamento. Não é idempotente: cada chamada repetida pode criar outra coisa.',
    en: 'Sends data to the server to create a new resource or trigger an action/process. Not idempotent: each repeated call can create something else.',
    whenPt: 'Criar um recurso, enviar formulário, autenticar, pagamentos, "fazer acontecer" (job, upload, search).',
    whenEn: 'Create a resource, submit a form, authenticate, payments, "make something happen" (job, upload, search).',
    example: 'POST /users  body: { "name": "Ana" }',
    safe: false,
    idempotent: false,
    body: true,
    cacheable: false,
    success: [201, 200, 202],
  },
  {
    method: 'PUT',
    cat: 'write',
    pt: 'Substitui o recurso inteiro no endereço indicado pelo corpo enviado (ou cria, se não existir). Idempotente: repetir a mesma requisição deixa o estado igual.',
    en: 'Replaces the whole resource at the given address with the request body (or creates it if missing). Idempotent: repeating the same request leaves the state unchanged.',
    whenPt: 'Atualizar um recurso por completo (envia todos os campos), upsert de registros.',
    whenEn: 'Fully update a resource (send all fields), upsert records.',
    example: 'PUT /users/123  body: { "name": "Ana", "email": "ana@x.com" }',
    safe: false,
    idempotent: true,
    body: true,
    cacheable: false,
    success: [200, 204, 201],
  },
  {
    method: 'PATCH',
    cat: 'write',
    pt: 'Aplica uma modificação parcial a um recurso — envia só os campos que mudam. A spec não garante idempotência, mas dá pra fazer idempotente com cuidado.',
    en: 'Applies a partial modification to a resource — send only the fields that change. The spec does not guarantee idempotency, but it can be made idempotent with care.',
    whenPt: 'Atualizar campos específicos (ex. só o status), operações incrementais, corrigir um campo de um JSON.',
    whenEn: 'Update specific fields (e.g. just the status), incremental operations, fix a single field of a record.',
    example: 'PATCH /users/123  body: { "status": "active" }',
    safe: false,
    idempotent: false,
    body: true,
    cacheable: false,
    success: [200, 204],
  },
  {
    method: 'DELETE',
    cat: 'write',
    pt: 'Remove um recurso existente. Sem corpo de resposta na versão mais comum; é idempotente na prática — deletar o que já não existe costuma responder igual.',
    en: 'Removes an existing resource. Usually no response body; idempotent in practice — deleting something that is already gone usually yields the same response.',
    whenPt: 'Remover um recurso, inativar um registro, limpar um arquivo.',
    whenEn: 'Remove a resource, deactivate a record, clear a file.',
    example: 'DELETE /users/123',
    safe: false,
    idempotent: true,
    body: false,
    cacheable: false,
    success: [204, 200, 404],
  },
  {
    method: 'TRACE',
    cat: 'infra',
    pt: 'Eco de diagnóstico: o servidor devolve exatamente a requisição recebida, pra quem estiver no meio do caminho (proxies) poder ver o que passou. Raríssimo e normalmente desabilitado por segurança.',
    en: 'Diagnostic echo: the server returns exactly the request it received, so intermediaries (proxies) can inspect what traveled through. Very rare and usually disabled for security.',
    whenPt: 'Depurar roteamento/proxies — na prática, quase sempre desabilitado.',
    whenEn: 'Debug routing/proxies — in practice, almost always disabled.',
    example: 'TRACE /',
    safe: true,
    idempotent: true,
    body: false,
    cacheable: false,
    success: [200, 405],
  },
  {
    method: 'CONNECT',
    cat: 'infra',
    pt: 'Estabelece um túnel bidirecional com o servidor de destino (via proxy) — é o mecanismo por trás do HTTPS sobre proxy. Não é usado em APIs REST.',
    en: 'Establishes a bidirectional tunnel with the target server (through a proxy) — the mechanism behind HTTPS through a proxy. Not used in REST APIs.',
    whenPt: 'Tunelamento HTTPS via proxy (não usado em APIs).',
    whenEn: 'HTTPS tunneling through a proxy (not used in APIs).',
    example: 'CONNECT host:443',
    safe: false,
    idempotent: false,
    body: false,
    cacheable: false,
    success: [200, 407],
  },
]

const CAT_COLOR = { read: 'green', write: 'blue', infra: 'gold' }

const CAT_LABEL = {
  read: { pt: 'Leitura (seguros)', en: 'Read (safe)' },
  write: { pt: 'Escrita', en: 'Write' },
  infra: { pt: 'Infraestrutura', en: 'Infrastructure' },
}

const translations = {
  pt: {
    title: 'Referência de Métodos HTTP',
    intro: (<>Cheat sheet pesquisável dos 9 métodos de requisição HTTP — o que cada um faz, quando usar, e as propriedades que decidem retry e cache (<Text code>safe</Text>, <Text code>idempotent</Text>). Complementa a <Text code>/references/http-status-codes</Text>, que trata dos códigos de resposta.</>),
    search: 'Buscar método, uso ou exemplo...',
    all: 'Todos',
    empty: 'Nenhum método encontrado. Tente outra busca ou categoria.',
    resultsOne: 'método encontrado',
    resultsMany: 'métodos encontrados',
    whenTitle: 'Quando usar',
    exampleTitle: 'Exemplo',
    propsTitle: 'Propriedades',
    successTitle: 'Status típicos',
    safeProp: 'Seguro (safe)',
    idemProp: 'Idempotente',
    bodyProp: 'Tem corpo',
    cacheProp: 'Cacheável',
    tipTitle: 'Safe vs. Idempotente',
    tipBody: (<>Um método é <Text strong>safe</Text> quando não altera o estado do servidor (GET, HEAD, OPTIONS, TRACE) — pode ser chamado quantas vezes quiser sem consequência. Um método é <Text strong>idempotente</Text> quando chamá-lo N vezes tem o mesmo efeito que chamar uma única vez (GET, PUT, DELETE). A distinção importa pra <Text code>retry</Text> automático: idempotente pode ser repetido com segurança em caso de timeout de rede; POST (não idempotente) não — repetir pode duplicar uma cobrança ou criar dois registros.</>),
    safeYes: 'Sim',
    safeNo: 'Não',
  },
  en: {
    title: 'HTTP Methods Reference',
    intro: (<>A searchable cheat sheet of the 9 HTTP request methods — what each does, when to use it, and the properties that drive retry and caching (<Text code>safe</Text>, <Text code>idempotent</Text>). Complements <Text code>/references/http-status-codes</Text>, which covers response codes.</>),
    search: 'Search method, use or example...',
    all: 'All',
    empty: 'No method found. Try a different search or category.',
    resultsOne: 'method found',
    resultsMany: 'methods found',
    whenTitle: 'When to use',
    exampleTitle: 'Example',
    propsTitle: 'Properties',
    successTitle: 'Typical statuses',
    safeProp: 'Safe',
    idemProp: 'Idempotent',
    bodyProp: 'Has body',
    cacheProp: 'Cacheable',
    tipTitle: 'Safe vs. Idempotent',
    tipBody: (<>A method is <Text strong>safe</Text> when it does not change server state (GET, HEAD, OPTIONS, TRACE) — it can be called any number of times with no consequence. A method is <Text strong>idempotent</Text> when calling it N times has the same effect as calling it once (GET, PUT, DELETE). The distinction matters for automatic <Text code>retry</Text>: an idempotent method can be safely repeated after a network timeout; POST (non-idempotent) cannot — repeating it may double a charge or create two records.</>),
    safeYes: 'Yes',
    safeNo: 'No',
  },
}

export default function HttpMethodsPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return METHODS.filter((m) => {
      if (category !== 'all' && m.cat !== category) return false
      if (!q) return true
      return (
        m.method.toLowerCase().includes(q) ||
        m[lang].toLowerCase().includes(q) ||
        m[lang === 'pt' ? 'whenPt' : 'whenEn'].toLowerCase().includes(q) ||
        m.example.toLowerCase().includes(q)
      )
    })
  }, [query, category, lang])

  const resultLabel = filtered.length === 1 ? t.resultsOne : t.resultsMany

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><ReadOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Alert
        type="info"
        showIcon
        icon={<SafetyOutlined />}
        message={t.tipTitle}
        description={t.tipBody}
      />

      <Space direction="vertical" style={{ width: '100%' }}>
        <Input
          prefix={<SearchOutlined />}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.search}
          allowClear
        />
        <Radio.Group value={category} onChange={(e) => setCategory(e.target.value)} optionType="button">
          <Radio.Button value="all">{t.all}</Radio.Button>
          {Object.keys(CAT_COLOR).map((cat) => (
            <Radio.Button key={cat} value={cat}>{CAT_LABEL[cat][lang]}</Radio.Button>
          ))}
        </Radio.Group>
      </Space>

      <Text type="secondary">
        {filtered.length} {resultLabel}
      </Text>

      {filtered.length === 0 ? (
        <Empty description={t.empty} />
      ) : (
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          {filtered.map((m) => (
            <Card key={m.method} size="small">
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <Space wrap align="center">
                  <Text strong style={{ fontSize: 18, fontFamily: 'monospace' }}>{m.method}</Text>
                  <Tag color={CAT_COLOR[m.cat]}>{CAT_LABEL[m.cat][lang]}</Tag>
                </Space>
                <Text>{m[lang]}</Text>
                <Descriptions
                  size="small"
                  column={{ xs: 1, sm: 2 }}
                  items={[
                    { key: 'when', label: t.whenTitle, span: 2, children: <Text type="secondary">{m[lang === 'pt' ? 'whenPt' : 'whenEn']}</Text> },
                    { key: 'example', label: t.exampleTitle, span: 2, children: <Text code>{m.example}</Text> },
                    {
                      key: 'props',
                      label: t.propsTitle,
                      children: (
                        <Space wrap size={[0, 4]}>
                          <Tag color={m.safe ? 'green' : 'red'}>{t.safeProp}: {m.safe ? t.safeYes : t.safeNo}</Tag>
                          <Tag color={m.idempotent ? 'blue' : 'volcano'}>{t.idemProp}: {m.idempotent ? t.safeYes : t.safeNo}</Tag>
                          <Tag color={m.body ? 'purple' : 'default'}>{t.bodyProp}: {m.body ? t.safeYes : t.safeNo}</Tag>
                          <Tag color={m.cacheable ? 'cyan' : 'default'}>{t.cacheProp}: {m.cacheable ? t.safeYes : t.safeNo}</Tag>
                        </Space>
                      ),
                    },
                    { key: 'success', label: t.successTitle, children: <Text code>{m.success.join(', ')}</Text> },
                  ]}
                />
              </Space>
            </Card>
          ))}
        </Space>
      )}
    </Space>
  )
}
