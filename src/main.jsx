import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ConfigProvider, App as AntdApp } from 'antd'
import ptBR from 'antd/locale/pt_BR'
import enUS from 'antd/locale/en_US'
import App from './App'
import { LanguageProvider, useLanguage } from './i18n/LanguageContext'
import './styles/global.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

// Componente separado só pra poder chamar useLanguage() dentro do
// LanguageProvider e repassar o locale certo pro ConfigProvider do antd.
function AntdConfig({ children }) {
  const { lang } = useLanguage()
  return (
    <ConfigProvider
      locale={lang === 'en' ? enUS : ptBR}
      theme={{
        token: {
          colorPrimary: '#1677ff',
          borderRadius: 6,
        },
      }}
    >
      <AntdApp>{children}</AntdApp>
    </ConfigProvider>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <AntdConfig>
          <App />
        </AntdConfig>
      </LanguageProvider>
    </QueryClientProvider>
  </React.StrictMode>
)
