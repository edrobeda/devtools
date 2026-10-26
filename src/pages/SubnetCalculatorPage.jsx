import React, { useState, useMemo } from 'react'
import { Typography, Card, Space, Input, Descriptions, Alert } from 'antd'
import { GlobalOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import { parseCidr, intToIPv4 } from '../utils/ipv4.js'

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

// O parse/máscara/rede/broadcast vem do util compartilhado (src/utils/ipv4.js),
// o mesmo usado pelo agregador de CIDR; aqui só é montado o que a tela mostra.
function buildSubnetResult(parsed) {
  const { prefix, network, broadcast, size, mask, wildcard } = parsed
  const totalHosts = Number(size)
  return {
    netmask: intToIPv4(mask),
    wildcard: intToIPv4(wildcard),
    network: intToIPv4(network),
    broadcast: intToIPv4(broadcast),
    firstHost: intToIPv4(prefix >= 31 ? network : network + 1n),
    lastHost: intToIPv4(prefix >= 31 ? broadcast : broadcast - 1n),
    totalHosts,
    usableHosts: prefix >= 31 ? 0 : totalHosts - 2,
  }
}

export default function SubnetCalculatorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [input, setInput] = useState('192.168.1.10/24')

  const result = useMemo(() => {
    if (!input.trim()) return null
    const parsed = parseCidr(input)
    return parsed.valid ? buildSubnetResult(parsed) : null
  }, [input])

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
