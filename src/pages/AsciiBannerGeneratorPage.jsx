import React, { useMemo, useState } from 'react'
import {
  Typography,
  Card,
  Space,
  Input,
  Segmented,
  Switch,
  Button,
  Alert,
  Statistic,
  Row,
  Col,
  Collapse,
  message,
} from 'antd'
import {
  FontSizeOutlined,
  CopyOutlined,
  DownloadOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import { getEngineSource, renderBanner, bannerWidth } from '../utils/asciiBanner'

const { Title, Paragraph, Text } = Typography

const fillOptions = ['#', '@', 'X', '*', 'O', '+', '=', '.']

const presets = [
  { key: 'devtools', text: 'DevTools' },
  { key: 'hello', text: 'Hello, World!' },
  { key: 'http', text: 'HTTP 204' },
  { key: 'curl', text: 'POST /api/orders HTTP/2' },
  { key: 'multiline', text: 'STAGING\nDEPLOY 42' },
]

const translations = {
  pt: {
    title: 'Gerador de Banner ASCII',
    intro: (
      <>
        Transforma texto em arte ASCII estilo <Text code>figlet</Text>, com
        glifos em matriz 5×5 — ideal para banners de terminal,{' '}
        <Text code>/etc/motd</Text>, cabeçalhos de arquivo e saída de CI. 100%
        no navegador; nenhum dado sai daqui.
      </>
    ),
    inputTitle: 'Texto',
    inputPlaceholder: 'Digite o texto do banner…',
    presets: 'Exemplos',
    optionsTitle: 'Opções',
    fill: 'Caractere de preenchimento',
    spacing: 'Espaço entre letras',
    spacingHint: 'colunas em branco entre glifos',
    scale: 'Tamanho',
    scale1: '1×',
    scale2: '2×',
    autoUpper: 'Converter para maiúsculas',
    autoUpperHint:
      'O motor tem uma única caixa de letras (maiúsculas); com a opção desligada, minúsculas viram “?”.',
    previewTitle: 'Preview',
    noText: 'Digite um texto acima para gerar o banner.',
    widthWarn:
      'O banner tem mais de 80 colunas — pode estourar terminais padrão. Reduza o texto, o espaçamento ou use 1×.',
    statsChars: 'Caracteres',
    statsLines: 'Linhas do banner',
    statsCols: 'Colunas',
    copy: 'Copiar',
    copied: 'Banner copiado!',
    download: 'Baixar .txt',
    source: 'Código-fonte do motor',
  },
  en: {
    title: 'ASCII Banner Generator',
    intro: (
      <>
        Turn text into <Text code>figlet</Text>-style ASCII art using 5×5
        glyphs — great for terminal banners, <Text code>/etc/motd</Text>,
        file headers and CI output. 100% in the browser; nothing leaves here.
      </>
    ),
    inputTitle: 'Text',
    inputPlaceholder: 'Type the banner text…',
    presets: 'Examples',
    optionsTitle: 'Options',
    fill: 'Fill character',
    spacing: 'Letter spacing',
    spacingHint: 'blank columns between glyphs',
    scale: 'Size',
    scale1: '1×',
    scale2: '2×',
    autoUpper: 'Uppercase conversion',
    autoUpperHint:
      'The engine has a single (uppercase) letter set; with this off, lowercase turns into “?”.',
    previewTitle: 'Preview',
    noText: 'Type some text above to generate the banner.',
    widthWarn:
      'The banner is wider than 80 columns — it may overflow standard terminals. Shorten the text, reduce spacing or use 1×.',
    statsChars: 'Characters',
    statsLines: 'Banner lines',
    statsCols: 'Columns',
    copy: 'Copy',
    copied: 'Banner copied!',
    download: 'Download .txt',
    source: 'Engine source code',
  },
}

export default function AsciiBannerGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [input, setInput] = useState('DevTools')
  const [fill, setFill] = useState('#')
  const [spacing, setSpacing] = useState(1)
  const [scale, setScale] = useState(1)
  const [autoUpper, setAutoUpper] = useState(true)

  const options = useMemo(
    () => ({ fill, spacing, scale, autoUpper }),
    [fill, spacing, scale, autoUpper]
  )

  const lines = useMemo(() => renderBanner(input, options), [input, options])

  const width = useMemo(() => bannerWidth(lines), [lines])

  const bannerText = useMemo(() => lines.join('\n'), [lines])

  function handleCopy() {
    if (!bannerText) return
    navigator.clipboard.writeText(bannerText)
    message.success(t.copied)
  }

  function handleDownload() {
    if (!bannerText) return
    const blob = new Blob([bannerText + '\n'], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'banner.txt'
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}>
        <FontSizeOutlined /> {t.title}
      </Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card title={t.inputTitle}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Input.TextArea
            autoSize={{ minRows: 2, maxRows: 6 }}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t.inputPlaceholder}
            style={{ fontFamily: 'monospace' }}
          />
          <Space wrap>
            <Text type="secondary">{t.presets}</Text>
            {presets.map((p) => (
              <Button key={p.key} size="small" onClick={() => setInput(p.text)}>
                {p.text.replace('\n', ' ⏎ ')}
              </Button>
            ))}
          </Space>
        </Space>
      </Card>

      <Card title={t.optionsTitle}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Space wrap align="center">
            <Text strong>{t.fill}</Text>
            <Segmented
              value={fill}
              onChange={setFill}
              options={fillOptions.map((f) => ({
                label: <Text code>{f}</Text>,
                value: f,
              }))}
            />
          </Space>
          <Space wrap align="center">
            <Text strong>{t.spacing}</Text>
            <Segmented
              value={spacing}
              onChange={setSpacing}
              options={[0, 1, 2, 3].map((s) => ({ label: String(s), value: s }))}
            />
            <Text type="secondary">{t.spacingHint}</Text>
          </Space>
          <Space wrap align="center">
            <Text strong>{t.scale}</Text>
            <Segmented
              value={scale}
              onChange={setScale}
              options={[
                { label: t.scale1, value: 1 },
                { label: t.scale2, value: 2 },
              ]}
            />
          </Space>
          <Space wrap align="center">
            <Switch checked={autoUpper} onChange={setAutoUpper} />
            <Text strong>{t.autoUpper}</Text>
          </Space>
          {!autoUpper && <Alert type="warning" showIcon message={t.autoUpperHint} />}
        </Space>
      </Card>

      <Card title={t.previewTitle} extra={width > 0 ? <Text code>{width} cols</Text> : null}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          {width > 80 && <Alert type="warning" showIcon message={t.widthWarn} />}
          {!lines.length ? (
            <Alert type="info" showIcon message={t.noText} />
          ) : (
            <pre
              style={{
                margin: 0,
                overflowX: 'auto',
                fontFamily: 'monospace',
                fontSize: 13,
                lineHeight: 1.25,
                background: 'rgba(0,0,0,0.03)',
                padding: 16,
                borderRadius: 8,
              }}
            >
              <code>{bannerText}</code>
            </pre>
          )}
          <Row gutter={[16, 16]}>
            <Col xs={8} sm={6}>
              <Card size="small">
                <Statistic title={t.statsChars} value={input.length} />
              </Card>
            </Col>
            <Col xs={8} sm={6}>
              <Card size="small">
                <Statistic title={t.statsLines} value={lines.length} />
              </Card>
            </Col>
            <Col xs={8} sm={6}>
              <Card size="small">
                <Statistic title={t.statsCols} value={width} />
              </Card>
            </Col>
          </Row>
          <Space wrap>
            <Button type="primary" icon={<CopyOutlined />} onClick={handleCopy} disabled={!bannerText}>
              {t.copy}
            </Button>
            <Button icon={<DownloadOutlined />} onClick={handleDownload} disabled={!bannerText}>
              {t.download}
            </Button>
          </Space>
        </Space>
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