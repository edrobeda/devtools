import React from 'react'
import { Typography, Card, Space, Statistic, Tag, Alert, Progress } from 'antd'
import { CodeOutlined, ThunderboltOutlined, StopOutlined } from '@ant-design/icons'
import useBattery from '../hooks/useBattery'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const sourceCode = `import { useEffect, useState } from 'react'

function readBattery(battery) {
  return {
    supported: true,
    loading: false,
    level: battery.level,
    charging: battery.charging,
    chargingTime: battery.chargingTime,
    dischargingTime: battery.dischargingTime,
  }
}

export default function useBattery() {
  const [state, setState] = useState(() => ({
    supported: typeof navigator !== 'undefined' && 'getBattery' in navigator,
    loading: typeof navigator !== 'undefined' && 'getBattery' in navigator,
    level: null,
    charging: null,
    chargingTime: null,
    dischargingTime: null,
  }))

  useEffect(() => {
    let battery = null
    let removed = false

    if (!('getBattery' in navigator)) {
      setState((s) => ({ ...s, loading: false }))
      return
    }

    const update = () => {
      if (!battery) return
      setState(readBattery(battery))
    }

    navigator.getBattery().then((bat) => {
      if (removed) return
      battery = bat
      update()
      battery.addEventListener('levelchange', update)
      battery.addEventListener('chargingchange', update)
      battery.addEventListener('chargingtimechange', update)
      battery.addEventListener('dischargingtimechange', update)
    })

    return () => {
      removed = true
      if (!battery) return
      battery.removeEventListener('levelchange', update)
      battery.removeEventListener('chargingchange', update)
      battery.removeEventListener('chargingtimechange', update)
      battery.removeEventListener('dischargingtimechange', update)
    }
  }, [])

  return state
}`

const translations = {
  pt: {
    title: 'Snippet: useBattery',
    intro: (
      <>
        Hook que expõe o estado da bateria do dispositivo via{' '}
        <Text code>Battery API</Text>: nível de carga, se está plugado e os
        tempos estimados de carregamento/descarregamento. Atualiza em tempo real
        quando o usuário conecta ou desconecta o carregador. Já está em{' '}
        <Text code>src/hooks/useBattery.js</Text>, pronto pra importar.
      </>
    ),
    sourceTitle: 'Código-fonte',
    demoTitle: 'Demonstração ao vivo',
    unsupported: 'Battery API não disponível neste navegador.',
    loading: 'Lendo estado da bateria...',
    levelLabel: 'Nível',
    chargingLabel: 'Status',
    chargingYes: 'Carregando',
    chargingNo: 'Na bateria',
    chargingTimeLabel: 'Tempo até carga completa',
    dischargingTimeLabel: 'Tempo restante de bateria',
    unknown: 'desconhecido',
    seconds: 's',
    minutes: 'min',
    hours: 'h',
    lowBattery: 'Bateria baixa',
    fullBattery: 'Carga completa',
  },
  en: {
    title: 'Snippet: useBattery',
    intro: (
      <>
        A hook that exposes the device battery state through the{' '}
        <Text code>Battery API</Text>: charge level, whether it is plugged in,
        and estimated charging/discharging times. It updates in real time when
        the user plugs or unplugs the charger. It already lives in{' '}
        <Text code>src/hooks/useBattery.js</Text>, ready to import.
      </>
    ),
    sourceTitle: 'Source code',
    demoTitle: 'Live demo',
    unsupported: 'Battery API is not available in this browser.',
    loading: 'Reading battery state...',
    levelLabel: 'Level',
    chargingLabel: 'Status',
    chargingYes: 'Charging',
    chargingNo: 'On battery',
    chargingTimeLabel: 'Time until full',
    dischargingTimeLabel: 'Battery time remaining',
    unknown: 'unknown',
    seconds: 's',
    minutes: 'min',
    hours: 'h',
    lowBattery: 'Low battery',
    fullBattery: 'Fully charged',
  },
}

function formatSeconds(value, t) {
  if (value === null || value === undefined || Number.isNaN(value)) return t.unknown
  if (!Number.isFinite(value)) return t.unknown
  const hours = Math.floor(value / 3600)
  const minutes = Math.floor((value % 3600) / 60)
  const seconds = Math.floor(value % 60)
  const parts = []
  if (hours > 0) parts.push(`${hours}${t.hours}`)
  if (minutes > 0 || hours > 0) parts.push(`${minutes}${t.minutes}`)
  parts.push(`${seconds}${t.seconds}`)
  return parts.join(' ')
}

function BatteryDemo({ t }) {
  const battery = useBattery()

  if (!battery.supported) {
    return <Alert type="warning" showIcon icon={<StopOutlined />} message={t.unsupported} />
  }

  if (battery.loading) {
    return <Alert type="info" showIcon message={t.loading} />
  }

  const percent = battery.level === null ? 0 : Math.round(battery.level * 100)
  const status = battery.charging ? t.chargingYes : t.chargingNo
  const statusColor = battery.charging ? 'green' : 'blue'
  const levelColor = percent <= 20 ? 'red' : percent >= 100 ? 'green' : percent >= 50 ? 'blue' : 'orange'
  const timeLabel = battery.charging ? t.chargingTimeLabel : t.dischargingTimeLabel
  const timeValue = battery.charging
    ? formatSeconds(battery.chargingTime, t)
    : formatSeconds(battery.dischargingTime, t)

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Progress
        percent={percent}
        status={percent <= 20 ? 'exception' : 'normal'}
        strokeColor={levelColor}
        format={() => `${percent}%`}
      />
      <Space wrap>
        <Statistic
          title={t.levelLabel}
          value={percent}
          suffix="%"
          valueStyle={{ color: levelColor }}
        />
        <Statistic
          title={t.chargingLabel}
          valueRender={() => (
            <Tag color={statusColor}>
              {battery.charging ? <ThunderboltOutlined /> : <StopOutlined />} {status}
            </Tag>
          )}
        />
        <Statistic title={timeLabel} value={timeValue} />
      </Space>
      {percent <= 20 && percent > 0 && (
        <Alert type="warning" message={t.lowBattery} showIcon />
      )}
      {percent >= 100 && (
        <Alert type="success" message={t.fullBattery} showIcon />
      )}
    </Space>
  )
}

export default function UseBatterySnippetPage() {
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
        <BatteryDemo t={t} />
      </Card>
    </Space>
  )
}
