import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Typography,
  Card,
  Space,
  Input,
  Select,
  Slider,
  Button,
  message,
  Collapse,
  Row,
  Col,
  Segmented,
  Alert,
  Tag,
} from 'antd'
import {
  PictureOutlined,
  CopyOutlined,
  DownloadOutlined,
  UndoOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  DEFAULTS,
  FIT_OPTIONS,
  buildIcons,
  buildHtmlLinks,
  buildManifest,
  estimateSizeKb,
} from '../utils/faviconGenerator'

const { Title, Paragraph, Text } = Typography
const { useMessage } = message

const FONT_OPTIONS = [
  'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  'Arial, Helvetica, sans-serif',
  'Georgia, "Times New Roman", serif',
  '"Courier New", Courier, monospace',
  '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
  'Roboto, sans-serif',
  '"Open Sans", sans-serif',
  '"Fira Code", "Consolas", monospace',
]

const PRESETS = [
  {
    key: 'wrench',
    labelKey: 'presetWrench',
    config: {
      mode: 'text',
      text: '🔧',
      bgColor: '#1677ff',
      textColor: '#ffffff',
      fontSizeRatio: 0.55,
      borderRadius: 0.22,
      themeColor: '#1677ff',
    },
  },
  {
    key: 'letter',
    labelKey: 'presetLetter',
    config: {
      mode: 'text',
      text: 'D',
      bgColor: '#52c41a',
      textColor: '#ffffff',
      fontSizeRatio: 0.6,
      borderRadius: 0.18,
      themeColor: '#52c41a',
    },
  },
  {
    key: 'dark',
    labelKey: 'presetDark',
    config: {
      mode: 'text',
      text: '◐',
      bgColor: '#001529',
      textColor: '#ffffff',
      fontSizeRatio: 0.5,
      borderRadius: 0.5,
      themeColor: '#001529',
    },
  },
  {
    key: 'warm',
    labelKey: 'presetWarm',
    config: {
      mode: 'text',
      text: '🔥',
      bgColor: '#fa541c',
      textColor: '#ffffff',
      fontSizeRatio: 0.55,
      borderRadius: 0.22,
      themeColor: '#fa541c',
    },
  },
]

const translations = {
  pt: {
    title: 'Gerador de Favicon',
    intro:
      'Gera ícones PNG para favicon, Apple Touch Icon, PWA manifest e outros usos — 100% no navegador. Use texto/emoji ou faça upload de uma imagem; ajuste cores, fonte e arredondamento, depois copie as tags HTML e o site.webmanifest.',
    mode: 'Modo',
    modeText: 'Texto / Emoji',
    modeImage: 'Imagem',
    textLabel: 'Texto/emoji (1-2 caracteres)',
    fontFamily: 'Fonte',
    bgColor: 'Cor de fundo',
    textColor: 'Cor do texto',
    fontSize: 'Tamanho da fonte',
    borderRadius: 'Arredondamento do fundo',
    imageFit: 'Ajuste da imagem',
    fitCover: 'Cobrir (cover)',
    fitContain: 'Contido (contain)',
    fitFill: 'Preencher (fill)',
    imageBg: 'Cor de fundo (letterbox)',
    themeColor: 'Cor do tema',
    appName: 'Nome do app',
    appShortName: 'Nome curto',
    upload: 'Escolher imagem',
    uploadHint: 'JPG, PNG, WebP, SVG etc. — tudo processado localmente.',
    noImage: 'Nenhuma imagem selecionada',
    sizes: 'Ícones gerados',
    sizeLabel: (s) => `${s}×${s}`,
    download: 'Baixar PNG',
    copy: 'Copiar',
    copied: 'Copiado!',
    copyError: 'Não foi possível copiar',
    htmlOutput: 'Tags HTML para &lt;head&gt;',
    manifestOutput: 'site.webmanifest',
    preview: 'Preview',
    presets: 'Presets rápidos',
    presetWrench: 'Emoji 🔧',
    presetLetter: 'Letra D',
    presetDark: 'Escuro',
    presetWarm: 'Quente',
    settings: 'Configurações',
    reset: 'Restaurar padrões',
    sourceTitle: 'Código-fonte do motor',
    sourceBody:
      'O motor usa &lt;canvas&gt; para desenhar cada tamanho. No modo texto desenha um fundo arredondado com o texto centralizado; no modo imagem redimensiona o arquivo com cover/contain/fill. Os arquivos são data URLs PNG, então nada sai do navegador.',
    pngDisclaimer:
      'O gerador produz PNGs. Para obter um arquivo .ico tradicional, converta os PNGs 16×16 e 32×32 com uma ferramenta externa ou sirva PNGs modernos (todos os navegadores atuais aceitam).',
  },
  en: {
    title: 'Favicon Generator',
    intro:
      'Generate PNG icons for favicon, Apple Touch Icon, PWA manifest and more — 100% in the browser. Use text/emoji or upload an image; adjust colors, font and rounding, then copy the HTML tags and site.webmanifest.',
    mode: 'Mode',
    modeText: 'Text / Emoji',
    modeImage: 'Image',
    textLabel: 'Text/emoji (1-2 characters)',
    fontFamily: 'Font family',
    bgColor: 'Background color',
    textColor: 'Text color',
    fontSize: 'Font size',
    borderRadius: 'Background rounding',
    imageFit: 'Image fit',
    fitCover: 'Cover',
    fitContain: 'Contain',
    fitFill: 'Fill',
    imageBg: 'Background color (letterbox)',
    themeColor: 'Theme color',
    appName: 'App name',
    appShortName: 'Short name',
    upload: 'Choose image',
    uploadHint: 'JPG, PNG, WebP, SVG etc. — all processed locally.',
    noImage: 'No image selected',
    sizes: 'Generated icons',
    sizeLabel: (s) => `${s}×${s}`,
    download: 'Download PNG',
    copy: 'Copy',
    copied: 'Copied!',
    copyError: 'Could not copy',
    htmlOutput: 'HTML tags for &lt;head&gt;',
    manifestOutput: 'site.webmanifest',
    preview: 'Preview',
    presets: 'Quick presets',
    presetWrench: 'Emoji 🔧',
    presetLetter: 'Letter D',
    presetDark: 'Dark',
    presetWarm: 'Warm',
    settings: 'Settings',
    reset: 'Reset defaults',
    sourceTitle: 'Engine source code',
    sourceBody:
      'The engine uses &lt;canvas&gt; to draw each size. In text mode it draws a rounded background with centered text; in image mode it scales the file using cover/contain/fill. Outputs are PNG data URLs, so nothing leaves the browser.',
    pngDisclaimer:
      'This generator outputs PNGs. To get a traditional .ico file, convert the 16×16 and 32×32 PNGs with an external tool, or serve modern PNGs (all current browsers support them).',
  },
}

