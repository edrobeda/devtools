import React, { useMemo, useState, useCallback } from 'react'
import { Typography, Card, Space, Input, List, Tag, Radio, Alert, Button, message } from 'antd'
import { ReadOutlined, SearchOutlined, ApartmentOutlined, CopyOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const CATEGORIES = ['web', 'db', 'cache', 'msg', 'mail', 'infra', 'ops', 'kube']

const CATEGORY_COLOR = {
  web: 'blue',
  db: 'geekblue',
  cache: 'purple',
  msg: 'cyan',
  mail: 'magenta',
  infra: 'orange',
  ops: 'green',
  kube: 'volcano',
}

const labelOf = {
  web: { pt: 'Web / HTTP', en: 'Web / HTTP' },
  db: { pt: 'Banco de Dados', en: 'Databases' },
  cache: { pt: 'Cache & Sessão', en: 'Cache & Sessions' },
  msg: { pt: 'Messageria & Filas', en: 'Messaging & Queues' },
  mail: { pt: 'E-mail', en: 'Email' },
  infra: { pt: 'Sistemas & Acesso', en: 'Sysadmin & Access' },
  ops: { pt: 'Observabilidade', en: 'Observability' },
  kube: { pt: 'Kubernetes & Cluster', en: 'Kubernetes & Cluster' },
}

const PORTS = [
  { port: 20, proto: 'TCP', cat: 'infra', name: 'FTP-Data', pt: 'Canal de dados do FTP (modo ativo)', en: 'FTP data channel (active mode)' },
  { port: 21, proto: 'TCP', cat: 'infra', name: 'FTP', pt: 'Controle do FTP — upload/download de arquivos', en: 'FTP control channel for file transfers' },
  { port: 22, proto: 'TCP', cat: 'infra', name: 'SSH / SFTP', pt: 'Shell seguro, acesso remoto e transferência via SFTP/SCP', en: 'Secure shell, remote access and SFTP/SCP transfers' },
  { port: 23, proto: 'TCP', cat: 'infra', name: 'Telnet', pt: 'Terminal remoto sem criptografia (evitar)', en: 'Unencrypted remote terminal (avoid)' },
  { port: 25, proto: 'TCP', cat: 'mail', name: 'SMTP', pt: 'Envio de e-mail entre servidores (MTA)', en: 'Email routing between servers (MTA)' },
  { port: 53, proto: 'UDP', cat: 'infra', name: 'DNS', pt: 'Resolução de nomes de domínio', en: 'Domain name resolution' },
  { port: 67, proto: 'UDP', cat: 'infra', name: 'DHCP Server', pt: 'Distribuição automática de IP (servidor)', en: 'Automatic IP assignment (server)' },
  { port: 68, proto: 'UDP', cat: 'infra', name: 'DHCP Client', pt: 'Recebe a configuração de rede (cliente)', en: 'Network configuration (client)' },
  { port: 69, proto: 'UDP', cat: 'infra', name: 'TFTP', pt: 'Transferência simples de arquivos (boot de rede)', en: 'Trivial file transfer (network boot)' },
  { port: 80, proto: 'TCP', cat: 'web', name: 'HTTP', pt: 'Tráfego web sem criptografia', en: 'Plain HTTP web traffic' },
  { port: 88, proto: 'UDP', cat: 'infra', name: 'Kerberos', pt: 'Autenticação de rede (AD, KDC)', en: 'Network authentication (AD, KDC)' },
  { port: 110, proto: 'TCP', cat: 'mail', name: 'POP3', pt: 'Baixar e-mail do servidor (sem sincronização)', en: 'Download email from the server (offline)' },
  { port: 123, proto: 'UDP', cat: 'infra', name: 'NTP', pt: 'Sincronização de relógio entre máquinas', en: 'Clock time synchronization' },
  { port: 143, proto: 'TCP', cat: 'mail', name: 'IMAP', pt: 'Acessa e-mail mantendo o estado no servidor', en: 'Access email keeping server-side state' },
  { port: 161, proto: 'UDP', cat: 'ops', name: 'SNMP Agent', pt: 'Coleta de métricas/estado de equipamentos', en: 'Equipment monitoring / metric collection' },
  { port: 179, proto: 'TCP', cat: 'infra', name: 'BGP', pt: 'Troca de rotas entre roteadores', en: 'Route exchange between routers' },
  { port: 389, proto: 'TCP', cat: 'infra', name: 'LDAP', pt: 'Diretório / identidade sem TLS', en: 'Directory / identity without TLS' },
  { port: 443, proto: 'TCP', cat: 'web', name: 'HTTPS', pt: 'Site criptografado (TLS)', en: 'Encrypted web traffic (TLS)' },
  { port: 445, proto: 'TCP', cat: 'infra', name: 'SMB / CIFS', pt: 'Compartilhamento de arquivos Windows', en: 'Windows file sharing' },
  { port: 465, proto: 'TCP', cat: 'mail', name: 'SMTPS', pt: 'SMTP sobre TLS (envio criptografado)', en: 'SMTP over TLS (encrypted submission)' },
  { port: 514, proto: 'UDP', cat: 'ops', name: 'Syslog', pt: 'Logs centralizados (recepção)', en: 'Centralized log reception' },
  { port: 587, proto: 'TCP', cat: 'mail', name: 'SMTP Submission', pt: 'Envio de e-mail por clientes (com autenticação)', en: 'Client e-mail submission (authenticated)' },
  { port: 631, proto: 'TCP', cat: 'infra', name: 'IPP', pt: 'Impressão via protocolo de internet', en: 'Internet printing protocol' },
  { port: 636, proto: 'TCP', cat: 'infra', name: 'LDAPS', pt: 'LDAP sobre TLS', en: 'LDAP over TLS' },
  { port: 993, proto: 'TCP', cat: 'mail', name: 'IMAPS', pt: 'IMAP sobre TLS', en: 'IMAP over TLS' },
  { port: 995, proto: 'TCP', cat: 'mail', name: 'POP3S', pt: 'POP3 sobre TLS', en: 'POP3 over TLS' },
  { port: 1194, proto: 'UDP', cat: 'infra', name: 'OpenVPN', pt: 'Túnel VPN padrão do OpenVPN', en: 'Default OpenVPN tunnel' },
  { port: 1433, proto: 'TCP', cat: 'db', name: 'SQL Server', pt: 'Microsoft SQL Server', en: 'Microsoft SQL Server database' },
  { port: 1521, proto: 'TCP', cat: 'db', name: 'Oracle DB', pt: 'Listener do banco Oracle', en: 'Oracle database listener' },
  { port: 1701, proto: 'UDP', cat: 'infra', name: 'L2TP', pt: 'Túnel L2TP (parte do L2TP/IPsec)', en: 'L2TP tunneling (part of L2TP/IPsec)' },
  { port: 1812, proto: 'UDP', cat: 'infra', name: 'RADIUS Auth', pt: 'Autenticação central (802.1X, Wi-Fi)', en: 'Central authentication (Wi-Fi, 802.1X)' },
  { port: 1813, proto: 'UDP', cat: 'infra', name: 'RADIUS Acct', pt: 'Contabilização de sessões RADIUS', en: 'RADIUS session accounting' },
  { port: 1883, proto: 'TCP', cat: 'msg', name: 'MQTT', pt: 'Mensageria leve para IoT', en: 'Lightweight IoT messaging' },
  { port: 2049, proto: 'TCP', cat: 'infra', name: 'NFS', pt: 'Sistema de arquivos de rede', en: 'Network file system' },
  { port: 2376, proto: 'TCP', cat: 'kube', name: 'Docker TLS', pt: 'Docker daemon com TLS', en: 'Docker daemon over TLS' },
  { port: 2379, proto: 'TCP', cat: 'kube', name: 'etcd client', pt: 'Acesso de clientes ao etcd (dados do cluster)', en: 'Client access to etcd (cluster data)' },
  { port: 2380, proto: 'TCP', cat: 'kube', name: 'etcd peer', pt: 'Comunicação entre nós do etcd', en: 'etcd node-to-node communication' },
  { port: 3000, proto: 'TCP', cat: 'web', name: 'Grafana', pt: 'Dashboard padrão do Grafana e apps de dev (Next.js)', en: 'Default Grafana and dev web servers (Next.js)' },
  { port: 3306, proto: 'TCP', cat: 'db', name: 'MySQL / MariaDB', pt: 'Banco de dados MySQL ou MariaDB', en: 'MySQL or MariaDB database' },
  { port: 3389, proto: 'TCP', cat: 'infra', name: 'RDP', pt: 'Desktop remoto do Windows', en: 'Windows Remote Desktop' },
  { port: 5000, proto: 'TCP', cat: 'web', name: 'Docker registry', pt: 'Registro de imagens Docker (também usado em dev)', en: 'Docker image registry (also used in dev)' },
  { port: 5353, proto: 'UDP', cat: 'infra', name: 'mDNS', pt: 'Descoberta local de dispositivos (Bonjour, .local)', en: 'Local device discovery (.local)' },
  { port: 5432, proto: 'TCP', cat: 'db', name: 'PostgreSQL', pt: 'Banco de dados PostgreSQL', en: 'PostgreSQL database' },
  { port: 5601, proto: 'TCP', cat: 'ops', name: 'Kibana', pt: 'Interface web do Elastic Stack', en: 'Elastic Stack web interface' },
  { port: 5672, proto: 'TCP', cat: 'msg', name: 'RabbitMQ AMQP', pt: 'Mensageria RabbitMQ', en: 'RabbitMQ messaging' },
  { port: 5984, proto: 'TCP', cat: 'db', name: 'CouchDB', pt: 'Banco de dados documental CouchDB', en: 'CouchDB document database' },
  { port: 6379, proto: 'TCP', cat: 'cache', name: 'Redis', pt: 'Cache/armazenamento chave-valor em memória', en: 'In-memory key-value cache/store' },
  { port: 6443, proto: 'TCP', cat: 'kube', name: 'Kube API', pt: 'API do kube-apiserver', en: 'Kubernetes API server' },
  { port: 7687, proto: 'TCP', cat: 'db', name: 'Neo4j Bolt', pt: 'Driver Bolt do Neo4j', en: 'Neo4j Bolt driver' },
  { port: 8000, proto: 'TCP', cat: 'web', name: 'HTTP alt', pt: 'Servidor web alternativo (dev)', en: 'Alternative web port (dev)' },
  { port: 8080, proto: 'TCP', cat: 'web', name: 'HTTP proxy / alt', pt: 'Alternativa/proxy popular ao 80', en: 'Popular alternative/proxy to port 80' },
  { port: 8443, proto: 'TCP', cat: 'web', name: 'HTTPS alt', pt: 'Alternativa criptografada ao 443', en: 'Encrypted alternative to 443' },
  { port: 8500, proto: 'TCP', cat: 'infra', name: 'Consul', pt: 'API HTTP do Consul (service discovery)', en: 'Consul HTTP API (service discovery)' },
  { port: 9000, proto: 'TCP', cat: 'ops', name: 'Portainer', pt: 'Gerenciador web do Docker', en: 'Docker web management UI' },
  { port: 9042, proto: 'TCP', cat: 'db', name: 'Cassandra CQL', pt: 'Consulta nativa do Cassandra', en: 'Cassandra native query protocol' },
  { port: 9090, proto: 'TCP', cat: 'ops', name: 'Prometheus', pt: 'Endpoint padrão do Prometheus', en: 'Default Prometheus endpoint' },
  { port: 9092, proto: 'TCP', cat: 'msg', name: 'Kafka', pt: 'Broker Kafka (listener padrão)', en: 'Kafka broker (default listener)' },
  { port: 9100, proto: 'TCP', cat: 'ops', name: 'node_exporter', pt: 'Métricas do host', en: 'Host metrics exporter' },
  { port: 9200, proto: 'TCP', cat: 'db', name: 'Elasticsearch', pt: 'API HTTP do Elasticsearch', en: 'Elasticsearch HTTP API' },
  { port: 9300, proto: 'TCP', cat: 'db', name: 'ES Transport', pt: 'Transporte entre nós do cluster ES', en: 'Elasticsearch node-to-node transport' },
  { port: 9418, proto: 'TCP', cat: 'infra', name: 'Git', pt: 'Protocolo git:// (read de repos)', en: 'git:// repository access' },
  { port: 11211, proto: 'TCP', cat: 'cache', name: 'Memcached', pt: 'Cache em memória', en: 'In-memory cache' },
  { port: 15672, proto: 'TCP', cat: 'msg', name: 'RabbitMQ Mgmt', pt: 'Painel web do RabbitMQ', en: 'RabbitMQ management web UI' },
  { port: 27017, proto: 'TCP', cat: 'db', name: 'MongoDB', pt: 'Banco MongoDB principal', en: 'Main MongoDB database port' },
]

const translations = {
  pt: {
    title: 'Portas de Rede Comuns',
    intro: (
      <>
        Referência pesquisável de portas TCP/UDP bem conhecidas — procure pelo
        número, pelo nome do serviço ou pela descrição pra descobrir rápido
        qual serviço usa uma porta (ou qual porta um serviço usa). Tudo
        client-side.
      </>
    ),
    search: 'Buscar por porta, serviço ou descrição...',
    all: 'Todas',
    empty: 'Nenhuma porta encontrada. Tente outra busca ou categoria.',
    tipTitle: 'Portas padrão e o registro IANA',
    tipBody: (
      <>
        Os números aqui são as <Text code>well-known</Text> do registro IANA no{' '}
        <Text code>TCP</Text>/<Text code>UDP</Text>. "Padrão" não é promessa:
        quase todo serviço (<Text code>PostgreSQL</Text>,{' '}
        <Text code>nginx</Text>, <Text code>Cassandra</Text>...) pode ser
        reconfigurado pra outra porta — ao investigar, confirme a porta real
        escutando no processo (<Text code>ss -ltnp</Text>) em vez de assumir a
        padrão. Portas abaixo de 1024 são privilegiadas e normalmente exigem
        root pra escutar.
      </>
    ),
    resultsOne: 'porta encontrada',
    resultsMany: 'portas encontradas',
    copy: 'Copiar como Markdown',
    copiedTitle: 'Tabela Markdown copiada',
    copiedError: 'Não foi possível copiar',
  },
  en: {
    title: 'Common Network Ports',
    intro: (
      <>
        A searchable reference of common TCP/UDP ports — look up a port number,
        service name or purpose to quickly find which service lives on a port
        (or which port a service uses). All client-side.
      </>
    ),
    search: 'Search by port number, service or description...',
    all: 'All',
    empty: 'No port found. Try a different search or category.',
    tipTitle: 'Default ports and the IANA registry',
    tipBody: (
      <>
        These are the <Text code>well-known</Text> entries from the IANA
        registry on <Text code>TCP</Text>/<Text code>UDP</Text>. Being the
        default is no promise: almost every service (<Text code>PostgreSQL</Text>,{' '}
        <Text code>nginx</Text>, <Text code>Cassandra</Text>...) can be
        reconfigured to another port. When troubleshooting, check which port
        the process is actually listening on (<Text code>ss -ltnp</Text>)
        instead of assuming the default. Ports below 1024 are privileged and
        usually require root to bind.
      </>
    ),
    resultsOne: 'port found',
    resultsMany: 'ports found',
    copy: 'Copy as Markdown',
    copiedTitle: 'Markdown table copied',
    copiedError: 'Could not copy',
  },
}

export default function CommonPortsPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [messageApi, messageContextHolder] = message.useMessage()

  const normalized = useCallback((s) => String(s).trim().toLowerCase(), [])

  const filtered = useMemo(() => {
    const q = normalized(query)
    return PORTS.filter((p) => {
      if (category !== 'all' && p.cat !== category) return false
      if (!q) return true
      return (
        String(p.port).includes(q) ||
        p.name.toLowerCase().includes(q) ||
        (p[lang] || '').toLowerCase().includes(q)
      )
    }).sort((a, b) => a.port - b.port)
  }, [query, category, lang, normalized])

  const mdTable = useMemo(() => {
    const head = '| Port | Proto | Service | Description |\n|---|---|---|---|\n'
    const rows = filtered
      .map((p) => `| ${p.port} | ${p.proto} | ${p.name.replace(/\|/g, '\\|')} | ${(p[lang] || '').replace(/\|/g, '\\|')} |`)
      .join('\n')
    return head + rows
  }, [filtered, lang])

  const resultLabel = filtered.length === 1 ? t.resultsOne : t.resultsMany

  const copyMarkdown = async () => {
    try {
      await navigator.clipboard.writeText(mdTable)
      messageApi.success(t.copiedTitle)
    } catch {
      messageApi.error(t.copiedError || 'Error')
    }
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {messageContextHolder}
      <Title level={2}><ReadOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Alert type="info" showIcon icon={<ApartmentOutlined />} message={t.tipTitle} description={t.tipBody} />

      <Space direction="vertical" style={{ width: '100%' }}>
        <Input
          prefix={<SearchOutlined />}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.search}
          allowClear
        />
        <Radio.Group value={category} onChange={(e) => setCategory(e.target.value)} optionType="button">
          <Radio.Button value="all">{t.all}</Radio.Button>
          {CATEGORIES.map((cat) => (
            <Radio.Button key={cat} value={cat}>{labelOf[cat][lang]}</Radio.Button>
          ))}
        </Radio.Group>
      </Space>

      <Space style={{ width: '100%', justifyContent: 'space-between' }}>
        <Text type="secondary">
          {filtered.length} {resultLabel}
        </Text>
        {filtered.length > 0 && (
          <Button size="small" icon={<CopyOutlined />} onClick={copyMarkdown}>
            {t.copy}
          </Button>
        )}
      </Space>

      <Card>
        <List
          dataSource={filtered}
          locale={{ emptyText: t.empty }}
          renderItem={(item) => (
            <List.Item key={`${item.port}-${item.proto}`}>
              <Space direction="vertical" size={6} style={{ width: '100%' }}>
                <Space wrap style={{ rowGap: 6 }}>
                  <Text code style={{ fontSize: 13 }}>{item.port}</Text>
                  <Tag>{item.proto}</Tag>
                  <Tag color={CATEGORY_COLOR[item.cat]}>{labelOf[item.cat][lang]}</Tag>
                  <Text strong>{item.name}</Text>
                </Space>
                <Text type="secondary">{item[lang]}</Text>
              </Space>
            </List.Item>
          )}
        />
      </Card>
    </Space>
  )
}