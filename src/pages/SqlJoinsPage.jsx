import React, { useMemo, useState } from 'react'
import {
  Typography,
  Card,
  Space,
  Select,
  Table,
  Tag,
  Row,
  Col,
  Collapse,
  Button,
  message,
} from 'antd'
import {
  ReadOutlined,
  CopyOutlined,
  DatabaseOutlined,
  NodeIndexOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  JOIN_TYPES,
  DEFAULT_EMPLOYEES,
  DEFAULT_DEPARTMENTS,
  executeJoin,
  buildSql,
  getJoinDescription,
} from '../utils/sqlJoins'

const { Title, Paragraph, Text } = Typography
const { Panel } = Collapse

const translations = {
  pt: {
    title: 'Visualizador de SQL JOINs',
    intro:
      'Entenda na prática como cada tipo de JOIN combina linhas entre tabelas. Escolha o JOIN, veja o diagrama de Venn, o resultado em tempo real e a query SQL equivalente.',
    chooseJoin: 'Tipo de JOIN',
    employees: 'employees',
    departments: 'departments',
    result: 'Resultado do JOIN',
    rows: 'linhas',
    query: 'Query SQL equivalente',
    description: 'O que esse JOIN faz?',
    source: 'Código-fonte do motor',
    sourceNote:
      'O algoritmo acima é 100% client-side e reproduz o comportamento relacional básico: NULL não é igual a NULL, LEFT preserva todas as linhas da esquerda, RIGHT preserva todas as da direita, FULL OUTER combina ambos e CROSS faz o produto cartesiano.',
    copied: 'Copiado!',
    vennA: 'A (employees)',
    vennB: 'B (departments)',
  },
  en: {
    title: 'SQL JOIN Visualizer',
    intro:
      'See in practice how each JOIN type combines rows between tables. Choose the JOIN, view the Venn diagram, the live result, and the equivalent SQL query.',
    chooseJoin: 'JOIN type',
    employees: 'employees',
    departments: 'departments',
    result: 'JOIN result',
    rows: 'rows',
    query: 'Equivalent SQL query',
    description: 'What does this JOIN do?',
    source: 'Engine source code',
    sourceNote:
      'The algorithm above is 100% client-side and reproduces basic relational behavior: NULL is not equal to NULL, LEFT keeps every left row, RIGHT keeps every right row, FULL OUTER combines both, and CROSS produces the Cartesian product.',
    copied: 'Copied!',
    vennA: 'A (employees)',
    vennB: 'B (departments)',
  },
}

const SOURCE_CODE = `// src/utils/sqlJoins.js — motor de JOINs relacional em memória

function matches(aVal, bVal) {
  // SQL: NULL = NULL é UNKNOWN (não faz match)
  if (aVal == null || bVal == null) return false
  return aVal === bVal
}

function merge(leftRow, rightRow, leftPrefix, rightPrefix) {
  const out = {}
  if (leftRow) {
    for (const [k, v] of Object.entries(leftRow)) out[\`\${leftPrefix}.\${k}\`] = v
  }
  if (rightRow) {
    for (const [k, v] of Object.entries(rightRow)) out[\`\${rightPrefix}.\${k}\`] = v
  }
  return out
}

export function innerJoin(a, b, leftKey, rightKey) {
  const out = []
  for (const left of a) {
    for (const right of b) {
      if (matches(left[leftKey], right[rightKey])) {
        out.push(merge(left, right, 'e', 'd'))
      }
    }
  }
  return out
}

export function leftJoin(a, b, leftKey, rightKey) {
  const out = []
  for (const left of a) {
    let matched = false
    for (const right of b) {
      if (matches(left[leftKey], right[rightKey])) {
        out.push(merge(left, right, 'e', 'd'))
        matched = true
      }
    }
    if (!matched) out.push(merge(left, null, 'e', 'd'))
  }
  return out
}

export function rightJoin(a, b, leftKey, rightKey) {
  // Implementado como LEFT JOIN invertido
  return leftJoin(b, a, rightKey, leftKey)
}

export function fullOuterJoin(a, b, leftKey, rightKey) {
  const left = leftJoin(a, b, leftKey, rightKey)
  const matchedRight = new Set()
  for (const leftRow of left) {
    for (const [i, right] of b.entries()) {
      let allMatch = true
      for (const k of Object.keys(right)) {
        if (leftRow[\`d.\${k}\`] !== right[k]) {
          allMatch = false
          break
        }
      }
      if (allMatch) matchedRight.add(i)
    }
  }
  const out = [...left]
  for (const [i, right] of b.entries()) {
    if (!matchedRight.has(i)) out.push(merge(null, right, 'e', 'd'))
  }
  return out
}

export function crossJoin(a, b) {
  const out = []
  for (const left of a) {
    for (const right of b) {
      out.push(merge(left, right, 'e', 'd'))
    }
  }
  return out
}

export function selfJoin(rows, childKey, parentKey) {
  const out = []
  for (const child of rows) {
    for (const parent of rows) {
      if (matches(child[childKey], parent[parentKey])) {
        out.push(merge(child, parent, 'emp', 'mgr'))
      }
    }
  }
  return out
}`

