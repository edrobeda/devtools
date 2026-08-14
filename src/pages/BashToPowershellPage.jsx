import React, { useMemo, useState } from 'react'
import { Typography, Card, Space, Tabs, Input, Button, Table, Tag, Collapse, Alert } from 'antd'
import { SwapOutlined, CopyOutlined, CodeOutlined, SearchOutlined, WindowsOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import { bashToPowershell, powershellToBash, CATALOG, CATEGORIES } from '../utils/bashToPowershell'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input

const BASH_EXAMPLES = [
  'ls -la\ncat README.md | grep TODO\nexport NODE_ENV=production\necho "Hello $USER"',
  'find . -name "*.js" | xargs wc -l\nsleep 5 && echo done',
  'cp src/App.jsx backup/App.jsx\nrm -rf node_modules\nmkdir -p dist/assets',
  'tail -f /var/log/nginx/access.log 2>/dev/null',
]

const PS_EXAMPLES = [
  'Get-ChildItem -Force\nGet-Content README.md | Select-String TODO\n$env:NODE_ENV = "production"\nWrite-Output "Hello $env:USERNAME"',
  'Get-ChildItem -Recurse -Filter "*.js" | ForEach-Object { Get-Content $_ }\nStart-Sleep -Seconds 5; if ($?) { Write-Output done }',
  'Copy-Item src/App.jsx backup/App.jsx\nRemove-Item -Recurse -Force node_modules\nNew-Item -ItemType Directory dist/assets -Force',
  'Get-Content /var/log/nginx/access.log -Wait -ErrorAction SilentlyContinue',
]

const translations = {
  pt: {
    title: 'Bash ↔ PowerShell',
    intro: 'Traduza comandos comuns entre Bash (Linux/macOS/WSL) e PowerShell (Windows). O conversor é heurístico: cobre os padrões do dia a dia, mas não substitui um parser de shell completo. Use a tabela abaixo para consultar equivalências rapidamente.',
    heuristicAlert: 'Conversor heurístico',
    heuristicBody: 'Scripts complexos (loops, condicionais, funções, aspas aninhadas e expansões) provavelmente exigirão ajustes manuais. A ferramenta é otimizada para comandos simples de terminal.',
    tabBashToPs: 'Bash → PowerShell',
    tabPsToBash: 'PowerShell → Bash',
    inputBash: 'Comando Bash',
    inputPs: 'Comando PowerShell',
    inputPlaceholderBash: 'Cole comandos de Bash aqui…',
    inputPlaceholderPs: 'Cole comandos de PowerShell aqui…',
    output: 'Resultado convertido',
    outputPlaceholder: 'A conversão aparece aqui…',
    examples: 'Exemplos',
    copy: 'Copiar',
    copied: 'Copiado!',
    copyError: 'Não foi possível copiar',
    statsLines: 'linhas',
    statsChanged: 'linhas convertidas',
    reference: 'Tabela de equivalência',
    referenceSearch: 'Buscar ação ou comando…',
    category: 'Categoria',
    action: 'Ação',
    bash: 'Bash',
    ps: 'PowerShell',
    empty: 'Nenhum comando encontrado.',
    sourceTitle: 'Código-fonte do motor',
    sourceBody: 'O motor em src/utils/bashToPowershell.js mantém duas listas de regras regex (Bash → PowerShell e PowerShell → Bash), aplica-as linha a linha e devolve estatísticas. O catálogo comparativo alimenta a tabela de referência.',
  },
  en: {
    title: 'Bash ↔ PowerShell',
    intro: 'Translate common commands between Bash (Linux/macOS/WSL) and PowerShell (Windows). The converter is heuristic: it covers everyday patterns, but it is not a full shell parser. Use the table below to quickly look up equivalences.',
    heuristicAlert: 'Heuristic converter',
    heuristicBody: 'Complex scripts (loops, conditionals, functions, nested quotes, and expansions) will likely require manual adjustments. The tool is optimized for simple terminal commands.',
    tabBashToPs: 'Bash → PowerShell',
    tabPsToBash: 'PowerShell → Bash',
    inputBash: 'Bash command',
    inputPs: 'PowerShell command',
    inputPlaceholderBash: 'Paste Bash commands here…',
    inputPlaceholderPs: 'Paste PowerShell commands here…',
    output: 'Converted output',
    outputPlaceholder: 'Converted output appears here…',
    examples: 'Examples',
    copy: 'Copy',
    copied: 'Copied!',
    copyError: 'Could not copy',
    statsLines: 'lines',
    statsChanged: 'lines converted',
    reference: 'Equivalence table',
    referenceSearch: 'Search action or command…',
    category: 'Category',
    action: 'Action',
    bash: 'Bash',
    ps: 'PowerShell',
    empty: 'No command found.',
    sourceTitle: 'Source code of the engine',
    sourceBody: 'The engine in src/utils/bashToPowershell.js keeps two regex rule lists (Bash → PowerShell and PowerShell → Bash), applies them line by line, and returns statistics. The comparison catalog powers the reference table.',
  },
}

export default function BashToPowershellPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [tab, setTab] = useState('bash-to-ps')
  const [bashInput, setBashInput] = useState('')
  const [psInput, setPsInput] = useState('')
  const [query, setQuery] = useState('')

  const bashResult = useMemo(() => bashToPowershell(bashInput), [bashInput])
  const psResult = useMemo(() => powershellToBash(psInput), [psInput])

  const copy = async (value) => {
    try {
      await navigator.clipboard.writeText(value)
      window.alert?.(t.copied)
    } catch {
      window.alert?.(t.copyError)
    }
  }

  const filteredCatalog = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return CATALOG
    return CATALOG.filter((row) =>
      row[lang].toLowerCase().includes(q) ||
      row.bash.toLowerCase().includes(q) ||
      row.ps.toLowerCase().includes(q) ||
      (CATEGORIES[lang][row.category] || row.category).toLowerCase().includes(q)
    )
  }, [query, lang])

  const columns = [
    {
      title: t.category,
      dataIndex: 'category',
      key: 'category',
      render: (v) => <Tag>{CATEGORIES[lang][v] || v}</Tag>,
      width: '18%',
    },
    { title: t.action, dataIndex: lang, key: 'action', width: '28%' },
    { title: t.bash, dataIndex: 'bash', key: 'bash', render: (v) => <Text code>{v}</Text> },
    { title: t.ps, dataIndex: 'ps', key: 'ps', render: (v) => <Text code>{v}</Text> },
  ]

  const renderExamples = (examples, setter) => (
    <Space wrap style={{ marginTop: 12 }}>
      {t.examples}:&nbsp;
      {examples.map((ex, idx) => (
        <Tag
          key={idx}
          color="processing"
          style={{ cursor: 'pointer', marginInlineEnd: 0 }}
          onClick={() => setter(ex)}
        >
          <Text code style={{ color: 'inherit' }}>
            {ex.split('\n')[0].length > 32 ? `${ex.split('\n')[0].slice(0, 32)}…` : ex.split('\n')[0]}
          </Text>
        </Tag>
      ))}
    </Space>
  )

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><WindowsOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Alert type="info" showIcon message={t.heuristicAlert} description={t.heuristicBody} />

      <Tabs
        activeKey={tab}
        onChange={setTab}
        items={[
          {
            key: 'bash-to-ps',
            label: t.tabBashToPs,
            icon: <SwapOutlined />,
            children: (
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <Card title={t.inputBash}>
                  <TextArea
                    value={bashInput}
                    onChange={(e) => setBashInput(e.target.value)}
                    placeholder={t.inputPlaceholderBash}
                    autoSize={{ minRows: 5, maxRows: 12 }}
                    showCount
                  />
                  {renderExamples(BASH_EXAMPLES, setBashInput)}
                </Card>
                <Card
                  title={t.output}
                  extra={
                    <Button
                      size="small"
                      icon={<CopyOutlined />}
                      onClick={() => copy(bashResult.output)}
                      disabled={!bashResult.output}
                    >
                      {t.copy}
                    </Button>
                  }
                >
                  {bashResult.output ? (
                    <pre style={{ margin: 0, overflowX: 'auto' }}>
                      <code>{bashResult.output}</code>
                    </pre>
                  ) : (
                    <Text type="secondary">{t.outputPlaceholder}</Text>
                  )}
                  <Space wrap size={[8, 8]} style={{ marginTop: 12 }}>
                    <Tag>{bashResult.lines} {t.statsLines}</Tag>
                    {bashResult.changed > 0 && (
                      <Tag color="blue">{bashResult.changed} {t.statsChanged}</Tag>
                    )}
                  </Space>
                </Card>
              </Space>
            ),
          },
          {
            key: 'ps-to-bash',
            label: t.tabPsToBash,
            icon: <SwapOutlined rotate={180} />,
            children: (
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <Card title={t.inputPs}>
                  <TextArea
                    value={psInput}
                    onChange={(e) => setPsInput(e.target.value)}
                    placeholder={t.inputPlaceholderPs}
                    autoSize={{ minRows: 5, maxRows: 12 }}
                    showCount
                  />
                  {renderExamples(PS_EXAMPLES, setPsInput)}
                </Card>
                <Card
                  title={t.output}
                  extra={
                    <Button
                      size="small"
                      icon={<CopyOutlined />}
                      onClick={() => copy(psResult.output)}
                      disabled={!psResult.output}
                    >
                      {t.copy}
                    </Button>
                  }
                >
                  {psResult.output ? (
                    <pre style={{ margin: 0, overflowX: 'auto' }}>
                      <code>{psResult.output}</code>
                    </pre>
                  ) : (
                    <Text type="secondary">{t.outputPlaceholder}</Text>
                  )}
                  <Space wrap size={[8, 8]} style={{ marginTop: 12 }}>
                    <Tag>{psResult.lines} {t.statsLines}</Tag>
                    {psResult.changed > 0 && (
                      <Tag color="blue">{psResult.changed} {t.statsChanged}</Tag>
                    )}
                  </Space>
                </Card>
              </Space>
            ),
          },
        ]}
      />

      <Card title={<><CodeOutlined /> {t.reference}</>}>
        <Input
          prefix={<SearchOutlined />}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.referenceSearch}
          allowClear
          style={{ marginBottom: 16 }}
        />
        <Table
          dataSource={filteredCatalog}
          columns={columns}
          rowKey={(r) => `${r.category}-${r.en}`}
          pagination={false}
          size="small"
          scroll={{ x: true }}
          locale={{ emptyText: t.empty }}
        />
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
                  <code>{bashToPowershell.toString()}</code>
                </pre>
              </Space>
            ),
          },
        ]}
      />
    </Space>
  )
}
