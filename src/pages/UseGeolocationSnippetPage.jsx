import React, { useState, useMemo } from 'react'
import { Typography, Card, Space, Statistic, Tag, Alert, Button, InputNumber, Checkbox } from 'antd'
import { CodeOutlined, EnvironmentOutlined, ReloadOutlined, CompassOutlined } from '@ant-design/icons'
import useGeolocation from '../hooks/useGeolocation'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const sourceCode = `import { useEffect, useRef, useState } from 'react'

function readPosition(position) {
  const { latitude, longitude, accuracy, altitude, altitudeAccuracy, heading, speed } = position.coords
  return {
    supported: true,
    loading: false,
    error: null,
    coords: {
      latitude,
      longitude,
      accuracy,
      altitude: altitude ?? null,
      altitudeAccuracy: altitudeAccuracy ?? null,
      heading: heading ?? null,
      speed: speed ?? null,
    },
    timestamp: position.timestamp,
  }
}

function errorState(error) {
  return {
    supported: true,
    loading: false,
    error: {
      code: error.code,
      message: error.message,
      type: ['permission_denied', 'position_unavailable', 'timeout'][error.code - 1] || 'unknown',
    },
    coords: null,
    timestamp: null,
  }
}

const noopOptions = {}

export default function useGeolocation(options = noopOptions) {
  const [state, setState] = useState(() => ({
    supported: typeof navigator !== 'undefined' && 'geolocation' in navigator,
    loading: false,
    error: null,
    coords: null,
    timestamp: null,
  }))

  const optionsRef = useRef(options)
  useEffect(() => {
    optionsRef.current = options
  }, [options])

  useEffect(() => {
    let watchId = null
    let cancelled = false

    if (!('geolocation' in navigator)) {
      setState((s) => ({ ...s, supported: false, loading: false }))
      return
    }

    setState((s) => ({ ...s, loading: true }))

    const handleSuccess = (position) => {
      if (cancelled) return
      setState(readPosition(position))
    }

    const handleError = (error) => {
      if (cancelled) return
      setState(errorState(error))
    }

    watchId = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      optionsRef.current
    )

    return () => {
      cancelled = true
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId)
      }
    }
  }, [])

  return state
}`

const translations = {
  pt: {
    title: 'Snippet: useGeolocation',
    intro: (
      <>
        Hook que expõe a localização geográfica do dispositivo via{' '}
        <Text code>Geolocation API</Text>: latitude, longitude, precisão,
        altitude, direção e velocidade. Usa <Text code>watchPosition</Text>{' '}
        para atualizar em tempo real e <Text code>clearWatch</Text> na desmontagem.
        Já está em <Text code>src/hooks/useGeolocation.js</Text>, pronto pra importar.
      </>
    ),
    sourceTitle: 'Código-fonte',
    demoTitle: 'Demonstração ao vivo',
    optionsTitle: 'Opções de watchPosition',
    unsupported: 'Geolocation API não disponível neste navegador.',
    loading: 'Obtendo localização...',
    permissionDenied: 'Permissão de localização negada.',
    positionUnavailable: 'Não foi possível determinar a posição.',
    timeoutError: 'Tempo limite esgotado ao obter a posição.',
    unknownError: 'Erro desconhecido',
    latitude: 'Latitude',
    longitude: 'Longitude',
    accuracy: 'Precisão (m)',
    altitude: 'Altitude (m)',
    altitudeAccuracy: 'Precisão altitude (m)',
    heading: 'Direção (°)',
    speed: 'Velocidade (m/s)',
    timestamp: 'Timestamp',
    notAvailable: '—',
    highAccuracy: 'Alta precisão (enableHighAccuracy)',
    timeoutLabel: 'Timeout (ms)',
    maximumAgeLabel: 'Idade máxima (ms)',
    openMaps: 'Abrir no Google Maps',
    reload: 'Reiniciar leitura',
  },
  en: {
    title: 'Snippet: useGeolocation',
    intro: (
      <>
        A hook that exposes the device geographic location through the{' '}
        <Text code>Geolocation API</Text>: latitude, longitude, accuracy,
        altitude, heading and speed. It uses <Text code>watchPosition</Text>{' '}
        to update in real time and <Text code>clearWatch</Text> on unmount.
        It already lives in <Text code>src/hooks/useGeolocation.js</Text>, ready to import.
      </>
    ),
    sourceTitle: 'Source code',
    demoTitle: 'Live demo',
    optionsTitle: 'watchPosition options',
    unsupported: 'Geolocation API is not available in this browser.',
    loading: 'Getting location...',
    permissionDenied: 'Location permission was denied.',
    positionUnavailable: 'Unable to determine the position.',
    timeoutError: 'Timeout while retrieving the position.',
    unknownError: 'Unknown error',
    latitude: 'Latitude',
    longitude: 'Longitude',
    accuracy: 'Accuracy (m)',
    altitude: 'Altitude (m)',
    altitudeAccuracy: 'Altitude accuracy (m)',
    heading: 'Heading (°)',
    speed: 'Speed (m/s)',
    timestamp: 'Timestamp',
    notAvailable: '—',
    highAccuracy: 'High accuracy (enableHighAccuracy)',
    timeoutLabel: 'Timeout (ms)',
    maximumAgeLabel: 'Maximum age (ms)',
    openMaps: 'Open in Google Maps',
    reload: 'Restart reading',
  },
}

