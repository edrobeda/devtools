import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  Typography,
  Card,
  Space,
  Segmented,
  Input,
  Button,
  Alert,
  Tag,
  Descriptions,
  List,
  Collapse,
  Upload,
  message,
} from 'antd'
import {
  SafetyCertificateOutlined,
  CopyOutlined,
  UploadOutlined,
  ThunderboltOutlined,
  FileTextOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import { decodeCertificate, getEngineSource, getSampleCertificates } from '../utils/certificateDecoder'

const { Title, Paragraph, Text } = Typography

const LOCALES = { pt: 'pt-BR', en: 'en-US' }

function formatDate(date, lang) {
  if (!date || date.getTime() !== date.getTime()) return '—'
  return date.toLocaleString(LOCALES[lang], {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function daysBetween(from, to) {
  return Math.round((to - from) / 86400000)
}

const translations = {
  pt: {
    title: 'Decodificador de Certificado X.509',
    intro: (
      <>
        Cole um certificado em <Text code>PEM</Text> ({'-----BEGIN CERTIFICATE-----'}) ou{' '}
        <Text code>DER</Text> (base64 cru) e veja todos os campos decodificados: subject/issuer,
        validade, chave pública, extensões e fingerprints. Análise 100% no navegador — o
        certificado nunca sai da sua máquina.
      </>
    ),
    input: 'Entrada (PEM ou DER base64)',
    inputPlaceholder: '-----BEGIN CERTIFICATE-----\nMIIB…\n-----END CERTIFICATE-----',
    samples: 'Exemplos',
    clear: 'Limpar',
    upload: 'Carregar arquivo (.pem / .crt / .cer)',
    decoding: 'Decodificando…',
    noInput: 'Cole um certificado ou use um dos exemplos acima.',
    errorNoBlocks: 'Não foi possível achar um certificado na entrada.',
    errorNotCert: 'A entrada contém blocos, mas nenhum era um certificado X.509 válido.',
    notCertSkipped: (names) => `Blocos ignorados por não serem certificados: ${names.join(', ')}.`,
    chainTitle: 'Certificados encontrados',
    results: 'Certificado',
    version: 'Versão',
    serial: 'Serial (hex)',
    serialDec: 'Serial (decimal)',
    sigAlg: 'Assinatura',
    subject: 'Subject',
    issuer: 'Issuer',
    validity: 'Validade',
    notBefore: 'Válido desde',
    notAfter: 'Válido até',
    validStatus: (days) => `Válido — expira em ${days} dia(s)`,
    expiredStatus: (days) => `Expirado há ${days} dia(s)`,
    notYetStatus: (days) => `Ainda não é válido — começa em ${days} dia(s)`,
    statusUnknown: 'Não foi possível calcular a validade.',
    publicKey: 'Chave pública',
    pubAlg: 'Algoritmo',
    pubBits: 'Tamanho',
    pubExponent: 'Expoente',
    pubCurve: 'Curva',
    modulus: 'Modulus (hex)',
    fingerprints: 'Fingerprints',
    sha256: 'SHA-256',
    sha1: 'SHA-1',
    copy: 'Copiar',
    copied: 'Copiado!',
    extensions: 'Extensões',
    none: 'Nenhuma',
    critical: 'crítico',
    altNames: 'Subject Alternative Names',
    ekuList: 'Usos estendidos',
    keyUsageList: 'Key usage',
    basicCa: (v) => `CA = ${v ? 'true — emissor de certificados' : 'false — certificado folha'}`,
    basicPath: (n) => ` | pathLenConstraint = ${n}`,
    sigValue: 'Assinatura (hex)',
    derSize: 'Tamanho (DER)',
    bytes: 'bytes',
    source: 'Código-fonte do motor',
  },
  en: {
    title: 'X.509 Certificate Decoder',
    intro: (
      <>
        Paste a certificate in <Text code>PEM</Text> ({'-----BEGIN CERTIFICATE-----'}) or{' '}
        <Text code>DER</Text> (raw base64) and see every decoded field: subject/issuer,
        validity, public key, extensions and fingerprints. 100% in-browser — the
        certificate never leaves your machine.
      </>
    ),
    input: 'Input (PEM or raw base64 DER)',
    inputPlaceholder: '-----BEGIN CERTIFICATE-----\nMIIB…\n-----END CERTIFICATE-----',
    samples: 'Samples',
    clear: 'Clear',
    upload: 'Load file (.pem / .crt / .cer)',
    decoding: 'Decoding…',
    noInput: 'Paste a certificate or use one of the samples above.',
    errorNoBlocks: 'Could not find a certificate in the input.',
    errorNotCert: 'The input has blocks, but none was a valid X.509 certificate.',
    notCertSkipped: (names) => `Skipped blocks that are not certificates: ${names.join(', ')}.`,
    chainTitle: 'Certificates found',
    results: 'Certificate',
    version: 'Version',
    serial: 'Serial (hex)',
    serialDec: 'Serial (decimal)',
    sigAlg: 'Signature',
    subject: 'Subject',
    issuer: 'Issuer',
    validity: 'Validity',
    notBefore: 'Valid from',
    notAfter: 'Valid until',
    validStatus: (days) => `Valid — expires in ${days} day(s)`,
    expiredStatus: (days) => `Expired ${days} day(s) ago`,
    notYetStatus: (days) => `Not yet valid — starts in ${days} day(s)`,
    statusUnknown: 'Could not compute validity.',
    publicKey: 'Public key',
    pubAlg: 'Algorithm',
    pubBits: 'Size',
    pubExponent: 'Exponent',
    pubCurve: 'Curve',
    modulus: 'Modulus (hex)',
    fingerprints: 'Fingerprints',
    sha256: 'SHA-256',
    sha1: 'SHA-1',
    copy: 'Copy',
    copied: 'Copied!',
    extensions: 'Extensions',
    none: 'None',
    critical: 'critical',
    altNames: 'Subject Alternative Names',
    ekuList: 'Extended key usage',
    keyUsageList: 'Key usage',
    basicCa: (v) => `CA = ${v ? 'true — certificate issuer' : 'false — leaf certificate'}`,
    basicPath: (n) => ` | pathLenConstraint = ${n}`,
    sigValue: 'Signature (hex)',
    derSize: 'Size (DER)',
    bytes: 'bytes',
    source: 'Engine source code',
  },
}

function fingerprintTag(fp, color) {
  return fp ? (
    <Tag style={{ fontFamily: 'monospace', fontSize: 12 }} color={color}>
      {fp}
    </Tag>
  ) : (
    <Text type="secondary">—</Text>
  )
}

function copyText(text) {
  navigator.clipboard.writeText(text)
  message.success(translations.copy)
}

export default function CertificateDecoderPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [input, setInput] = useState('')
  const [state, setState] = useState({ status: 'idle' })
  const timerRef = useRef(null)

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (!input.trim()) {
      setState({ status: 'idle' })
      return
    }
    setState({ status: 'loading' })
    timerRef.current = setTimeout(() => {
      decodeCertificate(input)
        .then((res) => setState(res.ok ? { status: 'ok', data: res } : { status: 'error', error: res.error, skipped: res.skipped }))
        .catch(() => setState({ status: 'error', error: 'errorNoBlocks' }))
    }, 300)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [input])

  const samples = useMemo(() => getSampleCertificates(), [])

  const certs = state.status === 'ok' ? state.data.certs : []
  const [selected, setSelected] = useState(0)

  useEffect(() => {
    setSelected(0)
  }, [input])

  const cert = certs[selected]

  function statusNode(c) {
    if (!c.notBeforeDate || !c.notAfterDate) return <Tag>{t.statusUnknown}</Tag>
    const now = Date.now()
    if (c.validityStatus === 'valid') {
      return <Tag color="green">{t.validStatus(daysBetween(now, c.notAfterDate.getTime()))}</Tag>
    }
    if (c.validityStatus === 'expired') {
      return <Tag color="red">{t.expiredStatus(daysBetween(c.notAfterDate.getTime(), now))}</Tag>
    }
    return <Tag color="orange">{t.notYetStatus(daysBetween(c.notBeforeDate.getTime(), now))}</Tag>
  }

  function handleUpload(file) {
    file.text().then((txt) => {
      setInput(txt)
    })
    return false
  }

  const sampleOptions = samples.map((s, i) => ({ label: s.label, value: i }))

  const role = certs[selected]
  const renderExt = (ext) => {
    if (ext.kind === 'altNames') {
      return (
        <div style={{ marginTop: 4 }}>
          <Text strong>{t.altNames}:</Text>
          <div style={{ marginTop: 4 }}>
            {ext.altNames.map((n, i) => (
              <Tag key={i} color="blue">
                {n.type}: <Text code>{n.value}</Text>
              </Tag>
            ))}
          </div>
        </div>
      )
    }
    if (ext.kind === 'basicConstraints') {
      return (
        <div style={{ marginTop: 4 }}>
          <Text code>{t.basicCa(ext.cA)}</Text>
          {ext.pathLen !== null && <Text code>{t.basicPath(ext.pathLen)}</Text>}
        </div>
      )
    }
    if (ext.kind === 'keyUsage') {
      return (
        <div style={{ marginTop: 4 }}>
          <Text strong>{t.keyUsageList}:</Text>{' '}
          {ext.usages.length ? ext.usages.map((u) => <Tag key={u}>{u}</Tag>) : <Text type="secondary">—</Text>}
        </div>
      )
    }
    if (ext.kind === 'eku') {
      return (
        <div style={{ marginTop: 4 }}>
          <Text strong>{t.ekuList}:</Text>{' '}
          {ext.eku.map((o) => <Tag key={o}>{o}</Tag>)}
        </div>
      )
    }
    if (ext.kind === 'authorityKeyIdentifier') {
      return (
        <div style={{ marginTop: 4 }}>
          <Text code style={{ fontSize: 12 }}>{ext.keyId || '—'}</Text>
        </div>
      )
    }
    if (ext.kind === 'hex') {
      return (
        <div style={{ marginTop: 4 }}>
          <Text code style={{ fontSize: 12 }}>{ext.value}</Text>
        </div>
      )
    }
    return null
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}>
        <SafetyCertificateOutlined /> {t.title}
      </Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card title={t.input} extra={<Upload accept=".pem,.crt,.cer,.der" beforeUpload={handleUpload} maxCount={1} showUploadList={false}>
        <Button size="small" icon={<UploadOutlined />}>{t.upload}</Button>
      </Upload>}>
        <Input.TextArea
          rows={8}
          spellCheck={false}
          style={{ fontFamily: 'monospace', fontSize: 12 }}
          placeholder={t.inputPlaceholder}
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <Space wrap style={{ marginTop: 12 }}>
          <Text strong>{t.samples}:</Text>
          {samples.map((s, i) => (
            <Button key={i} size="small" icon={<ThunderboltOutlined />} onClick={() => setInput(s.pem)}>
              {s.label}
            </Button>
          ))}
          <Button size="small" danger icon={<FileTextOutlined />} onClick={() => setInput('')}>
            {t.clear}
          </Button>
        </Space>
      </Card>

      {state.status === 'idle' && <Alert type="info" message={t.noInput} showIcon />}
      {state.status === 'loading' && <Alert type="info" message={t.decoding} showIcon />}
      {state.status === 'error' && (
        <Alert
          type="error"
          message={t[state.error] || t.errorNoBlocks}
          showIcon
          description={state.skipped && state.skipped.length ? t.notCertSkipped(state.skipped) : undefined}
        />
      )}

      {state.status === 'ok' && (
        <>
          {certs.length > 1 && (
            <Card title={t.chainTitle}>
              <Segmented block options={sampleOptions} value={selected} onChange={setSelected} />
            </Card>
          )}
          <Card title={t.results} extra={<span>{statusNode(role)}</span>}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Descriptions column={1} bordered size="small">
                <Descriptions.Item label={t.subject}>
                  {role.subject.map((s, i) => <Tag key={i}>{s.oidName} = {s.value}</Tag>)}
                </Descriptions.Item>
                <Descriptions.Item label={t.issuer}>
                  {role.issuer.map((s, i) => <Tag key={i}>{s.oidName} = {s.value}</Tag>)}
                </Descriptions.Item>
                <Descriptions.Item label={t.version}>v{role.version}</Descriptions.Item>
                <Descriptions.Item label={t.serial}>
                  <Text code>{role.serialHex}</Text>
                </Descriptions.Item>
                <Descriptions.Item label={t.serialDec}>
                  <Text code>{role.serialDec}</Text>
                </Descriptions.Item>
                <Descriptions.Item label={t.sigAlg}>{role.signatureAlgorithm}</Descriptions.Item>
                <Descriptions.Item label={t.validity}>
                  <Space direction="vertical" size={0}>
                    <span>{t.notBefore}: <Text strong>{formatDate(role.notBeforeDate, lang)}</Text> <Text code style={{ fontSize: 12 }}>{role.notBefore}</Text></span>
                    <span>{t.notAfter}: <Text strong>{formatDate(role.notAfterDate, lang)}</Text> <Text code style={{ fontSize: 12 }}>{role.notAfter}</Text></span>
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label={t.derSize}>
                  {role.derBytes.toLocaleString()} {t.bytes}
                </Descriptions.Item>
              </Descriptions>

              <Card size="small" title={t.publicKey} style={{ marginTop: 8 }}>
                <Descriptions column={1} bordered size="small">
                  <Descriptions.Item label={t.pubAlg}>{role.publicKey.algorithm}</Descriptions.Item>
                  {role.publicKey.bits > 0 && (
                    <Descriptions.Item label={t.pubBits}>{role.publicKey.bits} bits</Descriptions.Item>
                  )}
                  {role.publicKey.curve && (
                    <Descriptions.Item label={t.pubCurve}>{role.publicKey.curve}</Descriptions.Item>
                  )}
                  {role.publicKey.exponent > 0 && (
                    <Descriptions.Item label={t.pubExponent}>{role.publicKey.exponent}</Descriptions.Item>
                  )}
                  {role.publicKey.modulus && (
                    <Descriptions.Item label={t.modulus}>
                      <pre style={{ margin: 0, overflowX: 'auto', fontSize: 11 }}><code>{role.publicKey.modulus}</code></pre>
                    </Descriptions.Item>
                  )}
                </Descriptions>
              </Card>

              <Card size="small" title={t.fingerprints}>
                <Space direction="vertical" size="middle">
                  <Space wrap align="center">
                    <Text strong>{t.sha256}:</Text>
                    {fingerprintTag(role.sha256, 'green')}
                    {role.sha256 && <Button size="small" icon={<CopyOutlined />} onClick={() => copyText(role.sha256)}>{t.copy}</Button>}
                  </Space>
                  <Space wrap align="center">
                    <Text strong>{t.sha1}:</Text>
                    {fingerprintTag(role.sha1, 'blue')}
                    {role.sha1 && <Button size="small" icon={<CopyOutlined />} onClick={() => copyText(role.sha1)}>{t.copy}</Button>}
                  </Space>
                </Space>
              </Card>

              <Card size="small" title={t.extensions}>
                {role.extensions.length === 0 ? (
                  <Text type="secondary">{t.none}</Text>
                ) : (
                  <List
                    size="small"
                    dataSource={role.extensions}
                    renderItem={(ext) => (
                      <List.Item>
                        <Space direction="vertical" size={0} style={{ width: '100%' }}>
                          <Space>
                            <Text strong>{ext.name}</Text>
                            <Tag color={ext.critical ? 'volcano' : 'default'} style={{ fontSize: 11 }}>
                              {ext.critical ? t.critical : ext.oid}
                            </Tag>
                          </Space>
                          {renderExt(ext)}
                        </Space>
                      </List.Item>
                    )}
                  />
                )}
              </Card>

              <Card size="small" title={t.sigValue}>
                <pre style={{ margin: 0, overflowX: 'auto', fontSize: 11, maxHeight: 200, overflowY: 'auto' }}>
                  <code>{role.signatureHex}</code>
                </pre>
              </Card>
            </Space>
          </Card>
        </>
      )}

      <Collapse
        items={[
          {
            key: 'source',
            label: t.source,
            children: (
              <pre style={{ margin: 0, overflowX: 'auto' }}>
                <code>{getEngineSource()}</code>
              </pre>
            ),
          },
        ]}
      />
    </Space>
  )
}