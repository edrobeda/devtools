import React, { useMemo, useState } from 'react'
import {
  Typography,
  Card,
  Input,
  Space,
  Button,
  Tag,
  Statistic,
  Row,
  Col,
  Collapse,
  Alert,
  Tooltip,
} from 'antd'
import {
  RobotOutlined,
  CopyOutlined,
  ClearOutlined,
  CheckOutlined,
  FileTextOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  SECTIONS,
  TEMPLATES,
  buildPrompt,
  estimateTokens,
  applyTemplate,
  builderSource,
} from '../utils/llmPromptBuilder'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input
const { Panel } = Collapse

const translations = {
  pt: {
    title: 'LLM Prompt Builder',
    intro:
      'Monte prompts estruturados para modelos de linguagem (ChatGPT, Claude, Gemini, Llama etc.). Preencha as seções, escolha um template rápido e copie o resultado pronto para colar. Nenhum texto sai do navegador.',
    templatesTitle: 'Templates rápidos',
    sectionsTitle: 'Seções do prompt',
    previewTitle: 'Preview do prompt',
    tokenCount: 'Tokens estimados',
    charCount: 'Caracteres',
    copy: 'Copiar',
    copied: 'Copiado',
    clear: 'Limpar tudo',
    cleared: 'Limpado',
    emptyPreview: 'Preencha pelo menos uma seção para ver o prompt montado.',
    sourceCode: 'Código-fonte do montador',
    tipTitle: 'Dica',
    tipContent:
      'Ordene as seções de forma lógica: primeiro defina o papel, depois o contexto, a tarefa, exemplos, restrições e formato de saída. Prompts específicos costumam gerar respostas mais úteis.',
  },
  en: {
    title: 'LLM Prompt Builder',
    intro:
      'Build structured prompts for language models (ChatGPT, Claude, Gemini, Llama, etc.). Fill in the sections, pick a quick template, and copy the ready-to-paste result. No text leaves the browser.',
    templatesTitle: 'Quick templates',
    sectionsTitle: 'Prompt sections',
    previewTitle: 'Prompt preview',
    tokenCount: 'Estimated tokens',
    charCount: 'Characters',
    copy: 'Copy',
    copied: 'Copied',
    clear: 'Clear all',
    cleared: 'Cleared',
    emptyPreview: 'Fill at least one section to see the assembled prompt.',
    sourceCode: 'Builder source code',
    tipTitle: 'Tip',
    tipContent:
      'Order sections logically: define the role first, then context, task, examples, constraints and output format. Specific prompts usually yield more useful responses.',
  },
}

const emptySections = {
  role: '',
  context: '',
  task: '',
  examples: '',
  constraints: '',
  output: '',
}

export default function LlmPromptBuilderPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [sections, setSections] = useState({ ...emptySections })
  const [copied, setCopied] = useState(false)
  const [cleared, setCleared] = useState(false)

  const promptText = useMemo(() => buildPrompt(sections, lang), [sections, lang])
  const tokens = useMemo(() => estimateTokens(promptText), [promptText])

  function updateSection(key, value) {
    setSections((prev) => ({ ...prev, [key]: value }))
  }

  function loadTemplate(key) {
    const template = applyTemplate(key)
    if (!template) return
    setSections({
      role: template.role || '',
      context: template.context || '',
      task: template.task || '',
      examples: template.examples || '',
      constraints: template.constraints || '',
      output: template.output || '',
    })
  }

  function clearAll() {
    setSections({ ...emptySections })
    setCleared(true)
    setTimeout(() => setCleared(false), 1500)
  }

  function copyToClipboard() {
    navigator.clipboard.writeText(promptText)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}>
        <RobotOutlined /> {t.title}
      </Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Alert type="info" showIcon message={t.tipTitle} description={t.tipContent} />

      <Card size="small" title={<><ThunderboltOutlined /> {t.templatesTitle}</>}>
        <Space size={[8, 8]} wrap>
          {TEMPLATES.map((template) => (
            <Button key={template.key} size="small" onClick={() => loadTemplate(template.key)}>
              {lang === 'pt' ? template.labelPt : template.labelEn}
            </Button>
          ))}
        </Space>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card
            size="small"
            title={<><FileTextOutlined /> {t.sectionsTitle}</>}
            extra={
              <Tooltip title={t.clear}>
                <Button
                  size="small"
                  icon={cleared ? <CheckOutlined /> : <ClearOutlined />}
                  onClick={clearAll}
                >
                  {cleared ? t.cleared : t.clear}
                </Button>
              </Tooltip>
            }
          >
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              {SECTIONS.map((section) => (
                <div key={section.key}>
                  <Text strong>{lang === 'pt' ? section.labelPt : section.labelEn}</Text>
                  <TextArea
                    rows={section.key === 'task' || section.key === 'context' ? 4 : 3}
                    value={sections[section.key]}
                    onChange={(e) => updateSection(section.key, e.target.value)}
                    placeholder={lang === 'pt' ? section.placeholderPt : section.placeholderEn}
                    style={{ marginTop: 6 }}
                  />
                </div>
              ))}
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            size="small"
            title={t.previewTitle}
            extra={
              <Space>
                <Tag color="blue">{t.tokenCount}: {tokens}</Tag>
                <Tag color="default">{t.charCount}: {promptText.length}</Tag>
                <Button
                  size="small"
                  icon={copied ? <CheckOutlined /> : <CopyOutlined />}
                  onClick={copyToClipboard}
                  disabled={!promptText}
                >
                  {copied ? t.copied : t.copy}
                </Button>
              </Space>
            }
          >
            {promptText ? (
              <pre
                style={{
                  margin: 0,
                  padding: 12,
                  background: '#f6ffed',
                  border: '1px solid #b7eb8f',
                  borderRadius: 6,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  minHeight: 120,
                }}
              >
                <code>{promptText}</code>
              </pre>
            ) : (
              <Paragraph type="secondary" style={{ margin: 0, padding: 24, textAlign: 'center' }}>
                {t.emptyPreview}
              </Paragraph>
            )}
          </Card>

          <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
            <Col xs={12}>
              <Card size="small">
                <Statistic title={t.tokenCount} value={tokens} />
              </Card>
            </Col>
            <Col xs={12}>
              <Card size="small">
                <Statistic title={t.charCount} value={promptText.length} />
              </Card>
            </Col>
          </Row>
        </Col>
      </Row>

      <Collapse>
        <Panel header={t.sourceCode} key="source">
          <pre style={{ margin: 0, overflow: 'auto', padding: 16 }}>
            <code>{builderSource}</code>
          </pre>
        </Panel>
      </Collapse>
    </Space>
  )
}
