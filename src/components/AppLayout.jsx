import React, { useState } from 'react'
import { Layout, Menu, Segmented, Tag, theme } from 'antd'
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
  ApiOutlined,
  DatabaseOutlined,
  CloudOutlined,
  SafetyCertificateOutlined,
  FolderOutlined,
  GlobalOutlined,
  RobotOutlined,
  MobileOutlined,
  FontSizeOutlined,
  ReadOutlined,
  CalendarOutlined,
  SearchOutlined,
  SwapOutlined,
  IdcardOutlined,
} from '@ant-design/icons'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useLanguage } from '../i18n/LanguageContext'
import { NEW_ITEM_KEYS } from '../newItems'

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
    frontend: 'Front-end',
    apis: 'APIs',
    devops: 'DevOps',
    database: 'Banco de Dados',
    cloud: 'Cloud',
    security: 'Segurança',
    data: 'Arquivos & Dados',
    network: 'Rede',
    ai: 'IA',
    mobile: 'Mobile',
    text: 'Texto',
    references: 'Referências',
    extras: 'Fora da caixa',
    new: 'Novo',
    'jwt-decoder': 'Decodificador JWT',
    'cron-parser': 'Explicador de Cron',
    'hash-generator': 'Gerador de Hash',
    'json-formatter': 'Formatador de JSON',
    'color-converter': 'Conversor de Cor',
    'timestamp-converter': 'Conversor de Timestamp',
    'glass-card': 'Glass Card',
    'copy-button': 'Botão de Copiar Animado',
    'skeleton-shimmer': 'Skeleton Shimmer',
    'gradient-border-button': 'Botão com Borda Gradiente',
    'use-debounce': 'useDebounce',
    'use-local-storage': 'useLocalStorage',
    'use-click-outside': 'useClickOutside',
    'use-media-query': 'useMediaQuery',
    'contrast-checker': 'Checador de Contraste',
    'curl-generator': 'Gerador de cURL',
    'gitignore-generator': 'Gerador de .gitignore',
    'rate-limit-calculator': 'Calculadora de Rate Limit',
    'arn-parser': 'AWS ARN Parser',
    'password-strength': 'Força de Senha',
    'json-tree-viewer': 'Visualizador de Árvore JSON',
    'subnet-calculator': 'Calculadora de Sub-rede',
    'anthropic-cost-calculator': 'Calculadora de Custo Anthropic',
    'deep-link-tester': 'Testador de Deep Link',
    'word-counter': 'Contador de Palavras',
    'git-commands': 'Comandos Git',
    'days-until': 'Quantos dias até...',
    'regex-tester': 'Regex Tester',
    'base64-tool': 'Base64 Encode/Decode',
    'uuid-generator': 'Gerador de UUID',
    'case-converter': 'Conversor de Case',
  },
  en: {
    home: 'Home',
    tools: 'Tools',
    styles: 'Styles',
    snippets: 'Snippets',
    frontend: 'Front-end',
    apis: 'APIs',
    devops: 'DevOps',
    database: 'Database',
    cloud: 'Cloud',
    security: 'Security',
    data: 'Files & Data',
    network: 'Network',
    ai: 'AI',
    mobile: 'Mobile',
    text: 'Text',
    references: 'References',
    extras: 'Out of the box',
    new: 'New',
    'jwt-decoder': 'JWT Decoder',
    'cron-parser': 'Cron Expression Explainer',
    'hash-generator': 'Hash Generator',
    'json-formatter': 'JSON Formatter',
    'color-converter': 'Color Converter',
    'timestamp-converter': 'Timestamp Converter',
    'glass-card': 'Glass Card',
    'copy-button': 'Animated Copy Button',
    'skeleton-shimmer': 'Skeleton Shimmer',
    'gradient-border-button': 'Gradient Border Button',
    'use-debounce': 'useDebounce',
    'use-local-storage': 'useLocalStorage',
    'use-click-outside': 'useClickOutside',
    'use-media-query': 'useMediaQuery',
    'contrast-checker': 'Contrast Checker',
    'curl-generator': 'cURL Generator',
    'gitignore-generator': '.gitignore Generator',
    'rate-limit-calculator': 'Rate Limit Calculator',
    'arn-parser': 'AWS ARN Parser',
    'password-strength': 'Password Strength',
    'json-tree-viewer': 'JSON Tree Viewer',
    'subnet-calculator': 'Subnet Calculator',
    'anthropic-cost-calculator': 'Anthropic Cost Calculator',
    'deep-link-tester': 'Deep Link Tester',
    'word-counter': 'Word Counter',
    'git-commands': 'Git Commands',
    'days-until': 'Days Until...',
    'regex-tester': 'Regex Tester',
    'base64-tool': 'Base64 Encode/Decode',
    'uuid-generator': 'UUID Generator',
    'case-converter': 'Case Converter',
  },
}

