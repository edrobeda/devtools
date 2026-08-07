import React, { useMemo, useRef, useState } from 'react'
import { Typography, Card, Space, Button, Slider, Switch, Tag, Input } from 'antd'
import { CheckOutlined, CopyOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

// ─── Componente OTP ──────────────────────────────────────────────
// N caixas de um dígito cada. Sem inputs fantasma: cada caixa é um input
// real controlado por `value` (string concatenada). Digitar avança pro
// próximo campo vazio; Backspace apaga e, se o campo já estiver vazio,
// volta pro anterior e apaga ele; setas esquerda/direita navegam; colar
// um código inteiro preenche a partir do primeiro campo vazio.
function OtpInput({ length, value, onChange }) {
  const refs = useRef([])
  const digits = Array.from({ length }, (_, i) => value[i] || '')

  const focusAt = (i) => {
    refs.current[i]?.focus()
  }

  const nextEmpty = (arr, from) => {
    for (let k = from; k < arr.length; k++) if (!arr[k]) return k
    return arr.length - 1
  }

  const handleChange = (i, raw) => {
    const typed = raw.replace(/\D/g, '')
    const arr = [...digits]
    if (!typed) {
      arr[i] = ''
      onChange(arr.join(''))
      return
    }
    let pos = i
    for (const ch of typed) {
      if (pos < length) arr[pos++] = ch
    }
    onChange(arr.join(''))
    focusAt(nextEmpty(arr, pos))
  }

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace') {
      e.preventDefault()
      const arr = [...digits]
      if (arr[i]) {
        arr[i] = ''
        onChange(arr.join(''))
      } else if (i > 0) {
        arr[i - 1] = ''
        onChange(arr.join(''))
        focusAt(i - 1)
      }
    } else if (e.key === 'ArrowLeft' && i > 0) {
      e.preventDefault()
      focusAt(i - 1)
    } else if (e.key === 'ArrowRight' && i < length - 1) {
      e.preventDefault()
      focusAt(i + 1)
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const text = (e.clipboardData.getData('text') || '').replace(/\D/g, '')
    if (!text) return
    let start = digits.findIndex((c) => !c)
    if (start === -1) return
    const arr = [...digits]
    for (const ch of text) {
      if (start >= length) break
      arr[start++] = ch
    }
    onChange(arr.join(''))
    focusAt(nextEmpty(arr, start))
  }

  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }} onPaste={handlePaste}>
      {Array.from({ length }, (_, i) => (
        <input
          key={i}
          ref={(el) => (refs.current[i] = el)}
          value={digits[i]}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={1}
          aria-label={`digit ${i + 1}`}
          style={{
            width: 46,
            height: 54,
            textAlign: 'center',
            fontSize: 20,
            fontWeight: 600,
            border: '1px solid #d9d9d9',
            borderRadius: 8,
            outline: 'none',
            transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
          }}
          onFocus={(e) => {
            e.target.style.borderColor = '#1677ff'
            e.target.style.boxShadow = '0 0 0 2px rgba(22,119,255,0.15)'
          }}
          onBlur={(e) => {
            e.target.style.borderColor = '#d9d9d9'
            e.target.style.boxShadow = 'none'
          }}
        />
      ))}
    </div>
  )
}

