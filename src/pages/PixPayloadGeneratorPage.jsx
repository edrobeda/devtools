import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Typography, Alert, Card, Space, Input, Select, InputNumber, Tag, Button, Table, Collapse, Divider, message } from 'antd'
import { AccountBookOutlined, CopyOutlined, DownloadOutlined, ReloadOutlined, ThunderboltOutlined, QrcodeOutlined } from '@ant-design/icons'
import QRCode from 'qrcode'
import { useLanguage } from '../i18n/LanguageContext'
import { qrToSvg, utf8Bytes } from '../utils/qrRenderer'

const { Title, Paragraph, Text } = Typography

// Tamanho em bytes UTF-8 (é assim que o manual do BR Code conta o
// comprimento dos campos — para conteúdo ASCII é igual ao nº de caracteres).
function byteLen(value) {
  return new TextEncoder().encode(value).length
}

// Campo EMV (BR Code): ID de 2 dígitos + comprimento do valor em 2 dígitos
// decimais (zero-padded) + o valor. Tudo, inclusive o comprimento, é ASCII.
function tlv(id, value) {
  return id + String(byteLen(value)).padStart(2, '0') + value
}

// CRC-16/CCITT-FALSE: polinômio 0x1021, init 0xFFFF, sem reflexo, xorout 0.
// É a variante que o Pix exige; o receptor recalcula sobre o payload que
// termina em "6304" e compara com os 4 hex recebidos em 63.
function crc16ccitt(text) {
  let crc = 0xffff
  for (let i = 0; i < text.length; i++) {
    crc ^= (text.charCodeAt(i) & 0xff) << 8
    for (let b = 0; b < 8; b++) {
      crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) : (crc << 1)
      crc &= 0xffff
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0')
}

// Monta o payload "copia e cola" do BR Code: campos obrigatórios, valor
// opcional e o 6304 + CRC no fim. Devolve o payload pronto e a lista de
// camadas (id, valor, bytes no payload) pra página exibir a decomposição.
function buildPixPayload({ key, name, city, amount, txid }) {
  const amt = amount === null || amount === undefined || amount === ''
    ? ''
    : tlv('54', Number(amount).toFixed(2))

  const seg26 = tlv('26', tlv('00', 'br.gov.bcb.pix') + tlv('01', key))
  const seg62 = tlv('62', tlv('05', (txid || '').trim() || '***'))
  const body =
    tlv('00', '01') +
    seg26 +
    tlv('52', '0000') +
    tlv('53', '986') +
    amt +
    tlv('58', 'BR') +
    tlv('59', name) +
    tlv('60', city) +
    seg62

  const payload = body + '6304' + crc16ccitt(body + '6304')
  const rows = [
    { key: '00', id: '00', value: '01', size: 2, label: 'Payload Format Indicator' },
    { key: '26', id: '26', value: `00 ${tlv('00', 'br.gov.bcb.pix').slice(2)} / 01 ${key}`, size: seg26.length, label: 'Merchant Account Information' },
    { key: '52', id: '52', value: '0000', size: 4, label: 'Merchant Category Code' },
    { key: '53', id: '53', value: '986', size: 3, label: 'Transaction Currency (BRL)' },
    { key: '54', id: '54', value: amt ? `R$ ${Number(amount).toFixed(2)}` : '—', size: amt ? tlv('54', Number(amount).toFixed(2)).length : 0, label: 'Transaction Amount' },
    { key: '58', id: '58', value: 'BR', size: 2, label: 'Country Code' },
    { key: '59', id: '59', value: name, size: tlv('59', name).length, label: 'Merchant Name' },
    { key: '60', id: '60', value: city, size: tlv('60', city).length, label: 'Merchant City' },
    { key: '61', id: '62', value: `05 ${(txid || '').trim() || '***'}`, size: seg62.length, label: 'Additional Data (TxID)' },
    { key: '63', id: '63', value: crc16ccitt(body + '6304'), size: 4, label: 'CRC16' },
  ].filter((r) => r.id !== '54' || amt)

  return { payload, crc: crc16ccitt(body + '6304'), rows, totalBytes: utf8Bytes(payload), errors: [] }
}

const DEFAULT_STATE = {
  keyType: 'phone',
  key: '+5511987654321',
  name: 'ACME DEV',
  city: 'SAO PAULO',
  amount: null,
  txid: '***',
}

const EXAMPLES = [
  { id: 'static', keyType: 'phone', key: '+5511987654321', name: 'ACME DEV', city: 'SAO PAULO', amount: null, txid: '***' },
  { id: 'amount', keyType: 'email', key: 'pagamentos@acme.dev', name: 'ACME DEV', city: 'SAO PAULO', amount: 100.5, txid: '***' },
  { id: 'dynamic', keyType: 'evp', key: '123e4567-e89b-12d3-a456-426614174000', name: 'ACME DEV', city: 'SAO PAULO', amount: 9.9, txid: 'PEDIDO-0001' },
]

const KEY_TYPES = ['cpf', 'cnpj', 'phone', 'email', 'evp']

const QR_OPTS = { ecc: 'M', scale: 8, margin: 4, fg: '#1f1f1f', bg: '#ffffff' }

const translations = {
  pt: {
    title: 'Gerador de Payload PIX (Copia e Cola / QR)',
    intro: (
      <>
        Monta a <Text code>string</Text> EMV do <Text strong>Pix</Text> que os
        apps de banco leem — o mesmo conteúdo por trás do texto{' '}
        <Text code>copia e cola</Text> e do QR Code. Preenche os dados do
        recebedor, opcionalmente o valor e o TxID, e o payload pronto sai com
        a decomposição campo a campo e o CRC16 já calculado. Tudo 100% no
        navegador, nenhum dado sai daqui.
      </>
    ),
    alertTitle: 'Como funciona',
    alertBody: (
      <>
        O BR Code é uma sequência de campos{' '}
        <Text code>ID(2) + comprimento(2) + valor</Text>. Os obrigatórios são{' '}
        <Text code>00</Text> (formato), <Text code>26</Text> (conta de
        recebimento, com a chave), <Text code>52/53</Text> (categoria zero e
        moeda BRL), <Text code>58/59/60</Text> (país BR, nome e cidade) e{' '}
        <Text code>62</Text> (dados adicionais). O valor (<Text code>54</Text>)
        só entra se preenchido — sem valor o payload é do tipo{' '}
        <Text strong>estático</Text>; com valor, <Text strong>dinâmico</Text>.
        O final <Text code>63</Text> carrega o <Text strong>CRC16</Text>{' '}
        (CCITT-FALSE) desta string inteira: o app do banco recalcula e recusa
        o payload se bater diferente, então qualquer byte adulterado invalida
        o Pix — por isso é inútil (e crime) alterar a chave ou o valor à mão.
        O <Text code>TxID</Text> identifica a cobrança no comprovante; o
        valor <Text code>***</Text> é o padrão pra cobrança sem identificador.
        Sempre teste o payload gerado no app do seu banco antes de usar em
        produção.
      </>
    ),
    formTitle: 'Dados da cobrança',
    keyTypeLabel: 'Tipo de chave',
    keyTypeLabels: {
      cpf: 'CPF',
      cnpj: 'CNPJ',
      phone: 'Celular',
      email: 'E-mail',
      evp: 'Aleatória (EVP)',
    },
    keyLabel: 'Chave Pix',
    keyPlaceholders: {
      cpf: '12345678909',
      cnpj: '11222333000181',
      phone: '+5511987654321',
      email: 'pagamentos@acme.dev',
      evp: '123e4567-e89b-12d3-a456-426614174000',
    },
    keyHints: {
      cpf: '11 dígitos, só números',
      cnpj: '14 dígitos, só números',
      phone: 'Formato E.164, com DDI (ex.: +5511987654321)',
      email: 'E-mail válido cadastrado no banco',
      evp: 'Chave aleatória (UUID) gerada pelo banco',
    },
    nameLabel: 'Nome do recebedor',
    cityLabel: 'Cidade',
    amountLabel: 'Valor (R$)',
    amountHint: 'Deixe vazio para payload estático (sem valor)',
    txidLabel: 'TxID',
    txidHint: 'Máx. 25 caracteres. Vazio ou *** = sem identificador',
    examplesLabel: 'Exemplos de um clique',
    exStatic: 'Estático (celular)',
    exAmount: 'Com valor (e-mail)',
    exDynamic: 'Dinâmica (EVP + TxID)',
    reset: 'Limpar',
    outputTitle: 'Payload copia e cola',
    copy: 'Copiar payload',
    copySvg: 'Copiar QR (SVG)',
    downloadPng: 'Baixar QR (PNG)',
    copied: 'Copiado',
    copyErr: 'Falha ao copiar',
    staticTag: 'Estático',
    amountTag: 'Com valor',
    crcTag: 'CRC16',
    qrTitle: 'QR Code',
    qrHint: 'O QR abaixo codifica exatamente a string do payload — escaneável por qualquer app de Pix.',
    breakdownTitle: 'Decomposição campo a campo',
    colId: 'Camada',
    colField: 'Campo',
    colValue: 'Conteúdo',
    colSize: 'Bytes',
    bytes: 'bytes',
    errKey: 'Informe a chave Pix.',
    errName: 'Informe o nome do recebedor.',
    errCity: 'Informe a cidade.',
    errTxid: 'O TxID pode ter no máximo 25 caracteres.',
    errLength: (n, max) => `${n}/${max}`,
    sourceTitle: 'Algoritmo-fonte',
    sourceNote: 'Funciona offline, no navegador.',
    resetConfirm: 'Campos restaurados para o exemplo estático.',
  },
  en: {
    title: 'PIX Payload Generator (Copy & Paste / QR)',
    intro: (
      <>
        Builds the EMV <Text code>string</Text> that Brazilian bank apps read
        for <Text strong>Pix</Text> — the same content behind the{' '}
        <Text code>copy and paste</Text> text and the QR Code. Fill in the
        receiver data, optionally the amount and TxID, and get the ready
        payload with a field-by-field breakdown and the CRC16 already
        computed. 100% in the browser, nothing leaves this page.
      </>
    ),
    alertTitle: 'How it works',
    alertBody: (
      <>
        The BR Code is a sequence of <Text code>ID(2) + length(2) + value</Text>{' '}
        fields. The required ones are <Text code>00</Text> (format),{' '}
        <Text code>26</Text> (receiving account, with the key),{' '}
        <Text code>52/53</Text> (zero category and BRL currency),{' '}
        <Text code>58/59/60</Text> (country BR, name and city) and{' '}
        <Text code>62</Text> (additional data). The amount (<Text code>54</Text>)
        only appears if set — no amount means a{' '}
        <Text strong>static</Text> payload; with amount,{' '}
        <Text strong>dynamic</Text>. The trailing <Text code>63</Text> field
        carries the <Text strong>CRC16</Text> (CCITT-FALSE) of the whole
        string: the receiver recomputes it and rejects the payload on
        mismatch, so tampering with the key or amount invalidates the Pix.
        The <Text code>TxID</Text> identifies the charge on the receipt;{' '}
        <Text code>***</Text> is the standard value for charges without an
        identifier. Always test the generated payload in your bank app before
        using it in production.
      </>
    ),
    formTitle: 'Charge data',
    keyTypeLabel: 'Key type',
    keyTypeLabels: {
      cpf: 'CPF',
      cnpj: 'CNPJ',
      phone: 'Phone',
      email: 'E-mail',
      evp: 'Random (EVP)',
    },
    keyLabel: 'Pix key',
    keyPlaceholders: {
      cpf: '12345678909',
      cnpj: '11222333000181',
      phone: '+5511987654321',
      email: 'payments@acme.dev',
      evp: '123e4567-e89b-12d3-a456-426614174000',
    },
    keyHints: {
      cpf: '11 digits, numbers only',
      cnpj: '14 digits, numbers only',
      phone: 'E.164 format, with country code (e.g. +5511987654321)',
      email: 'Valid e-mail registered at the bank',
      evp: 'Random key (UUID) issued by the bank',
    },
    nameLabel: 'Receiver name',
    cityLabel: 'City',
    amountLabel: 'Amount (BRL)',
    amountHint: 'Leave empty for a static payload (no amount)',
    txidLabel: 'TxID',
    txidHint: 'Max 25 chars. Empty or *** = no identifier',
    examplesLabel: 'One-click examples',
    exStatic: 'Static (phone)',
    exAmount: 'With amount (e-mail)',
    exDynamic: 'Dynamic (EVP + TxID)',
    reset: 'Clear',
    outputTitle: 'Copy-and-paste payload',
    copy: 'Copy payload',
    copySvg: 'Copy QR (SVG)',
    downloadPng: 'Download QR (PNG)',
    copied: 'Copied',
    copyErr: 'Copy failed',
    staticTag: 'Static',
    amountTag: 'With amount',
    crcTag: 'CRC16',
    qrTitle: 'QR Code',
    qrHint: 'The QR below encodes exactly the payload string — scannable by any Pix app.',
    breakdownTitle: 'Field-by-field breakdown',
    colId: 'Layer',
    colField: 'Field',
    colValue: 'Content',
    colSize: 'Bytes',
    bytes: 'bytes',
    errKey: 'Enter the Pix key.',
    errName: 'Enter the receiver name.',
    errCity: 'Enter the city.',
    errTxid: 'TxID can be at most 25 characters.',
    errLength: (n, max) => `${n}/${max}`,
    sourceTitle: 'Source algorithm',
    sourceNote: 'Works offline, in the browser.',
    resetConfirm: 'Fields restored to the static example.',
  },
}

const SOURCE_CODE = `// 0) Tamanho em bytes UTF-8 (é assim que o manual do BR Code conta o
//    comprimento dos campos — para ASCII é igual ao nº de caracteres).
function byteLen(value) {
  return new TextEncoder().encode(value).length
}

// 1) Campo EMV (BR Code): ID de 2 dígitos + comprimento do valor em 2
//    dígitos decimais (zero-padded) + o valor. Tudo ASCII.
function tlv(id, value) {
  return id + String(byteLen(value)).padStart(2, '0') + value
}

// 2) CRC-16/CCITT-FALSE: polinômio 0x1021, init 0xFFFF, sem reflexo.
//    O Pix exige exatamente esta variante (check "123456789" = 29B1).
function crc16ccitt(text) {
  let crc = 0xffff
  for (let i = 0; i < text.length; i++) {
    crc ^= (text.charCodeAt(i) & 0xff) << 8
    for (let b = 0; b < 8; b++) {
      crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) : (crc << 1)
      crc &= 0xffff
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0')
}

// 3) Monta o payload: campos obrigatórios, valor opcional e 6304 + CRC.
//    Sem valor = payload estático; com valor = dinâmico.
function buildPixPayload({ key, name, city, amount, txid }) {
  const amt = amount === null || amount === undefined || amount === ''
    ? ''
    : tlv('54', Number(amount).toFixed(2))

  const body =
    tlv('00', '01')                 // Payload Format Indicator
    + tlv('26',                     // Merchant Account Information
        tlv('00', 'br.gov.bcb.pix') //  00 = GUI do Pix
        + tlv('01', key))           //  01 = chave de recebimento
    + tlv('52', '0000')             // Merchant Category Code
    + tlv('53', '986')              // Moeda (BRL)
    + amt                          // Valor (campo 54, opcional)
    + tlv('58', 'BR')               // Country Code
    + tlv('59', name)               // Nome do recebedor
    + tlv('60', city)               // Cidade
    + tlv('62', tlv('05', txid || '***')) // Additional Data + TxID

  return body + '6304' + crc16ccitt(body + '6304')
}`

export default function PixPayloadGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [keyType, setKeyType] = useState(DEFAULT_STATE.keyType)
  const [key, setKey] = useState(DEFAULT_STATE.key)
  const [name, setName] = useState(DEFAULT_STATE.name)
  const [city, setCity] = useState(DEFAULT_STATE.city)
  const [amount, setAmount] = useState(DEFAULT_STATE.amount)
  const [txid, setTxid] = useState(DEFAULT_STATE.txid)

  const [messageApi, messageContextHolder] = message.useMessage()
  const [pngDataUrl, setPngDataUrl] = useState('')

  const result = useMemo(() => {
    const errors = []
    if (!key.trim()) errors.push(t.errKey)
    if (!name.trim()) errors.push(t.errName)
    if (!city.trim()) errors.push(t.errCity)
    if (txid.trim().length > 25) errors.push(t.errTxid)
    if (errors.length) return { errors, payload: '', crc: '', rows: [], totalBytes: 0 }

    return buildPixPayload({ key: key.trim(), name: name.trim(), city: city.trim(), amount, txid })
  }, [key, name, city, amount, txid, t])

  const { payload, crc, rows, errors, totalBytes } = result

  const svg = useMemo(() => (payload ? qrToSvg(payload, QR_OPTS) : ''), [payload])

  useEffect(() => {
    let cancelled = false
    if (!payload) {
      setPngDataUrl('')
      return undefined
    }
    setPngDataUrl('')
    QRCode.toDataURL(payload, {
      errorCorrectionLevel: 'M',
      margin: 4,
      width: 512,
      color: { dark: '#1f1f1f', light: '#ffffff' },
    })
      .then((url) => {
        if (!cancelled) setPngDataUrl(url)
      })
      .catch(() => {
        if (!cancelled) setPngDataUrl('')
      })
    return () => {
      cancelled = true
    }
  }, [payload])

  const copy = useCallback(
    async (value) => {
      try {
        await navigator.clipboard.writeText(value)
        messageApi.success(t.copied)
      } catch {
        messageApi.error(t.copyErr)
      }
    },
    [t, messageApi]
  )

  const downloadPng = useCallback(() => {
    if (!pngDataUrl) return
    const a = document.createElement('a')
    a.href = pngDataUrl
    a.download = 'pix-copia-e-cola.png'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }, [pngDataUrl])

  const applyExample = useCallback((ex) => {
    setKeyType(ex.keyType)
    setKey(ex.key)
    setName(ex.name)
    setCity(ex.city)
    setAmount(ex.amount)
    setTxid(ex.txid)
  }, [])

  const reset = useCallback(() => {
    setKeyType(DEFAULT_STATE.keyType)
    setKey(DEFAULT_STATE.key)
    setName(DEFAULT_STATE.name)
    setCity(DEFAULT_STATE.city)
    setAmount(DEFAULT_STATE.amount)
    setTxid(DEFAULT_STATE.txid)
    messageApi.info(t.resetConfirm)
  }, [t, messageApi])

  const columns = [
    { title: t.colId, dataIndex: 'id', width: 70 },
    { title: t.colField, dataIndex: 'label' },
    {
      title: t.colValue,
      dataIndex: 'value',
      render: (v) => <Text code style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{v}</Text>,
    },
    { title: t.colSize, dataIndex: 'size', width: 80, align: 'right' },
  ]

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {messageContextHolder}
      <Title level={2}><AccountBookOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Alert type="info" showIcon message={t.alertTitle} description={t.alertBody} />

      <Card title={t.formTitle}>
        <Space direction="vertical" size="middle" style={{ width: '100%', maxWidth: 560 }}>
          <Space wrap align="end" size="large">
            <Space direction="vertical" size={4}>
              <Text type="secondary">{t.keyTypeLabel}</Text>
              <Select
                value={keyType}
                onChange={setKeyType}
                options={KEY_TYPES.map((v) => ({ value: v, label: t.keyTypeLabels[v] }))}
                style={{ width: 200 }}
              />
            </Space>
            <Space direction="vertical" size={0} style={{ flex: 1, minWidth: 280 }}>
              <Text type="secondary">{t.keyLabel}</Text>
              <Input
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder={t.keyPlaceholders[keyType]}
                allowClear
                style={{ fontFamily: 'monospace' }}
              />
              <Text type="secondary" style={{ fontSize: 12 }}>{t.keyHints[keyType]}</Text>
            </Space>
          </Space>

          <Space wrap align="start" size="large">
            <Space direction="vertical" size={0} style={{ minWidth: 240 }}>
              <Text type="secondary">{t.nameLabel} · <Text code>≤ 25</Text></Text>
              <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={25} allowClear placeholder="ACME DEV" />
            </Space>
            <Space direction="vertical" size={0} style={{ minWidth: 200 }}>
              <Text type="secondary">{t.cityLabel} · <Text code>≤ 15</Text></Text>
              <Input value={city} onChange={(e) => setCity(e.target.value)} maxLength={15} allowClear placeholder="SAO PAULO" />
            </Space>
          </Space>

          <Space wrap align="end" size="large">
            <Space direction="vertical" size={4}>
              <Text type="secondary">{t.amountLabel}</Text>
              <InputNumber
                value={amount}
                onChange={setAmount}
                min={0}
                max={99999999999.99}
                precision={2}
                prefix="R$"
                placeholder="0,00"
                style={{ width: 180 }}
              />
              <Text type="secondary" style={{ fontSize: 12 }}>{t.amountHint}</Text>
            </Space>
            <Space direction="vertical" size={0} style={{ minWidth: 220 }}>
              <Text type="secondary">{t.txidLabel} · {t.errLength(txid.length, 25)}</Text>
              <Input value={txid} onChange={(e) => setTxid(e.target.value)} maxLength={25} allowClear placeholder="***" style={{ fontFamily: 'monospace' }} />
              <Text type="secondary" style={{ fontSize: 12 }}>{t.txidHint}</Text>
            </Space>
          </Space>
        </Space>

        <Divider />

        <Space wrap size="middle">
          <Text type="secondary">{t.examplesLabel}:</Text>
          {EXAMPLES.map((ex) => (
            <Tag
              key={ex.id}
              color={key === ex.key && name === ex.name && amount === ex.amount ? 'blue' : 'default'}
              style={{ cursor: 'pointer', fontSize: 13, padding: '2px 10px' }}
              onClick={() => applyExample(ex)}
            >
              <ThunderboltOutlined /> {ex.id === 'static' ? t.exStatic : ex.id === 'amount' ? t.exAmount : t.exDynamic}
            </Tag>
          ))}
          <Button size="small" icon={<ReloadOutlined />} onClick={reset}>
            {t.reset}
          </Button>
        </Space>
      </Card>

      <Card
        title={t.outputTitle}
        extra={
          <Space wrap>
            <Tag color="green">{amount === null ? t.staticTag : t.amountTag}</Tag>
            {payload && (
              <Tag color="blue">{t.crcTag} <Text code>{crc}</Text></Tag>
            )}
            {payload && <Tag>{totalBytes} {t.bytes}</Tag>}
          </Space>
        }
      >
        {errors.length > 0 ? (
          <Alert type="warning" showIcon message={errors.join(' · ')} />
        ) : (
          <>
            <Space wrap style={{ marginBottom: 12 }}>
              <Button type="primary" icon={<CopyOutlined />} onClick={() => copy(payload)}>
                {t.copy}
              </Button>
              <Button icon={<CopyOutlined />} disabled={!svg} onClick={() => copy(svg)}>
                {t.copySvg}
              </Button>
              <Button icon={<DownloadOutlined />} disabled={!pngDataUrl} onClick={downloadPng}>
                {t.downloadPng}
              </Button>
            </Space>
            <pre
              style={{
                margin: 0,
                fontSize: 13,
                lineHeight: 1.7,
                background: '#111',
                color: '#6fdb6f',
                padding: 14,
                borderRadius: 6,
                overflowX: 'auto',
                fontFamily: "'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace",
              }}
            >
              {payload}
            </pre>
          </>
        )}
      </Card>

      {payload && (
        <>
          <Card title={t.qrTitle}>
            <Paragraph type="secondary">{t.qrHint}</Paragraph>
            <div
              style={{
                padding: 16,
                background: '#ffffff',
                borderRadius: 10,
                border: '1px solid #f0f0f0',
                display: 'inline-block',
              }}
              dangerouslySetInnerHTML={{ __html: svg }}
            />
          </Card>

          <Card title={t.breakdownTitle}>
            <Table
              rowKey="key"
              size="small"
              columns={columns}
              dataSource={rows}
              pagination={false}
              style={{ maxWidth: 720 }}
            />
          </Card>
        </>
      )}

      <Collapse
        items={[
          {
            key: 'src',
            label: `${t.sourceTitle} · ${t.sourceNote}`,
            children: <pre style={{ margin: 0, fontSize: 12.5, lineHeight: 1.6, background: '#f5f5f5', padding: 12, borderRadius: 6, overflowX: 'auto' }}>{SOURCE_CODE}</pre>,
          },
        ]}
      />
    </Space>
  )
}