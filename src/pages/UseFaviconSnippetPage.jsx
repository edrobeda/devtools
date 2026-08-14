import React, { useState } from 'react'
import { Typography, Card, Space, Button, Input, Alert, Radio } from 'antd'
import { CodeOutlined, SmileOutlined, LinkOutlined, ReloadOutlined } from '@ant-design/icons'
import useFavicon from '../hooks/useFavicon'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const sourceCode = `import { useCallback, useEffect, useRef } from 'react'

function getIconLink() {
  return (
    document.querySelector("link[rel='shortcut icon']") ||
    document.querySelector("link[rel='icon']") ||
    null
  )
}

function createIconLink() {
  const link = document.createElement('link')
  link.rel = 'icon'
  link.type = 'image/png'
  document.head.appendChild(link)
  return link
}

function renderEmojiFavicon(emoji, options = {}) {
  const size = options.size || 64
  const bgColor = options.bgColor || 'transparent'
  const color = options.color || '#000000'

  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size

  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  if (bgColor !== 'transparent') {
    ctx.fillStyle = bgColor
    ctx.fillRect(0, 0, size, size)
  }

  ctx.font = \`\${Math.round(size * 0.75)}px serif\`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = color
  ctx.fillText(emoji, size / 2, size / 2 + size * 0.05)

  return canvas.toDataURL('image/png')
}

function resolveHref(href, options) {
  if (typeof href !== 'string') return null
  const trimmed = href.trim()
  if (!trimmed) return null

  if (trimmed.startsWith('emoji:')) {
    const emoji = trimmed.slice(6).trim() || '⭐'
    return renderEmojiFavicon(emoji, options)
  }

  return trimmed
}

export default function useFavicon(initialHref, options = {}) {
  const originalHrefRef = useRef(null)
  const optionsRef = useRef(options)
  optionsRef.current = options

  const setFavicon = useCallback((href) => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return

    const resolved = resolveHref(href, optionsRef.current)
    if (!resolved) return

    let link = getIconLink()
    if (!link) {
      link = createIconLink()
    }
    link.href = resolved
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return undefined

    const link = getIconLink()
    originalHrefRef.current = link?.href || ''

    if (initialHref) {
      setFavicon(initialHref)
    }

    return () => {
      const current = getIconLink()
      if (!current) return
      if (originalHrefRef.current) {
        current.href = originalHrefRef.current
      } else {
        current.remove()
      }
    }
  }, [initialHref, setFavicon])

  return setFavicon
}

// uso:
// const setFavicon = useFavicon('emoji:🚀')
// setFavicon('emoji:🔥')
// setFavicon('https://example.com/favicon.ico')`

const translations = {
  pt: {
    title: 'Snippet: useFavicon',
    intro: (
      <>
        Hook que troca o favicon da aba do navegador em tempo real. Aceita uma URL absoluta,
        data URI ou o prefixo <Text code>emoji:</Text> para renderizar um emoji em um canvas
        e usá-lo como ícone. Ao desmontar o componente, o favicon original é restaurado
        automaticamente.
      </>
    ),
    sourceTitle: 'Código-fonte',
    demoTitle: 'Demonstração',
    demoDesc: 'Clique nos botões para mudar o favicon desta aba:',
    emojiLabel: 'Emoji rápido',
    customEmojiLabel: 'Emoji customizado',
    customEmojiPlaceholder: 'Cole um emoji, ex: 🚀',
    urlLabel: 'URL de imagem',
    urlPlaceholder: 'https://...',
    apply: 'Aplicar',
    restore: 'Restaurar favicon original',
    current: 'Favicon atual',
    note: (
      <>
        A mudança afeta apenas a aba ativa. O favicon original é salvo na montagem e
        restaurado na desmontagem. Emojis são desenhados em um <Text code>{'<canvas>'}</Text> de
        64×64 px e convertidos em data URI.
      </>
    ),
  },
  en: {
    title: 'Snippet: useFavicon',
    intro: (
      <>
        A hook that changes the browser tab favicon in real time. It accepts an absolute URL,
        a data URI or the <Text code>emoji:</Text> prefix to render an emoji onto a canvas and
        use it as the icon. When the component unmounts, the original favicon is automatically
        restored.
      </>
    ),
    sourceTitle: 'Source code',
    demoTitle: 'Demo',
    demoDesc: 'Click the buttons to change this tab\'s favicon:',
    emojiLabel: 'Quick emoji',
    customEmojiLabel: 'Custom emoji',
    customEmojiPlaceholder: 'Paste an emoji, e.g. 🚀',
    urlLabel: 'Image URL',
    urlPlaceholder: 'https://...',
    apply: 'Apply',
    restore: 'Restore original favicon',
    current: 'Current favicon',
    note: (
      <>
        The change only affects the active tab. The original favicon is saved on mount and
        restored on unmount. Emojis are drawn onto a 64×64 <Text code>{'<canvas>'}</Text> and
        converted to a data URI.
      </>
    ),
  },
}