function buildColumns(keys, prefix) {
  return keys.map((k) => ({
    title: prefix ? `${prefix}.${k}` : k,
    dataIndex: prefix ? `${prefix}.${k}` : k,
    key: prefix ? `${prefix}.${k}` : k,
    render: (v) => (v == null ? <Text type="secondary">NULL</Text> : String(v)),
  }))
}

function VennDiagram({ type, t }) {
  const isSelf = type === 'self'
  const aFill = {
    inner: 'url(#inner)',
    left: '#1890ff',
    right: 'transparent',
    full: 'url(#inner)',
    cross: 'url(#inner)',
    self: '#1890ff',
  }[type]
  const bFill = {
    inner: 'url(#inner)',
    left: 'transparent',
    right: '#fa8c16',
    full: 'url(#inner)',
    cross: 'url(#inner)',
    self: 'transparent',
  }[type]

  return (
    <svg
      viewBox="0 0 280 160"
      style={{ width: '100%', maxWidth: 360, height: 'auto', display: 'block' }}
      aria-label="Venn diagram"
    >
      <defs>
        <pattern id="inner" patternUnits="userSpaceOnUse" width="8" height="8">
          <rect width="8" height="8" fill="#40a9ff" fillOpacity="0.35" />
          <line x1="0" y1="0" x2="8" y2="8" stroke="#096dd9" strokeWidth="1" />
        </pattern>
      </defs>
      {!isSelf ? (
        <g>
          <circle
            cx="105"
            cy="80"
            r="65"
            fill={aFill}
            fillOpacity={aFill === '#1890ff' ? 0.25 : undefined}
            stroke="#1890ff"
            strokeWidth="2"
          />
          <circle
            cx="175"
            cy="80"
            r="65"
            fill={bFill}
            fillOpacity={bFill === '#fa8c16' ? 0.25 : undefined}
            stroke="#fa8c16"
            strokeWidth="2"
          />
          <text x="75" y="145" fill="#1890ff" fontSize="12" fontWeight="600">
            {t.vennA}
          </text>
          <text x="165" y="145" fill="#fa8c16" fontSize="12" fontWeight="600">
            {t.vennB}
          </text>
        </g>
      ) : (
        <g>
          <circle
            cx="140"
            cy="80"
            r="55"
            fill="#1890ff"
            fillOpacity="0.15"
            stroke="#1890ff"
            strokeWidth="2"
          />
          <path
            d="M 140 30 Q 190 30 190 80 Q 190 130 140 130"
            fill="none"
            stroke="#1890ff"
            strokeWidth="2"
            strokeDasharray="4 4"
            markerEnd="url(#arrow)"
          />
          <defs>
            <marker id="arrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto">
              <path d="M0,0 L0,6 L9,3 z" fill="#1890ff" />
            </marker>
          </defs>
          <text x="105" y="90" fill="#1890ff" fontSize="12" fontWeight="600">
            employees → employees
          </text>
        </g>
      )}
    </svg>
  )
}

