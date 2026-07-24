import React, { useState, useMemo } from 'react'
import { Typography, Card, Space, DatePicker, Statistic, Button } from 'antd'
import { CalendarOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

function nextFriday() {
  const now = dayjs()
  let day = now.day()
  let diff = (5 - day + 7) % 7
  if (diff === 0) diff = 7
  return now.add(diff, 'day').hour(18).minute(0).second(0)
}

const translations = {
  pt: {
    title: 'Quantos dias até...',
    intro: (
      <>
        Escolhe uma data (por padrão, a próxima sexta-feira às 18h) e vê
        quantos dias, horas e minutos faltam — atualizado ao vivo, tudo
        calculado com <Text code>Date</Text> no navegador.
      </>
    ),
    targetDate: 'Data alvo',
    useNextFriday: 'Usar próxima sexta',
    days: 'Dias',
    hours: 'Horas',
    minutes: 'Minutos',
    past: 'Essa data já passou!',
    remaining: 'restantes até',
  },
  en: {
    title: 'How many days until...',
    intro: (
      <>
        Pick a date (defaults to next Friday at 6pm) and see how many
        days, hours and minutes remain — updates live, all computed with{' '}
        <Text code>Date</Text> in the browser.
      </>
    ),
    targetDate: 'Target date',
    useNextFriday: 'Use next Friday',
    days: 'Days',
    hours: 'Hours',
    minutes: 'Minutes',
    past: 'That date has already passed!',
    remaining: 'remaining until',
  },
}

export default function DaysUntilPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [target, setTarget] = useState(nextFriday())
  const [now, setNow] = useState(dayjs())

  React.useEffect(() => {
    const interval = setInterval(() => setNow(dayjs()), 1000)
    return () => clearInterval(interval)
  }, [])

  const diff = useMemo(() => {
    const totalMs = target.diff(now)
    const isPast = totalMs < 0
    const abs = Math.abs(totalMs)
    const days = Math.floor(abs / (1000 * 60 * 60 * 24))
    const hours = Math.floor((abs / (1000 * 60 * 60)) % 24)
    const minutes = Math.floor((abs / (1000 * 60)) % 60)
    return { isPast, days, hours, minutes }
  }, [target, now])

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><CalendarOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card>
        <Space wrap>
          <div>
            <Text strong>{t.targetDate}</Text>
            <div>
              <DatePicker
                showTime
                value={target}
                onChange={(value) => value && setTarget(value)}
                style={{ width: 220 }}
              />
            </div>
          </div>
          <Button style={{ marginTop: 22 }} onClick={() => setTarget(nextFriday())}>{t.useNextFriday}</Button>
        </Space>
      </Card>

      <Card>
        {diff.isPast && <Paragraph type="danger">{t.past}</Paragraph>}
        <Space size="large" wrap>
          <Statistic title={t.days} value={diff.days} />
          <Statistic title={t.hours} value={diff.hours} />
          <Statistic title={t.minutes} value={diff.minutes} />
        </Space>
        <Paragraph type="secondary" style={{ marginTop: 16 }}>
          {t.remaining} {target.format('DD/MM/YYYY HH:mm')}
        </Paragraph>
      </Card>
    </Space>
  )
}