function errorMessage(error, t) {
  if (!error) return null
  switch (error.type) {
    case 'permission_denied':
      return t.permissionDenied
    case 'position_unavailable':
      return t.positionUnavailable
    case 'timeout':
      return t.timeoutError
    default:
      return error.message || t.unknownError
  }
}

function GeolocationDemo({ t }) {
  const [highAccuracy, setHighAccuracy] = useState(false)
  const [timeoutValue, setTimeoutValue] = useState(10000)
  const [maximumAgeValue, setMaximumAgeValue] = useState(0)
  const [tick, setTick] = useState(0)

  const options = useMemo(
    () => ({
      enableHighAccuracy: highAccuracy,
      timeout: timeoutValue,
      maximumAge: maximumAgeValue,
    }),
    [highAccuracy, timeoutValue, maximumAgeValue]
  )

  // Força recriação do hook ao clicar em "Reiniciar leitura".
  const key = `${tick}-${JSON.stringify(options)}`
  const geo = useGeolocation(options)

  const mapsUrl = geo.coords
    ? `https://www.google.com/maps?q=${geo.coords.latitude},${geo.coords.longitude}`
    : null

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Card size="small" title={t.optionsTitle}>
        <Space wrap>
          <Checkbox checked={highAccuracy} onChange={(e) => setHighAccuracy(e.target.checked)}>
            {t.highAccuracy}
          </Checkbox>
          <InputNumber
            min={1000}
            max={60000}
            step={1000}
            value={timeoutValue}
            onChange={(v) => setTimeoutValue(v || 10000)}
            addonBefore={t.timeoutLabel}
            style={{ width: 160 }}
          />
          <InputNumber
            min={0}
            max={600000}
            step={1000}
            value={maximumAgeValue}
            onChange={(v) => setMaximumAgeValue(v ?? 0)}
            addonBefore={t.maximumAgeLabel}
            style={{ width: 180 }}
          />
          <Button icon={<ReloadOutlined />} onClick={() => setTick((n) => n + 1)}>
            {t.reload}
          </Button>
        </Space>
      </Card>

      {key && !geo.supported && (
        <Alert type="warning" showIcon message={t.unsupported} />
      )}

      {geo.loading && (
        <Alert type="info" showIcon icon={<CompassOutlined spin />} message={t.loading} />
      )}

      {geo.error && (
        <Alert type="error" showIcon message={errorMessage(geo.error, t)} />
      )}

      {geo.coords && (
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Space wrap>
            <Statistic title={t.latitude} value={geo.coords.latitude} precision={6} />
            <Statistic title={t.longitude} value={geo.coords.longitude} precision={6} />
            <Statistic title={t.accuracy} value={geo.coords.accuracy} precision={1} />
            <Statistic
              title={t.altitude}
              value={geo.coords.altitude === null ? t.notAvailable : geo.coords.altitude}
              precision={1}
            />
            <Statistic
              title={t.altitudeAccuracy}
              value={geo.coords.altitudeAccuracy === null ? t.notAvailable : geo.coords.altitudeAccuracy}
              precision={1}
            />
            <Statistic
              title={t.heading}
              value={geo.coords.heading === null ? t.notAvailable : geo.coords.heading}
              precision={1}
            />
            <Statistic
              title={t.speed}
              value={geo.coords.speed === null ? t.notAvailable : geo.coords.speed}
              precision={1}
            />
            <Statistic
              title={t.timestamp}
              value={geo.timestamp ? new Date(geo.timestamp).toLocaleTimeString() : t.notAvailable}
            />
          </Space>

          <Space wrap>
            <Tag color="blue">
              <EnvironmentOutlined /> {geo.coords.latitude.toFixed(4)}, {geo.coords.longitude.toFixed(4)}
            </Tag>
            {mapsUrl && (
              <Button type="primary" href={mapsUrl} target="_blank" rel="noopener noreferrer">
                {t.openMaps}
              </Button>
            )}
          </Space>
        </Space>
      )}

      {!geo.loading && !geo.error && !geo.coords && geo.supported && (
        <Alert type="info" showIcon message={t.loading} />
      )}
    </Space>
  )
}

export default function UseGeolocationSnippetPage() {
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
        <GeolocationDemo t={t} />
      </Card>
    </Space>
  )
}
