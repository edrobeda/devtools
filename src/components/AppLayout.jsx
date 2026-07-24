import React, { useState } from 'react'
import { Layout, Menu, theme } from 'antd'
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

const { Header, Sider, Content } = Layout

const menuItems = [
  { key: '/', icon: <HomeOutlined />, label: 'Home' },
  {
    key: 'group-tools',
    icon: <ToolOutlined />,
    label: 'Ferramentas',
    children: [
      { key: '/tools/jwt-decoder', icon: <KeyOutlined />, label: 'Decodificador JWT' },
      { key: '/tools/cron-parser', icon: <FieldTimeOutlined />, label: 'Explicador de Cron' },
      { key: '/tools/hash-generator', icon: <NumberOutlined />, label: 'Gerador de Hash' },
      { key: '/tools/json-formatter', icon: <FileTextOutlined />, label: 'Formatador de JSON' },
      { key: '/tools/color-converter', icon: <BgColorsOutlined />, label: 'Conversor de Cor' },
    ],
  },
  {
    key: 'group-styles',
    icon: <BgColorsOutlined />,
    label: 'Estilos',
    children: [
      { key: '/styles/glass-card', label: 'Glass Card' },
      { key: '/styles/copy-button', label: 'Botão de Copiar Animado' },
      { key: '/styles/skeleton-shimmer', label: 'Skeleton Shimmer' },
    ],
  },
  {
    key: 'group-snippets',
    icon: <CodeOutlined />,
    label: 'Snippets',
    children: [
      { key: '/snippets/use-debounce', label: 'useDebounce' },
      { key: '/snippets/use-local-storage', label: 'useLocalStorage' },
      { key: '/snippets/use-click-outside', label: 'useClickOutside' },
    ],
  },
]

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { token: { colorBgContainer, borderRadiusLG } } = theme.useToken()

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
        }}>
          {React.createElement(collapsed ? MenuUnfoldOutlined : MenuFoldOutlined, {
            onClick: () => setCollapsed(!collapsed),
            style: { fontSize: 18, cursor: 'pointer' },
          })}
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
