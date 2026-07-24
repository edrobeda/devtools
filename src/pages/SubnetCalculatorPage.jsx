import React, { useState, useMemo } from 'react'
import { Typography, Card, Space, Input, Descriptions, Alert } from 'antd'
import { GlobalOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const translations = {
  pt: {
    title: 'Calculadora de Sub-rede IP (CIDR)',
    intro: (
      <>
        Digita um endereço IPv4 em notação CIDR (ex: <Text code>192.168.1.10/24</Text>)
        e calcula máscara, endereço de rede, broadcast, range de hosts
        utilizáveis e total de hosts — tudo com operações de bits no
        navegador.
      </>
    ),
    placeholder: '192.168.1.10/24',
    netmask: 'Máscara de sub-rede',
    wildcard: 'Wildcard mask',
    network: 'Endereço de rede',
    broadcast: 'Endereço de broadcast',
    firstHost: 'Primeiro host utilizável',
    lastHost: 'Último host utilizável',
    totalHosts: 'Total de endereços',
    usableHosts: 'Hosts utilizáveis',
    invalid: 'Formato inválido — use ip/prefixo, ex: 10.0.0.1/24 (prefixo de 0 a 32)',
  },
  en: {
    title: 'IP Subnet Calculator (CIDR)',
    intro: (
      <>
        Enter an IPv4 address in CIDR notation (e.g.{' '}
        <Text code>192.168.1.10/24</Text>) and calculate the netmask,
        network address, broadcast, usable host range, and total host
        count — all bitwise operations in the browser.
      </>
    ),
    placeholder: '192.168.1.10/24',
    netmask: 'Subnet mask',
    wildcard: 'Wildcard mask',
    network: 'Network address',
    broadcast: 'Broadcast address',
    firstHost: 'First usable host',
    lastHost: 'Last usable host',
    totalHosts: 'Total addresses',
    usableHosts: 'Usable hosts',
    invalid: 'Invalid format — use ip/prefix, e.g. 10.0.0.1/24 (prefix 0 to 32)',
  },
}

function ipToInt(parts) {
  return (parts[0] << 24 | parts[1] << 16 | parts[2] << 8 | parts[3]) >>> 0
}

function intToIp(int) {
  return [(int >>> 24) & 255, (int >>> 16) & 255, (int >>> 8) & 255, int & 255].join('.')
}

function parseCidr(input) {
  const match = input.trim().match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})\/(\d{1,2})$/)
  if (!match) return null
  const parts = match.slice(1, 5).map(Number)
  const prefix = Number(match[5])
  if (parts.some((p) => p > 255) || prefix > 32) return null

  const ipInt = ipToInt(parts)
  const maskInt = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0
  const wildcardInt = (~maskInt) >>> 0
  const networkInt = (ipInt & maskInt) >>> 0
  const broadcastInt = (networkInt | wildcardInt) >>> 0
  const totalHosts = Math.pow(2, 32 - prefix)
  const usableHosts = prefix >= 31 ? 0 : totalHosts - 2

  return {
    netmask: intToIp(maskInt),
    wildcard: intToIp(wildcardInt),
    network: intToIp(networkInt),
    broadcast: intToIp(broadcastInt),
    firstHost: prefix >= 31 ? intToIp(networkInt) : intToIp(networkInt + 1),
    lastHost: prefix >= 31 ? intToIp(broadcastInt) : intToIp(broadcastInt - 1),
    totalHosts,
    usableHosts,
  }
}

export default function SubnetCalculatorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [input, setInput] = useState('192.168.1.10/24')

  const result = useMemo(() => (input.trim() ? parseCidr(input) : null), [input])

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><GlobalOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card>
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t.placeholder}
          style={{ fontFamily: 'monospace' }}
        />
      </Card>

      {input.trim() && !result && <Alert type="error" showIcon message={t.invalid} />}

      {result && (
        <Card>
          <Descriptions bordered size="small" column={1}>
            <Descriptions.Item label={t.netmask}><Text code>{result.netmask}</Text></Descriptions.Item>
            <Descriptions.Item label={t.wildcard}><Text code>{result.wildcard}</Text></Descriptions.Item>
            <Descriptions.Item label={t.network}><Text code>{result.network}</Text></Descriptions.Item>
            <Descriptions.Item label={t.broadcast}><Text code>{result.broadcast}</Text></Descriptions.Item>
            <Descriptions.Item label={t.firstHost}><Text code>{result.firstHost}</Text></Descriptions.Item>
            <Descriptions.Item label={t.lastHost}><Text code>{result.lastHost}</Text></Descriptions.Item>
            <Descriptions.Item label={t.totalHosts}>{result.totalHosts.toLocaleString()}</Descriptions.Item>
            <Descriptions.Item label={t.usableHosts}>{result.usableHosts.toLocaleString()}</Descriptions.Item>
          </Descriptions>
        </Card>
      )}
    </Space>
  )
}
