import React, { useMemo, useState } from 'react'
import { Typography, Card, Space, Input, Alert, Button, Collapse, Tag, Table, Statistic, Row, Col, message } from 'antd'
import { CalculatorOutlined, CopyOutlined, DeleteOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import { generateTruthTable, formatExpression, EXAMPLES } from '../utils/truthTableGenerator'

const { Title, Paragraph, Text } = Typography

const translations = {
  pt: {
    title: 'Gerador de Tabela Verdade',
    intro: 'Escreva uma expressão booleana com variáveis e operadores lógicos para gerar a tabela verdade completa no navegador. Útil para validar lógica de condições, circuitos digitais e provas simples.',
    expressionLabel: 'Expressão booleana',
    expressionPlaceholder: 'Ex: A && (B || !C)',
    examples: 'Exemplos rápidos',
    resultTitle: 'Tabela verdade',
    resultEmpty: 'Digite uma expressão válida para ver a tabela.',
    errorEmpty: 'Digite uma expressão para começar.',
    variables: 'Variáveis',
    rows: 'Linhas',
    tautology: 'Tautologia',
    contradiction: 'Contradição',
    contingency: 'Contingência',
    tautologyDesc: 'A expressão é verdadeira para todas as combinações.',
    contradictionDesc: 'A expressão é falsa para todas as combinações.',
    contingencyDesc: 'A expressão pode ser verdadeira ou falsa.',
    copy: 'Copiar',
    copied: 'Copiado!',
    copyError: 'Não foi possível copiar',
    clear: 'Limpar',
    operatorsReference: 'Operadores suportados',
    operatorAnd: 'E / AND',
    operatorOr: 'OU / OR',
    operatorNot: 'NÃO / NOT',
    operatorXor: 'OU exclusivo',
    operatorImplies: 'Implicação',
    operatorIff: 'Bicondicional',
    sourceTitle: 'Código-fonte — parser e avaliador',
    sourceBody: 'O motor em src/utils/truthTableGenerator.js tokeniza a expressão, converte para notação pós-fixa (shunting-yard) e avalia cada linha da tabela a partir das combinações de valores das variáveis.',
    columnResult: 'Resultado',
  },
  en: {
    title: 'Truth Table Generator',
    intro: 'Type a boolean expression with variables and logical operators to generate the full truth table in the browser. Useful for validating condition logic, digital circuits, and simple proofs.',
    expressionLabel: 'Boolean expression',
    expressionPlaceholder: 'E.g. A && (B || !C)',
    examples: 'Quick examples',
    resultTitle: 'Truth table',
    resultEmpty: 'Type a valid expression to see the table.',
    errorEmpty: 'Please enter an expression to get started.',
    variables: 'Variables',
    rows: 'Rows',
    tautology: 'Tautology',
    contradiction: 'Contradiction',
    contingency: 'Contingency',
    tautologyDesc: 'The expression is true for every combination.',
    contradictionDesc: 'The expression is false for every combination.',
    contingencyDesc: 'The expression may be true or false.',
    copy: 'Copy',
    copied: 'Copied!',
    copyError: 'Could not copy',
    clear: 'Clear',
    operatorsReference: 'Supported operators',
    operatorAnd: 'AND',
    operatorOr: 'OR',
    operatorNot: 'NOT',
    operatorXor: 'Exclusive OR',
    operatorImplies: 'Implication',
    operatorIff: 'Biconditional',
    sourceTitle: 'Source code — parser and evaluator',
    sourceBody: 'The engine in src/utils/truthTableGenerator.js tokenizes the expression, converts it to postfix notation (shunting-yard), and evaluates each table row from the variable value combinations.',
    columnResult: 'Result',
  },
}

const OPERATORS = [
  { symbol: '&& / ∧', nameKey: 'operatorAnd', example: 'A && B' },
  { symbol: '|| / ∨', nameKey: 'operatorOr', example: 'A || B' },
  { symbol: '! / ¬ / ~', nameKey: 'operatorNot', example: '!A' },
  { symbol: '^ / ⊕', nameKey: 'operatorXor', example: 'A ^ B' },
  { symbol: '=> / →', nameKey: 'operatorImplies', example: 'A => B' },
  { symbol: '<=> / ↔', nameKey: 'operatorIff', example: 'A <=> B' },
]

export default function TruthTableGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [input, setInput] = useState('')

  const tableResult = useMemo(() => {
    if (!input.trim()) return { data: null, error: '' }
    try {
      const data = generateTruthTable(input)
      return { data, error: '' }
    } catch (err) {
      return { data: null, error: err.message }
    }
  }, [input])

  const copyMarkdown = async () => {
    if (!tableResult.data) return
    const { variables, rows } = tableResult.data
    const headers = [...variables, t.columnResult]
    const lines = [
      '| ' + headers.join(' | ') + ' |',
      '| ' + headers.map(() => '---').join(' | ') + ' |',
      ...rows.map((r) => '| ' + [...variables.map((v) => (r.values[v] ? '1' : '0')), r.result ? '1' : '0'].join(' | ') + ' |'),
    ]
    try {
      await navigator.clipboard.writeText(lines.join('\n'))
      message.success(t.copied)
    } catch {
      message.error(t.copyError)
    }
  }

  const applyExample = (expression) => {
    setInput(expression)
  }

  const columns = useMemo(() => {
    if (!tableResult.data) return []
    const vars = tableResult.data.variables
    return [
      ...vars.map((v) => ({
        title: <Text code>{v}</Text>,
        dataIndex: v,
        key: v,
        align: 'center',
        render: (value) => (value ? <Tag color="blue">1</Tag> : <Tag color="default">0</Tag>),
      })),
      {
        title: <Text strong>{t.columnResult}</Text>,
        dataIndex: 'result',
        key: 'result',
        align: 'center',
        render: (value) => (value
          ? <Tag color="green" icon={<CheckCircleOutlined />}>1</Tag>
          : <Tag color="red" icon={<CloseCircleOutlined />}>0</Tag>),
      },
    ]
  }, [tableResult.data, t.columnResult])

  const dataSource = useMemo(() => {
    if (!tableResult.data) return []
    return tableResult.data.rows.map((r, idx) => ({
      key: idx,
      result: r.result,
      ...r.values,
    }))
  }, [tableResult.data])

  const classification = useMemo(() => {
    if (!tableResult.data) return null
    const { isTautology, isContradiction } = tableResult.data
    if (isTautology) return { label: t.tautology, desc: t.tautologyDesc, color: 'green' }
    if (isContradiction) return { label: t.contradiction, desc: t.contradictionDesc, color: 'red' }
    return { label: t.contingency, desc: t.contingencyDesc, color: 'blue' }
  }, [tableResult.data, t])

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><CalculatorOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card>
        <Space direction="vertical" size={8} style={{ width: '100%' }}>
          <Text type="secondary">{t.expressionLabel}</Text>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t.expressionPlaceholder}
            style={{ fontFamily: 'monospace' }}
            allowClear
          />
          <Space wrap style={{ marginTop: 4 }}>
            {t.examples}:&nbsp;
            {EXAMPLES.map((ex) => (
              <Tag
                key={ex.key}
                color="processing"
                style={{ cursor: 'pointer', marginInlineEnd: 0 }}
                onClick={() => applyExample(ex.expression)}
              >
                <Text code style={{ color: 'inherit' }}>{ex[lang]}</Text>
              </Tag>
            ))}
          </Space>
        </Space>
      </Card>

      {tableResult.error && <Alert type="error" showIcon message={tableResult.error} />}

      {tableResult.data && (
        <>
          <Row gutter={[16, 16]}>
            <Col xs={12} sm={8} md={6}>
              <Card>
                <Statistic title={t.variables} value={tableResult.data.variables.length} />
              </Card>
            </Col>
            <Col xs={12} sm={8} md={6}>
              <Card>
                <Statistic title={t.rows} value={tableResult.data.total} />
              </Card>
            </Col>
            <Col xs={24} sm={8} md={12}>
              <Card>
                <Space align="center">
                  <Tag color={classification.color} style={{ fontSize: 14, padding: '4px 10px' }}>
                    {classification.label}
                  </Tag>
                  <Text type="secondary">{classification.desc}</Text>
                </Space>
              </Card>
            </Col>
          </Row>

          <Card
            title={(
              <Space>
                {t.resultTitle}
                {input && (
                  <Text code style={{ fontSize: 13 }}>
                    {formatExpression(input)}
                  </Text>
                )}
              </Space>
            )}
            extra={(
              <Space>
                <Button
                  size="small"
                  icon={<CopyOutlined />}
                  onClick={copyMarkdown}
                  disabled={dataSource.length === 0}
                >
                  {t.copy}
                </Button>
                <Button
                  size="small"
                  icon={<DeleteOutlined />}
                  onClick={() => setInput('')}
                >
                  {t.clear}
                </Button>
              </Space>
            )}
          >
            <Table
              columns={columns}
              dataSource={dataSource}
              pagination={false}
              size="small"
              bordered
              scroll={{ x: 'max-content' }}
            />
          </Card>
        </>
      )}

      {!tableResult.data && !tableResult.error && (
        <Alert type="info" showIcon message={t.errorEmpty} />
      )}

      <Card title={t.operatorsReference}>
        <Row gutter={[8, 8]}>
          {OPERATORS.map((op) => (
            <Col xs={24} sm={12} md={8} key={op.nameKey}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 12px',
                  border: '1px solid #f0f0f0',
                  borderRadius: 6,
                  background: '#fafafa',
                }}
              >
                <div>
                  <Text strong code>{op.symbol}</Text>
                  <div><Text type="secondary" style={{ fontSize: 12 }}>{t[op.nameKey]}</Text></div>
                </div>
                <Text code style={{ fontSize: 12 }}>{op.example}</Text>
              </div>
            </Col>
          ))}
        </Row>
      </Card>

      <Collapse
        items={[
          {
            key: 'source',
            label: t.sourceTitle,
            children: (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Paragraph type="secondary">{t.sourceBody}</Paragraph>
                <pre style={{ margin: 0, overflowX: 'auto', maxHeight: 320 }}>
                  <code>{generateTruthTable.toString()}</code>
                </pre>
              </Space>
            ),
          },
        ]}
      />
    </Space>
  )
}