const sourceCode = `function OtpInput({ length, value, onChange }) {
  const refs = useRef([])
  const digits = Array.from({ length }, (_, i) => value[i] || '')

  // Avança o foco pro próximo campo vazio depois de preencher a partir de 'from'
  const nextEmpty = (arr, from) => {
    for (let k = from; k < arr.length; k++) if (!arr[k]) return k
    return arr.length - 1
  }
  const focusAt = (i) => refs.current[i]?.focus()

  const handleChange = (i, raw) => {
    const typed = raw.replace(/\\D/g, '')
    const arr = [...digits]
    if (!typed) { arr[i] = ''; onChange(arr.join('')); return }
    let pos = i
    for (const ch of typed) {          // colar inteiro também passa por aqui
      if (pos < length) arr[pos++] = ch
    }
    onChange(arr.join(''))
    focusAt(nextEmpty(arr, pos))
  }

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace') {
      e.preventDefault()
      const arr = [...digits]
      if (arr[i]) {                    // apaga o próprio dígito
        arr[i] = ''; onChange(arr.join(''))
      } else if (i > 0) {              // vazio: volta e apaga o anterior
        arr[i - 1] = ''; onChange(arr.join('')); focusAt(i - 1)
      }
    } else if (e.key === 'ArrowLeft' && i > 0)  { e.preventDefault(); focusAt(i - 1) }
    else if (e.key === 'ArrowRight' && i < length - 1) { e.preventDefault(); focusAt(i + 1) }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const text = (e.clipboardData.getData('text') || '').replace(/\\D/g, '')
    if (!text) return
    let start = digits.findIndex((c) => !c)   // começa no primeiro vazio
    if (start === -1) return
    const arr = [...digits]
    for (const ch of text) {
      if (start >= length) break
      arr[start++] = ch
    }
    onChange(arr.join(''))
    focusAt(nextEmpty(arr, start))
  }

  return (
    <div style={{ display: 'flex', gap: 8 }} onPaste={handlePaste}>
      {Array.from({ length }, (_, i) => (
        <input
          key={i}
          ref={(el) => (refs.current[i] = el)}
          value={digits[i]}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={1}
          style={{ width: 46, height: 54, textAlign: 'center', fontSize: 20 }}
        />
      ))}
    </div>
  )
}`

const translations = {
  pt: {
    title: 'Componente: Input OTP (código de verificação)',
    intro: (
      <>
        O padrão de campo pra códigos de verificação — N caixas de um{' '}
        dígito cada (email 2FA, senha de cartão, token de login). Sem
        inputs "fantasma": cada caixa é um input real e o componente é{' '}
        <Text code>controlado</Text> por uma string única concatenada. As
        micro-interações que fazem o fluxo ser fluido: digitar avança
        sozinho pro próximo campo vazio, <Text code>Backspace</Text> apaga
        e — se o campo já estiver vazio — volta pro anterior apagando ele,{' '}
        <Text code>←</Text>/<Text code>→</Text> navegam e colar um código
        inteiro preenche tudo a partir do primeiro campo vazio. Só aceita
        dígitos (<Text code>inputMode="numeric"</Text>).
      </>
    ),
    demoTitle: 'Demonstração',
    demoHint: 'Clique numa caixa e digite; use Backspace, setas ou cole um código completo.',
    length: 'Quantidade de dígitos',
    current: 'Código capturado',
    empty: 'ainda vazio — digite para preencher',
    complete: 'preenchido',
    completedMsg: 'Pronto! O código está completo.',
    copy: 'Copiar',
    copied: 'Copiado!',
    placeholderCode: 'Ex.: 482913',
    mask: 'Exibir como senha',
    sourceTitle: 'Código-fonte (componente reutilizável)',
    sourceIntro: (
      <>
        Um único componente de ~60 linhas. O valor é a string concatenada
        (vazia <Text code>""</Text> = nada digitado); quem usa só precisa
        passar <Text code>value</Text> e <Text code>onChange</Text>.
      </>
    ),
    tryText: 'Experimente também preencher com um botão:',
    fillBtn: 'Preencher de exemplo',
  },
  en: {
    title: 'Component: OTP / Verification Code Input',
    intro: (
      <>
        The code-entry pattern for verification codes — N one-digit boxes
        each (2FA email, card PIN, login token). No "ghost" inputs: every
        box is a real input and the component is{' '}
        <Text code>controlled</Text> by a single concatenated string. The
        micro-interactions that make it feel smooth: typing auto-advances
        to the next empty box, <Text code>Backspace</Text> deletes and —
        when the box is already empty — moves back and clears the previous
        one, <Text code>←</Text>/<Text code>→</Text> navigate and pasting a
        full code fills everything from the first empty box. Digits only (
        <Text code>inputMode="numeric"</Text>).
      </>
    ),
    demoTitle: 'Demo',
    demoHint: 'Click a box and type; use Backspace, arrows or paste a full code.',
    length: 'Number of digits',
    current: 'Captured code',
    empty: 'still empty — type to fill it in',
    complete: 'complete',
    completedMsg: 'Done! The code is complete.',
    copy: 'Copy',
    copied: 'Copied!',
    placeholderCode: 'e.g. 482913',
    mask: 'Show as password',
    sourceTitle: 'Source code (reusable component)',
    sourceIntro: (
      <>
        A single ~60-line component. The value is the concatenated string
        (<Text code>""</Text> empty = nothing typed); consumers just pass{' '}
        <Text code>value</Text> and <Text code>onChange</Text>.
      </>
    ),
    tryText: 'You can also fill it with a button:',
    fillBtn: 'Fill with sample',
  },
}

