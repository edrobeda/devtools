import React, { useState } from 'react'
import { Layout, Menu, Segmented, theme } from 'antd'
import {
  HomeOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  ToolOutlined,
  BgColorsOutlined,
  CodeOutlined,
  KeyOutlined,
  FieldTimeOutlined,
  NumberOutlined,
  FileTextOutlined,
} from '@ant-design/icons'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useLanguage } from '../i18n/LanguageContext'

const { Header, Sider, Content } = Layout

// Labels do menu por idioma — rótulos apenas, a lista de rotas/ícones fica
// fixa abaixo. Rodadas futuras do agente: ao adicionar uma página nova,
// adicione o par pt/en aqui também.
const LABELS = {
  pt: {
    home: 'Home',
    tools: 'Ferramentas',
    styles: 'Estilos',
    snippets: 'Snippets',
    'jwt-decoder': 'Decodificador JWT',
    'cron-parser': 'Explicador de Cron',
    'hash-generator': 'Gerador de Hash',
    'json-formatter': 'Formatador de JSON',
    'color-converter': 'Conversor de Cor',
    'glass-card': 'Glass Card',
    'copy-button': 'Botão de Copiar Animado',
    'skeleton-shimmer': 'Skeleton Shimmer',
    'use-debounce': 'useDebounce',
    'use-local-storage': 'useLocalStorage',
    'use-click-outside': 'useClickOutside',
  },
  en: {
    home: 'Home',
    tools: 'Tools',
    styles: 'Styles',
    snippets: 'Snippets',
    'jwt-decoder': 'JWT Decoder',
    'cron-parser': 'Cron Expression Explainer',
    'hash-generator': 'Hash Generator',
    'json-formatter': 'JSON Formatter',
    'color-converter': 'Color Converter',
    'glass-card': 'Glass Card',
    'copy-button': 'Animated Copy Button',
    'skeleton-shimmer': 'Skeleton Shimmer',
    'use-debounce': 'useDebounce',
    'use-local-storage': 'useLocalStorage',
    'use-click-outside': 'useClickOutside',
  },
}

function buildMenuItems(l) {
  return [
    { key: '/', icon: <HomeOutlined />, label: l.home },
    {
      key: 'group-tools',
      icon: <ToolOutlined />,
      label: l.tools,
      children: [
        { key: '/tools/jwt-decoder', icon: <KeyOutlined />, label: l['jwt-decoder'] },
        { key: '/tools/cron-parser', icon: <FieldTimeOutlined />, label: l['cron-parser'] },
        { key: '/tools/hash-generator', icon: <NumberOutlined />, label: l['hash-generator'] },
        { key: '/tools/json-formatter', icon: <FileTextOutlined />, label: l['json-formatter'] },
        { key: '/tools/color-converter', icon: <BgColorsOutlined />, label: l['color-converter'] },
      ],
    },
    {
      key: 'group-styles',
      icon: <BgColorsOutlined />,
      label: l.styles,
      children: [
        { key: '/styles/glass-card', label: l['glass-card'] },
        { key: '/styles/copy-button', label: l['copy-button'] },
        { key: '/styles/skeleton-shimmer', label: l['skeleton-shimmer'] },
      ],
    },
    {
      key: 'group-snippets',
      icon: <CodeOutlined />,
      label: l.snippets,
      children: [
        { key: '/snippets/use-debounce', label: l['use-debounce'] },
        { key: '/snippets/use-local-storage', label: l['use-local-storage'] },
        { key: '/snippets/use-click-outside', label: l['use-click-outside'] },
      ],
    },
  ]
}

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { lang, setLang } = useLanguage()
  const { token: { colorBgContainer, borderRadiusLG } } = theme.useToken()

  const menuItems = buildMenuItems(LABELS[lang])

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed}>
        <div style={{
          height: 32,
          margin: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontWeight: 700,
          overflow: 'hidden',
          whiteSpace: 'nowrap',
        }}>
          {collapsed ? 'DT' : 'DevTools'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          defaultOpenKeys={['group-tools', 'group-styles', 'group-snippets']}
          items={menuItems}
          onClick={({ key }) => {
            if (key.startsWith('/')) navigate(key)
          }}
        />
      </Sider>
      <Layout>
        <Header style={{
          padding: '0 16px',
          background: colorBgContainer,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          {React.createElement(collapsed ? MenuUnfoldOutlined : MenuFoldOutlined, {
            onClick: () => setCollapsed(!collapsed),
            style: { fontSize: 18, cursor: 'pointer' },
          })}
          <Segmented
            value={lang}
            onChange={setLang}
            options={[
              { label: 'PT', value: 'pt' },
              { label: 'EN', value: 'en' },
            ]}
          />
        </Header>
        <Content style={{
          margin: 24,
          padding: 24,
          background: colorBgContainer,
          borderRadius: borderRadiusLG,
          minHeight: 280,
        }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}
