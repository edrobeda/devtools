import React, { useMemo, useState } from 'react'
import { Typography, Card, Input, Space, Button, Checkbox, Radio, Tag, Alert, Empty } from 'antd'
import {
  EyeInvisibleOutlined,
  ClearOutlined,
  CopyOutlined,
  ExperimentOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const RULES = [
  {
    key: 'bearer',
    tag: '[TOKEN]',
    label: { pt: 'Tokens Bearer', en: 'Bearer tokens' },
    re: /\bBearer\s+[A-Za-z0-9._~+=_-]+/gi,
  },
  {
    key: 'authInfo',
    tag: '[AUTH]',
    label: { pt: 'Credenciais em URLs (user:pass@)', en: 'Credentials in URLs (user:pass@)' },
    re: /https?:\/\/[^\s/@:]+:[^\s/@]*@/gi,
  },
  {
    key: 'jwt',
    tag: '[JWT]',
    label: { pt: 'JWT', en: 'JWT' },
    re: /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g,
  },
  {
    key: 'secretKV',
    tag: '[SECRET]',
    label: { pt: 'Segredos em chave=valor', en: 'Secrets in key=value' },
    re: /\b(password|passwd|pass|pwd|secret|token|api[_-]?key|access[_-]?key|client[_-]?secret|refresh[_-]?token|private[_-]?key|authorization|x-api-key|x-auth-token)\b\s*[:=]\s*["']?[^\s"',;)\[\]{}]+/gi,
  },
  {
    key: 'card',
    tag: '[CARD]',
    label: { pt: 'Cartões de crédito', en: 'Credit cards' },
    re: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
  },
  {
    key: 'cnpj',
    tag: '[CNPJ]',
    label: { pt: 'CNPJ', en: 'Company ID (CNPJ)' },
    re: /\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}\b/g,
  },
  {
    key: 'cpf',
    tag: '[CPF]',
    label: { pt: 'CPF', en: 'Tax ID (CPF)' },
    re: /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g,
  },
  {
    key: 'email',
    tag: '[EMAIL]',
    label: { pt: 'E-mails', en: 'E-mails' },
    re: /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/gi,
  },
  {
    key: 'uuid',
    tag: '[UUID]',
    label: { pt: 'UUIDs', en: 'UUIDs' },
    re: /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi,
  },
  {
    key: 'mac',
    tag: '[MAC]',
    label: { pt: 'Endereços MAC', en: 'MAC addresses' },
    re: /\b(?:[0-9a-f]{2}[:-]){5}[0-9a-f]{2}\b/gi,
  },
  {
    key: 'ipv6',
    tag: '[IPV6]',
    label: { pt: 'Endereços IPv6', en: 'IPv6 addresses' },
    re: /\b((?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|(?:[0-9a-fA-F]{1,4}:){1,7}:|(?:[0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|(?:[0-9a-fA-F]{1,4}:){1,5}(?::[0-9a-fA-F]{1,4}){1,2}|(?:[0-9a-fA-F]{1,4}:){1,4}(?::[0-9a-fA-F]{1,4}){1,3}|(?:[0-9a-fA-F]{1,4}:){1,3}(?::[0-9a-fA-F]{1,4}){1,4}|(?:[0-9a-fA-F]{1,4}:){1,2}(?::[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:(?:(?::[0-9a-fA-F]{1,4}){1,6})|:(?:(?::[0-9a-fA-F]{1,4}){1,7}|:))\b/gi,
  },
  {
    key: 'ipv4',
    tag: '[IPV4]',
    label: { pt: 'Endereços IPv4', en: 'IPv4 addresses' },
    re: /\b(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\b/g,
  },
  {
    key: 'phone',
    tag: '[PHONE]',
    label: { pt: 'Telefones', en: 'Phone numbers' },
    re: /(?:\+?\d{1,3}[\s-]?)?(?:\(\d{2,3}\)\s?|\d{2,3}[\s-]?)?\d{4,5}[\s-]?\d{4}/g,
  },
]

const SAMPLE = `2026-09-17T09:41:23Z INFO  user=maria.silva@example.com action=login ip=203.0.113.10
2026-09-17T09:41:24Z WARN  attempt from 2001:db8:85a3::8a2e:370:7334 request_id=9f8c2b7e-3a10-4b11-8c12-1d2e3f4a5b6c
2026-09-17T09:41:25Z ERROR charge failed card=4532 8471 0293 8812 cpf=529.982.247-25
2026-09-17T09:41:26Z DEBUG token=Bearer sk_live_51H8xK2AbCdEfGhIjK phone=+55 11 98888-7777
2026-09-17T09:41:27Z INFO  push deps callback https://admin:sup3rs3cret@api.example.com/hook
2026-09-17T09:41:28Z INFO  password=Tr0ub4dor&3 mac=a1:b2:c3:d4:e5:f6`

const translations = {
  pt: {
    title: 'Redator de PII (mascarar dados sensíveis)',
    intro: (
      <>
        Cola um log, uma resposta de API ou qualquer saída de terminal e mascara
        dados sensíveis — e-mails, CPF/CNPJ, cartões, IPs, tokens — antes de colar
        num ticket, numa issue ou num PR. Os valores originais nunca são exibidos,
        só as contagens por tipo. 100% no navegador: nada sai daqui.
      </>
    ),
    inputTitle: 'Texto / log de entrada',
    inputPlaceholder: 'Cole aqui o texto com dados sensíveis...',
    sample: 'Carregar exemplo',
    clear: 'Limpar',
    optionsTitle: 'O que mascarar',
    modeTag: 'Tag por tipo ([EMAIL], [IPV4]...)',
    modeGeneric: 'Tudo vira [REDACTED]',
    outputTitle: 'Resultado mascarado',
    copy: 'Copiar',
    copied: 'Copiado!',
    stats: 'Encontrado',
    nothingFound: 'nenhum dado sensível detectado',
    emptyOutput: 'Cole o texto acima para gerar a versão mascarada.',
    caveatTitle: 'Limitações',
    caveatDesc:
      'A detecção é baseada em regex e não é 100% precisa: pode mascarar de menos ou de mais (ex.: números longos podem ser tratados como telefone/CPF). Revise a saída antes de compartilhar e desabilite detectores quando necessário. Para conformidade real de privacidade, use ferramentas especializadas no lugar desta página.',
  },
  en: {
    title: 'PII Redactor (mask sensitive data)',
    intro: (
      <>
        Paste a log, an API response or any terminal output and mask sensitive
        data — e-mails, tax IDs, cards, IPs, tokens — before pasting it into a
        ticket, an issue or a PR. Original values are never shown, only counts
        per type. 100% in the browser: nothing leaves this page.
      </>
    ),
    inputTitle: 'Input text / log',
    inputPlaceholder: 'Paste the text with sensitive data...',
    sample: 'Load sample',
    clear: 'Clear',
    optionsTitle: 'What to mask',
    modeTag: 'Per-type tag ([EMAIL], [IPV4]...)',
    modeGeneric: 'Everything becomes [REDACTED]',
    outputTitle: 'Masked result',
    copy: 'Copy',
    copied: 'Copied!',
    stats: 'Found',
    nothingFound: 'no sensitive data detected',
    emptyOutput: 'Paste the text above to generate the masked version.',
    caveatTitle: 'Limitations',
    caveatDesc:
      'Detection is regex-based and not 100% accurate: it can over- or under-mask (e.g., long numbers may be treated as phones/CPF). Review the output before sharing and disable detectors when needed. For real privacy compliance, use a dedicated tool instead of this page.',
  },
}

export default function PiiRedactorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [text, setText] = useState(SAMPLE)
  const [enabled, setEnabled] = useState(() => Object.fromEntries(RULES.map((r) => [r.key, true])))
  const [mode, setMode] = useState('tag')
  const [copied, setCopied] = useState(false)

  const result = useMemo(() => {
    const counts = {}
    let work = text
    if (!work.trim()) return { out: '', counts }

    RULES.forEach((rule) => {
      if (!enabled[rule.key]) return
      const matches = work.match(rule.re)
      if (!matches || matches.length === 0) return
      counts[rule.key] = matches.length
      const tag = mode === 'generic' ? '[REDACTED]' : rule.tag
      work = work.replace(rule.re, () => tag)
    })
    return { out: work, counts }
  }, [text, enabled, mode])

  function toggleRule(key) {
    setEnabled((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  async function copyOutput() {
    await navigator.clipboard.writeText(result.out)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }

  const countEntries = RULES.filter((r) => result.counts[r.key])

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}>
        <EyeInvisibleOutlined /> {t.title}
      </Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card title={t.inputTitle}>
        <Input.TextArea
          rows={9}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t.inputPlaceholder}
          style={{ fontFamily: 'monospace', fontSize: 13 }}
        />
        <Space wrap style={{ marginTop: 8 }}>
          <Button icon={<ExperimentOutlined />} onClick={() => setText(SAMPLE)}>
            {t.sample}
          </Button>
          <Button icon={<ClearOutlined />} onClick={() => setText('')}>
            {t.clear}
          </Button>
        </Space>
      </Card>

      <Card title={t.optionsTitle}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Radio.Group
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            optionType="button"
            buttonStyle="solid"
            options={[
              { value: 'tag', label: t.modeTag },
              { value: 'generic', label: t.modeGeneric },
            ]}
          />
          <Space size={[8, 8]} wrap>
            {RULES.map((rule) => (
              <Checkbox
                key={rule.key}
                checked={enabled[rule.key]}
                onChange={() => toggleRule(rule.key)}
              >
                {rule.label[lang]}
              </Checkbox>
            ))}
          </Space>
        </Space>
      </Card>

      <Card
        title={t.outputTitle}
        extra={
          <Button
            icon={<CopyOutlined />}
            disabled={!text.trim()}
            onClick={copyOutput}
          >
            {copied ? t.copied : t.copy}
          </Button>
        }
      >
        {!text.trim() ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t.emptyOutput} />
        ) : (
          <>
            <div style={{ marginBottom: 8 }}>
              <Text strong>{t.stats}: </Text>
              {countEntries.length === 0 ? (
                <Text type="secondary">{t.nothingFound}</Text>
              ) : (
                <Space wrap size={[4, 4]}>
                  {countEntries.map((rule) => (
                    <Tag key={rule.key} color="red">
                      {rule.label[lang]}: {result.counts[rule.key]}
                    </Tag>
                  ))}
                </Space>
              )}
            </div>
            <pre
              style={{
                margin: 0,
                padding: 12,
                background: 'rgba(0,0,0,0.03)',
                borderRadius: 8,
                fontFamily: 'monospace',
                fontSize: 13,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                maxHeight: 320,
                overflow: 'auto',
              }}
            >
              {result.out}
            </pre>
          </>
        )}
      </Card>

      <Alert type="warning" showIcon message={t.caveatTitle} description={t.caveatDesc} />
    </Space>
  )
}