const EXAMPLE_CODE = '482913'

export default function OtpInputPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [length, setLength] = useState(6)
  const [code, setCode] = useState('')
  const [masked, setMasked] = useState(false)
  const [copied, setCopied] = useState(false)

  const isComplete = code.length === length
  const emptyCount = length - code.length

  const boxCounts = useMemo(() => {
    const counts = { filled: Math.min(code.length, length), empty: length }
    counts.empty = length - counts.filled
    return counts
  }, [code, length])

  const display = masked
    ? Array.from({ length }, (_, i) => code[i] ? '\u2022' : '\u2013').join('')
    : (code || t.placeholderCode)

  function handleLengthChange(n) {
    setLength(n)
    setCode((c) => c.slice(0, n))
    setCopied(false)
  }

  function handleFill() {
    setCode(EXAMPLE_CODE.slice(0, length))
    setCopied(false)
  }

  function handleCopy() {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    }).catch(() => {})
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><CheckOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card title={t.demoTitle}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <OtpInput length={length} value={code} onChange={setCode} />
          <Text type="secondary" style={{ fontSize: 12 }}>{t.demoHint}</Text>

          <Space wrap>
            <Space direction="vertical" size={4} style={{ width: 240 }}>
              <Text type="secondary">{t.length}: {length}</Text>
              <Slider min={4} max={8} value={length} onChange={handleLengthChange} />
            </Space>
            <Switch checked={masked} onChange={setMasked} checkedChildren={t.mask} unCheckedChildren={t.mask} />
          </Space>

          <Space direction="vertical" size={8}>
            <Text type="secondary">{t.current}</Text>
            <Input
              readOnly
              value={display}
              suffix={
                isComplete ? (
                  <Button type="text" size="small" icon={<CopyOutlined />} onClick={handleCopy}>
                    {copied ? t.copied : t.copy}
                  </Button>
                ) : undefined
              }
              style={{ maxWidth: 300, fontFamily: 'monospace', letterSpacing: masked ? 6 : 2 }}
            />
            <Space wrap>
              <Tag color={isComplete ? 'green' : 'default'}>
                {boxCounts.filled}/{length}
              </Tag>
              {isComplete ? (
                <Tag color="green" icon={<CheckOutlined />}>{t.complete} · {t.completedMsg}</Tag>
              ) : (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {emptyCount} {t.empty}
                </Text>
              )}
            </Space>
          </Space>

          <Space>
            <Text type="secondary">{t.tryText}</Text>
            <Button onClick={handleFill}>{t.fillBtn}</Button>
          </Space>
        </Space>
      </Card>

      <Card title={t.sourceTitle}>
        <Paragraph type="secondary">{t.sourceIntro}</Paragraph>
        <pre style={{ margin: 0, overflowX: 'auto' }}>
          <code>{sourceCode}</code>
        </pre>
      </Card>
    </Space>
  )
}
