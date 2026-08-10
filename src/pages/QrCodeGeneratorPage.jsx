import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Typography, Alert, Card, Space, Input, Segmented, InputNumber, Tag, Button, Descriptions, Collapse, ColorPicker, message, Divider } from 'antd'
import { QrcodeOutlined, CopyOutlined, DownloadOutlined } from '@ant-design/icons'
import QRCode from 'qrcode'
import { useLanguage } from '../i18n/LanguageContext'
import {
  ECC_LEVELS,
  ECC_PCT,
  encodeQr,
  qrToSvg,
  contrastRatio,
  utf8Bytes,
} from '../utils/qrRenderer'

const { Title, Paragraph, Text } = Typography

const EXAMPLES = [
  { id: 'url', icon: '🔗', text: 'https://devtools.eventifylab.com' },
  { id: 'wifi', icon: '📶', text: 'WIFI:T:WPA;S:Escritorio;P:senha123;;' },
  { id: 'totp', icon: '🔐', text: 'otpauth://totp/DevTools:bot@eventifylab.com?secret=JBSWY3DPEHPK3PXP&issuer=DevTools' },
  { id: 'json', icon: '🧩', text: '{"url":"https://api.eventifylab.com/v1/demo","method":"POST","ttl":300}' },
  { id: 'mail', icon: '✉️', text: 'mailto:dev@eventifylab.com?subject=Codigo%20para%20teste' },
]

const SCALES = [
  { label: '4', value: 4 },
  { label: '8', value: 8 },
  { label: '12', value: 12 },
]

