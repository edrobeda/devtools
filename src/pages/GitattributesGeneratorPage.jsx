import React, { useMemo, useState } from 'react'
import { Typography, Card, Space, Checkbox, Button, message, Alert, Collapse } from 'antd'
import { ToolOutlined, CopyOutlined, DownloadOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import { buildGitattributes, getPresets, getDefaultSelectedKeys } from '../utils/gitattributesGenerator'

const { Title, Paragraph, Text } = Typography

const translations = {
  pt: {
    title: 'Gerador de .gitattributes',
    intro: (
      <>
        Monte um arquivo <Text code>.gitattributes</Text> combinando presets
        para normalização de quebras de linha, linguagens e arquivos binários.
        Tudo é gerado no navegador — nenhum dado sai daqui.
      </>
    ),
    presets: 'Presets',
    result: 'Resultado',
    copy: 'Copiar',
    copied: 'Copiado',
    download: 'Baixar .gitattributes',
    empty: 'Marque ao menos um preset para gerar o arquivo.',
    downloadName: 'gitattributes',
    alertTitle: 'O que é .gitattributes?',
    alertText:
      'É um arquivo do Git que define atributos por caminho: como normalizar quebras de linha, quais arquivos são binários, diffs especiais, merge strategies e arquivos a ignorar em archives. Geralmente fica na raiz do repositório.',
    source: 'Código-fonte do motor',
  },
  en: {
    title: '.gitattributes Generator',
    intro: (
      <>
        Build a <Text code>.gitattributes</Text> file by combining presets for
        line ending normalization, languages and binary files. Everything is
        generated in the browser — no data leaves your machine.
      </>
    ),
    presets: 'Presets',
    result: 'Result',
    copy: 'Copy',
    copied: 'Copied',
    download: 'Download .gitattributes',
    empty: 'Check at least one preset to generate the file.',
    downloadName: 'gitattributes',
    alertTitle: 'What is .gitattributes?',
    alertText:
      'It is a Git file that defines per-path attributes: how to normalize line endings, which files are binary, special diffs, merge strategies and files to exclude from archives. Usually placed at the repository root.',
    source: 'Engine source code',
  },
}

const engineSource = `const PRESETS = {
  minimum: {
    name: { pt: 'Mínimo', en: 'Minimum' },
    lines: [
      '# Normalize line endings automatically',
      '* text=auto',
      '',
      '# Mark common binary files',
      '*.png binary',
      '*.jpg binary',
      '*.jpeg binary',
      '*.gif binary',
      '*.ico binary',
      '*.webp binary',
      '*.pdf binary',
      '*.zip binary',
    ],
  },
  // ...outros presets
}

export function buildGitattributes(selectedKeys, lang) {
  const seen = new Set()
  const result = []

  selectedKeys.forEach((key) => {
    const preset = PRESETS[key]
    if (!preset) return
    if (result.length > 0) result.push('')
    result.push(\`# \${preset.name[lang] || preset.name.en}\`)
    preset.lines.forEach((line) => {
      if (line === '' || line.startsWith('#')) {
        result.push(line)
        return
      }
      if (seen.has(line)) return
      seen.add(line)
      result.push(line)
    })
  })

  return result.join('\\n').trim()
}`

export default function GitattributesGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [selected, setSelected] = useState(getDefaultSelectedKeys)

  const presets = useMemo(() => getPresets(lang), [lang])
  const output = useMemo(() => buildGitattributes(selected, lang), [selected, lang])

  function handleCopy() {
    navigator.clipboard.writeText(output)
    message.success(t.copied)
  }

  function handleDownload() {
    const blob = new Blob([output], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = '.gitattributes'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const checkboxOptions = useMemo(
    () =>
      presets.map((preset) => ({
        label: (
          <span>
            <strong>{preset.name}</strong>
            <div style={{ fontSize: 12, color: 'var(--ant-color-text-secondary)' }}>
              {preset.description}
            </div>
          </span>
        ),
        value: preset.key,
      })),
    [presets]
  )

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><ToolOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Alert message={t.alertTitle} description={t.alertText} type="info" showIcon />

      <Card title={t.presets}>
        <Checkbox.Group
          value={selected}
          onChange={setSelected}
          options={checkboxOptions}
          style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
        />
      </Card>

      <Card
        title={t.result}
        extra={
          <Space>
            <Button
              size="small"
              icon={<CopyOutlined />}
              onClick={handleCopy}
              disabled={!output}
            >
              {t.copy}
            </Button>
            <Button
              size="small"
              icon={<DownloadOutlined />}
              onClick={handleDownload}
              disabled={!output}
            >
              {t.download}
            </Button>
          </Space>
        }
      >
        {output ? (
          <pre
            style={{
              margin: 0,
              overflowX: 'auto',
              maxHeight: 480,
              overflowY: 'auto',
              whiteSpace: 'pre',
            }}
          >
            <code>{output}</code>
          </pre>
        ) : (
          <Text type="secondary">{t.empty}</Text>
        )}
      </Card>

      <Collapse
        items={[
          {
            key: 'source',
            label: t.source,
            children: (
              <pre style={{ margin: 0, overflowX: 'auto' }}>
                <code>{engineSource}</code>
              </pre>
            ),
          },
        ]}
      />
    </Space>
  )
}
