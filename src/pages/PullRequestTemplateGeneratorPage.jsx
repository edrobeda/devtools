import React, { useMemo, useState } from 'react'
import {
  Typography,
  Card,
  Space,
  Checkbox,
  Button,
  message,
  Collapse,
  Alert,
} from 'antd'
import {
  FileTextOutlined,
  CopyOutlined,
  DownloadOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  buildTemplate,
  getDefaultConfig,
  getEngineSource,
  getPresets,
  getSections,
} from '../utils/pullRequestTemplateGenerator'

const { Title, Paragraph, Text } = Typography

const translations = {
  pt: {
    title: 'Gerador de Pull Request Template',
    intro: (
      <>
        Monte um arquivo <Text code>pull_request_template.md</Text> para padronizar
        as descrições de PR no seu repositório. Escolha as seções, marque opções
        pré-selecionadas e baixe o Markdown — tudo no navegador, nenhum dado sai.
      </>
    ),
    presets: 'Presets',
    sections: 'Seções',
    sectionsHint: 'Selecione as seções que devem aparecer no template.',
    typeOfChange: 'Tipo de mudança pré-selecionado',
    checklist: 'Checklist pré-selecionado',
    output: 'Preview do template',
    stats: (lines, bytes) => `${lines} linhas · ${bytes} bytes`,
    copy: 'Copiar',
    copied: 'Copiado!',
    download: 'Baixar .md',
    empty: 'Selecione pelo menos uma seção para gerar o template.',
    alertTitle: 'Onde colocar?',
    alertText:
      'Salve como .github/pull_request_template.md na raiz do repositório, em .github/PULL_REQUEST_TEMPLATE.md ou dentro de .github/PULL_REQUEST_TEMPLATE/nome.md. GitHub, GitLab, Bitbucket e Gitea reconhecem o arquivo ao abrir uma nova PR.',
    source: 'Código-fonte do motor',
  },
  en: {
    title: 'Pull Request Template Generator',
    intro: (
      <>
        Build a <Text code>pull_request_template.md</Text> to standardize PR
        descriptions in your repository. Choose sections, pre-check options and
        download the Markdown — all in the browser, no data leaves your machine.
      </>
    ),
    presets: 'Presets',
    sections: 'Sections',
    sectionsHint: 'Select the sections that should appear in the template.',
    typeOfChange: 'Pre-selected change type',
    checklist: 'Pre-selected checklist',
    output: 'Template preview',
    stats: (lines, bytes) => `${lines} lines · ${bytes} bytes`,
    copy: 'Copy',
    copied: 'Copied!',
    download: 'Download .md',
    empty: 'Select at least one section to generate the template.',
    alertTitle: 'Where to place it?',
    alertText:
      'Save it as .github/pull_request_template.md at the repository root, .github/PULL_REQUEST_TEMPLATE.md or inside .github/PULL_REQUEST_TEMPLATE/name.md. GitHub, GitLab, Bitbucket and Gitea will use it when opening a new PR.',
    source: 'Engine source code',
  },
}

export default function PullRequestTemplateGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [config, setConfig] = useState(getDefaultConfig)

  const sections = useMemo(() => getSections(lang), [lang])
  const presets = useMemo(() => getPresets(lang), [lang])
  const output = useMemo(() => buildTemplate(config, lang), [config, lang])

  const sectionOptions = useMemo(
    () =>
      sections.map((section) => ({
        label: (
          <span>
            <strong>{section.name}</strong>
            <div style={{ fontSize: 12, color: 'var(--ant-color-text-secondary)' }}>
              {section.hint}
            </div>
          </span>
        ),
        value: section.key,
      })),
    [sections]
  )

  const typeOptions = useMemo(
    () =>
      (sections.find((s) => s.key === 'typeOfChange')?.options || []).map((option) => ({
        label: option,
        value: option,
      })),
    [sections]
  )

  const checklistOptions = useMemo(
    () =>
      (sections.find((s) => s.key === 'checklist')?.options || []).map((option, index) => ({
        label: option,
        value: index,
      })),
    [sections]
  )

  function applyPreset(preset) {
    setConfig({
      selectedSections: [...preset.sections],
      typeOfChange: [...preset.selectedTypes],
      checklist: [...preset.selectedChecklist],
    })
  }

  function handleCopy() {
    navigator.clipboard.writeText(output)
    message.success(t.copied)
  }

  function handleDownload() {
    const blob = new Blob([output], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'pull_request_template.md'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const stats = useMemo(() => {
    const lines = output ? output.split('\n').length : 0
    const bytes = new Blob([output]).size
    return t.stats(lines, bytes)
  }, [output, t])

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}>
        <FileTextOutlined /> {t.title}
      </Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Alert message={t.alertTitle} description={t.alertText} type="info" showIcon />

      <Card title={t.presets}>
        <Space wrap>
          {presets.map((preset) => (
            <Button key={preset.key} onClick={() => applyPreset(preset)}>
              {preset.name}
            </Button>
          ))}
        </Space>
      </Card>

      <Card title={t.sections}>
        <Paragraph type="secondary">{t.sectionsHint}</Paragraph>
        <Checkbox.Group
          value={config.selectedSections}
          onChange={(values) =>
            setConfig((prev) => ({ ...prev, selectedSections: values }))
          }
          options={sectionOptions}
          style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
        />
      </Card>

      <Card title={t.typeOfChange}>
        <Checkbox.Group
          value={config.typeOfChange}
          onChange={(values) =>
            setConfig((prev) => ({ ...prev, typeOfChange: values }))
          }
          options={typeOptions}
          style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
        />
      </Card>

      <Card title={t.checklist}>
        <Checkbox.Group
          value={config.checklist}
          onChange={(values) =>
            setConfig((prev) => ({ ...prev, checklist: values }))
          }
          options={checklistOptions}
          style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
        />
      </Card>

      <Card
        title={t.output}
        extra={
          <Space>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {stats}
            </Text>
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
                <code>{getEngineSource()}</code>
              </pre>
            ),
          },
        ]}
      />
    </Space>
  )
}
