import React, { useMemo, useState } from 'react'
import { Typography, Card, Space, Select, Input, Checkbox, Button, Table, message } from 'antd'
import { GithubOutlined, CopyOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input

const TYPES = [
  { value: 'feat', pt: 'nova funcionalidade pra quem usa o software', en: 'a new feature for the user' },
  { value: 'fix', pt: 'correção de bug pra quem usa o software', en: 'a bug fix for the user' },
  { value: 'docs', pt: 'mudanças na documentação', en: 'changes to documentation' },
  { value: 'style', pt: 'formatação, ponto e vírgula etc — sem mudança de código', en: 'formatting, missing semicolons, etc — no code change' },
  { value: 'refactor', pt: 'refatoração de código de produção (não é fix nem feat)', en: 'refactoring production code (not a fix or feature)' },
  { value: 'perf', pt: 'mudança de código focada em performance', en: 'a code change that improves performance' },
  { value: 'test', pt: 'adição/correção de testes, sem mudar código de produção', en: 'adding missing tests, no production code change' },
  { value: 'build', pt: 'mudanças no sistema de build ou dependências externas', en: 'changes to the build system or external dependencies' },
  { value: 'ci', pt: 'mudanças em arquivos e scripts de CI', en: 'changes to CI configuration files and scripts' },
  { value: 'chore', pt: 'tarefa de manutenção que não mexe em src/ nem em testes', en: 'maintenance task that touches neither src nor tests' },
  { value: 'revert', pt: 'reverte um commit anterior', en: 'reverts a previous commit' },
]

const translations = {
  pt: {
    title: 'Gerador de Mensagem de Commit',
    intro: (
      <>
        Monta uma mensagem de commit seguindo o padrão{' '}
        <Text code>Conventional Commits</Text> (<Text code>tipo(escopo): descrição</Text>)
        a partir de um formulário, e traz a tabela dos tipos como referência
        rápida. Nenhuma requisição é feita — é só um montador de texto local.
      </>
    ),
    type: 'Tipo',
    scope: 'Escopo (opcional)',
    scopePlaceholder: 'ex.: auth, api, ui',
    breaking: 'Breaking change',
    description: 'Descrição curta',
    descriptionPlaceholder: 'ex.: adiciona validação de e-mail no cadastro',
    body: 'Corpo (opcional)',
    bodyPlaceholder: 'Explica o quê e por quê, não o como.',
    footer: 'Rodapé (opcional)',
    footerPlaceholder: 'ex.: Closes #123',
    breakingDesc: 'Descrição da breaking change (opcional)',
    breakingDescPlaceholder: 'O que muda pra quem consome a API/lib',
    preview: 'Mensagem gerada',
    copy: 'Copiar',
    copied: 'Mensagem copiada!',
    descriptionRequired: 'Preencha a descrição curta pra gerar a mensagem.',
    referenceTitle: 'Referência: tipos',
    colType: 'Tipo',
    colDesc: 'Quando usar',
  },
  en: {
    title: 'Commit Message Generator',
    intro: (
      <>
        Builds a commit message following the{' '}
        <Text code>Conventional Commits</Text> pattern (<Text code>type(scope): description</Text>)
        from a form, plus a quick-reference table of the types. No request is
        ever made — it's just a local text builder.
      </>
    ),
    type: 'Type',
    scope: 'Scope (optional)',
    scopePlaceholder: 'e.g. auth, api, ui',
    breaking: 'Breaking change',
    description: 'Short description',
    descriptionPlaceholder: 'e.g. add email validation on signup',
    body: 'Body (optional)',
    bodyPlaceholder: 'Explain what and why, not how.',
    footer: 'Footer (optional)',
    footerPlaceholder: 'e.g. Closes #123',
    breakingDesc: 'Breaking change description (optional)',
    breakingDescPlaceholder: "What changes for the API/lib's consumers",
    preview: 'Generated message',
    copy: 'Copy',
    copied: 'Message copied!',
    descriptionRequired: 'Fill in the short description to generate the message.',
    referenceTitle: 'Reference: types',
    colType: 'Type',
    colDesc: 'When to use it',
  },
}

export default function CommitMessageGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [type, setType] = useState('feat')
  const [scope, setScope] = useState('')
  const [breaking, setBreaking] = useState(false)
  const [description, setDescription] = useState('')
  const [body, setBody] = useState('')
  const [footer, setFooter] = useState('')
  const [breakingDesc, setBreakingDesc] = useState('')

  const output = useMemo(() => {
    if (!description.trim()) return ''
    const scopePart = scope.trim() ? `(${scope.trim()})` : ''
    const bangPart = breaking ? '!' : ''
    const header = `${type}${scopePart}${bangPart}: ${description.trim()}`

    const parts = [header]
    if (body.trim()) parts.push(body.trim())

    const footerLines = []
    if (breaking) {
      footerLines.push(`BREAKING CHANGE: ${breakingDesc.trim() || description.trim()}`)
    }
    if (footer.trim()) footerLines.push(footer.trim())
    if (footerLines.length) parts.push(footerLines.join('\n'))

    return parts.join('\n\n')
  }, [type, scope, breaking, description, body, footer, breakingDesc])

  function handleCopy() {
    navigator.clipboard.writeText(output)
    message.success(t.copied)
  }

  const columns = [
    { title: t.colType, dataIndex: 'value', key: 'value', width: 100, render: (v) => <Text code>{v}</Text> },
    { title: t.colDesc, dataIndex: 'desc', key: 'desc' },
  ]
  const tableData = TYPES.map((tp) => ({ key: tp.value, value: tp.value, desc: tp[lang] }))

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><GithubOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Space wrap size="large" align="start">
            <div>
              <div><Text>{t.type}</Text></div>
              <Select
                value={type}
                onChange={setType}
                style={{ width: 160 }}
                options={TYPES.map((tp) => ({ value: tp.value, label: tp.value }))}
              />
            </div>
            <div>
              <div><Text>{t.scope}</Text></div>
              <Input
                value={scope}
                onChange={(e) => setScope(e.target.value)}
                placeholder={t.scopePlaceholder}
                style={{ width: 200 }}
              />
            </div>
            <div style={{ paddingTop: 22 }}>
              <Checkbox checked={breaking} onChange={(e) => setBreaking(e.target.checked)}>
                {t.breaking}
              </Checkbox>
            </div>
          </Space>

          <div>
            <div><Text>{t.description}</Text></div>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t.descriptionPlaceholder}
            />
          </div>

          {breaking && (
            <div>
              <div><Text>{t.breakingDesc}</Text></div>
              <TextArea
                value={breakingDesc}
                onChange={(e) => setBreakingDesc(e.target.value)}
                placeholder={t.breakingDescPlaceholder}
                autoSize={{ minRows: 2, maxRows: 4 }}
              />
            </div>
          )}

          <div>
            <div><Text>{t.body}</Text></div>
            <TextArea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={t.bodyPlaceholder}
              autoSize={{ minRows: 2, maxRows: 6 }}
            />
          </div>

          <div>
            <div><Text>{t.footer}</Text></div>
            <Input
              value={footer}
              onChange={(e) => setFooter(e.target.value)}
              placeholder={t.footerPlaceholder}
            />
          </div>
        </Space>
      </Card>

      <Card
        title={t.preview}
        extra={<Button size="small" icon={<CopyOutlined />} onClick={handleCopy} disabled={!output}>{t.copy}</Button>}
      >
        {output ? (
          <pre style={{ margin: 0, overflowX: 'auto', whiteSpace: 'pre-wrap' }}>
            <code>{output}</code>
          </pre>
        ) : (
          <Text type="secondary">{t.descriptionRequired}</Text>
        )}
      </Card>

      <Card title={t.referenceTitle}>
        <Table columns={columns} dataSource={tableData} pagination={false} size="small" />
      </Card>
    </Space>
  )
}