export default function FaviconGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [messageApi, messageContextHolder] = useMessage()

  const [config, setConfig] = useState(DEFAULTS)
  const [imageSrc, setImageSrc] = useState(null)
  const [icons, setIcons] = useState([])
  const [generating, setGenerating] = useState(false)

  const patch = useCallback((p) => {
    setConfig((prev) => ({ ...prev, ...p }))
  }, [])

  const applyPreset = (key) => {
    const preset = PRESETS.find((p) => p.key === key)
    if (preset) setConfig((prev) => ({ ...prev, ...preset.config }))
  }

  const reset = () => {
    setConfig(DEFAULTS)
    setImageSrc(null)
  }

  const handleFile = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setImageSrc(ev.target.result)
    reader.readAsDataURL(file)
  }

  const generate = useCallback(async () => {
    setGenerating(true)
    try {
      const result = await buildIcons(config, imageSrc)
      setIcons(result)
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Favicon generation failed', err)
      messageApi.error(t.copyError)
    } finally {
      setGenerating(false)
    }
  }, [config, imageSrc, messageApi, t.copyError])

  useEffect(() => {
    generate()
  }, [generate])

  const htmlLinks = useMemo(() => buildHtmlLinks(config), [config])
  const manifest = useMemo(() => buildManifest(config), [config])

  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      messageApi.success(t.copied)
    } catch {
      messageApi.error(t.copyError)
    }
  }

  const previewUrl = useMemo(() => {
    const icon = icons.find((i) => i.size === 192) || icons[icons.length - 1]
    return icon ? icon.dataUrl : ''
  }, [icons])

  const isImageMode = config.mode === 'image'
  const canGenerateImage = isImageMode && imageSrc

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {messageContextHolder}
      <Title level={2}>
        <PictureOutlined /> {t.title}
      </Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Alert type="info" showIcon message={t.pngDisclaimer} />

      <Space style={{ width: '100%', justifyContent: 'space-between' }}>
        <Text strong>{t.presets}</Text>
        <Button size="small" icon={<UndoOutlined />} onClick={reset}>
          {t.reset}
        </Button>
      </Space>
      <Space wrap>
        {PRESETS.map((p) => (
          <Button key={p.key} size="small" onClick={() => applyPreset(p.key)}>
            {t[p.labelKey]}
          </Button>
        ))}
      </Space>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={12}>
          <Card title={t.settings || 'Configurações'}>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <FormItem label={t.mode}>
                <Segmented
                  block
                  value={config.mode}
                  onChange={(v) => patch({ mode: v })}
                  options={[
                    { value: 'text', label: t.modeText },
                    { value: 'image', label: t.modeImage },
                  ]}
                />
              </FormItem>

              {config.mode === 'text' ? (
                <>
                  <FormItem label={t.textLabel}>
                    <Input
                      value={config.text}
                      onChange={(e) => patch({ text: e.target.value })}
                      maxLength={2}
                    />
                  </FormItem>

                  <FormItem label={t.fontFamily}>
                    <Select
                      style={{ width: '100%' }}
                      value={config.fontFamily}
                      onChange={(v) => patch({ fontFamily: v })}
                      options={FONT_OPTIONS.map((f) => ({ value: f, label: f.split(',')[0] }))}
                    />
                  </FormItem>

                  <Row gutter={[16, 16]}>
                    <Col xs={12}>
                      <ColorField
                        label={t.bgColor}
                        value={config.bgColor}
                        onChange={(v) => patch({ bgColor: v })}
                      />
                    </Col>
                    <Col xs={12}>
                      <ColorField
                        label={t.textColor}
                        value={config.textColor}
                        onChange={(v) => patch({ textColor: v })}
                      />
                    </Col>
                  </Row>

                  <FormItem label={`${t.fontSize} · ${Math.round(config.fontSizeRatio * 100)}%`}>
                    <Slider
                      min={0.2}
                      max={0.9}
                      step={0.01}
                      value={config.fontSizeRatio}
                      onChangeComplete={(v) => patch({ fontSizeRatio: v })}
                    />
                  </FormItem>

                  <FormItem label={`${t.borderRadius} · ${Math.round(config.borderRadius * 100)}%`}>
                    <Slider
                      min={0}
                      max={0.5}
                      step={0.01}
                      value={config.borderRadius}
                      onChangeComplete={(v) => patch({ borderRadius: v })}
                    />
                  </FormItem>
                </>
              ) : (
                <>
                  <FormItem label={t.upload}>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFile}
                      style={{ display: 'block' }}
                    />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {t.uploadHint}
                    </Text>
                  </FormItem>

                  {imageSrc ? (
                    <img
                      src={imageSrc}
                      alt="upload preview"
                      style={{
                        width: '100%',
                        maxHeight: 160,
                        objectFit: 'contain',
                        border: '1px solid #f0f0f0',
                        borderRadius: 8,
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        height: 120,
                        border: '1px dashed #d9d9d9',
                        borderRadius: 8,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text type="secondary">{t.noImage}</Text>
                    </div>
                  )}

                  <FormItem label={t.imageFit}>
                    <Segmented
                      block
                      value={config.fit}
                      onChange={(v) => patch({ fit: v })}
                      options={FIT_OPTIONS.map((f) => ({
                        value: f,
                        label: t[`fit${f.charAt(0).toUpperCase() + f.slice(1)}`],
                      }))}
                    />
                  </FormItem>

                  <ColorField
                    label={t.imageBg}
                    value={config.imageBgColor}
                    onChange={(v) => patch({ imageBgColor: v })}
                  />
                </>
              )}

              <ColorField
                label={t.themeColor}
                value={config.themeColor}
                onChange={(v) => patch({ themeColor: v })}
              />

              <FormItem label={t.appName}>
                <Input
                  value={config.appName}
                  onChange={(e) => patch({ appName: e.target.value })}
                />
              </FormItem>

              <FormItem label={t.appShortName}>
                <Input
                  value={config.appShortName}
                  onChange={(e) => patch({ appShortName: e.target.value })}
                />
              </FormItem>
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Card title={t.preview} loading={generating}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: 180,
                  background: '#fafafa',
                  borderRadius: 8,
                  border: '1px solid #f0f0f0',
                }}
              >
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="favicon preview"
                    style={{
                      width: 96,
                      height: 96,
                      borderRadius: config.mode === 'text' ? config.borderRadius * 96 : 0,
                      objectFit: 'cover',
                    }}
                  />
                ) : (
                  <Text type="secondary">{isImageMode && !imageSrc ? t.noImage : '…'}</Text>
                )}
              </div>
            </Card>

            <Card title={t.sizes} loading={generating}>
              <Space wrap>
                {icons.map((icon) => (
                  <div
                    key={icon.size}
                    style={{
                      border: '1px solid #f0f0f0',
                      borderRadius: 8,
                      padding: 12,
                      textAlign: 'center',
                      width: 120,
                    }}
                  >
                    <img
                      src={icon.dataUrl}
                      alt={`icon ${icon.size}`}
                      style={{
                        width: 64,
                        height: 64,
                        objectFit: 'contain',
                        marginBottom: 8,
                      }}
                    />
                    <div>
                      <Tag>{t.sizeLabel(icon.size)}</Tag>
                    </div>
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      {estimateSizeKb(icon.dataUrl)} KB
                    </Text>
                    <div style={{ marginTop: 6 }}>
                      <Button
                        size="small"
                        icon={<DownloadOutlined />}
                        href={icon.dataUrl}
                        download={`favicon-${icon.size}x${icon.size}.png`}
                      >
                        {t.download}
                      </Button>
                    </div>
                  </div>
                ))}
              </Space>
            </Card>
          </Space>
        </Col>
      </Row>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={12}>
          <Card
            title={<span dangerouslySetInnerHTML={{ __html: t.htmlOutput }} />}
            extra={
              <Button size="small" icon={<CopyOutlined />} onClick={() => copy(htmlLinks)}>
                {t.copy}
              </Button>
            }
          >
            <pre style={{ margin: 0, overflowX: 'auto' }}>
              <code>{htmlLinks}</code>
            </pre>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card
            title={t.manifestOutput}
            extra={
              <Button size="small" icon={<CopyOutlined />} onClick={() => copy(manifest)}>
                {t.copy}
              </Button>
            }
          >
            <pre style={{ margin: 0, overflowX: 'auto' }}>
              <code>{manifest}</code>
            </pre>
          </Card>
        </Col>
      </Row>

      <Collapse
        items={[
          {
            key: 'source',
            label: t.sourceTitle,
            children: (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Paragraph type="secondary">
                  <span dangerouslySetInnerHTML={{ __html: t.sourceBody }} />
                </Paragraph>
                <pre style={{ margin: 0, overflowX: 'auto', maxHeight: 360 }}>
                  <code>{SOURCE_CODE}</code>
                </pre>
              </Space>
            ),
          },
        ]}
      />
    </Space>
  )
}

