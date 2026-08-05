import React, { useEffect, useMemo, useState } from 'react'
import { Typography, Card, Input, Space, Alert } from 'antd'
import { FieldTimeOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input

const translations = {
  pt: {
    title: 'Timeline de Expiração do JWT',
    intro: (
      <>
        Cola um JSON Web Token e vê as claims de tempo — <Text code>iat</Text>,{' '}
        <Text code>nbf</Text> e <Text code>exp</Text> — desenhadas numa linha
        do tempo, com um marcador de "agora" que se move sozinho e uma
        contagem regressiva ao vivo até expirar (ou desde que expirou). Tudo
        client-side, sem verificar assinatura; complementa o{' '}
        <Text code>/tools/jwt-decoder</Text>, que mostra o header/payload
        crus em vez da linha do tempo.
      </>
    ),
    placeholder: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    invalidTokenTitle: 'Token inválido',
    parseError: 'Token precisa ter 3 partes separadas por ponto (header.payload.signature).',
    noClaims: 'Esse token não tem nenhuma das claims de tempo (iat, nbf, exp) — nada pra desenhar na timeline.',
    issuedAt: 'Emitido (iat)',
    notBefore: 'Válido a partir de (nbf)',
    expiresAt: 'Expira (exp)',
    now: 'Agora',
    timelineTitle: 'Linha do tempo',
    statusValid: 'Válido agora',
    statusExpired: 'Expirado',
    statusNotYetValid: 'Ainda não é válido',
    expiresIn: 'Expira em',
    expiredAgo: 'Expirou há',
    validIn: 'Fica válido em',
    locale: 'pt-BR',
  },
  en: {
    title: 'JWT Expiration Timeline',
    intro: (
      <>
        Paste a JSON Web Token and see its time claims — <Text code>iat</Text>,{' '}
        <Text code>nbf</Text> and <Text code>exp</Text> — plotted on a
        timeline, with a "now" marker that moves on its own and a live
        countdown to expiration (or since it expired). Everything runs
        client-side, no signature verification; complements{' '}
        <Text code>/tools/jwt-decoder</Text>, which shows the raw
        header/payload instead of the timeline.
      </>
    ),
    placeholder: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    invalidTokenTitle: 'Invalid token',
    parseError: 'Token needs 3 parts separated by dots (header.payload.signature).',
    noClaims: 'This token has none of the time claims (iat, nbf, exp) — nothing to plot on the timeline.',
    issuedAt: 'Issued (iat)',
    notBefore: 'Valid from (nbf)',
    expiresAt: 'Expires (exp)',
    now: 'Now',
    timelineTitle: 'Timeline',
    statusValid: 'Valid now',
    statusExpired: 'Expired',
    statusNotYetValid: 'Not yet valid',
    expiresIn: 'Expires in',
    expiredAgo: 'Expired',
    validIn: 'Becomes valid in',
    locale: 'en-US',
  },
}

function base64UrlDecode(segment) {
  const normalized = segment.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=')
  const binary = atob(padded)
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0))
  return new TextDecoder('utf-8').decode(bytes)
}

function decodeJwt(token, parseErrorMessage) {
  const parts = token.trim().split('.')
  if (parts.length !== 3) {
    throw new Error(parseErrorMessage)
  }
  const [rawHeader, rawPayload] = parts
  const header = JSON.parse(base64UrlDecode(rawHeader))
  const payload = JSON.parse(base64UrlDecode(rawPayload))
  return { header, payload }
}

function formatDuration(ms) {
  const abs = Math.abs(ms)
  const days = Math.floor(abs / 86400000)
  const hours = Math.floor((abs / 3600000) % 24)
  const minutes = Math.floor((abs / 60000) % 60)
  const seconds = Math.floor((abs / 1000) % 60)
  const parts = []
  if (days) parts.push(`${days}d`)
  if (days || hours) parts.push(`${hours}h`)
  if (days || hours || minutes) parts.push(`${minutes}min`)
  if (!days && !hours) parts.push(`${seconds}s`)
  return parts.join(' ')
}

