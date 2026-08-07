import React, { useMemo, useState } from 'react'
import { Typography, Card, Space, Input, Tag, Descriptions, Button } from 'antd'
import { GlobalOutlined, DesktopOutlined, MobileOutlined, TabletOutlined, SendOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

// ─── Parser de User-Agent ────────────────────────────────────────────────
// Detecta navegador, motor de renderização, SO e tipo de dispositivo a
// partir da string `User-Agent`. Tudo por regex, sem API externa. A ordem
// de teste importa: tokens específicos (Edg, OPR, CriOS, FxiOS...) antes
// dos genéricos (Chrome, Safari, Firefox).
const WINDOWS = [
  ['10.0', 'Windows 10 / 11'],
  ['6.3', 'Windows 8.1'],
  ['6.2', 'Windows 8'],
  ['6.1', 'Windows 7'],
  ['6.0', 'Windows Vista'],
  ['5.1', 'Windows XP'],
]

function detectBrowser(s) {
  if (s.includes('Edg/')) return ['Edge (Chromium)', s.match(/Edg\/([\d.]+)/)?.[1] || null]
  if (s.includes('Edge/')) return ['Edge (Legacy)', s.match(/Edge\/([\d.]+)/)?.[1] || null]
  if (s.includes('OPR/')) return ['Opera', s.match(/OPR\/([\d.]+)/)?.[1] || null]
  if (s.includes('Opera')) return ['Opera', s.match(/Opera[ /]([\d.]+)/)?.[1] || null]
  if (s.includes('SamsungBrowser')) return ['Samsung Internet', s.match(/SamsungBrowser\/([\d.]+)/)?.[1] || null]
  if (s.includes('CriOS')) return ['Chrome (iOS)', s.match(/CriOS\/([\d.]+)/)?.[1] || null]
  if (s.includes('FxiOS')) return ['Firefox (iOS)', s.match(/FxiOS\/([\d.]+)/)?.[1] || null]
  if (s.includes('EdgiOS')) return ['Edge (iOS)', s.match(/EdgiOS\/([\d.]+)/)?.[1] || null]
  if (s.includes('MSIE')) return ['Internet Explorer', s.match(/MSIE ([\d.]+)/)?.[1] || s.match(/rv:([\d.]+)/)?.[1] || null]
  if (s.includes('Trident')) return ['Internet Explorer', s.match(/rv:([\d.]+)/)?.[1] || null]
  if (s.includes('Firefox/')) return ['Firefox', s.match(/Firefox\/([\d.]+)/)?.[1] || null]
  if (s.includes('Chromium')) return ['Chromium', s.match(/Chromium\/([\d.]+)/)?.[1] || null]
  if (s.includes('Chrome')) return ['Chrome', s.match(/Chrome\/([\d.]+)/)?.[1] || null]
  if (s.includes('Safari')) {
    const v = s.match(/Version\/([\d.]+)/)?.[1]
    return ['Safari', v || null]
  }
  return ['Desconhecido / Unknown', null]
}

function detectEngine(s) {
  if (/Edg\/|Edge\/|OPR\/|Chrome\/|CriOS\/|CrOS\//.test(s)) return 'Blink'
  if (/Firefox\/|FxiOS/.test(s)) return 'Gecko'
  if (/Safari\//.test(s) && !/Chrome\//.test(s)) return 'WebKit'
  if (/Trident|MSIE/.test(s)) return 'Trident'
  return 'Desconhecido / Unknown'
}

function detectOs(s) {
  const win = WINDOWS.find(([v]) => s.includes(`Windows NT ${v}`))
  if (win) return { name: win[1], version: null }
  if (s.includes('Android')) return { name: 'Android', version: s.match(/Android ([\d.]+)/)?.[1] || null }
  if (s.includes('iPad')) return { name: 'iPadOS', version: s.match(/iPhone OS ([\d_]+)/)?.[1]?.replace(/_/g, '.') || null }
  if (s.includes('iPhone') || s.includes('iPod')) return { name: 'iOS', version: s.match(/iPhone OS ([\d_]+)/)?.[1]?.replace(/_/g, '.') || null }
  if (s.includes('CrOS')) return { name: 'ChromeOS', version: null }
  const mac = s.match(/Mac OS X ([\d_.]+)/)
  if (mac || s.includes('Macintosh')) return { name: 'macOS', version: mac ? mac[1].replace(/_/g, '.') : null }
  if (s.includes('Windows Phone')) return { name: 'Windows Phone', version: null }
  if (s.includes('Ubuntu')) return { name: 'Ubuntu (Linux)', version: null }
  if (s.includes('X11;') || s.includes('Linux')) return { name: 'Linux', version: null }
  return { name: 'Desconhecido / Unknown', version: null }
}

function detectDevice(s) {
  if (s.includes('iPad')) return 'Tablet'
  if (s.includes('iPhone') || s.includes('iPod')) return 'Mobile'
  if (s.includes('Android')) return /Mobile/.test(s) ? 'Mobile' : 'Tablet'
  if (s.includes('Mobile')) return 'Mobile'
  return 'Desktop'
}

function parseUserAgent(raw) {
  const s = String(raw || '')
  const [browser, browserVersion] = detectBrowser(s)
  const os = detectOs(s)
  const device = detectDevice(s)
  return {
    browser,
    browserVersion,
    engine: detectEngine(s),
    os: os.name,
    osVersion: os.version,
    device,
  }
}

const SOURCE_SNIPPET = `// Navegador — tokens específicos primeiro (a ordem importa):
const isEdge = ua.includes('Edg/') || ua.includes('Edge/')
const isOpera = ua.includes('OPR/')
const isSamsung = ua.includes('SamsungBrowser')
const isIOSWebView = /CriOS|FxiOS|EdgiOS/.test(ua)
const isFirefox = /Firefox\\/|FxiOS/.test(ua)
const isChrome = ua.includes('Chrome')
const isSafari = ua.includes('Safari') && !isChrome

// OS — marcadores clássicos do cabeçalho:
//   'Windows NT 10.0' | 'Android 14' | 'iPhone OS 17_5'
//   | 'Mac OS X 10_15_7' | 'CrOS' | 'X11; Linux'
// Dispositivo — presença de tokens de mobile/tablet:
//   /iPad|iPhone|Android|Mobile/`

const EXAMPLES = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15',
  'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:127.0) Gecko/20100101 Firefox/127.0',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.0.0',
]

const translations = {
  pt: {
    title: 'Parser de User-Agent',
    intro: 'Cola uma string User-Agent e descobre navegador, motor de renderização, sistema operacional e tipo de dispositivo — tudo client-side, via regex, sem chamada externa. Útil pra interpretar logs e analytics ou conferir como seu app enxerga o visitante.',
    placeholder: 'Cole aqui um User-Agent HTTP...',
    example: 'Exemplo',
    collected: 'Detecção atual',
    browser: 'Navegador',
    engine: 'Motor de renderização',
    os: 'Sistema operacional',
    device: 'Dispositivo',
    unknown: 'Desconhecido',
    howTitle: 'Como funciona',
    howBody: 'Tudo por regex, na ordem de especificidade: navegadores com token próprio (Edg, OPR, CriOS, FxiOS, SamsungBrowser) antes dos genéricos (Chrome, Firefox, Safari); OS por marcadores como Windows NT / Android / iPhone OS / Mac OS X / CrOS; e o dispositivo pela presença de tokens de mobile/tablet. A string nunca sai do seu navegador.',
    detectMine: 'Usar o meu navegador',
    yourUa: 'Seu User-Agent atual',
  },
  en: {
    title: 'User-Agent Parser',
    intro: 'Paste a User-Agent string and find the browser, rendering engine, OS and device type — fully client-side via regexes, no external API. Handy for reading logs and analytics or checking how your app sees the visitor.',
    placeholder: 'Paste an HTTP User-Agent here...',
    example: 'Example',
    collected: 'Current detection',
    browser: 'Browser',
    engine: 'Rendering engine',
    os: 'Operating system',
    device: 'Device',
    unknown: 'Unknown',
    howTitle: 'Under the hood',
    howBody: 'All detection runs via regexes in order of specificity: browsers with their own token (Edg, OPR, CriOS, FxiOS, SamsungBrowser) before generic ones (Chrome, Firefox, Safari); OS by markers such as Windows NT / Android / iPhone OS / Mac OS X / CrOS; and device by the presence of mobile/tablet tokens. The string never leaves your browser.',
    detectMine: 'Use my browser',
    yourUa: 'Your current User-Agent',
  },
}

const DEVICE_ICONS = {
  Mobile: <MobileOutlined />,
  Tablet: <TabletOutlined />,
  Desktop: <DesktopOutlined />,
}

export default function UserAgentParserPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [input, setInput] = useState('')

  const selfUa = typeof navigator !== 'undefined' ? navigator.userAgent : ''

  const result = useMemo(() => parseUserAgent(input), [input])

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><GlobalOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card>
        <Input.TextArea
          rows={4}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t.placeholder}
          style={{ fontFamily: 'monospace' }}
        />
        <Space wrap style={{ marginTop: 12 }}>
          {EXAMPLES.map((ex, i) => (
            <Button key={i} size="small" onClick={() => setInput(ex)}>{t.example} {i + 1}</Button>
          ))}
          <Button size="small" type="primary" icon={<SendOutlined />} onClick={() => setInput(selfUa)}>
            {t.detectMine}
          </Button>
        </Space>
      </Card>

      {input.trim() ? (
        <Card title={t.collected}>
          <Space wrap style={{ marginBottom: 16 }}>
            <Tag icon={DEVICE_ICONS[result.device] || <DesktopOutlined />} color="blue">
              {result.device}
            </Tag>
            <Tag color="geekblue">
              {t.browser}: {result.browser}{result.browserVersion ? ` v${result.browserVersion}` : ''}
            </Tag>
            <Tag color="purple">{t.engine}: {result.engine}</Tag>
            <Tag color="cyan">{t.os}: {result.os}{result.osVersion ? ` v${result.osVersion}` : ''}</Tag>
          </Space>
          <Descriptions bordered size="small" column={1}>
            <Descriptions.Item label={t.browser}>
              <Text code>{result.browser}</Text>
              {result.browserVersion && <Text type="secondary"> — v{result.browserVersion}</Text>}
            </Descriptions.Item>
            <Descriptions.Item label={t.engine}><Text code>{result.engine}</Text></Descriptions.Item>
            <Descriptions.Item label={t.os}>
              <Text code>{result.os}</Text>
              {result.osVersion && <Text type="secondary"> — v{result.osVersion}</Text>}
            </Descriptions.Item>
            <Descriptions.Item label={t.device}><Text code>{result.device}</Text></Descriptions.Item>
          </Descriptions>
        </Card>
      ) : (
        <Card>
          <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>{t.yourUa}:</Text>
          <Text code style={{ wordBreak: 'break-all' }}>{selfUa}</Text>
          <Paragraph type="secondary" style={{ marginTop: 12, marginBottom: 0 }}>{t.howBody}</Paragraph>
        </Card>
      )}

      <Card title={t.howTitle}>
        <pre style={{ margin: 0, overflowX: 'auto' }}><code>{SOURCE_SNIPPET}</code></pre>
      </Card>
    </Space>
  )
}