function FormItem({ label, children }) {
  return (
    <Space direction="vertical" size={4} style={{ width: '100%' }}>
      <Text>{label}</Text>
      {children}
    </Space>
  )
}

function ColorField({ label, value, onChange }) {
  return (
    <Space direction="vertical" size={4} style={{ width: '100%' }}>
      <Text>{label}</Text>
      <Space>
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{ width: 44, height: 32, border: 'none', cursor: 'pointer', background: 'none' }}
        />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{ width: 120 }}
          maxLength={7}
        />
      </Space>
    </Space>
  )
}

const SOURCE_CODE = `// src/utils/faviconGenerator.js (resumo)

export const DEFAULTS = { mode: 'text', text: '🔧', bgColor: '#1677ff', ... };

export function drawTextIcon({ text, size, bgColor, textColor, fontFamily, fontSizeRatio, borderRadius }) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = bgColor;
  roundRect(ctx, 0, 0, size, size, size * borderRadius);
  ctx.fill();

  ctx.fillStyle = textColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = \`\${size * fontSizeRatio}px "Apple Color Emoji", ... , \${fontFamily}\`;
  ctx.fillText(text.slice(0, 2), size / 2, size / 2);

  return canvas.toDataURL('image/png');
}

export async function drawImageIcon({ image, size, fit, bgColor }) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, size, size);

  const img = await loadImage(image);
  const scale = fit === 'contain'
    ? Math.min(size / img.width, size / img.height)
    : fit === 'cover'
    ? Math.max(size / img.width, size / img.height)
    : size / Math.max(img.width, img.height);

  const dw = img.width * scale;
  const dh = img.height * scale;
  ctx.drawImage(img, (size - dw) / 2, (size - dh) / 2, dw, dh);
  return canvas.toDataURL('image/png');
}

export async function buildIcons(config, imageSrc) {
  const sizes = [16, 32, 180, 192, 512];
  const results = [];
  for (const size of sizes) {
    const dataUrl = config.mode === 'image' && imageSrc
      ? await drawImageIcon({ image: imageSrc, size, fit: config.fit, bgColor: config.imageBgColor })
      : drawTextIcon({ text: config.text, size, bgColor: config.bgColor, textColor: config.textColor,
                       fontFamily: config.fontFamily, fontSizeRatio: config.fontSizeRatio,
                       borderRadius: config.borderRadius });
    results.push({ size, dataUrl });
  }
  return results;
}`
