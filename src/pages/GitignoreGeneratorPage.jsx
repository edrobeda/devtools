import React, { useState, useMemo } from 'react'
import { Typography, Card, Space, Checkbox, Button, message } from 'antd'
import { ToolOutlined, CopyOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const TEMPLATES = {
  Node: `node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.pnpm-debug.log*
dist/
build/
.env
.env.local
.env.*.local`,
  Python: `__pycache__/
*.py[cod]
*$py.class
*.egg-info/
.eggs/
.venv/
venv/
env/
.pytest_cache/
.mypy_cache/
*.log
dist/
build/`,
  Java: `*.class
*.jar
*.war
*.ear
target/
.gradle/
build/
out/`,
  React: `build/
.cache/
coverage/
*.local`,
  macOS: `.DS_Store
.AppleDouble
.LSOverride
._*`,
  Windows: `Thumbs.db
ehthumbs.db
Desktop.ini
$RECYCLE.BIN/`,
  VSCode: `.vscode/
!.vscode/extensions.json`,
  IntelliJ: `.idea/
*.iml
*.iws`,
  Docker: `*.pid
docker-compose.override.yml`,
  Terraform: `.terraform/
*.tfstate
*.tfstate.backup
*.tfvars
.terraform.lock.hcl`,
}

const translations = {
  pt: {
    title: 'Gerador de .gitignore',
    intro: (
      <>
        Marca as linguagens/ferramentas do projeto e monta um{' '}
        <Text code>.gitignore</Text> combinando os templates, sem linhas
        duplicadas — tudo embutido no código, sem chamada de rede.
      </>
    ),
    templates: 'Templates',
    result: 'Resultado',
    copy: 'Copiar',
    copied: 'Copiado',
    empty: 'Marque ao menos um template para gerar o arquivo.',
  },
  en: {
    title: '.gitignore Generator',
    intro: (
      <>
        Check the languages/tools your project uses and build a{' '}
        <Text code>.gitignore</Text> combining the templates, with
        duplicate lines removed — all embedded in code, no network call.
      </>
    ),
    templates: 'Templates',
    result: 'Result',
    copy: 'Copy',
    copied: 'Copied',
    empty: 'Check at least one template to generate the file.',
  },
}

export default function GitignoreGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [selected, setSelected] = useState(['Node'])

  const output = useMemo(() => {
    const lines = []
    const seen = new Set()
    selected.forEach((name) => {
      const block = TEMPLATES[name]
      if (!block) return
      lines.push(`# ${name}`)
      block.split('\n').forEach((line) => {
        if (!seen.has(line)) {
          seen.add(line)
          lines.push(line)
        }
      })
      lines.push('')
    })
    return lines.join('\n').trim()
  }, [selected])

  function handleCopy() {
    navigator.clipboard.writeText(output)
    message.success(t.copied)
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><ToolOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card title={t.templates}>
        <Checkbox.Group
          value={selected}
          onChange={setSelected}
          options={Object.keys(TEMPLATES).map((name) => ({ label: name, value: name }))}
          style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}
        />
      </Card>

      <Card
        title={t.result}
        extra={<Button size="small" icon={<CopyOutlined />} onClick={handleCopy} disabled={!output}>{t.copy}</Button>}
      >
        {output ? (
          <pre style={{ margin: 0, overflowX: 'auto', maxHeight: 400, overflowY: 'auto' }}>
            <code>{output}</code>
          </pre>
        ) : (
          <Text type="secondary">{t.empty}</Text>
        )}
      </Card>
    </Space>
  )
}