export default function SqlJoinsPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [joinType, setJoinType] = useState('inner')

  const result = useMemo(
    () => executeJoin(joinType, DEFAULT_EMPLOYEES, DEFAULT_DEPARTMENTS),
    [joinType]
  )

  const resultKeys = useMemo(
    () => (result.length > 0 ? Object.keys(result[0]) : []),
    [result]
  )

  const resultColumns = useMemo(
    () =>
      resultKeys.map((k) => ({
        title: k,
        dataIndex: k,
        key: k,
        render: (v) => (v == null ? <Text type="secondary">NULL</Text> : String(v)),
      })),
    [resultKeys]
  )

  const employeeColumns = useMemo(
    () => buildColumns(['id', 'name', 'department_id', 'manager_id']),
    []
  )
  const departmentColumns = useMemo(() => buildColumns(['id', 'name']), [])

  const sql = useMemo(() => buildSql(joinType), [joinType])

  const joinOptions = JOIN_TYPES.map((j) => ({
    label: lang === 'pt' ? j.labelPt : j.labelEn,
    value: j.key,
  }))

  const copySql = () => {
    navigator.clipboard.writeText(sql)
    message.success(t.copied)
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}>
        <ReadOutlined /> {t.title}
      </Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Text strong>{t.chooseJoin}</Text>
          <Select
            value={joinType}
            onChange={setJoinType}
            options={joinOptions}
            style={{ minWidth: 220 }}
          />
        </Space>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title={<><DatabaseOutlined /> {t.employees}</>} size="small">
            <Table
              dataSource={DEFAULT_EMPLOYEES}
              columns={employeeColumns}
              rowKey="id"
              pagination={false}
              size="small"
              bordered
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title={<><DatabaseOutlined /> {t.departments}</>} size="small">
            <Table
              dataSource={DEFAULT_DEPARTMENTS}
              columns={departmentColumns}
              rowKey="id"
              pagination={false}
              size="small"
              bordered
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={10} lg={8}>
          <Card title={<><NodeIndexOutlined /> Venn</>} size="small">
            <VennDiagram type={joinType} t={t} />
          </Card>
        </Col>
        <Col xs={24} md={14} lg={16}>
          <Card
            title={
              <Space>
                <span>{t.result}</span>
                <Tag color="blue">
                  {result.length} {t.rows}
                </Tag>
              </Space>
            }
            size="small"
          >
            <Table
              dataSource={result}
              columns={resultColumns}
              rowKey={(_, idx) => idx}
              pagination={false}
              size="small"
              bordered
              locale={{ emptyText: '—' }}
              scroll={{ x: 'max-content' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title={t.description} size="small">
            <Paragraph style={{ margin: 0 }}>
              {getJoinDescription(joinType, lang)}
            </Paragraph>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space style={{ justifyContent: 'space-between', width: '100%' }}>
                <span>{t.query}</span>
                <Button size="small" icon={<CopyOutlined />} onClick={copySql}>
                  Copy
                </Button>
              </Space>
            }
            size="small"
          >
            <pre style={{ margin: 0, overflow: 'auto' }}>
              <code>{sql}</code>
            </pre>
          </Card>
        </Col>
      </Row>

      <Collapse ghost>
        <Panel header={t.source} key="source">
          <Paragraph>{t.sourceNote}</Paragraph>
          <pre style={{ overflow: 'auto', maxHeight: 480 }}>
            <code>{SOURCE_CODE}</code>
          </pre>
        </Panel>
      </Collapse>
    </Space>
  )
}
