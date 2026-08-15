import React, { useMemo, useState } from 'react'
import {
  Typography,
  Card,
  Space,
  Input,
  Button,
  Radio,
  Alert,
  Tag,
  Statistic,
  Row,
  Col,
  Collapse,
  message,
} from 'antd'
import {
  CodeOutlined,
  CopyOutlined,
  ClearOutlined,
  FormatPainterOutlined,
  CompressOutlined,
  CheckCircleOutlined,
  BugOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import * as gf from '../utils/graphqlFormatter'

const { Title, Paragraph, Text } = Typography

const SOURCE_SNIPPET = Object.values(gf)
  .filter((f) => typeof f === 'function')
  .map((f) => f.toString())
  .join('\n\n')
const { TextArea } = Input

const EXAMPLE_SIMPLE_PT = `query BuscarUsuario($id: ID!) {
  usuario(id: $id) {
    id
    nome
    email
    perfil {
      avatar
      bio
    }
  }
}`

const EXAMPLE_SIMPLE_EN = `query GetUser($id: ID!) {
  user(id: $id) {
    id
    name
    email
    profile {
      avatar
      bio
    }
  }
}`

const EXAMPLE_VARIABLES = `mutation CriarPedido($input: PedidoInput!) {
  criarPedido(input: $input) {
    ok
    pedido {
      id
      total
      itens {
        produto { nome preco }
        quantidade
      }
    }
    erros {
      campo
      mensagem
    }
  }
}`

const EXAMPLE_FRAGMENT = `fragment DadosPessoa on Pessoa {
  nome
  email
  endereco {
    rua
    cidade
  }
}

query Pessoas($limite: Int = 10) {
  pessoas(limit: $limite) {
    ...DadosPessoa
    telefone
  }
}`

const EXAMPLE_INTROSPECTION = `query Introspection {
  __schema {
    queryType { name }
    mutationType { name }
    subscriptionType { name }
    types {
      name
      kind
      fields {
        name
        type { name }
      }
    }
  }
}`

const translations = {
  pt: {
    title: 'GraphQL Formatter & Minifier',
    intro: (
      <>
        Formate, minifique e valide consultas GraphQL 100% no navegador. O parser léxico reconhece
        <Text code>query</Text>, <Text code>mutation</Text>, <Text code>subscription</Text>, fragmentos,
        strings de bloco (<Text code>{'"""..."""'}</Text>), comentários <Text code>#</Text> e variáveis.
        Nenhuma query sai daqui.
      </>
    ),
    inputLabel: 'Query GraphQL',
    inputPlaceholder: 'Cole sua query GraphQL aqui...',
    mode: 'Modo',
    format: 'Formatar',
    minify: 'Minificar',
    validate: 'Validar',
    auto: 'Auto',
    copy: 'Copiar',
    copied: 'Copiado!',
    clear: 'Limpar',
    examples: 'Exemplos rápidos',
    outputLabel: 'Resultado',
    validationOk: 'Sintaxe OK',
    validationError: 'Erro de sintaxe',
    stats: 'Estatísticas',
    tokens: 'tokens',
    operations: 'operações',
    lines: 'linhas',
    chars: 'caracteres',
    noOutput: 'A saída aparece aqui',
    algorithmTitle: 'Algoritmo',
    algorithmDesc: 'O motor é um lexer e reconstrutor em src/utils/graphqlFormatter.js. Ele não depende da biblioteca graphql e roda inteiramente no cliente.',
    sourceTab: 'graphqlFormatter.js',
    exampleSimple: 'Query com variáveis',
    exampleVariables: 'Mutation',
    exampleFragment: 'Fragmentos',
    exampleIntrospection: 'Introspecção',
  },
  en: {
    title: 'GraphQL Formatter & Minifier',
    intro: (
      <>
        Format, minify and validate GraphQL queries 100% in the browser. The lexical parser understands
        <Text code>query</Text>, <Text code>mutation</Text>, <Text code>subscription</Text>, fragments,
        block strings (<Text code>{'"""..."""'}</Text>), <Text code>#</Text> comments and variables.
        No query leaves this page.
      </>
    ),
    inputLabel: 'GraphQL query',
    inputPlaceholder: 'Paste your GraphQL query here...',
    mode: 'Mode',
    format: 'Format',
    minify: 'Minify',
    validate: 'Validate',
    auto: 'Auto',
    copy: 'Copy',
    copied: 'Copied!',
    clear: 'Clear',
    examples: 'Quick examples',
    outputLabel: 'Output',
    validationOk: 'Syntax OK',
    validationError: 'Syntax error',
    stats: 'Statistics',
    tokens: 'tokens',
    operations: 'operations',
    lines: 'lines',
    chars: 'characters',
    noOutput: 'Output will appear here',
    algorithmTitle: 'Algorithm',
    algorithmDesc: 'The engine is a lexer and reconstructor in src/utils/graphqlFormatter.js. It does not depend on the graphql package and runs entirely on the client.',
    sourceTab: 'graphqlFormatter.js',
    exampleSimple: 'Query with variables',
    exampleVariables: 'Mutation',
    exampleFragment: 'Fragments',
    exampleIntrospection: 'Introspection',
  },
}

export default function GraphqlFormatterPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [input, setInput] = useState(() => (lang === 'pt' ? EXAMPLE_SIMPLE_PT : EXAMPLE_SIMPLE_EN))
  const [mode, setMode] = useState('auto') // auto | format | minify | validate

  const processed = useMemo(() => {
    if (!input.trim()) {
      return { ok: true, value: '', stats: { tokens: 0, operations: 0, lines: 0, chars: 0 } }
    }

    if (mode === 'validate') {
      const { valid, errors, tokens } = gf.validateGraphql(input)
      return {
        ok: valid,
        value: valid ? t.validationOk : errors.map((e) => `Line ${e.line}: ${e.message}`).join('\n'),
        stats: { tokens: tokens.length, operations: 0, lines: 0, chars: 0 },
        isValidation: true,
      }
    }

    if (mode === 'minify') {
      const res = gf.minifyGraphql(input)
      return {
        ok: res.ok,
        value: res.value,
        error: res.error,
        line: res.line,
        stats: {
          tokens: res.tokenCount || 0,
          operations: 0,
          lines: res.value.split('\n').length,
          chars: res.value.length,
        },
      }
    }

    // auto ou format
    const res = gf.formatGraphql(input)
    return {
      ok: res.ok,
      value: res.value,
      error: res.error,
      line: res.line,
      stats: {
        tokens: res.tokenCount || 0,
        operations: res.operations?.length || 0,
        lines: res.value.split('\n').length,
        chars: res.value.length,
      },
    }
  }, [input, mode, lang, t.validationOk])

  function copy() {
    navigator.clipboard.writeText(processed.value)
    message.success(t.copied)
  }

  function loadExample(key) {
    const map = {
      exampleSimple: lang === 'pt' ? EXAMPLE_SIMPLE_PT : EXAMPLE_SIMPLE_EN,
      exampleVariables: EXAMPLE_VARIABLES,
      exampleFragment: EXAMPLE_FRAGMENT,
      exampleIntrospection: EXAMPLE_INTROSPECTION,
    }
    setInput(map[key] || '')
    if (mode === 'validate') setMode('auto')
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><CodeOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Space wrap>
            <Text>{t.mode}:</Text>
            <Radio.Group value={mode} onChange={(e) => setMode(e.target.value)} optionType="button">
              <Radio.Button value="auto">{t.auto}</Radio.Button>
              <Radio.Button value="format"><FormatPainterOutlined /> {t.format}</Radio.Button>
              <Radio.Button value="minify"><CompressOutlined /> {t.minify}</Radio.Button>
              <Radio.Button value="validate"><CheckCircleOutlined /> {t.validate}</Radio.Button>
            </Radio.Group>
          </Space>

          <div>
            <Text strong>{t.inputLabel}</Text>
            <TextArea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t.inputPlaceholder}
              autoSize={{ minRows: 6, maxRows: 14 }}
              style={{ fontFamily: 'monospace' }}
            />
          </div>

          <Space wrap>
            <Text strong>{t.examples}:</Text>
            <Button size="small" onClick={() => loadExample('exampleSimple')}>{t.exampleSimple}</Button>
            <Button size="small" onClick={() => loadExample('exampleVariables')}>{t.exampleVariables}</Button>
            <Button size="small" onClick={() => loadExample('exampleFragment')}>{t.exampleFragment}</Button>
            <Button size="small" onClick={() => loadExample('exampleIntrospection')}>{t.exampleIntrospection}</Button>
            <Button size="small" icon={<ClearOutlined />} onClick={() => setInput('')} style={{ marginLeft: 'auto' }}>
              {t.clear}
            </Button>
          </Space>
        </Space>
      </Card>

      <Card
        title={mode === 'validate' ? t.validationOk : t.outputLabel}
        extra={
          <Button
            size="small"
            icon={<CopyOutlined />}
            onClick={copy}
            disabled={!processed.ok || !processed.value}
          >
            {t.copy}
          </Button>
        }
      >
        {processed.ok ? (
          <>
            {processed.isValidation ? (
              <Alert
                type="success"
                showIcon
                icon={<CheckCircleOutlined />}
                message={t.validationOk}
              />
            ) : (
              <pre
                style={{
                  margin: 0,
                  padding: 0,
                  overflowX: 'auto',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  fontFamily: 'monospace',
                  fontSize: 13,
                  lineHeight: 1.6,
                }}
              >
                {processed.value || t.noOutput}
              </pre>
            )}

            {!processed.isValidation && (
              <Row gutter={16} style={{ marginTop: 16 }}>
                <Col><Statistic title={t.tokens} value={processed.stats.tokens} /></Col>
                <Col><Statistic title={t.operations} value={processed.stats.operations} /></Col>
                <Col><Statistic title={t.lines} value={processed.stats.lines} /></Col>
                <Col><Statistic title={t.chars} value={processed.stats.chars} /></Col>
              </Row>
            )}
          </>
        ) : (
          <Alert
            type="error"
            showIcon
            icon={<BugOutlined />}
            message={t.validationError}
            description={processed.line ? `Line ${processed.line}: ${processed.error}` : processed.error}
          />
        )}
      </Card>

      <Card title={t.algorithmTitle}>
        <Paragraph type="secondary">{t.algorithmDesc}</Paragraph>
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
