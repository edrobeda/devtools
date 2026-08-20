import React, { useMemo, useState } from 'react'
import {
  Typography,
  Card,
  Space,
  Input,
  Table,
  Tag,
  Alert,
  Button,
  Select,
  Collapse,
  message,
  Tooltip,
} from 'antd'
import {
  ApartmentOutlined,
  CopyOutlined,
  SearchOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  XPATH_SAMPLES,
  evaluateXpath,
  parseNamespaceLines,
  buildResolver,
  parseXml,
  getEngineSource,
} from '../utils/xpathTester'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input

const translations = {
  pt: {
    title: 'XPath Tester',
    intro: (
      <>
        Testa expressões <Text code>XPath 1.0</Text> contra um documento XML
        colado — útil pra SOAP, SAML, configs, feed RSS e qualquer XML que
        você precise garimpar. A avaliação usa o{' '}
        <Text code>document.evaluate</Text> nativo do navegador, com suporte
        a namespaces via resolver. Tudo roda localmente.
      </>
    ),
    sampleLabel: 'Exemplo',
    xmlLabel: 'Documento XML',
    nsLabel: 'Namespaces (prefixo=uri por linha)',
    nsPlaceholder: 'ex.: soap=http://schemas.xmlsoap.org/soap/envelope/\nsaml=urn:oasis:names:tc:SAML:2.0:assertion',
    xpathLabel: 'Expressão XPath',
    xpathPlaceholder: '/catalogo/livro[@preco > 30]',
    invalidXml: 'XML inválido',
    invalidXpath: 'Expressão inválida',
    nsError: 'Linhas de namespace ignoradas',
    nsErrMsg: {
      badformat: 'formato esperado: prefixo=uri (ex.: soap=http://schemas.xmlsoap.org/soap/envelope/)',
      emptyuri: 'URI vazia',
    },
    nodeType: { element: 'elemento', attribute: 'atributo', text: 'texto' },
    col: {
      path: 'Caminho',
      node: 'Nó',
      preview: 'Conteúdo',
    },
    scalarTitle: 'Resultado',
    scalarType: { number: 'número', string: 'string', boolean: 'booleano' },
    copy: 'Copiar',
    copied: 'Copiado!',
    copyError: 'Não foi possível copiar',
    noNodes: 'Nenhum nó corresponde à expressão.',
    matches: (n) => `${n} ${n === 1 ? 'nó encontrado' : 'nós encontrados'}`,
    refTitle: 'Sintaxe XPath 1.0 rápida',
    refTipTitle: 'Por que namespaces podem "frustrar"',
    refTipBody: (
      <>
        Expressões com prefixo (<Text code>//saml:Assertion</Text>) só
        funcionam se o prefixo estiver registrado no bloco de namespaces
        abaixo. Expressões sem prefixo ({' '}
        <Text code>//Assertion</Text>) NÃO casam com elementos que moram num{' '}
        <Text code>xmlns</Text> padrão — nesse caso use{' '}
        <Text code>local-name()</Text>, ex.:{' '}
        <Text code>//*[local-name()="Assertion"]</Text>.
      </>
    ),
    refRows: [
      { syntax: '/a/b', desc: 'Caminho absoluto da raiz' },
      { syntax: 'a/b', desc: 'Caminho relativo (filhos a partir do contexto)' },
      { syntax: '//a', desc: 'Qualquer <a> em qualquer profundidade' },
      { syntax: '.', desc: 'Nó de contexto atual' },
      { syntax: '..', desc: 'Elemento pai' },
      { syntax: '@attr', desc: 'Atributo do nó de contexto' },
      { syntax: '[@attr="x"]', desc: 'Predicado filtrando por atributo' },
      { syntax: '[position()<3]', desc: 'Predicado por posição (XPath é 1-based)' },
      { syntax: '[a/b="v"]', desc: 'Predicado aninhado com condição' },
      { syntax: 'text()', desc: 'Nós de texto do elemento' },
      { syntax: '*', desc: 'Qualquer elemento' },
      { syntax: '|', desc: 'União de caminhos' },
      { syntax: 'count(//a)', desc: 'Quantos nós o caminho casa' },
      { syntax: 'string(//a)', desc: 'Valor em string do primeiro nó' },
      { syntax: 'boolean(//a)', desc: 'Existe algum nó?' },
      { syntax: 'local-name()', desc: 'Nome sem prefixo (ignora namespace)' },
      { syntax: 'contains(., "x")', desc: 'Conteúdo contém o texto' },
      { syntax: 'starts-with(@id, "ab")', desc: 'Atributo começa com' },
      { syntax: 'concat(a, b)', desc: 'Concatena valores' },
      { syntax: 'number(a) + 1', desc: 'Aritmética sobre valores' },
    ],
    source: 'Código-fonte do motor',
  },
  en: {
    title: 'XPath Tester',
    intro: (
      <>
        Test <Text code>XPath 1.0</Text> expressions against pasted XML —
        handy for SOAP, SAML, config files, RSS feeds and any XML you need to
        dig through. Evaluation uses the browser&apos;s native{' '}
        <Text code>document.evaluate</Text>, with namespace support through a
        resolver. Everything runs locally.
      </>
    ),
    sampleLabel: 'Sample',
    xmlLabel: 'XML document',
    nsLabel: 'Namespaces (prefix=uri per line)',
    nsPlaceholder: 'e.g.: soap=http://schemas.xmlsoap.org/soap/envelope/\nsaml=urn:oasis:names:tc:SAML:2.0:assertion',
    xpathLabel: 'XPath expression',
    xpathPlaceholder: '/catalog/book[@price > 30]',
    invalidXml: 'Invalid XML',
    invalidXpath: 'Invalid expression',
    nsError: 'Namespace lines ignored',
    nsErrMsg: {
      badformat: 'expected format: prefix=uri (e.g.: soap=http://schemas.xmlsoap.org/soap/envelope/)',
      emptyuri: 'Empty URI',
    },
    nodeType: { element: 'element', attribute: 'attribute', text: 'text' },
    col: {
      path: 'Path',
      node: 'Node',
      preview: 'Content',
    },
    scalarTitle: 'Result',
    scalarType: { number: 'number', string: 'string', boolean: 'boolean' },
    copy: 'Copy',
    copied: 'Copied!',
    copyError: 'Could not copy',
    noNodes: 'No nodes match the expression.',
    matches: (n) => `${n} ${n === 1 ? 'node found' : 'nodes found'}`,
    refTitle: 'Quick XPath 1.0 syntax',
    refTipTitle: 'Why namespaces can trip you up',
    refTipBody: (
      <>
        Prefixed expressions (<Text code>//saml:Assertion</Text>) only work if
        the prefix is registered in the namespace box below. Unprefixed
        expressions (<Text code>//Assertion</Text>) do NOT match elements
        living under a default <Text code>xmlns</Text> — use{' '}
        <Text code>local-name()</Text> instead, e.g.{' '}
        <Text code>//*[local-name()="Assertion"]</Text>.
      </>
    ),
    refRows: [
      { syntax: '/a/b', desc: 'Absolute path from the root' },
      { syntax: 'a/b', desc: 'Relative path (children from context)' },
      { syntax: '//a', desc: 'Any <a> at any depth' },
      { syntax: '.', desc: 'Current context node' },
      { syntax: '..', desc: 'Parent element' },
      { syntax: '@attr', desc: 'Attribute of the context node' },
      { syntax: '[@attr="x"]', desc: 'Predicate filtering by attribute' },
      { syntax: '[position()<3]', desc: 'Position predicate (XPath is 1-based)' },
      { syntax: '[a/b="v"]', desc: 'Nested predicate with condition' },
      { syntax: 'text()', desc: 'Text nodes of the element' },
      { syntax: '*', desc: 'Any element' },
      { syntax: '|', desc: 'Union of paths' },
      { syntax: 'count(//a)', desc: 'How many nodes the path matches' },
      { syntax: 'string(//a)', desc: 'String value of the first node' },
      { syntax: 'boolean(//a)', desc: 'Does any node exist?' },
      { syntax: 'local-name()', desc: 'Name without prefix (ignores namespace)' },
      { syntax: 'contains(., "x")', desc: 'Content contains the text' },
      { syntax: 'starts-with(@id, "ab")', desc: 'Attribute starts with' },
      { syntax: 'concat(a, b)', desc: 'Concatenate values' },
      { syntax: 'number(a) + 1', desc: 'Arithmetic on values' },
    ],
    source: 'Engine source code',
  },
}

export default function XPathTesterPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [messageApi, messageContextHolder] = message.useMessage()

  const [sample, setSample] = useState('saml')
  const [xml, setXml] = useState(XPATH_SAMPLES[0].xml)
  const [nsText, setNsText] = useState(XPATH_SAMPLES[0].ns)
  const [xpath, setXpath] = useState(XPATH_SAMPLES[0].xpath)

  const parsedNs = useMemo(() => parseNamespaceLines(nsText), [nsText])
  const resolver = useMemo(() => buildResolver(parsedNs.map), [parsedNs])

  const parsedDoc = useMemo(() => parseXml(xml), [xml])

  const result = useMemo(() => {
    if (!parsedDoc.ok) return { ok: false, error: parsedDoc.error, errorKind: 'xml' }
    if (!xpath.trim()) return { ok: true, empty: true }
    const r = evaluateXpath(parsedDoc.doc, xpath, resolver)
    return r
  }, [parsedDoc, xpath, resolver])

  function applySample(key) {
    const s = XPATH_SAMPLES.find((x) => x.key === key)
    if (!s) return
    setSample(key)
    setXml(s.xml)
    setNsText(s.ns)
    setXpath(s.xpath)
  }

  function copy(value) {
    navigator.clipboard
      .writeText(value)
      .then(() => messageApi.success(t.copied))
      .catch(() => messageApi.error(t.copyError))
  }

  const columns = [
    {
      title: t.col.path,
      dataIndex: 'path',
      key: 'path',
      render: (v) => <Text code>{v}</Text>,
    },
    {
      title: t.col.node,
      dataIndex: 'nodeType',
      key: 'nodeType',
      width: 90,
      render: (v) => <Tag color={v === 'element' ? 'geekblue' : v === 'attribute' ? 'purple' : 'default'}>{t.nodeType[v]}</Tag>,
    },
    {
      title: t.col.preview,
      dataIndex: 'preview',
      key: 'preview',
      ellipsis: true,
      render: (v) => (v ? <Text>{v}</Text> : <Text type="secondary">—</Text>),
    },
    {
      title: '',
      key: 'copy',
      width: 48,
      render: (_, row) => (
        <Tooltip title={t.copy}>
          <Button size="small" type="text" icon={<CopyOutlined />} onClick={() => copy(row.xml)} />
        </Tooltip>
      ),
    },
  ]

  const nodeRows = result.ok && result.kind === 'nodes' ? result.nodes.map((n, i) => ({ ...n, key: i })) : []

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {messageContextHolder}
      <Title level={2}>
        <ApartmentOutlined /> {t.title}
      </Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Space wrap align="center">
            <Text strong>{t.sampleLabel}</Text>
            <Select
              value={sample}
              onChange={applySample}
              options={XPATH_SAMPLES.map((s) => ({ value: s.key, label: s.label }))}
              style={{ minWidth: 180 }}
            />
          </Space>
          <div>
            <Text strong>{t.xmlLabel}</Text>
            <TextArea
              value={xml}
              onChange={(e) => setXml(e.target.value)}
              autoSize={{ minRows: 10, maxRows: 22 }}
              style={{ fontFamily: 'monospace', marginTop: 4 }}
            />
            {result.errorKind === 'xml' && (
              <Alert style={{ marginTop: 8 }} type="error" showIcon message={t.invalidXml} description={result.error} />
            )}
          </div>
          <div>
            <Text strong>{t.nsLabel}</Text>
            <TextArea
              value={nsText}
              onChange={(e) => setNsText(e.target.value)}
              autoSize={{ minRows: 2, maxRows: 5 }}
              placeholder={t.nsPlaceholder}
              style={{ fontFamily: 'monospace', marginTop: 4 }}
            />
            {parsedNs.errors.length > 0 && (
              <Alert
                style={{ marginTop: 8 }}
                type="warning"
                showIcon
                message={t.nsError}
                description={parsedNs.errors.map((e) => `${t.nsErrMsg[e.code]} · linha ${e.line}: ${e.text}`).join(' · ')}
              />
            )}
          </div>
          <Input
              value={xpath}
              onChange={(e) => setXpath(e.target.value)}
              prefix={<SearchOutlined />}
              placeholder={t.xpathPlaceholder}
              style={{ fontFamily: 'monospace' }}
              allowClear
            />
        </Space>
      </Card>

      {result.empty ? null : !result.ok ? (
        result.errorKind !== 'xml' && (
          <Alert type="error" showIcon message={t.invalidXpath} description={result.error} />
        )
      ) : result.kind === 'scalar' ? (
        <Card title={t.scalarTitle}>
          <Space wrap align="center">
            <Tag color="gold">{t.scalarType[result.scalarType]}</Tag>
            <Text code style={{ fontSize: 16 }}>
              {result.scalarType === 'boolean'
                ? String(result.value)
                : result.scalarType === 'number'
                  ? String(result.value)
                  : result.value}
            </Text>
            <Button size="small" icon={<CopyOutlined />} onClick={() => copy(String(result.value))}>
              {t.copy}
            </Button>
          </Space>
        </Card>
      ) : (
        <Card title={t.matches(result.count)}>
          {result.count === 0 ? (
            <Text type="secondary">{t.noNodes}</Text>
          ) : (
            <Table
              columns={columns}
              dataSource={nodeRows}
              pagination={result.count > 10 ? { pageSize: 10 } : false}
              size="small"
            />
          )}
        </Card>
      )}

      <Card title={t.refTitle}>
        <Alert type="info" showIcon message={t.refTipTitle} description={t.refTipBody} style={{ marginBottom: 12 }} />
        <Table
          columns={[
            { title: 'XPath', dataIndex: 'syntax', key: 'syntax', render: (v) => <Text code>{v}</Text> },
            { title: '', dataIndex: 'desc', key: 'desc' },
          ]}
          dataSource={t.refRows.map((r, i) => ({ ...r, key: i }))}
          pagination={false}
          size="small"
          showHeader={false}
        />
      </Card>

      <Collapse
        items={[
          {
            key: 'source',
            label: t.source,
            children: (
              <pre style={{ margin: 0, overflowX: 'auto' }}>
                <code>{getEngineSource()}</code>
              </pre>
            ),
          },
        ]}
      />
    </Space>
  )
}