import React from 'react'
import { Typography, Card, Space, Tag, Descriptions } from 'antd'
import { CodeOutlined, WifiOutlined, DisconnectOutlined } from '@ant-design/icons'
import useNetworkStatus from '../hooks/useNetworkStatus'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const sourceCode = `import { useCallback, useEffect, useState } from 'react'

function getConnection() {
  return navigator.connection || navigator.mozConnection || navigator.webkitConnection
}

function getNetworkInfo() {
  const conn = typeof navigator !== 'undefined' ? getConnection() : null
  return {
    online: typeof navigator !== 'undefined' ? navigator.onLine : true,
    effectiveType: conn?.effectiveType,
    downlink: conn?.downlink,
    rtt: conn?.rtt,
    saveData: conn?.saveData,
  }
}

export default function useNetworkStatus() {
  const [status, setStatus] = useState(getNetworkInfo)

  const update = useCallback(() => {
    setStatus(getNetworkInfo())
  }, [])

  useEffect(() => {
    window.addEventListener('online', update)
    window.addEventListener('offline', update)

    const conn = getConnection()
    if (conn) {
      conn.addEventListener('change', update)
    }

    return () => {
      window.removeEventListener('online', update)
      window.removeEventListener('offline', update)
      if (conn) {
        conn.removeEventListener('change', update)
      }
    }
  }, [update])

  return status
}

// uso:
// const { online, effectiveType, downlink, rtt, saveData } = useNetworkStatus()`

const translations = {
  pt: {
    title: 'Snippet: useNetworkStatus',
    intro: (
      <>
        Hook que escuta os eventos <Text code>online</Text>/<Text code>offline</Text>{' '}
        do navegador e, quando disponível, acompanha mudanças no{' '}
        <Text code>navigator.connection</Text> (Network Information API). Retorna{' '}
        <Text code>online</Text>, <Text code>effectiveType</Text> (por exemplo{' '}
        <Text code>4g</Text>/<Text code>3g</Text>), <Text code>downlink</Text>,{' '}
        <Text code>rtt</Text> e <Text code>saveData</Text>. Útil para adaptar a
        experiência a conexões lentas ou para avisar que a aplicação está sem
        internet.
      </>
    ),
    sourceTitle: 'Código-fonte',
    demoTitle: 'Demonstração',
    demoDesc: 'Dados da conexão detectados neste navegador agora:',
    online: 'Online',
    offline: 'Offline',
    effectiveType: 'Tipo efetivo',
    downlink: 'Downlink estimado',
    downlinkUnit: 'Mbps',
    rtt: 'Latência (RTT)',
    rttUnit: 'ms',
    saveData: 'Economia de dados',
    saveDataOn: 'Ativada',
    saveDataOff: 'Desativada',
    unavailable: 'não disponível',
    compatibilityNote: (
      <>
        Nota: <Text code>navigator.connection</Text> não é suportado por todos os
        navegadores (Safari desktop, por exemplo). Nesses casos os campos de tipo
        de rede aparecem como "não disponível", mas <Text code>online</Text>{' '}
        continua funcionando.
      </>
    ),
  },
  en: {
    title: 'Snippet: useNetworkStatus',
    intro: (
      <>
        A hook that listens to browser <Text code>online</Text>/{' '}
        <Text code>offline</Text> events and, when available, tracks changes on{' '}
        <Text code>navigator.connection</Text> (Network Information API). It
        returns <Text code>online</Text>, <Text code>effectiveType</Text> (e.g.{' '}
        <Text code>4g</Text>/<Text code>3g</Text>), <Text code>downlink</Text>,{' '}
        <Text code>rtt</Text> and <Text code>saveData</Text>. Useful for adapting
        the experience to slow connections or warning when the app is offline.
      </>
    ),
    sourceTitle: 'Source code',
    demoTitle: 'Demo',
    demoDesc: 'Connection data detected by this browser right now:',
    online: 'Online',
    offline: 'Offline',
    effectiveType: 'Effective type',
    downlink: 'Estimated downlink',
    downlinkUnit: 'Mbps',
    rtt: 'Latency (RTT)',
    rttUnit: 'ms',
    saveData: 'Data saver',
    saveDataOn: 'On',
    saveDataOff: 'Off',
    unavailable: 'unavailable',
    compatibilityNote: (
      <>
        Note: <Text code>navigator.connection</Text> is not supported by all
        browsers (e.g. desktop Safari). In those cases the network type fields
        appear as "unavailable", but <Text code>online</Text> still works.
      </>
    ),
  },
}

function DemoUsage({ t }) {
  const { online, effectiveType, downlink, rtt, saveData } = useNetworkStatus()

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Text type="secondary">{t.demoDesc}</Text>
      <Descriptions bordered column={{ xs: 1, sm: 2 }} size="small">
        <Descriptions.Item label={t.online}>
          <Tag
            color={online ? 'green' : 'red'}
            icon={online ? <WifiOutlined /> : <DisconnectOutlined />}
          >
            {online ? t.online : t.offline}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label={t.effectiveType}>
          <Text code>{effectiveType || t.unavailable}</Text>
        </Descriptions.Item>
        <Descriptions.Item label={t.downlink}>
          {typeof downlink === 'number'
            ? `${downlink} ${t.downlinkUnit}`
            : t.unavailable}
        </Descriptions.Item>
        <Descriptions.Item label={t.rtt}>
          {typeof rtt === 'number' ? `${rtt} ${t.rttUnit}` : t.unavailable}
        </Descriptions.Item>
        <Descriptions.Item label={t.saveData}>
          {saveData === true
            ? <Tag color="blue">{t.saveDataOn}</Tag>
            : saveData === false
              ? <Tag>{t.saveDataOff}</Tag>
              : t.unavailable}
        </Descriptions.Item>
      </Descriptions>
      <Paragraph type="secondary" style={{ marginBottom: 0 }}>
        {t.compatibilityNote}
      </Paragraph>
    </Space>
  )
}

export default function UseNetworkStatusSnippetPage() {
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
        <DemoUsage t={t} />
      </Card>
    </Space>
  )
}
