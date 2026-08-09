import React, { useMemo, useState, useCallback } from 'react'
import { Typography, Card, Space, Input, List, Tag, Radio, Alert, Button, message } from 'antd'
import { SearchOutlined, SafetyCertificateOutlined, CopyOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const CATEGORIES = ['keys', 'csr', 'certs', 'convert', 'verify', 'tls', 'crypto']

const CATEGORY_COLOR = {
  keys: 'blue',
  csr: 'purple',
  certs: 'green',
  convert: 'gold',
  verify: 'cyan',
  tls: 'orange',
  crypto: 'volcano',
}

const labelOf = {
  keys: { pt: 'Chaves', en: 'Keys' },
  csr: { pt: 'CSR', en: 'CSR' },
  certs: { pt: 'Certificados', en: 'Certificates' },
  convert: { pt: 'Conversão & formatos', en: 'Conversion & formats' },
  verify: { pt: 'Validação', en: 'Validation' },
  tls: { pt: 'TLS na prática', en: 'TLS in practice' },
  crypto: { pt: 'Hash & encriptação', en: 'Hash & encryption' },
}

const COMMANDS = [
  // ─── Chaves ────────────────────────────────────────────────────────────────
  { cmd: 'openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out key.pem', cat: 'keys', pt: 'Gera chave privada RSA 2048 (forma nova/universal)', en: 'Generates an RSA 2048 private key (new/universal form)' },
  { cmd: 'openssl genrsa -out key.pem 2048', cat: 'keys', pt: 'Gera chave RSA 2048 (forma clássica)', en: 'Generates an RSA 2048 key (classic form)' },
  { cmd: 'openssl genrsa -aes256 -out key.pem 3072', cat: 'keys', pt: 'Chave RSA protegida por senha (aes256)', en: 'RSA key protected with a passphrase (aes256)' },
  { cmd: 'openssl genpkey -algorithm EC -pkeyopt ec_paramgen_curve:prime256v1 -out ec.pem', cat: 'keys', pt: 'Chave EC na curva prime256v1 (P-256)', en: 'Elliptic curve key on prime256v1 (P-256)' },
  { cmd: 'openssl ecparam -name secp384r1 -genkey -noout -out ec.pem', cat: 'keys', pt: 'Chave EC secp384r1 (P-384), forma com -genkey', en: 'secp384r1 EC key (P-384), command-line param form' },
  { cmd: 'openssl ecparam -list_curves', cat: 'keys', pt: 'Lista as curvas elípticas suportadas', en: 'Lists the supported elliptic curves' },
  { cmd: 'openssl rsa -in key.pem -text -noout', cat: 'keys', pt: 'Mostra os parâmetros/valor da chave RSA', en: 'Prints the RSA key parameters/value' },
  { cmd: 'openssl rsa -in key.pem -check -noout', cat: 'keys', pt: 'Verifica se a chave RSA não está corrompida', en: 'Checks the RSA key for consistency' },
  { cmd: 'openssl pkey -in key.pem -pubout -out pub.pem', cat: 'keys', pt: 'Extrai a chave PÚBLICA da privada (any algo)', en: 'Extracts the PUBLIC key from the private one' },
  { cmd: 'openssl rsa -in key.pem -pubout -out pub.pem', cat: 'keys', pt: 'Extrai a chave pública (apenas RSA)', en: 'Extracts the public key (RSA only)' },
  { cmd: 'openssl rsa -in key.pem -check -passin file:pass.txt', cat: 'keys', pt: 'Valida a chave passando a senha por arquivo', en: 'Validates the key passing the passphrase via file' },

  // ─── CSR ───────────────────────────────────────────────────────────────────
  { cmd: 'openssl req -new -key key.pem -out req.csr -subj "/C=BR/O=ACME/CN=example.com"', cat: 'csr', pt: 'Gera o CSR a partir da chave já existente', en: 'Creates a CSR from an existing key' },
  { cmd: 'openssl req -new -newkey rsa:2048 -nodes -keyout key.pem -out req.csr', cat: 'csr', pt: 'Chave nova + CSR de uma vez (-nodes = sem senha)', en: 'New key + CSR in one go (-nodes = no passphrase)' },
  { cmd: 'openssl req -in req.csr -text -noout', cat: 'csr', pt: 'Inspeciona o conteúdo do CSR', en: 'Inspects the CSR contents' },
  { cmd: 'openssl req -verify -in req.csr -noout', cat: 'csr', pt: 'Verifica a assinatura do CSR', en: 'Verifies the CSR signature' },
  { cmd: 'openssl req -in req.csr -pubkey -noout', cat: 'csr', pt: 'Mostra a chave pública embutida no CSR', en: 'Shows the public key embedded in the CSR' },

  // ─── Certificados ──────────────────────────────────────────────────────────
  { cmd: 'openssl req -x509 -newkey rsa:2048 -nodes -days 365 \\\n  -keyout key.pem -out cert.pem -subj "/CN=localhost"', cat: 'certs', pt: 'Autoassinado p/ teste local (CN localhost)', en: 'Self-signed cert for local testing (CN localhost)' },
  { cmd: 'openssl x509 -in cert.pem -text -noout', cat: 'certs', pt: 'Inspeciona o certificado (todos os campos)', en: 'Inspects the certificate (every field)' },
  { cmd: 'openssl x509 -in cert.pem -subject -issuer -dates -noout', cat: 'certs', pt: 'Resumo rápido: sujeito, emissor, validade', en: 'Quick summary: subject, issuer, validity' },
  { cmd: 'openssl x509 -in cert.pem -enddate -noout', cat: 'certs', pt: 'Só a data de expiração', en: 'Only the expiry date' },
  { cmd: 'openssl x509 -in cert.pem -ext subjectAltName -noout', cat: 'certs', pt: 'Lista os SANs (domínios que o cert cobre)', en: 'Lists the SANs (domains the cert covers)' },
  { cmd: 'openssl x509 -in cert.pem -fingerprint -sha256 -noout', cat: 'certs', pt: 'Fingerprint SHA-256 do certificado', en: 'SHA-256 fingerprint of the certificate' },
  { cmd: 'openssl x509 -in cert.pem -serial -noout', cat: 'certs', pt: 'Número de série', en: 'Serial number' },
  { cmd: 'openssl x509 -in cert.pem -pubkey -noout', cat: 'certs', pt: 'Chave pública do certificado', en: 'Public key from the certificate' },
  { cmd: 'openssl crl -in crl.pem -text -noout', cat: 'certs', pt: 'Inspeciona uma lista de revogação (CRL)', en: 'Inspects a Certificate Revocation List' },

  // ─── Conversão & formatos ──────────────────────────────────────────────────
  { cmd: 'openssl x509 -in cert.pem -outform der -out cert.der', cat: 'convert', pt: 'PEM → DER (binário)', en: 'PEM → DER (binary)' },
  { cmd: 'openssl x509 -inform der -in cert.der -outform pem -out cert.pem', cat: 'convert', pt: 'DER → PEM (texto)', en: 'DER → PEM (text)' },
  { cmd: 'openssl pkey -in key.pem -outform der -out key.der', cat: 'convert', pt: 'Chave privada PEM → DER', en: 'Private key PEM → DER' },
  { cmd: 'openssl pkcs12 -export -out bundle.p12 \\\n  -inkey key.pem -in cert.pem -certfile ca.pem', cat: 'convert', pt: 'Junta chave + cert + cadeia num PKCS#12 (.p12/.pfx)', en: 'Packs key + cert + chain into PKCS#12 (.p12/.pfx)' },
  { cmd: 'openssl pkcs12 -in bundle.p12 -nodes -out all.pem', cat: 'convert', pt: 'Extrai chave e certificados do .p12 (formato PEM)', en: 'Extracts key and certs from .p12 as PEM' },
  { cmd: 'openssl pkcs8 -in key.pem -topk8 -nocrypt -out key-pk8.pem', cat: 'convert', pt: 'Converte a chave pro formato PKCS#8 (sem senha)', en: 'Converts the key to PKCS#8 (no passphrase)' },
  { cmd: 'openssl crl2pkcs7 -nocrl \\\n  -certfile cert.pem -out cert.p7b', cat: 'convert', pt: 'Cert → PKCS#7 (.p7b/.p7c), usado em distribuição', en: 'Cert → PKCS#7 (.p7b/.p7c), used for bundling' },

  // ─── Validação ─────────────────────────────────────────────────────────────
  { cmd: 'openssl verify -CAfile ca.pem cert.pem', cat: 'verify', pt: 'Valida o cert contra a CA (cadeia)', en: 'Verifies the cert against the CA (chain)' },
  { cmd: 'openssl verify -CAfile ca.pem -untrusted chain.pem cert.pem', cat: 'verify', pt: 'Valida incluindo os intermediários separados', en: 'Verifies including intermediate certs' },
  { cmd: 'openssl ca -in req.csr -out cert.pem \\\n  -keyfile ca.key -cert ca.pem -days 365', cat: 'verify', pt: 'Assina o CSR com a CA (gera o certificado)', en: 'Signs the CSR with the CA (issues the certificate)' },
  { cmd: 'openssl verify -CApath /etc/ssl/certs cert.pem', cat: 'verify', pt: 'Valida usando o trust store do sistema', en: 'Verifies using the system trust store' },

  // ─── TLS na prática ────────────────────────────────────────────────────────
  { cmd: 'openssl s_client -connect example.com:443 -servername example.com', cat: 'tls', pt: 'Pega o cert de um host: fato o handshake TLS', en: 'Fetches a host cert; dumps the TLS handshake' },
  { cmd: 'openssl s_client -connect example.com:443 -servername example.com -showcerts', cat: 'tls', pt: 'Mostra TODA a cadeia que o host envia', en: 'Shows the WHOLE chain the host sends' },
  { cmd: 'openssl s_client -connect example.com:443 -tls1_2', cat: 'tls', pt: 'Força TLS 1.2 no teste', en: 'Forces TLS 1.2 for the test' },
  { cmd: 'openssl s_client -connect example.com:443 -brief', cat: 'tls', pt: 'Teste TLS “brief”: só status/algos, sem o dump', en: 'Brief TLS test: status/algorithms, no dump' },
  { cmd: 'openssl s_server -accept 8443 -cert cert.pem -key key.pem -WWW', cat: 'tls', pt: 'Sobe um servidor TLS de teste na porta 8443', en: 'Runs a test TLS server on port 8443' },
  { cmd: 'openssl s_client -connect localhost:8443 -CAfile ca.pem \\\n  -verify_return_error', cat: 'tls', pt: 'Testa cliente verificando a cadeia contra a CA', en: 'Client test verifying the chain against the CA' },
  { cmd: 'openssl s_client -connect example.com:443 -servername example.com \\\n | openssl x509 -noout -subject -dates', cat: 'tls', pt: 'Cabelada: pega do host direto no resumo do cert', en: 'One-liner: host cert straight to a summary' },

  // ─── Hash & encriptação ────────────────────────────────────────────────────
  { cmd: 'openssl dgst -sha256 arquivo.txt', cat: 'crypto', pt: 'Hash SHA-256 de um arquivo', en: 'SHA-256 hash of a file' },
  { cmd: 'openssl sha256 arquivo.txt', cat: 'crypto', pt: 'Atalho equivalente ao dgst', en: 'Shorthand equivalent of dgst' },
  { cmd: "openssl dgst -sha256 -out sig.bin -sign key.pem arquivo.txt", cat: 'crypto', pt: 'Assina o arquivo (SHA-256) com a chave privada', en: 'Signs the file (SHA-256) with the private key' },
  { cmd: "openssl dgst -sha256 -verify pub.pem -signature sig.bin arquivo.txt", cat: 'crypto', pt: 'Verifica a assinatura com a chave pública', en: 'Verifies the signature with the public key' },
  { cmd: 'openssl pkeyutl -encrypt -pubin -inkey pub.pem -in msg.bin -out msg.enc', cat: 'crypto', pt: 'Encripta com a chave pública (RSA/QEC)', en: 'Encrypts with the public key (RSA/EC)' },
  { cmd: 'openssl pkeyutl -decrypt -inkey key.pem -in msg.enc -out msg.bin', cat: 'crypto', pt: 'Decripta com a chave privada', en: 'Decrypts with the private key' },
  { cmd: 'openssl enc -aes-256-cbc -pbkdf2 -salt -in segredo.txt -out segredo.enc', cat: 'crypto', pt: 'Encripta um arquivo simétrico (pede senha)', en: 'Encrypts a file with a password (prompts for one)' },
  { cmd: 'openssl enc -d -aes-256-cbc -pbkdf2 -in segredo.enc -out segredo.txt', cat: 'crypto', pt: 'Decripta o arquivo simétrico', en: 'Decrypts the symmetric file' },
  { cmd: 'openssl rand -hex 32', cat: 'crypto', pt: '32 bytes aleatórios seguros em hex (64 chars)', en: '32 cryptographically random bytes in hex' },
  { cmd: 'openssl rand -base64 48', cat: 'crypto', pt: '48 bytes aleatórios em base64 (boa pra token/secret)', en: '48 random bytes in base64 (nice for tokens/secrets)' },
  { cmd: 'openssl speed -blake2s256', cat: 'crypto', pt: 'Benchmark do algoritmo (speed)', en: 'Benchmarks an algorithm (speed)' },
]

const translations = {
  pt: {
    title: 'Comandos OpenSSL',
    intro: (
      <>
        Cheat sheet pesquisável do <Text code>openssl</Text> — o canivete suíço
        do TLS/certificados que todo dev que mexe com HTTPS, chaves ou assinaturas
        acaba usando. Entrada em <Text code>openssl &lt;ação&gt;</Text> a partir
        do terminal. Tudo client-side.
      </>
    ),
    search: 'Buscar comando ou descrição...',
    all: 'Todos',
    empty: 'Nenhum comando encontrado. Tente outra busca ou categoria.',
    tipTitle: 'O essencial antes de sair digitando',
    tipBody: (
      <>
        <Text code>openssl</Text> é uma coleção de subcomandos muitos
        independentes — <Text code>genpkey</Text>/<Text code>genrsa</Text>{' '}
        (gerar chave), <Text code>req</Text> (CSR e autoassinado),{' '}
        <Text code>x509</Text> (inspecionar cert), <Text code>s_client</Text>{' '}
        (testar TLS), <Text code>dgst</Text> (hash/assinatura),{' '}
        <Text code>enc</Text> (encriptar arquivo). O mnemônico do dia a dia:
        <Text code>genrsa → req -new → CA → x509</Text> gera a cadeia, e{' '}
        <Text code>s_client</Text> + <Text code>x509</Text> descobrem o que o
        host manda. Pegadinhas: PEM é texto com <Text code>BEGIN/END</Text>{' '}
        (o mesmo cert existe em DER binário), chaves sem proteção precisam ser
        tratadas como segredo, e campos <Text code>-noout</Text> mostram{' '}
        <Text code>-text</Text> sem imprimir a chave/cert outra vez no stdout.
      </>
    ),
    resultsOne: 'comando encontrado',
    resultsMany: 'comandos encontrados',
    copy: 'Copiar como Markdown',
    copied: 'Tabela Markdown copiada',
    copiedError: 'Não foi possível copiar',
  },
  en: {
    title: 'OpenSSL Commands',
    intro: (
      <>
        A searchable cheat sheet for <Text code>openssl</Text> — the Swiss-army
        knife of TLS in the terminal: HTTPS, keys and signatures. Usage is{' '}
        <Text code>openssl &lt;action&gt;</Text> from the shell. All
        client-side.
      </>
    ),
    tipTitle: 'The essentials before you start typing',
    tipBody: (
      <>
        <Text code>openssl</Text> is a collection of fairly independent
        subcommands — <Text code>req</Text> (CSR and self-signed),{' '}
        <Text code>x509</Text> (inspect cert), <Text code>s_client</Text>{' '}
        (test TLS), <Text code>dgst</Text> (hash/sign), <Text code>enc</Text>{' '}
        (encrypt files). The day-to-day mnemonic:{' '}
        <Text code>genkey → req → CA → x509</Text> builds a chain, and{' '}
        <Text code>s_client</Text> + <Text code>x509</Text> inspect a live
        host. Gotchas: PEM wraps DER (text vs binary), unprotected keys must
        be treated as secrets, and adding <Text code>-noout</Text> keeps the
        'raw value' from flooding your terminal.
      </>
    ),
    resultsOne: 'command found',
    resultsMany: 'commands found',
    copy: 'Copy as Markdown',
    copied: 'Markdown table copied',
    copiedError: 'Could not copy',
  },
}

export default function OpensslCommandsPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [category, setCategory] = useState('all')
  const [query, setQuery] = useState('')
  const [messageApi, messageContextHolder] = message.useMessage()

  const normalized = useCallback((s) => String(s).trim().toLowerCase(), [])

  const filtered = useMemo(() => {
    const q = normalized(query)
    return COMMANDS.filter((c) => {
      if (category !== 'all' && c.cat !== category) return false
      if (!q) return true
      return (
        c.cmd.toLowerCase().includes(q) ||
        (c[lang] || '').toLowerCase().includes(q)
      )
    })
  }, [category, query, lang, normalized])

  const mdTable = useMemo(() => {
    const head = '| Command | Category | Description |\n|---|---|---|\n'
    const rows = filtered.map((c) =>
      `| \`${c.cmd.replace(/\|/g, '\\|').replace(/\n/g, '\\n')}\` | ${labelOf[c.cat][lang]} | ${(c[lang] || '').replace(/\|/g, '\\|')} |`
    )
    return head + rows.join('\n')
  }, [filtered, lang])

  const copyText = useCallback(
    async (text, okMsg) => {
      try {
        await navigator.clipboard.writeText(text)
        messageApi.success(okMsg || t.copied)
      } catch {
        messageApi.error(t.copiedError || 'Error')
      }
    },
    [t, messageApi]
  )

  const resultLabel = filtered.length === 1 ? t.resultsOne : t.resultsMany

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {messageContextHolder}
      <Title level={2}><SafetyCertificateOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Alert type="info" showIcon icon={<SafetyCertificateOutlined />} message={t.tipTitle} description={t.tipBody} />

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
          <Button size="small" icon={<CopyOutlined />} onClick={() => copyText(mdTable)}>
            {t.copy}
          </Button>
        )}
      </Space>

      <Card>
        <List
          dataSource={filtered}
          locale={{ emptyText: t.empty }}
          renderItem={(item) => (
            <List.Item key={item.cmd}>
              <Space direction="vertical" size={6} style={{ width: '100%' }}>
                <Space wrap style={{ rowGap: 6 }}>
                  <Text code style={{ fontSize: 13 }}>{item.cmd}</Text>
                  <Tag color={CATEGORY_COLOR[item.cat]}>{labelOf[item.cat][lang]}</Tag>
                  <Button size="small" type="text" icon={<CopyOutlined />} onClick={() => copyText(item.cmd)} />
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