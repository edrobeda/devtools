import React, { useMemo, useState } from 'react'
import {
  Typography,
  Card,
  Space,
  Button,
  InputNumber,
  Select,
  List,
  Alert,
  Tag,
  Row,
  Col,
} from 'antd'
import {
  CodeOutlined,
  StepBackwardOutlined,
  StepForwardOutlined,
  LeftOutlined,
  RightOutlined,
} from '@ant-design/icons'
import usePagination from '../hooks/usePagination'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography
const { Option } = Select

const sourceCode = `import { useCallback, useMemo, useState } from 'react'

export default function usePagination(items, options = {}) {
  const { pageSize = 10, initialPage = 1 } = options

  const [page, setPage] = useState(initialPage)

  const totalItems = items.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))

  // Garante que a página atual nunca fique fora dos limites quando
  // os dados mudam (ex.: filtro reduzindo o total de itens).
  const safePage = Math.min(Math.max(1, page), totalPages)

  const startIndex = (safePage - 1) * pageSize

  const pageItems = useMemo(
    () => items.slice(startIndex, startIndex + pageSize),
    [items, startIndex, pageSize]
  )

  const canNext = safePage < totalPages
  const canPrev = safePage > 1

  const goTo = useCallback(
    (next) => {
      setPage((current) => {
        const resolved = typeof next === 'function' ? next(current) : next
        return Math.min(Math.max(1, resolved), totalPages)
      })
    },
    [totalPages]
  )

  const nextPage = useCallback(() => goTo((p) => p + 1), [goTo])
  const prevPage = useCallback(() => goTo((p) => p - 1), [goTo])
  const firstPage = useCallback(() => goTo(1), [goTo])
  const lastPage = useCallback(() => goTo(totalPages), [goTo, totalPages])

  return {
    page: safePage,
    pageSize,
    totalItems,
    totalPages,
    pageItems,
    canNext,
    canPrev,
    setPage: goTo,
    nextPage,
    prevPage,
    firstPage,
    lastPage,
  }
}`

const translations = {
  pt: {
    title: 'Snippet: usePagination',
    intro: (
      <>
        Hook utilitário para paginar arrays no React. Recebe uma lista de itens
        e opções de <Text code>pageSize</Text> / <Text code>initialPage</Text>, e
        devolve a página atual, os itens visíveis, o total de páginas e funções
        de navegação. Ideal para tabelas, listas e cards paginados sem depender
        de bibliotecas externas.
      </>
    ),
    sourceTitle: 'Código-fonte',
    demoTitle: 'Demonstração',
    pageSizeLabel: 'Itens por página',
    goToLabel: 'Ir para página',
    first: 'Primeira',
    previous: 'Anterior',
    next: 'Próxima',
    last: 'Última',
    stats: (page, totalPages, totalItems, start, end) =>
      `Página ${page} de ${totalPages} · exibindo ${start}–${end} de ${totalItems} itens`,
    note: (
      <>
        O hook usa <Text code>useMemo</Text> para a fatia visível e{' '}
        <Text code>useCallback</Text> para todas as funções de navegação,
        mantendo referências estáveis. A página atual é automaticamente
        ajustada quando o <Text code>items</Text> muda de tamanho.
      </>
    ),
  },
  en: {
    title: 'Snippet: usePagination',
    intro: (
      <>
        A utility hook for paginating arrays in React. It takes an item list
        and <Text code>pageSize</Text> / <Text code>initialPage</Text> options,
        then returns the current page, visible items, total pages and
        navigation helpers. Great for paginated tables, lists and cards without
        pulling in external libraries.
      </>
    ),
    sourceTitle: 'Source code',
    demoTitle: 'Demo',
    pageSizeLabel: 'Items per page',
    goToLabel: 'Go to page',
    first: 'First',
    previous: 'Previous',
    next: 'Next',
    last: 'Last',
    stats: (page, totalPages, totalItems, start, end) =>
      `Page ${page} of ${totalPages} · showing ${start}–${end} of ${totalItems} items`,
    note: (
      <>
        The hook uses <Text code>useMemo</Text> for the visible slice and{' '}
        <Text code>useCallback</Text> for all navigation functions, keeping
        references stable. The current page is automatically clamped when{' '}
        <Text code>items</Text> changes size.
      </>
    ),
  },
}

const TOTAL_ITEMS = 64

function DemoUsage({ t }) {
  const [pageSize, setPageSize] = useState(8)
  const items = useMemo(
    () => Array.from({ length: TOTAL_ITEMS }, (_, i) => `Item ${String(i + 1).padStart(2, '0')}`),
    []
  )

  const {
    page,
    totalItems,
    totalPages,
    pageItems,
    canNext,
    canPrev,
    setPage,
    nextPage,
    prevPage,
    firstPage,
    lastPage,
  } = usePagination(items, { pageSize, initialPage: 1 })

  const startIndex = (page - 1) * pageSize + 1
  const endIndex = Math.min(page * pageSize, totalItems)

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Row gutter={[16, 16]} align="middle">
        <Col>
          <Space>
            <Text>{t.pageSizeLabel}:</Text>
            <Select
              value={pageSize}
              onChange={setPageSize}
              style={{ width: 80 }}
            >
              <Option value={4}>4</Option>
              <Option value={8}>8</Option>
              <Option value={12}>12</Option>
              <Option value={16}>16</Option>
              <Option value={24}>24</Option>
            </Select>
          </Space>
        </Col>
        <Col>
          <Space>
            <Text>{t.goToLabel}:</Text>
            <InputNumber
              min={1}
              max={totalPages}
              value={page}
              onChange={(value) => value && setPage(value)}
              style={{ width: 70 }}
            />
          </Space>
        </Col>
        <Col>
          <Tag color="blue">{t.stats(page, totalPages, totalItems, startIndex, endIndex)}</Tag>
        </Col>
      </Row>

      <List
        bordered
        dataSource={pageItems}
        renderItem={(item) => (
          <List.Item>
            <Text>{item}</Text>
          </List.Item>
        )}
      />

      <Space wrap>
        <Button icon={<StepBackwardOutlined />} onClick={firstPage} disabled={!canPrev}>
          {t.first}
        </Button>
        <Button icon={<LeftOutlined />} onClick={prevPage} disabled={!canPrev}>
          {t.previous}
        </Button>
        <Button onClick={nextPage} disabled={!canNext}>
          {t.next} <RightOutlined />
        </Button>
        <Button onClick={lastPage} disabled={!canNext}>
          {t.last} <StepForwardOutlined />
        </Button>
      </Space>

      <Alert type="info" showIcon message={t.note} />
    </Space>
  )
}

export default function UsePaginationSnippetPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}>
        <CodeOutlined /> {t.title}
      </Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card title={t.sourceTitle}>
        <pre style={{ margin: 0, overflowX: 'auto' }}>
          <code>{sourceCode}</code>
        </pre>
      </Card>

      <Card title={t.demoTitle}>
        <DemoUsage t={t} />
      </Card>
    </Space>
  )
}
