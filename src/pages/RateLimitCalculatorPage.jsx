import React, { useState, useMemo } from 'react'
import { Typography, Card, Space, InputNumber, Select, Descriptions } from 'antd'
import { DatabaseOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const UNIT_SECONDS = {
  second: 1,
  minute: 60,
  hour: 3600,
  day: 86400,
}

const translations = {
  pt: {
    title: 'Calculadora de Rate Limit',
    intro: (
      <>
        Informa um limite de requisições por janela de tempo e calcula a
        taxa equivalente em outras unidades, o intervalo mínimo entre
        requisições (fixed window) e uma estimativa de burst permitido —
        só matemática, sem chamada de rede.
      </>
    ),
    limit: 'Limite de requisições',
    window: 'Janela de tempo',
    second: 'segundo',
    minute: 'minuto',
    hour: 'hora',
    day: 'dia',
    perSecond: 'Requisições / segundo',
    perMinute: 'Requisições / minuto',
    perHour: 'Requisições / hora',
    perDay: 'Requisições / dia',
    interval: 'Intervalo mínimo entre requisições (fixed window)',
    note: (
      <>
        Em um esquema <Text code>fixed window</Text>, todas as requisições
        do limite podem, no pior caso, ser consumidas no início da janela
        seguido de outra rajada no início da próxima — um burst de até 2×
        o limite em um curto intervalo perto da fronteira das janelas. Um
        esquema <Text code>sliding window</Text> ou <Text code>token
        bucket</Text> evita esse efeito.
      </>
    ),
    burstNote: 'Burst máximo possível perto da fronteira de janelas (fixed window)',
  },
  en: {
    title: 'Rate Limit Calculator',
    intro: (
      <>
        Enter a request limit per time window and calculate the equivalent
        rate in other units, the minimum interval between requests (fixed
        window), and an estimate of the allowed burst — pure math, no
        network call.
      </>
    ),
    limit: 'Request limit',
    window: 'Time window',
    second: 'second',
    minute: 'minute',
    hour: 'hour',
    day: 'day',
    perSecond: 'Requests / second',
    perMinute: 'Requests / minute',
    perHour: 'Requests / hour',
    perDay: 'Requests / day',
    interval: 'Minimum interval between requests (fixed window)',
    note: (
      <>
        In a <Text code>fixed window</Text> scheme, the entire limit can,
        in the worst case, be consumed right at the start of a window,
        followed by another burst at the start of the next one — up to 2×
        the limit in a short span near the window boundary. A{' '}
        <Text code>sliding window</Text> or <Text code>token bucket</Text>{' '}
        scheme avoids this effect.
      </>
    ),
    burstNote: 'Max possible burst near a window boundary (fixed window)',
  },
}

export default function RateLimitCalculatorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [limit, setLimit] = useState(100)
  const [windowValue, setWindowValue] = useState(1)
  const [windowUnit, setWindowUnit] = useState('minute')

  const stats = useMemo(() => {
    const windowSeconds = (windowValue || 0) * UNIT_SECONDS[windowUnit]
    if (!limit || !windowSeconds) return null
    const perSecond = limit / windowSeconds
    return {
      perSecond,
      perMinute: perSecond * 60,
      perHour: perSecond * 3600,
      perDay: perSecond * 86400,
      intervalMs: (windowSeconds / limit) * 1000,
      burst: limit * 2,
    }
  }, [limit, windowValue, windowUnit])

  function fmt(n) {
    if (!isFinite(n)) return '—'
    return n >= 100 ? n.toFixed(1) : n.toFixed(4).replace(/0+$/, '').replace(/\.$/, '')
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><DatabaseOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card>
        <Space wrap size="middle">
          <div>
            <Text strong>{t.limit}</Text>
            <div><InputNumber min={1} value={limit} onChange={setLimit} style={{ width: 140 }} /></div>
          </div>
          <div>
            <Text strong>{t.window}</Text>
            <div>
              <Space.Compact>
                <InputNumber min={1} value={windowValue} onChange={setWindowValue} style={{ width: 100 }} />
                <Select
                  value={windowUnit}
                  onChange={setWindowUnit}
                  style={{ width: 130 }}
                  options={[
                    { value: 'second', label: t.second },
                    { value: 'minute', label: t.minute },
                    { value: 'hour', label: t.hour },
                    { value: 'day', label: t.day },
                  ]}
                />
              </Space.Compact>
            </div>
          </div>
        </Space>
      </Card>

      {stats && (
        <Card>
          <Descriptions bordered size="small" column={1}>
            <Descriptions.Item label={t.perSecond}>{fmt(stats.perSecond)}</Descriptions.Item>
            <Descriptions.Item label={t.perMinute}>{fmt(stats.perMinute)}</Descriptions.Item>
            <Descriptions.Item label={t.perHour}>{fmt(stats.perHour)}</Descriptions.Item>
            <Descriptions.Item label={t.perDay}>{fmt(stats.perDay)}</Descriptions.Item>
            <Descriptions.Item label={t.interval}>{fmt(stats.intervalMs)} ms</Descriptions.Item>
            <Descriptions.Item label={t.burstNote}>{stats.burst}</Descriptions.Item>
          </Descriptions>
        </Card>
      )}

      <Paragraph type="secondary">{t.note}</Paragraph>
    </Space>
  )
}
