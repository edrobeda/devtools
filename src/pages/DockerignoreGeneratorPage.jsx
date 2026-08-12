import React, { useMemo, useState } from 'react'
import {
  Typography,
  Card,
  Space,
  Checkbox,
  Button,
  Alert,
  Collapse,
  Input,
  Tag,
  message,
  Row,
  Col,
} from 'antd'
import {
  ContainerOutlined,
  CopyOutlined,
  DownloadOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import { buildDockerignore, PRESETS } from '../utils/dockerignoreGenerator'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input

const SOURCE = `
function buildDockerignore(presetKeys, customLines) {
  const seen = new Set()
  const out = []

  function pushLine(line) {
    const normalized = line.trim()
    if (!normalized) {
      if (out.length && out[out.length - 1] !== '') out.push('')
      return
    }
    if (normalized.startsWith('#')) {
      out.push(normalized)
      return
    }
    // Preserva negações e evita padrões duplicados.
    if (normalized.startsWith('!')) {
      out.push(normalized)
      return
    }
    if (!seen.has(normalized)) {
      seen.add(normalized)
      out.push(normalized)
    }
  }

  for (const key of presetKeys) {
    const preset = PRESETS[key]
    if (!preset) continue
    if (presetKeys.length > 1) out.push(\`# \${preset.label.en}\`)
    for (const line of preset.lines) pushLine(line)
  }

  if (customLines && customLines.trim()) {
    if (out.length && out[out.length - 1] !== '') out.push('')
    out.push('# Custom')
    for (const line of customLines.split('\\n')) pushLine(line)
  }

  while (out.length && out[0] === '') out.shift()
  while (out.length && out[out.length - 1] === '') out.pop()

  return out.join('\\n')
}
`

const translations = {
  pt: {
    title: 'Gerador de .dockerignore',
    intro:
      'Monta um arquivo .dockerignore combinando presets por linguagem com suas próprias regras. O que está listado aqui não entra no contexto de build do Docker, acelerando o envio e reduzindo o tamanho da imagem.',
    presets: 'Presets por linguagem',
    presetsHint: 'Selecione um ou mais templates; padrões iguais são deduplicados, mas negações (!) são preservadas.',
    custom: 'Padrões customizados',
    customPlaceholder: 'Coloque uma regra por linha...',
    output: '.dockerignore gerado',
    copy: 'Copiar',
    copied: '.dockerignore copiado!',
    download: 'Baixar .dockerignore',
    downloadName: '.dockerignore',
    lineCount: (n) => `${n} linha${n === 1 ? '' : 's'}`,
    byteCount: (n) => `${n} bytes`,
    empty: 'Selecione ao menos um preset ou adicione regras customizadas.',
    tipsTitle: 'Dicas do .dockerignore',
    tipsBody: (
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        <li>
          O <Text code>.dockerignore</Text> funciona como o{' '}
          <Text code>.gitignore</Text>, mas para o contexto enviado ao Docker.
          Arquivos ignorados não são copiados com <Text code>COPY</Text>.
        </li>
        <li>
          Sempre ignore <Text code>node_modules/</Text>, ambientes virtuais e
          arquivos de build — eles são recriados dentro do container.
        </li>
        <li>
          Cuidado com negações (<Text code>!.env.example</Text>): a ordem importa
          e um diretório excluído antes não pode ser re-incluído depois.
        </li>
        <li>
          Ignorar <Text code>.git/</Text> e <Text code>README.md</Text> reduz o
          contexto sem afetar a aplicação em runtime.
        </li>
      </ul>
    ),
    sourceTitle: 'Algoritmo-fonte',
    sourceBody:
      'buildDockerignore percorre os presets selecionados e as linhas customizadas, normaliza o espaço em branco, mantém comentários, remove padrões repetidos e preserva negações (!).',
  },
  en: {
    title: '.dockerignore Generator',
    intro:
      'Build a .dockerignore file by combining language presets with your own rules. Anything listed here is left out of the Docker build context, making sends faster and images smaller.',
    presets: 'Language presets',
    presetsHint: 'Select one or more templates; equal patterns are deduplicated, but negations (!) are preserved.',
    custom: 'Custom patterns',
    customPlaceholder: 'One rule per line...',
    output: 'Generated .dockerignore',
    copy: 'Copy',
    copied: '.dockerignore copied!',
    download: 'Download .dockerignore',
    downloadName: '.dockerignore',
    lineCount: (n) => `${n} line${n === 1 ? '' : 's'}`,
    byteCount: (n) => `${n} bytes`,
    empty: 'Select at least one preset or add custom rules.',
    tipsTitle: '.dockerignore tips',
    tipsBody: (
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        <li>
          <Text code>.dockerignore</Text> works like{' '}
          <Text code>.gitignore</Text> for the Docker build context. Ignored
          files are not copied with <Text code>COPY</Text>.
        </li>
        <li>
          Always ignore <Text code>node_modules/</Text>, virtual environments and
          build artifacts — they are rebuilt inside the container.
        </li>
        <li>
          Watch out for negations (<Text code>!.env.example</Text>): order matters
          and a directory excluded before cannot be re-included later.
        </li>
        <li>
          Ignoring <Text code>.git/</Text> and <Text code>README.md</Text> shrinks
          the context without affecting runtime.
        </li>
      </ul>
    ),
    sourceTitle: 'Source code',
    sourceBody:
      'buildDockerignore walks selected presets and custom lines, normalizes whitespace, keeps comments, removes repeated patterns and preserves negations (!).',
  },
}

export default function DockerignoreGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [selected, setSelected] = useState(['generic', 'node'])
  const [custom, setCustom] = useState('')

  const output = useMemo(
    () => buildDockerignore(selected, custom),
    [selected, custom]
  )
  const lineCount = output ? output.split('\n').length : 0
  const byteCount = useMemo(() => new Blob([output]).size, [output])

  const copyOutput = () => {
    navigator.clipboard.writeText(output)
    message.success(t.copied)
  }

  const downloadOutput = () => {
    const blob = new Blob([output], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = t.downloadName
    a.click()
    URL.revokeObjectURL(url)
  }

  const presetOptions = useMemo(
    () =>
      Object.entries(PRESETS).map(([key, preset]) => ({
        label: preset.label[lang],
        value: key,
      })),
    [lang]
  )

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}>
        <ContainerOutlined /> {t.title}
      </Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Alert type="info" showIcon message={t.tipsTitle} description={t.tipsBody} />

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title={t.presets}>
            <Paragraph type="secondary" style={{ fontSize: 12, marginBottom: 12 }}>
              {t.presetsHint}
            </Paragraph>
            <Checkbox.Group
              value={selected}
              onChange={setSelected}
              options={presetOptions}
              style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}
            />
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title={t.custom}>
            <TextArea
              rows={8}
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              placeholder={t.customPlaceholder}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title={t.output}
        extra={
          <Space>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {t.lineCount(lineCount)} · {t.byteCount(byteCount)}
            </Text>
            <Button
              size="small"
              icon={<CopyOutlined />}
              onClick={copyOutput}
              disabled={!output}
            >
              {t.copy}
            </Button>
            <Button
              size="small"
              icon={<DownloadOutlined />}
              onClick={downloadOutput}
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
              background: '#0d1117',
              color: '#e6edf3',
              padding: 12,
              borderRadius: 8,
              maxHeight: 480,
              fontSize: 12.5,
              lineHeight: 1.6,
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
            label: t.sourceTitle,
            children: (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Paragraph type="secondary">{t.sourceBody}</Paragraph>
                <pre style={{ margin: 0, overflowX: 'auto', maxHeight: 400 }}>
                  <code>{SOURCE}</code>
                </pre>
              </Space>
            ),
          },
        ]}
      />
    </Space>
  )
}
