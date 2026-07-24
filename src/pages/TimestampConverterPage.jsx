import React, { useState } from 'react'
import { Typography, Card, Input, Space, Button, Descriptions, DatePicker, Alert } from 'antd'
import { FieldTimeOutlined, CopyOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const translations = {
  pt: {
    title: 'Conversor de Timestamp',
    intro: (
      <>
        Converte entre timestamp Unix (segundos ou milissegundos) e data
        legível — tudo local via <Text code>Date</Text>, nenhum dado sai do
        navegador.
      </>
    ),
    toDateTitle: 'Timestamp → Data',
    timestampPlaceholder: 'Ex: 1721836800 ou 1721836800000',
    now: 'Usar agora',
    invalidTimestamp: 'Timestamp inválido',
    local: 'Local',
    utc: 'UTC (ISO 8601)',
    unitDetected: 'Unidade detectada',
    seconds: 'segundos',
    milliseconds: 'milissegundos',
    toTimestampTitle: 'Data → Timestamp',
    pickDate: 'Escolha uma data e hora',
    secondsLabel: 'Segundos',
    msLabel: 'Milissegundos',
    copy: 'Copiar',
    copiedMessage: 'Copiado',
  },
  en: {
    title: 'Timestamp Converter',
    intro: (
      <>
        Converts between Unix timestamp (seconds or milliseconds) and a
        readable date — all local via <Text code>Date</Text>, no data
        leaves the browser.
      </>
    ),
    toDateTitle: 'Timestamp → Date',
    timestampPlaceholder: 'e.g.: 1721836800 or 1721836800000',
    now: 'Use now',
    invalidTimestamp: 'Invalid timestamp',
    local: 'Local',
    utc: 'UTC (ISO 8601)',
    unitDetected: 'Detected unit',
    seconds: 'seconds',
    milliseconds: 'milliseconds',
    toTimestampTitle: 'Date → Timestamp',
    pickDate: 'Pick a date and time',
    secondsLabel: 'Seconds',
    msLabel: 'Milliseconds',
    copy: 'Copy',
    copiedMessage: 'Copied',
  },
}

// Timestamps em segundos ficam na casa dos 10 dígitos (até ~2286); acima
// disso, assume-se milissegundos.
function detectUnit(numeric) {
  return Math.abs(numeric) >= 1e12 || (Math.abs(numeric) < 1e12 && Math.abs(numeric) >= 1e11)
    ? 'ms'
    : Math.abs(numeric) >= 1e10
      ? 'ms'
      : 's'
}

export default function TimestampConverterPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [tsInput, setTsInput] = useState('')
  const [tsError, setTsError] = useState(null)
  const [tsResult, setTsResult] = useState(null)

  const [pickedDate, setPickedDate] = useState(null)

  function handleTsChange(value) {
    setTsInput(value)
    if (!value.trim()) {
      setTsResult(null)
      setTsError(null)
      return
    }
    const numeric = Number(value.trim())
    if (!Number.isFinite(numeric)) {
      setTsError(t.invalidTimestamp)
      setTsResult(null)
      return
    }
    const unit = detectUnit(numeric)
    const ms = unit === 's' ? numeric * 1000 : numeric
    const date = new Date(ms)
    if (Number.isNaN(date.getTime())) {
      setTsError(t.invalidTimestamp)
      setTsResult(null)
      return
    }
    setTsError(null)
    setTsResult({
      unit,
      local: date.toLocaleString(),
      utc: date.toISOString(),
    })
  }

  function handleUseNow() {
    const now = Date.now()
    handleTsChange(String(now))
  }

  function handleCopy(value) {
    navigator.clipboard.writeText(String(value))
  }

  const seconds = pickedDate ? Math.floor(pickedDate.valueOf() / 1000) : null
  const ms = pickedDate ? pickedDate.valueOf() : null

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><FieldTimeOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card title={t.toDateTitle}>
        <Space.Compact style={{ width: '100%' }}>
          <Input
            placeholder={t.timestampPlaceholder}
            value={tsInput}
            onChange={(e) => handleTsChange(e.target.value)}
            style={{ fontFamily: 'monospace' }}
          />
          <Button onClick={handleUseNow}>{t.now}</Button>
        </Space.Compact>

        {tsError && (
          <Alert style={{ marginTop: 12 }} type="error" showIcon message={tsError} />
        )}

        {tsResult && (
          <Descriptions style={{ marginTop: 16 }} column={1} bordered size="small">
            <Descriptions.Item label={t.unitDetected}>
              {tsResult.unit === 's' ? t.seconds : t.milliseconds}
            </Descriptions.Item>
            <Descriptions.Item label={t.local}>{tsResult.local}</Descriptions.Item>
            <Descriptions.Item label={t.utc}>
              <Space>
                <Text code>{tsResult.utc}</Text>
                <Button size="small" icon={<CopyOutlined />} onClick={() => handleCopy(tsResult.utc)} />
              </Space>
            </Descriptions.Item>
          </Descriptions>
        )}
      </Card>

      <Card title={t.toTimestampTitle}>
        <DatePicker
          showTime
          placeholder={t.pickDate}
          style={{ width: '100%' }}
          onChange={(value) => setPickedDate(value)}
        />

        {pickedDate && (
          <Descriptions style={{ marginTop: 16 }} column={1} bordered size="small">
            <Descriptions.Item label={t.secondsLabel}>
              <Space>
                <Text code>{seconds}</Text>
                <Button size="small" icon={<CopyOutlined />} onClick={() => handleCopy(seconds)} />
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label={t.msLabel}>
              <Space>
                <Text code>{ms}</Text>
                <Button size="small" icon={<CopyOutlined />} onClick={() => handleCopy(ms)} />
              </Space>
            </Descriptions.Item>
          </Descriptions>
        )}
      </Card>
    </Space>
  )
}