function Timeline({ claims, nowMs, t }) {
  const points = []
  if (claims.iat) points.push({ key: 'iat', label: t.issuedAt, ts: claims.iat * 1000, color: '#2a78d6' })
  if (claims.nbf) points.push({ key: 'nbf', label: t.notBefore, ts: claims.nbf * 1000, color: '#d6a52a' })
  if (claims.exp) points.push({ key: 'exp', label: t.expiresAt, ts: claims.exp * 1000, color: '#eb4d4d' })

  const allTs = [...points.map((p) => p.ts), nowMs]
  const min = Math.min(...allTs)
  const max = Math.max(...allTs)
  const span = Math.max(max - min, 1000)
  const pad = span * 0.15
  const rangeMin = min - pad
  const rangeMax = max + pad
  const rangeSpan = rangeMax - rangeMin

  function pct(ts) {
    return ((ts - rangeMin) / rangeSpan) * 100
  }

  return (
    <div style={{ position: 'relative', height: 130, marginTop: 8 }}>
      <div style={{ position: 'absolute', top: 64, left: 0, right: 0, height: 2, background: '#d9d9d9' }} />
      {points.map((p) => (
        <div
          key={p.key}
          style={{
            position: 'absolute',
            left: `${pct(p.ts)}%`,
            top: 20,
            transform: 'translateX(-50%)',
            textAlign: 'center',
            width: 140,
          }}
        >
          <Text style={{ fontSize: 11, display: 'block' }}>{p.label}</Text>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: p.color, margin: '4px auto' }} />
          <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>
            {new Date(p.ts).toLocaleString(t.locale)}
          </Text>
        </div>
      ))}
      <div
        style={{
          position: 'absolute',
          left: `${pct(nowMs)}%`,
          top: 60,
          bottom: 20,
          width: 2,
          background: '#52c41a',
          transform: 'translateX(-50%)',
        }}
      />
      <div style={{ position: 'absolute', left: `${pct(nowMs)}%`, bottom: 0, transform: 'translateX(-50%)' }}>
        <Text style={{ fontSize: 11, color: '#52c41a', fontWeight: 600, whiteSpace: 'nowrap' }}>{t.now}</Text>
      </div>
    </div>
  )
}

export default function JwtTimelinePage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [token, setToken] = useState('')
  const [nowMs, setNowMs] = useState(Date.now())

  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const result = useMemo(() => {
    if (!token.trim()) return { data: null, error: null }
    try {
      return { data: decodeJwt(token, t.parseError), error: null }
    } catch (err) {
      return { data: null, error: err.message }
    }
  }, [token, t.parseError])

  const claims = result.data?.payload || {}
  const hasAnyClaim = Boolean(claims.iat || claims.nbf || claims.exp)

  let status = null
  if (claims.exp && nowMs >= claims.exp * 1000) status = 'expired'
  else if (claims.nbf && nowMs < claims.nbf * 1000) status = 'notYetValid'
  else if (claims.exp || claims.nbf) status = 'valid'

  let statusMessage = ''
  if (status === 'expired') {
    statusMessage = `${t.statusExpired} — ${t.expiredAgo} ${formatDuration(nowMs - claims.exp * 1000)}`
  } else if (status === 'notYetValid') {
    statusMessage = `${t.statusNotYetValid} — ${t.validIn} ${formatDuration(claims.nbf * 1000 - nowMs)}`
  } else if (status === 'valid') {
    statusMessage = t.statusValid + (claims.exp ? ` — ${t.expiresIn} ${formatDuration(claims.exp * 1000 - nowMs)}` : '')
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><FieldTimeOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card>
        <TextArea
          rows={4}
          placeholder={t.placeholder}
          value={token}
          onChange={(e) => setToken(e.target.value)}
          style={{ fontFamily: 'monospace' }}
        />
      </Card>

      {result.error && (
        <Alert type="error" showIcon message={t.invalidTokenTitle} description={result.error} />
      )}

      {result.data && !hasAnyClaim && (
        <Alert type="warning" showIcon message={t.noClaims} />
      )}

      {result.data && hasAnyClaim && (
        <Card title={t.timelineTitle}>
          {status && (
            <Alert
              style={{ marginBottom: 8 }}
              type={status === 'expired' ? 'error' : status === 'notYetValid' ? 'warning' : 'success'}
              showIcon
              message={statusMessage}
            />
          )}
          <Timeline claims={claims} nowMs={nowMs} t={t} />
        </Card>
      )}
    </Space>
  )
}