const translations = {
  pt: {
    title: 'Gerador de QR Code',
    intro: (
      <>
        Transforma qualquer texto em um <Text code>QR Code</Text> — URL,
        Wi-Fi, segredo de 2FA (<Text code>otpauth://</Text>), payload JSON —
        com nível de correção de erro, cores e zona de silêncio configuráveis.
        O QR é gerado no navegador, byte a byte, sem nenhuma API.
      </>
    ),
    inputLabel: 'Conteúdo',
    inputPlaceholder: 'Digite ou cole o texto que o QR deve armazenar…',
    examplesLabel: 'Exemplos de um clique',
    eccLabel: 'Correção de erro (ECC)',
    eccDesc: (pct) => `${pct}% de redundância`,
    scaleLabel: 'Escala do preview',
    scalePx: (px) => `${px} px/módulo`,
    marginLabel: 'Zona de silêncio',
    marginDesc: 'módulos em volta (spec: ≥ 4)',
    marginHelp: 'Branco necessário ao redor do QR pra o scanner achar os finder patterns.',
    colorsLabel: 'Cores',
    fgLabel: 'Módulos',
    bgLabel: 'Fundo',
    contrastBad: 'Contraste baixo',
    contrastOk: 'Contraste OK',
    contrastWarn: 'Contraste mediano',
    statsTitle: 'Detalhes da matriz',
    version: 'Versão',
    grid: 'Grade (módulos)',
    eccRow: 'Correção de erro',
    payload: 'Payload (UTF-8)',
    darkRow: 'Módulos escuros',
    density: 'Densidade',
    tooBig: 'Conteúdo grande demais para um QR Code (limite da versão 40). Encurte o texto ou reduza o nível de correção de erro.',
    empty: 'Digite algo pra gerar o QR.',
    outputTitle: 'Saídas',
    svgCopy: 'Copiar SVG',
    pngCopy: 'Copiar PNG (data URI)',
    imgCopy: 'Copiar <img>',
    download: 'Baixar PNG',
    copied: 'Copiado',
    copyErr: 'Falha ao copiar',
    imgTab: 'HTML <img>',
    svgTab: 'SVG',
    pngTab: 'Data URI PNG',
    previewTitle: 'Preview',
    alertTitle: 'QR code não é seguro por si só',
    alertBody: (
      <>
        O QR armazena uma <Text code>string</Text> (até ~2–3 KB, conforme
        versão e ECC) — <Text strong>sem criptografia</Text>: qualquer pessoa
        que fotografar o código lê o conteúdo. Não coloque segredo, token de
        recovery de 2FA nem dado sensível. Quem precisa de acesso controlado
        deve usar um link curto com autenticação em vez do dado cru.{' '}
        <Text strong>Contraste</Text>: escuro sobre claro, de preferência
        razão ≥ 4.5; o scanner lê módulo escuro claro-fundo, então textura,
        degradê e cores próximas atrapalham. A <Text code>zona de silêncio</Text>{' '}
        de 4 módulos é exigida pela spec — sem ela muitos apps de scanner
        falham. E no impresso o que importa é o tamanho do <Text strong>módulo</Text>{' '}
        (não o zoom): um QR de 4 cm com módulo grande lê melhor que um de 10
        cm com módulo minúsculo. O <Text strong>ECC</Text> troca densidade por
        robustez: L (7%) é o mais enxuto; H (30%) aguenta arranhões e canto
        rasgado.
      </>
    ),
    sourceTitle: 'Algoritmo-fonte',
  },
  en: {
    title: 'QR Code Generator',
    intro: (
      <>
        Turns any text into a <Text code>QR Code</Text> — URL, Wi-Fi, 2FA seed
        (<Text code>otpauth://</Text>), JSON payload — with configurable error
        correction, colors and quiet zone. The QR is generated in-browser,
        bit by bit, with no API.
      </>
    ),
    inputLabel: 'Content',
    inputPlaceholder: 'Type or paste the text the QR should store…',
    examplesLabel: 'One-click examples',
    eccLabel: 'Error correction (ECC)',
    eccDesc: (pct) => `${pct}% redundancy`,
    scaleLabel: 'Preview scale',
    scalePx: (px) => `${px} px/module`,
    marginLabel: 'Quiet zone',
    marginDesc: 'modules around (spec: ≥ 4)',
    marginHelp: 'Blank space around the QR so scanners can find the finder patterns.',
    colorsLabel: 'Colors',
    fgLabel: 'Modules',
    bgLabel: 'Background',
    contrastBad: 'Low contrast',
    contrastOk: 'Good contrast',
    contrastWarn: 'Average contrast',
    statsTitle: 'Matrix details',
    version: 'Version',
    grid: 'Grid (modules)',
    eccRow: 'Error correction',
    payload: 'Payload (UTF-8)',
    darkRow: 'Dark modules',
    density: 'Density',
    tooBig: 'Content too large for a QR Code (version 40 limit). Shorten the text or lower the error correction level.',
    empty: 'Type something to generate the QR.',
    outputTitle: 'Outputs',
    svgCopy: 'Copy SVG',
    pngCopy: 'Copy PNG (data URI)',
    imgCopy: 'Copy <img>',
    download: 'Download PNG',
    copied: 'Copied',
    copyErr: 'Copy failed',
    imgTab: 'HTML <img>',
    svgTab: 'SVG',
    pngTab: 'PNG data URI',
    previewTitle: 'Preview',
    alertTitle: 'A QR code is not secure by itself',
    alertBody: (
      <>
        A QR stores a <Text code>string</Text> (up to ~2–3 KB depending on
        version and ECC) — <Text strong>no encryption</Text>: anyone who
        photographs the code can read its content. Do not put secrets, 2FA
        recovery tokens or sensitive data in it. If you need controlled
        access, encode a short authenticated link instead of raw data.{' '}
        <Text strong>Contrast</Text>: dark on light, preferably a ratio ≥ 4.5;
        the scanner reads dark modules against a light background, so
        texture, gradients and similar colors hurt. The{' '}
        <Text code>quiet zone</Text> of 4 modules is required by the spec —
        without it many scanner apps fail. And on print what matters is the{' '}
        <Text strong>module size</Text> (not the zoom): a 4 cm QR with large
        modules scans better than a 10 cm one with tiny modules.{' '}
        <Text strong>ECC</Text> trades density for robustness: L (7%) is the
        leanest; H (30%) survives scratches and torn corners.
      </>
    ),
    sourceTitle: 'Source algorithm',
  },
}

export default function QrCodeGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [messageApi, messageContextHolder] = message.useMessage()

  const [text, setText] = useState(EXAMPLES[0].text)
  const [ecc, setEcc] = useState('M')
  const [scale, setScale] = useState(8)
  const [margin, setMargin] = useState(4)
  const [fg, setFg] = useState('#000000')
  const [bg, setBg] = useState('#ffffff')

  // Objetos primitivos (strings/números) nas deps → useMemo/useEffect estáveis.
  const qr = useMemo(() => encodeQr(text, ecc), [text, ecc])

  const svg = useMemo(
    () => (qr && !qr.error ? qrToSvg(text, { ecc, scale, margin, fg, bg }) : ''),
    [qr, text, ecc, scale, margin, fg, bg]
  )

  const [pngDataUrl, setPngDataUrl] = useState('')

  useEffect(() => {
    let cancelled = false
    if (!text || (qr && qr.error)) {
      if (!cancelled) setPngDataUrl('')
      return undefined
    }
    QRCode.toDataURL(text, { errorCorrectionLevel: ecc, margin, width: 512, color: { dark: fg, light: bg } })
      .then((url) => {
        if (!cancelled) setPngDataUrl(url)
      })
      .catch(() => {
        if (!cancelled) setPngDataUrl('')
      })
    return () => {
      cancelled = true
    }
  }, [text, ecc, margin, fg, bg, qr])

  const ratio = useMemo(() => contrastRatio(fg, bg), [fg, bg])
  const contrastState = ratio >= 4.5 ? 'ok' : ratio >= 2.5 ? 'warn' : 'bad'

  const imgTag = pngDataUrl
    ? `<img src="${pngDataUrl}" width="512" height="512" alt="QR Code" />`
    : ''

  const densityPct = qr && !qr.error ? ((qr.dark / (qr.size * qr.size)) * 100).toFixed(1) : '—'

  const copy = useCallback(
    async (value) => {
      try {
        await navigator.clipboard.writeText(value)
        messageApi.success(t.copied)
      } catch {
        messageApi.error(t.copyErr)
      }
    },
    [t, messageApi]
  )

  const downloadPng = useCallback(() => {
    if (!pngDataUrl) return
    const a = document.createElement('a')
    a.href = pngDataUrl
    a.download = 'qrcode.png'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }, [pngDataUrl])

  const source = useMemo(() => {
    const intro = `// 1) Códifica o texto e lê a matriz binária de módulos (síncrono, sem canvas)
//    QRCode.create devolve { modules, version, ... } do pacote 'qrcode'.
const qr = QRCode.create(text, { errorCorrectionLevel: ecc })
const size = qr.modules.size

// 2) Monta o SVG do zero: um <path> por raia horizontal de módulos escuros
//    (run-length) + <rect> de fundo — compacto mesmo em versões altas.
export function qrToSvg(text, { ecc, scale, margin, fg, bg }) {
  const enc = encodeQr(text, ecc)
  if (!enc || enc.error) return ''
  const { matrix, size } = enc
  const cell = Math.max(1, scale | 0)
  const m = Math.max(0, margin | 0)
  const view = (size + 2 * m) * cell
  const origin = m * cell
  let d = ''
  for (let r = 0; r < size; r++) {
    const y = (r + m) * cell
    let c = 0
    while (c < size) {
      while (c < size && !matrix[r][c]) c++
      if (c >= size) break
      const start = c
      while (c < size && matrix[r][c]) c++
      const w = (c - start) * cell
      d += \`M\${origin + start * cell} \${y}h\${w}v\${cell}h-\${w}z\`
    }
  }
  return (
    \`<svg xmlns="http://www.w3.org/2000/svg" width="\${view}" height="\${view}" \` +
    \`viewBox="0 0 \${view} \${view}" role="img" aria-label="QR Code">\` +
    \`<rect width="100%" height="100%" fill="\${bg}"/>\` +
    (d ? \`<path d="\${d}" fill="\${fg}"/>\` : '') +
    \`</svg>\`
  )
}

// 3) PNG para baixar/copiar: a lib expõe toDataURL (data URI base64).
QRCode.toDataURL(text, { errorCorrectionLevel: ecc, margin, width: 512, color: { dark: fg, light: bg } })

// 4) Aviso de contraste: razão WCAG entre as duas cores escolhidas.
function contrastRatio(hexA, hexB) {
  const la = hexLuminance(hexA)
  const lb = hexLuminance(hexB)
  const [hi, lo] = la >= lb ? [la, lb] : [lb, la]
  return (hi + 0.05) / (lo + 0.05)
}`
    return intro
  }, [])

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {messageContextHolder}
      <Title level={2}><QrcodeOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Alert type="info" showIcon message={t.alertTitle} description={t.alertBody} />

      <Card title={t.inputLabel}>
        <Input.TextArea
          rows={3}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t.inputPlaceholder}
          style={{ fontFamily: 'monospace', fontSize: 14 }}
          allowClear
        />
        <Text type="secondary" style={{ display: 'block', margin: '12px 0 4px' }}>
          {t.examplesLabel}
        </Text>
        <Space size={[8, 8]} wrap>
          {EXAMPLES.map((ex) => (
            <Tag
              key={ex.id}
              color={text === ex.text ? 'blue' : 'default'}
              style={{ cursor: 'pointer', fontSize: 13, padding: '2px 10px' }}
              onClick={() => setText(ex.text)}
            >
              {ex.icon} {ex.id.toUpperCase()}
            </Tag>
          ))}
        </Space>

        <Divider />

        <Space wrap align="center" size="large">
          <Space direction="vertical" size={4}>
            <Text type="secondary">{t.eccLabel}</Text>
            <Segmented
              value={ecc}
              onChange={setEcc}
              options={ECC_LEVELS.map((level) => ({
                value: level,
                label: (
                  <span>
                    <Text strong>{level}</Text> <Text type="secondary" style={{ fontSize: 11 }}>({ECC_PCT[level]}%)</Text>
                  </span>
                ),
              }))}
            />
          </Space>
          <Space direction="vertical" size={4}>
            <Text type="secondary">{t.scaleLabel}</Text>
            <Segmented
              value={scale}
              onChange={setScale}
              options={SCALES.map((s) => ({ value: s.value, label: s.value }))}
            />
          </Space>
          <Space direction="vertical" size={4}>
            <Text type="secondary">{t.marginLabel} ({t.marginDesc})</Text>
            <InputNumber min={0} max={8} value={margin} onChange={(v) => setMargin(v ?? 0)} style={{ width: 80 }} />
          </Space>
        </Space>

        <Space wrap align="center" size="large" style={{ marginTop: 20 }}>
          <Space direction="vertical" size={4}>
            <Text type="secondary">{t.colorsLabel}</Text>
            <Space wrap size="middle" align="center">
              <Space size={6}>
                <ColorPicker value={fg} onChange={(c) => setFg(`#${c.toHex()}`)} disabled={false} />
                <Text>{t.fgLabel}</Text>
              </Space>
              <Space size={6}>
                <ColorPicker value={bg} onChange={(c) => setBg(`#${c.toHex()}`)} />
                <Text>{t.bgLabel}</Text>
              </Space>
            </Space>
          </Space>
          <Tag color={contrastState === 'ok' ? 'green' : contrastState === 'warn' ? 'orange' : 'red'}>
            {contrastState === 'ok' ? t.contrastOk : contrastState === 'warn' ? t.contrastWarn : t.contrastBad} · {ratio.toFixed(1)}
          </Tag>
        </Space>
      </Card>

      <Card title={t.previewTitle}>
        {!text ? (
          <Text type="secondary">{t.empty}</Text>
        ) : qr && qr.error ? (
          <Alert type="error" showIcon message={t.tooBig} />
        ) : (
          <Space direction="vertical" size="middle" align="center" style={{ width: '100%' }}>
            <div
              style={{
                padding: 16,
                background: '#fafafa',
                borderRadius: 10,
                border: '1px solid #f0f0f0',
                display: 'inline-block',
              }}
              dangerouslySetInnerHTML={{ __html: svg }}
            />
            <Descriptions bordered size="small" column={4}>
              <Descriptions.Item label={t.version}><Text strong>{qr.version}</Text></Descriptions.Item>
              <Descriptions.Item label={t.grid}>{qr.size} × {qr.size}</Descriptions.Item>
              <Descriptions.Item label={t.eccRow}>{ecc} ({ECC_PCT[ecc]}%)</Descriptions.Item>
              <Descriptions.Item label={t.payload}>{utf8Bytes(text)} B</Descriptions.Item>
              <Descriptions.Item label={t.darkRow}>{qr.dark}</Descriptions.Item>
              <Descriptions.Item label={t.density}>{densityPct}%</Descriptions.Item>
            </Descriptions>
          </Space>
        )}
      </Card>

      <Card
        title={t.outputTitle}
        extra={
          <Space wrap>
            <Button size="small" icon={<DownloadOutlined />} disabled={!pngDataUrl} onClick={downloadPng}>
              {t.download}
            </Button>
          </Space>
        }
      >
        <Space wrap>
          <Button icon={<CopyOutlined />} disabled={!svg} onClick={() => copy(svg)}>
            {t.svgCopy}
          </Button>
          <Button icon={<CopyOutlined />} disabled={!pngDataUrl} onClick={() => copy(pngDataUrl)}>
            {t.pngCopy}
          </Button>
          <Button icon={<CopyOutlined />} disabled={!imgTag} onClick={() => copy(imgTag)}>
            {t.imgCopy}
          </Button>
        </Space>
        <pre
          style={{
            margin: '12px 0 0',
            fontSize: 12.5,
            lineHeight: 1.6,
            background: '#f5f5f5',
            padding: 12,
            borderRadius: 6,
            overflowX: 'auto',
            maxHeight: 220,
            overflowY: 'auto',
          }}
        >
          {svg ? svg : (pngDataUrl ? pngDataUrl : '')}
        </pre>
      </Card>

      <Collapse
        items={[
          {
            key: 'src',
            label: t.sourceTitle,
            children: <pre style={{ margin: 0, fontSize: 12.5, lineHeight: 1.6, background: '#f5f5f5', padding: 12, borderRadius: 6, overflowX: 'auto' }}>{source}</pre>,
          },
        ]}
      />
    </Space>
  )
}