function withNewBadge(key, label, l) {
  if (!NEW_ITEM_KEYS.includes(key)) return label
  return (
    <span>
      {label} <Tag color="green" style={{ marginLeft: 4, lineHeight: '16px', fontSize: 11 }}>{l.new}</Tag>
    </span>
  )
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
        { key: '/tools/timestamp-converter', icon: <FieldTimeOutlined />, label: l['timestamp-converter'] },
        { key: '/tools/regex-tester', icon: <SearchOutlined />, label: withNewBadge('/tools/regex-tester', l['regex-tester'], l) },
        { key: '/tools/base64-tool', icon: <SwapOutlined />, label: withNewBadge('/tools/base64-tool', l['base64-tool'], l) },
        { key: '/tools/uuid-generator', icon: <IdcardOutlined />, label: withNewBadge('/tools/uuid-generator', l['uuid-generator'], l) },
        { key: '/tools/case-converter', icon: <FontSizeOutlined />, label: withNewBadge('/tools/case-converter', l['case-converter'], l) },
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
        { key: '/styles/gradient-border-button', label: l['gradient-border-button'] },
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
        { key: '/snippets/use-media-query', label: l['use-media-query'] },
      ],
    },
    {
      key: 'group-frontend',
      icon: <BgColorsOutlined />,
      label: l.frontend,
      children: [
        { key: '/frontend/contrast-checker', label: l['contrast-checker'] },
      ],
    },
    {
      key: 'group-apis',
      icon: <ApiOutlined />,
      label: l.apis,
      children: [
        { key: '/apis/curl-generator', label: l['curl-generator'] },
      ],
    },
    {
      key: 'group-devops',
      icon: <ToolOutlined />,
      label: l.devops,
      children: [
        { key: '/devops/gitignore-generator', label: l['gitignore-generator'] },
      ],
    },
    {
      key: 'group-database',
      icon: <DatabaseOutlined />,
      label: l.database,
      children: [
        { key: '/database/rate-limit-calculator', label: l['rate-limit-calculator'] },
      ],
    },
    {
      key: 'group-cloud',
      icon: <CloudOutlined />,
      label: l.cloud,
      children: [
        { key: '/cloud/arn-parser', label: l['arn-parser'] },
      ],
    },
    {
      key: 'group-security',
      icon: <SafetyCertificateOutlined />,
      label: l.security,
      children: [
        { key: '/security/password-strength', label: l['password-strength'] },
      ],
    },
    {
      key: 'group-data',
      icon: <FolderOutlined />,
      label: l.data,
      children: [
        { key: '/data/json-tree-viewer', label: l['json-tree-viewer'] },
      ],
    },
    {
      key: 'group-network',
      icon: <GlobalOutlined />,
      label: l.network,
      children: [
        { key: '/network/subnet-calculator', label: l['subnet-calculator'] },
      ],
    },
    {
      key: 'group-ai',
      icon: <RobotOutlined />,
      label: l.ai,
      children: [
        { key: '/ai/anthropic-cost-calculator', label: l['anthropic-cost-calculator'] },
      ],
    },
    {
      key: 'group-mobile',
      icon: <MobileOutlined />,
      label: l.mobile,
      children: [
        { key: '/mobile/deep-link-tester', label: l['deep-link-tester'] },
      ],
    },
    {
      key: 'group-text',
      icon: <FontSizeOutlined />,
      label: l.text,
      children: [
        { key: '/text/word-counter', label: l['word-counter'] },
      ],
    },
    {
      key: 'group-references',
      icon: <ReadOutlined />,
      label: l.references,
      children: [
        { key: '/references/git-commands', label: l['git-commands'] },
      ],
    },
    {
      key: 'group-extras',
      icon: <CalendarOutlined />,
      label: l.extras,
      children: [
        { key: '/extras/days-until', label: l['days-until'] },
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
          defaultOpenKeys={[
            'group-tools', 'group-styles', 'group-snippets', 'group-frontend', 'group-apis',
            'group-devops', 'group-database', 'group-cloud', 'group-security', 'group-data',
            'group-network', 'group-ai', 'group-mobile', 'group-text', 'group-references', 'group-extras',
          ]}
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
