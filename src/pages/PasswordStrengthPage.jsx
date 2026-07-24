import React, { useState, useMemo } from 'react'
import { Typography, Card, Space, Input, Progress, Descriptions, Tag } from 'antd'
import { SafetyCertificateOutlined, EyeInvisibleOutlined, EyeTwoTone } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const translations = {
  pt: {
    title: 'Checador de Força de Senha',
    intro: (
      <>
        Digita uma senha e vê a entropia estimada (bits) a partir do
        tamanho do alfabeto usado, uma estimativa aproximada de tempo pra
        quebrar por força bruta, e um score de força — tudo calculado no
        navegador, a senha nunca sai daqui.
      </>
    ),
    placeholder: 'Digite uma senha para testar',
    entropy: 'Entropia estimada',
    bits: 'bits',
    crackTime: 'Tempo estimado de quebra por força bruta (10 bilhões tentativas/s)',
    strength: 'Força',
    veryWeak: 'Muito fraca',
    weak: 'Fraca',
    fair: 'Razoável',
    strong: 'Forte',
    veryStrong: 'Muito forte',
    lowercase: 'minúsculas',
    uppercase: 'maiúsculas',
    numbers: 'números',
    symbols: 'símbolos',
    length: 'Comprimento',
    charTypes: 'Tipos de caractere usados',
    note: 'Estimativa simplificada baseada em entropia de alfabeto — não considera padrões previsíveis (datas, palavras de dicionário, sequências de teclado).',
  },
  en: {
    title: 'Password Strength Checker',
    intro: (
      <>
        Type a password and see the estimated entropy (bits) from the
        character-set size, a rough brute-force crack-time estimate, and a
        strength score — all computed in the browser, the password never
        leaves this page.
      </>
    ),
    placeholder: 'Type a password to test',
    entropy: 'Estimated entropy',
    bits: 'bits',
    crackTime: 'Estimated brute-force crack time (10 billion tries/s)',
    strength: 'Strength',
    veryWeak: 'Very weak',
    weak: 'Weak',
    fair: 'Fair',
    strong: 'Strong',
    veryStrong: 'Very strong',
    lowercase: 'lowercase',
    uppercase: 'uppercase',
    numbers: 'numbers',
    symbols: 'symbols',
    length: 'Length',
    charTypes: 'Character types used',
    note: 'Simplified estimate based on character-set entropy — does not account for predictable patterns (dates, dictionary words, keyboard sequences).',
  },
}

function analyze(password) {
  const hasLower = /[a-z]/.test(password)
  const hasUpper = /[A-Z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  const hasSymbol = /[^a-zA-Z0-9]/.test(password)

  let poolSize = 0
  if (hasLower) poolSize += 26
  if (hasUpper) poolSize += 26
  if (hasNumber) poolSize += 10
  if (hasSymbol) poolSize += 33

  const entropy = password.length > 0 && poolSize > 0
    ? password.length * Math.log2(poolSize)
    : 0

  const guesses = Math.pow(2, entropy)
  const seconds = guesses / 1e10

  return { hasLower, hasUpper, hasNumber, hasSymbol, entropy, seconds }
}

function formatDuration(seconds, lang) {
  if (!isFinite(seconds) || seconds < 1e-3) return lang === 'pt' ? 'instantâneo' : 'instant'
  const units = [
    [60, lang === 'pt' ? 'segundos' : 'seconds'],
    [60, lang === 'pt' ? 'minutos' : 'minutes'],
    [24, lang === 'pt' ? 'horas' : 'hours'],
    [365, lang === 'pt' ? 'dias' : 'days'],
    [Infinity, lang === 'pt' ? 'anos' : 'years'],
  ]
  let value = seconds
  let unitLabel = lang === 'pt' ? 'segundos' : 'seconds'
  for (const [factor, label] of units) {
    if (value < factor) {
      unitLabel = label
      break
    }
    value /= factor
    unitLabel = label
  }
  if (value > 1e6) return `${value.toExponential(2)} ${unitLabel}`
  return `${value.toFixed(1)} ${unitLabel}`
}

function strengthFromEntropy(entropy) {
  if (entropy === 0) return { level: 0, key: 'veryWeak', color: '#d9d9d9' }
  if (entropy < 28) return { level: 1, key: 'veryWeak', color: '#ff4d4f' }
  if (entropy < 36) return { level: 2, key: 'weak', color: '#ff7a45' }
  if (entropy < 60) return { level: 3, key: 'fair', color: '#faad14' }
  if (entropy < 80) return { level: 4, key: 'strong', color: '#52c41a' }
  return { level: 5, key: 'veryStrong', color: '#389e0d' }
}

export default function PasswordStrengthPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [password, setPassword] = useState('')

  const result = useMemo(() => analyze(password), [password])
  const strength = strengthFromEntropy(result.entropy)

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><SafetyCertificateOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card>
        <Input.Password
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t.placeholder}
          iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
          size="large"
        />
      </Card>

      <Card>
        <Progress
          percent={Math.min(100, (strength.level / 5) * 100)}
          strokeColor={strength.color}
          showInfo={false}
        />
        <Text strong style={{ color: strength.color }}>{t[strength.key]}</Text>

        <Descriptions bordered size="small" column={1} style={{ marginTop: 16 }}>
          <Descriptions.Item label={t.length}>{password.length}</Descriptions.Item>
          <Descriptions.Item label={t.charTypes}>
            <Space wrap>
              {result.hasLower && <Tag>{t.lowercase}</Tag>}
              {result.hasUpper && <Tag>{t.uppercase}</Tag>}
              {result.hasNumber && <Tag>{t.numbers}</Tag>}
              {result.hasSymbol && <Tag>{t.symbols}</Tag>}
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label={t.entropy}>{result.entropy.toFixed(1)} {t.bits}</Descriptions.Item>
          <Descriptions.Item label={t.crackTime}>{formatDuration(result.seconds, lang)}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Paragraph type="secondary" style={{ fontSize: 12 }}>{t.note}</Paragraph>
    </Space>
  )
}
