import React, { useState } from 'react'
import { Typography, Card, Space, Tag, Button, Alert } from 'antd'
import { CodeOutlined, SunOutlined, MoonOutlined, DesktopOutlined } from '@ant-design/icons'
import usePreferredColorScheme from '../hooks/usePreferredColorScheme'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const sourceCode = `import { useEffect, useState } from 'react'

function getPreferredColorScheme() {
  if (typeof window === 'undefined') return 'no-preference'
  const darkQuery = window.matchMedia('(prefers-color-scheme: dark)')
  const lightQuery = window.matchMedia('(prefers-color-scheme: light)')
  if (darkQuery.matches) return 'dark'
  if (lightQuery.matches) return 'light'
  return 'no-preference'
}

export default function usePreferredColorScheme() {
  const [scheme, setScheme] = useState(getPreferredColorScheme)

  useEffect(() => {
    const darkQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const lightQuery = window.matchMedia('(prefers-color-scheme: light)')

    const handler = () => setScheme(getPreferredColorScheme())

    darkQuery.addEventListener('change', handler)
    lightQuery.addEventListener('change', handler)

    return () => {
      darkQuery.removeEventListener('change', handler)
      lightQuery.removeEventListener('change', handler)
    }
  }, [])

  return scheme
}

// uso:
// const scheme = usePreferredColorScheme()
// scheme === 'dark' | 'light' | 'no-preference'`

const translations = {
  pt: {
    title: 'Snippet: usePreferredColorScheme',
    intro: (
      <>
        Hook que detecta o tema preferido do sistema operacional/navegador usando a media query{' '}
        <Text code>prefers-color-scheme</Text>. Retorna <Text code>dark</Text>,{' '}
        <Text code>light</Text> ou <Text code>no-preference</Text> e reage em tempo real quando
        o usuário alterna o tema do sistema. Útil para sincronizar o modo claro/escuro de uma
        aplicação com a preferência do usuário sem depender de CSS-only.
      </>
    ),
    sourceTitle: 'Código-fonte',
    demoTitle: 'Demonstração',
    demoDesc: 'Tema detectado neste navegador agora:',
    simulated: 'Simulação ativa',
    simulatedHelp: 'Os botões abaixo sobrescrevem temporariamente o valor real para você testar a UI sem mudar o tema do sistema.',
    real: 'Valor real',
    system: 'Sistema',
    light: 'Claro',
    dark: 'Escuro',
    noPreference: 'Sem preferência',
    darkLabel: 'Escuro',
    lightLabel: 'Claro',
    noPreferenceLabel: 'Sem preferência',
    usageTitle: 'Exemplo de uso',
    usageBody: 'Combine com useState/useEffect para aplicar uma classe no <body> ou trocar o tema do Ant Design:',
    usageCode: `const scheme = usePreferredColorScheme()
const isDark = scheme === 'dark'

useEffect(() => {
  document.body.classList.toggle('dark', isDark)
}, [isDark])`,
    compatibilityNote: (
      <>
        Nota: navegadores mais antigos podem não suportar <Text code>prefers-color-scheme</Text>
        {' '}ou o método <Text code>addEventListener</Text> em <Text code>MediaQueryList</Text>.
        Nesses casos o hook retorna <Text code>no-preference</Text> de forma segura.
      </>
    ),
  },
  en: {
    title: 'Snippet: usePreferredColorScheme',
    intro: (
      <>
        A hook that detects the preferred OS/browser theme using the{' '}
        <Text code>prefers-color-scheme</Text> media query. It returns <Text code>dark</Text>,{' '}
        <Text code>light</Text> or <Text code>no-preference</Text> and reacts in real time when
        the user switches the system theme. Useful for syncing an app&apos;s light/dark mode with
        the user&apos;s preference without relying on CSS-only solutions.
      </>
    ),
    sourceTitle: 'Source code',
    demoTitle: 'Demo',
    demoDesc: 'Theme detected by this browser right now:',
    simulated: 'Simulation active',
    simulatedHelp: 'The buttons below temporarily override the real value so you can test the UI without changing your system theme.',
    real: 'Real value',
    system: 'System',
    light: 'Light',
    dark: 'Dark',
    noPreference: 'No preference',
    darkLabel: 'Dark',
    lightLabel: 'Light',
    noPreferenceLabel: 'No preference',
    usageTitle: 'Usage example',
    usageBody: 'Combine with useState/useEffect to apply a class on the <body> or swap the Ant Design theme:',
    usageCode: `const scheme = usePreferredColorScheme()
const isDark = scheme === 'dark'

useEffect(() => {
  document.body.classList.toggle('dark', isDark)
}, [isDark])`,
    compatibilityNote: (
      <>
        Note: older browsers may not support <Text code>prefers-color-scheme</Text> or the{' '}
        <Text code>addEventListener</Text> method on <Text code>MediaQueryList</Text>. In those
        cases the hook safely returns <Text code>no-preference</Text>.
      </>
    ),
  },
}

const schemeConfig = {
  dark: { color: 'purple', icon: <MoonOutlined />, labelKey: 'darkLabel' },
  light: { color: 'orange', icon: <SunOutlined />, labelKey: 'lightLabel' },
  'no-preference': { color: 'default', icon: <DesktopOutlined />, labelKey: 'noPreferenceLabel' },
}

function DemoUsage({ t }) {
  const realScheme = usePreferredColorScheme()
  const [simulated, setSimulated] = useState(null)
  const scheme = simulated ?? realScheme
  const config = schemeConfig[scheme]

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Text type="secondary">{t.demoDesc}</Text>

      <Card
        style={{
          textAlign: 'center',
          background: scheme === 'dark' ? '#1f1f1f' : scheme === 'light' ? '#fffbe6' : undefined,
          borderColor: scheme === 'dark' ? '#434343' : scheme === 'light' ? '#ffd666' : undefined,
        }}
      >
        <Space direction="vertical" size="small">
          <Tag
            color={config.color}
            icon={config.icon}
            style={{ fontSize: 16, padding: '8px 16px', lineHeight: '24px' }}
          >
            {t[config.labelKey]}
          </Tag>
          {simulated && (
            <Text type="warning">
              {t.simulated}: {t[schemeConfig[realScheme].labelKey]}
            </Text>
          )}
        </Space>
      </Card>

      <Alert type="info" showIcon message={t.simulatedHelp} />

      <Space wrap>
        <Button type={simulated === null ? 'primary' : 'default'} onClick={() => setSimulated(null)}>
          <DesktopOutlined /> {t.system}
        </Button>
        <Button onClick={() => setSimulated('light')}>
          <SunOutlined /> {t.light}
        </Button>
        <Button onClick={() => setSimulated('dark')}>
          <MoonOutlined /> {t.dark}
        </Button>
      </Space>

      <Card title={t.usageTitle} size="small">
        <Paragraph>{t.usageBody}</Paragraph>
        <pre style={{ margin: 0, overflowX: 'auto' }}>
          <code>{t.usageCode}</code>
        </pre>
      </Card>

      <Paragraph type="secondary" style={{ marginBottom: 0 }}>
        {t.compatibilityNote}
      </Paragraph>
    </Space>
  )
}

export default function UsePreferredColorSchemeSnippetPage() {
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
