import React, { useMemo, useState } from 'react'
import { Typography, Card, Space, Input, Table, Tag, Alert } from 'antd'
import { OrderedListOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input

// Especificidade CSS = (a, b, c):
//   a = seletores de ID
//   b = classes, seletores de atributo e pseudo-classes
//   c = seletores de tipo (tag) e pseudo-elementos
// Referência: https://www.w3.org/TR/selectors-3/#specificity
// :where(...) sempre conta 0. :is()/:not() contam a especificidade do
// conteúdo interno (aqui, aproximada contando todos os tokens internos,
// já que o cálculo exato de "seletor mais específico entre os argumentos"
// exigiria um parser CSS completo).
const PSEUDO_ELEMENTS = ['before', 'after', 'first-line', 'first-letter', 'placeholder', 'selection', 'marker', 'backdrop', 'file-selector-button']

function unwrapFunctionalPseudos(selector) {
  let s = selector
  // :where(...) contribui zero — remove por completo, mantendo espaço pra não colar tokens vizinhos
  for (let i = 0; i < 5; i++) {
    const next = s.replace(/:where\(([^()]*)\)/gi, ' ')
    if (next === s) break
    s = next
  }
  // :not(...) e :is(...)/:matches() — desembrulha mantendo o conteúdo interno
  for (let i = 0; i < 5; i++) {
    const next = s.replace(/:(?:not|is|matches)\(([^()]*)\)/gi, ' $1 ')
    if (next === s) break
    s = next
  }
  return s
}

function computeSpecificity(rawSelector) {
  let s = unwrapFunctionalPseudos(rawSelector.trim())
  let a = 0
  let b = 0
  let c = 0

  // pseudo-elementos (:: sempre, ou : legado pra uma lista fixa) → c
  s = s.replace(/::?([a-zA-Z-]+)/g, (m, name) => {
    if (m.startsWith('::') || PSEUDO_ELEMENTS.includes(name.toLowerCase())) {
      c += 1
      return ' '
    }
    return m // devolve pra próxima etapa contar como pseudo-classe
  })

  // IDs → a
  s = s.replace(/#[a-zA-Z_-][\w-]*/g, () => { a += 1; return ' ' })

  // atributos [foo="bar"] → b
  s = s.replace(/\[[^\]]*\]/g, () => { b += 1; return ' ' })

  // classes → b
  s = s.replace(/\.[a-zA-Z_-][\w-]*/g, () => { b += 1; return ' ' })

  // pseudo-classes restantes (com ou sem argumento residual de :not/:is desembrulhado) → b
  s = s.replace(/:[a-zA-Z-]+(\([^()]*\))?/g, () => { b += 1; return ' ' })

  // o que sobra: seletores de tipo (tag), exceto universal * e combinadores
  const rest = s.split(/[\s>+~,]+/).filter(Boolean)
  rest.forEach((token) => {
    if (token === '*' || token === '&') return
    if (/^[a-zA-Z][\w-]*$/.test(token)) c += 1
  })

  return { a, b, c }
}

function specificityToNumber({ a, b, c }) {
  return a * 1_000_000 + b * 1_000 + c
}

const translations = {
  pt: {
    title: 'Calculadora de Especificidade CSS',
    intro: (
      <>
        Cola um ou mais seletores CSS (um por linha, ou separados por{' '}
        <Text code>,</Text>) e vê a especificidade de cada um no formato{' '}
        <Text code>(a, b, c)</Text>: <Text code>a</Text> = IDs,{' '}
        <Text code>b</Text> = classes/atributos/pseudo-classes,{' '}
        <Text code>c</Text> = tags/pseudo-elementos. Quanto maior, mais essa
        regra "ganha" de outra com especificidade menor, independente da
        ordem no arquivo.
      </>
    ),
    limitation: (
      <>
        Aproximação: <Text code>:where()</Text> conta zero corretamente, mas{' '}
        <Text code>:not()</Text>/<Text code>:is()</Text> somam todos os
        tokens internos em vez de pegar apenas o argumento mais específico
        (regra exata da spec) — na prática, pra um único argumento simples
        dentro dos parênteses, o resultado bate.
      </>
    ),
    placeholder: '#header .nav > a:hover\n.card.featured::before\nbutton[type="submit"]\n*',
    selector: 'Seletor',
    specificity: 'Especificidade (a, b, c)',
    rank: '#',
    invalidHint: 'Seletor vazio ignorado',
  },
  en: {
    title: 'CSS Specificity Calculator',
    intro: (
      <>
        Paste one or more CSS selectors (one per line, or comma-separated)
        and see each one's specificity as <Text code>(a, b, c)</Text>:{' '}
        <Text code>a</Text> = IDs, <Text code>b</Text> =
        classes/attributes/pseudo-classes, <Text code>c</Text> =
        tags/pseudo-elements. The higher it ranks, the more that rule "wins"
        over another with lower specificity, regardless of source order.
      </>
    ),
    limitation: (
      <>
        Approximation: <Text code>:where()</Text> correctly counts as zero,
        but <Text code>:not()</Text>/<Text code>:is()</Text> sum all inner
        tokens instead of taking only the most specific argument (the spec's
        exact rule) — in practice, for a single simple argument inside the
        parentheses, the result matches.
      </>
    ),
    placeholder: '#header .nav > a:hover\n.card.featured::before\nbutton[type="submit"]\n*',
    selector: 'Selector',
    specificity: 'Specificity (a, b, c)',
    rank: '#',
    invalidHint: 'Empty selector skipped',
  },
}

export default function CssSpecificityCalculatorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [input, setInput] = useState('#header .nav > a:hover\n.card.featured::before\nbutton[type="submit"]\ndiv > p\n*')

  const rows = useMemo(() => {
    const selectors = input
      .split(/\n|,(?![^[]*\])/)
      .map((s) => s.trim())
      .filter(Boolean)

    return selectors
      .map((selector, idx) => {
        const spec = computeSpecificity(selector)
        return { key: idx, selector, ...spec, sortValue: specificityToNumber(spec) }
      })
      .sort((r1, r2) => r2.sortValue - r1.sortValue)
      .map((r, idx) => ({ ...r, rank: idx + 1 }))
  }, [input])

  const columns = [
    { title: t.rank, dataIndex: 'rank', width: 48 },
    {
      title: t.selector,
      dataIndex: 'selector',
      render: (val) => <Text code>{val}</Text>,
    },
    {
      title: t.specificity,
      key: 'spec',
      render: (_, row) => (
        <Space>
          <Tag color="magenta">a={row.a}</Tag>
          <Tag color="blue">b={row.b}</Tag>
          <Tag color="green">c={row.c}</Tag>
        </Space>
      ),
    },
  ]

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><OrderedListOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>
      <Alert type="info" showIcon message={t.limitation} />

      <Card>
        <TextArea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t.placeholder}
          autoSize={{ minRows: 4, maxRows: 10 }}
          style={{ fontFamily: 'monospace' }}
        />
      </Card>

      <Card>
        <Table
          dataSource={rows}
          columns={columns}
          pagination={false}
          size="small"
        />
      </Card>
    </Space>
  )
}