const EMOJI_PRESETS = ['🔥', '🚀', '🐛', '✅', '⚠️', '⭐', '🎉', '💡']

function Demo({ t }) {
  const setFavicon = useFavicon()
  const [mode, setMode] = useState('emoji')
  const [customEmoji, setCustomEmoji] = useState('🚀')
  const [url, setUrl] = useState('')
  const [current, setCurrent] = useState('emoji:⭐')

  const apply = (href) => {
    setFavicon(href)
    setCurrent(href)
  }

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Text type="secondary">{t.demoDesc}</Text>

      <Radio.Group
        value={mode}
        onChange={(e) => setMode(e.target.value)}
        optionType="button"
        buttonStyle="solid"
      >
        <Radio.Button value="emoji"><SmileOutlined /> Emoji</Radio.Button>
        <Radio.Button value="url"><LinkOutlined /> URL</Radio.Button>
      </Radio.Group>

      {mode === 'emoji' && (
        <>
          <Card title={t.emojiLabel} size="small">
            <Space wrap>
              {EMOJI_PRESETS.map((emoji) => (
                <Button key={emoji} onClick={() => apply(`emoji:${emoji}`)}>
                  {emoji}
                </Button>
              ))}
            </Space>
          </Card>

          <Card title={t.customEmojiLabel} size="small">
            <Space.Compact style={{ width: '100%' }}>
              <Input
                value={customEmoji}
                onChange={(e) => setCustomEmoji(e.target.value)}
                placeholder={t.customEmojiPlaceholder}
                maxLength={4}
              />
              <Button type="primary" onClick={() => apply(`emoji:${customEmoji}`)}>
                {t.apply}
              </Button>
            </Space.Compact>
          </Card>
        </>
      )}

      {mode === 'url' && (
        <Card title={t.urlLabel} size="small">
          <Space.Compact style={{ width: '100%' }}>
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={t.urlPlaceholder}
            />
            <Button type="primary" onClick={() => apply(url)}>
              {t.apply}
            </Button>
          </Space.Compact>
        </Card>
      )}

      <Alert
        type="info"
        showIcon
        message={(
          <>
            {t.current}: <Text code>{current}</Text>
          </>
        )}
      />

      <Button icon={<ReloadOutlined />} onClick={() => apply('emoji:⭐')}>
        {t.restore}
      </Button>

      <Paragraph type="secondary" style={{ marginBottom: 0 }}>
        {t.note}
      </Paragraph>
    </Space>
  )
}

export default function UseFaviconSnippetPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><CodeOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card title={t.sourceTitle}>
        <pre style={{ margin: 0, overflowX: 'auto' }}>
          <code>{sourceCode}</code>
        </pre>
      </Card>

      <Card title={t.demoTitle}>
        <Demo t={t} />
      </Card>
    </Space>
  )
}
