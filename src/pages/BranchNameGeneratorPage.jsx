import React, { useMemo, useState } from 'react'
import { Typography, Card, Space, Select, Input, Checkbox, Button } from 'antd'
import { BranchesOutlined, CopyOutlined, CheckOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const TYPES = [
  { value: 'feature', label: 'feature' },
  { value: 'fix', label: 'fix' },
  { value: 'hotfix', label: 'hotfix' },
  { value: 'refactor', label: 'refactor' },
  { value: 'chore', label: 'chore' },
  { value: 'docs', label: 'docs' },
  { value: 'test', label: 'test' },
  { value: 'style', label: 'style' },
  { value: 'build', label: 'build' },
  { value: 'ci', label: 'ci' },
]

// Converte texto livre num segmento de branch válido: sem acentos,
// minúsculas, tudo que não for letra/dígito viram traço, sem traço nas
// pontas e truncado. Segue a "parte" de um check-ref-format.
function slugify(text) {
  return String(text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/\-{2,}/g, '-')
    .replace(/^-+|-+$/g, '')
}

const translations = {
  pt: {
    title: 'Gerador de Nome de Branch',
    intro: (
      <>
        Gera um nome de branch git consistente a partir de uma descrição, no
        padrão <Text code>tipo/escopo-descricao</Text> — em minúsculas, sem
        acentos e já sanitizado contra as regras do{' '}
        <Text code>git check-ref-format</Text> (nada de espaço, <Text code>..</Text>,{' '}
        <Text code>{'@{'}</Text>, barra/`-` no fim etc.). Também monta o comando{' '}
        <Text code>git checkout -b</Text> pronto pra copiar.
      </>
    ),
    type: 'Tipo',
    scope: 'Escopo (opcional)',
    scopePlaceholder: 'ex.: auth, checkout',
    includeType: 'Incluir prefixo de tipo',
    includeScope: 'Incluir escopo',
    description: 'Descrição da mudança',
    descriptionPlaceholder: 'ex.: Adicionar login com Google OAuth',
    slugField: 'Ajustar slug manualmente (opcional)',
    slugPlaceholder: 'ex.: add-google-oauth',
    result: 'Branch gerada',
    copy: 'Copiar branch',
    copyCmd: 'Copiar comando checkout',
    copied: 'Copiado!',
    empty: 'Digite uma descrição pra gerar o nome.',
    whyTitle: 'Por que assim',
    whyBody: (
      <>
        Branches consistentes facilitam filtrar PRs e montar pipelines de CI
        que reagem a prefixos como <Text code>feat/</Text> ou{' '}
        <Text code>fix/</Text>. O nome vem da descrição: tira acentos, baixa
        as maiúsculas, troca espaços por traço e limita o tamanho. Use o campo
        de slug quando precisar de um nome curto/semântico próprio (ex. o
        identificador da tarefa + resumo).
      </>
    ),
  },
  en: {
    title: 'Branch Name Generator',
    intro: (
      <>
        Builds a consistent git branch name from a short description, in the{' '}
        <Text code>type/scope-description</Text> pattern — lowercased,
        accent-free and normalized against every{' '}
        <Text code>git check-ref-format</Text> rule (no trailing dots,{' '}
        <Text code>..</Text>, <Text code>{'@{'}</Text>, leading dash, whitespace).
        It also prints a ready-to-paste <Text code>git checkout -b</Text>.
      </>
    ),
    type: 'Type',
    scope: 'Scope (optional)',
    scopePlaceholder: 'e.g. auth, checkout',
    includeType: 'Include type prefix',
    includeScope: 'Include scope',
    description: 'Change description',
    descriptionPlaceholder: 'e.g. add Google OAuth login',
    slugField: 'Use custom name instead (optional)',
    slugPlaceholder: 'e.g. add-google-oauth',
    result: 'Generated branch',
    copy: 'Copy branch',
    copyCmd: 'Copy checkout command',
    copied: 'Copied!',
    empty: 'Type a description to generate the name.',
    whyTitle: 'Why this',
    whyBody: (
      <>
        Consistent branches make PR filtering and CI pattern matching much
        easier (e.g. reacting to a <Text code>feat/</Text> or{' '}
        <Text code>fix/</Text> prefix). The name is derived from the
        description: accents stripped, lowercased, spaces become dashes and it
        is length-limited. Use the custom-name field when you want to
        handcraft the slug (e.g. ticket id + summary).
      </>
    ),
  },
}

const MAX_LEN = 50

export default function BranchNameGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [type, setType] = useState('feature')
  const [scope, setScope] = useState('')
  const [description, setDescription] = useState('')
  const [custom, setCustom] = useState('')
  const [includeType, setIncludeType] = useState(true)
  const [includeScope, setIncludeScope] = useState(true)
  const [copiedBranch, setCopiedBranch] = useState(false)
  const [copiedCmd, setCopiedCmd] = useState(false)

  const scopePart = includeScope ? slugify(scope) : ''
  const namePart = (custom.trim() ? slugify(custom) : slugify(description)).slice(0, MAX_LEN)

  // Monta o nome a partir de partes já limpas. O comentário é simples,
  // mas garante que não começa com "-" e não tem segmento vazio.
  const branch = useMemo(() => {
    const parts = []
    if (includeType) parts.push(type)
    if (scopePart) parts.push(scopePart)
    if (namePart) parts.push(namePart)
    return parts.join('/')
  }, [includeType, includeScope, type, scopePart, namePart])

  const command = branch ? `git checkout -b ${branch}` : ''

  async function doCopy(kind) {
    const text = kind === 'branch' ? branch : command
    if (!text) return
    const setFlag = kind === 'branch' ? setCopiedBranch : setCopiedCmd
    setFlag(false)
    try {
      await navigator.clipboard.writeText(text)
      setFlag(true)
    } catch {
      setFlag(false)
    }
    setTimeout(() => setFlag(false), 1500)
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><BranchesOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Space wrap size="large" align="start">
            <div>
              <div><Text>{t.type}</Text></div>
              <Select
                value={type}
                onChange={setType}
                style={{ width: 140 }}
                options={TYPES.map((x) => ({ value: x.value, label: x.label }))}
              />
            </div>
            <div>
              <div><Text>{t.scope}</Text></div>
              <Input
                value={scope}
                onChange={(e) => setScope(e.target.value)}
                placeholder={t.scopePlaceholder}
                style={{ width: 200 }}
                allowClear
              />
            </div>
            <div style={{ paddingTop: 30 }}>
              <Space direction="vertical" size={8}>
                <Checkbox checked={includeType} onChange={(e) => setIncludeType(e.target.checked)}>
                  {t.includeType}
                </Checkbox>
                <Checkbox checked={includeScope} onChange={(e) => setIncludeScope(e.target.checked)}>
                  {t.includeScope}
                </Checkbox>
              </Space>
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

          <div>
            <div><Text type="secondary">{t.slugField}</Text></div>
            <Input
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              placeholder={t.slugPlaceholder}
              allowClear
            />
          </div>
        </Space>
      </Card>

      <Card
        title={t.result}
        extra={
          <Button
            size="small"
            type="primary"
            icon={copiedBranch ? <CheckOutlined /> : <CopyOutlined />}
            onClick={() => doCopy('branch')}
            disabled={!branch}
          >
            {copiedBranch ? t.copied : t.copy}
          </Button>
        }
      >
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          {branch ? (
            <>
              <pre style={{ margin: 0, overflowX: 'auto' }}><code>{branch}</code></pre>
              {command && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <Text code style={{ fontSize: 13 }}>{command}</Text>
                  <Button
                    size="small"
                    icon={copiedCmd ? <CheckOutlined /> : <CopyOutlined />}
                    onClick={() => doCopy('cmd')}
                  >
                    {copiedCmd ? t.copied : t.copyCmd}
                  </Button>
                </div>
              )}
            </>
          ) : (
            <Text type="secondary">{t.empty}</Text>
          )}
        </Space>
      </Card>

      <Card title={t.whyTitle}>
        <Paragraph type="secondary">{t.whyBody}</Paragraph>
      </Card>
    </Space>
  )
}