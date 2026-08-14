import React, { useMemo, useState } from 'react'
import { Typography, Card, Space, Tabs, Input, Button, Slider, Collapse, Tag, message, Row, Col, Alert } from 'antd'
import { CopyOutlined, LockOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  caesarEncrypt,
  caesarDecrypt,
  rot13,
  rot47,
  bruteForceCaesar,
  rotatedAlphabet,
  caesarStats,
  rot47Stats,
} from '../utils/caesarCipher'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input
const { useMessage } = message

const CAESAR_EXAMPLES = ['HELLO WORLD', 'Caesar cipher example', 'Attack at dawn!', 'DevTools 2026']
const ROT13_EXAMPLES = ['Uryyb Jbeyq', 'ABCDEFGHIJKLM', 'Why did the chicken cross the road?']
const ROT47_EXAMPLES = ['p]5@=6D @7 E96 =2E6G6=]', 'Hello World!', 'ROT47 covers more characters.']

const translations = {
  pt: {
    title: 'Cifra de César / ROT13 / ROT47',
    intro: (
      <>
        Codifica e decodifica textos com a <Text strong>Cifra de César</Text> clássica
        (deslocamento fixo no alfabeto A–Z), <Text strong>ROT13</Text> (deslocamento de 13,
        involutivo)         e <Text strong>ROT47</Text> (deslocamento no bloco ASCII imprimível{' '}
        <Text code>!</Text>–<Text code>~</Text>). Totalmente no navegador: útil para CTFs,
        brincadeiras de criptografia e ofuscação leve de textos.
      </>
    ),
    alertTitle: 'Criptografia clássica, não segura',
    alertBody: (
      <>
        Cifra de César e ROT13/47 são algoritmos de substituição muito fracos. Nunca use para
        proteger dados reais — servem apenas para diversão, demonstrações educacionais ou
        ofuscação mínima (ex.: spoilers). ROT47 preserva espaços e quebras; César/ROT13 só
        alteram letras A–Z, mantendo acentos, números e símbolos inalterados.
      </>
    ),
    tabCaesar: 'César (encode/decode)',
    tabRot13: 'ROT13',
    tabRot47: 'ROT47',
    tabBrute: 'Força bruta',
    inputLabel: 'Texto de entrada',
    inputPlaceholder: 'Digite (ou cole) o texto aqui…',
    shiftLabel: 'Deslocamento (shift)',
    shiftHint: (s) => `Shift ${s}`,
    modeLabel: 'Modo',
    modeEncode: 'Codificar',
    modeDecode: 'Decodificar',
    outputLabel: 'Resultado',
    outputPlaceholder: 'O resultado aparece aqui…',
    examples: 'Exemplos',
    copy: 'Copiar',
    copied: 'Copiado!',
    copyError: 'Não foi possível copiar',
    invert: 'Inverter',
    statsTitle: 'Estatísticas',
    statLength: 'caracteres',
    statTransformed: 'transformados',
    statUnchanged: 'inalterados',
    refTitle: 'Tabela de referência',
    refOriginal: 'Original',
    refShifted: 'Com shift',
    bruteTitle: 'Tentar todos os deslocamentos',
    bruteHint: 'Útil quando você não sabe o shift usado. Cada linha mostra o resultado de decodificar com um deslocamento diferente.',
    bruteShift: 'Shift',
    sourceCol: 'Código-fonte',
    sourceBody:
      'O núcleo vive em src/utils/caesarCipher.js. caesarEncrypt e caesarDecrypt aplicam o deslocamento apenas sobre A–Z (preservando maiúsculas/minúsculas); rot13 é César com shift 13; rot47 opera sobre o bloco ASCII 33–126; bruteForceCaesar retorna os 25 deslocamentos possíveis. Todos os cálculos são feitos caractere a caractere, sem saída de rede.',
  },
  en: {
    title: 'Caesar Cipher / ROT13 / ROT47',
    intro: (
      <>
        Encodes and decodes text using the classic <Text strong>Caesar cipher</Text>
        (fixed shift over the A–Z alphabet),         <Text strong>ROT13</Text> (shift by 13,
        self-inverting) and <Text strong>ROT47</Text> (shift over the printable ASCII block{' '}
        <Text code>!</Text>–<Text code>~</Text>). Fully client-side: handy for CTFs,
        cryptography demos and light text obfuscation.
      </>
    ),
    alertTitle: 'Classic cipher, not secure',
    alertBody: (
      <>
        Caesar cipher and ROT13/47 are extremely weak substitution ciphers. Never use them to
        protect real data — they are only for fun, educational demos or minimal obfuscation
        (e.g. spoilers). ROT47 keeps spaces and line breaks; Caesar/ROT13 only change A–Z
        letters, leaving accents, digits and symbols untouched.
      </>
    ),
    tabCaesar: 'Caesar (encode/decode)',
    tabRot13: 'ROT13',
    tabRot47: 'ROT47',
    tabBrute: 'Brute force',
    inputLabel: 'Input text',
    inputPlaceholder: 'Type (or paste) text here…',
    shiftLabel: 'Shift',
    shiftHint: (s) => `Shift ${s}`,
    modeLabel: 'Mode',
    modeEncode: 'Encode',
    modeDecode: 'Decode',
    outputLabel: 'Output',
    outputPlaceholder: 'The result appears here…',
    examples: 'Examples',
    copy: 'Copy',
    copied: 'Copied!',
    copyError: 'Could not copy',
    invert: 'Invert',
    statsTitle: 'Statistics',
    statLength: 'characters',
    statTransformed: 'transformed',
    statUnchanged: 'unchanged',
    refTitle: 'Reference table',
    refOriginal: 'Original',
    refShifted: 'Shifted',
    bruteTitle: 'Try every shift',
    bruteHint: 'Useful when you do not know the shift used. Each line shows the result of decoding with a different shift.',
    bruteShift: 'Shift',
    sourceCol: 'Source code',
    sourceBody:
      'The core lives in src/utils/caesarCipher.js. caesarEncrypt and caesarDecrypt apply the shift only to A–Z (preserving case); rot13 is Caesar with shift 13; rot47 operates on the ASCII 33–126 block; bruteForceCaesar returns all 25 possible shifts. All calculations are done character by character with no network traffic.',
  },
}

function OutputCard({ title, value, onCopy, onInvert, copyDisabled, invertDisabled, t }) {
  return (
    <Card
      title={title}
      extra={
        <Space>
          {onInvert && (
            <Button size="small" onClick={onInvert} disabled={invertDisabled}>
              {t.invert}
            </Button>
          )}
          <Button size="small" icon={<CopyOutlined />} onClick={onCopy} disabled={copyDisabled}>
            {t.copy}
          </Button>
        </Space>
      }
    >
      {value ? (
        <pre style={{ margin: 0, overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          <code>{value}</code>
        </pre>
      ) : (
        <Text type="secondary">{t.outputPlaceholder}</Text>
      )}
    </Card>
  )
}

function RefTable({ shift, t }) {
  const upper = useMemo(() => rotatedAlphabet(shift, true), [shift])
  const lower = useMemo(() => rotatedAlphabet(shift, false), [shift])
  return (
    <Space direction="vertical" size="small" style={{ width: '100%' }}>
      <Text strong>{t.refTitle}</Text>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', fontSize: 13 }}>
          <tbody>
            <tr>
              <td style={{ padding: '4px 8px', fontWeight: 600 }}>{t.refOriginal}</td>
              {'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((ch) => (
                <td key={ch} style={{ padding: '4px 6px', border: '1px solid #f0f0f0', textAlign: 'center' }}>{ch}</td>
              ))}
            </tr>
            <tr>
              <td style={{ padding: '4px 8px', fontWeight: 600 }}>{t.refShifted}</td>
              {upper.map((ch, i) => (
                <td key={i} style={{ padding: '4px 6px', border: '1px solid #f0f0f0', textAlign: 'center', background: '#fafafa' }}>
                  <Text code>{ch}</Text>
                </td>
              ))}
            </tr>
            <tr>
              <td style={{ padding: '4px 8px', fontWeight: 600 }}>{t.refOriginal}</td>
              {'abcdefghijklmnopqrstuvwxyz'.split('').map((ch) => (
                <td key={ch} style={{ padding: '4px 6px', border: '1px solid #f0f0f0', textAlign: 'center' }}>{ch}</td>
              ))}
            </tr>
            <tr>
              <td style={{ padding: '4px 8px', fontWeight: 600 }}>{t.refShifted}</td>
              {lower.map((ch, i) => (
                <td key={i} style={{ padding: '4px 6px', border: '1px solid #f0f0f0', textAlign: 'center', background: '#fafafa' }}>
                  <Text code>{ch}</Text>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </Space>
  )
}

export default function CaesarCipherPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [messageApi, messageContextHolder] = useMessage()

  const [activeTab, setActiveTab] = useState('caesar')
  const [text, setText] = useState('')
  const [shift, setShift] = useState(3)
  const [caesarMode, setCaesarMode] = useState('encode')

  const caesarOutput = useMemo(() => {
    if (!text) return ''
    return caesarMode === 'encode' ? caesarEncrypt(text, shift) : caesarDecrypt(text, shift)
  }, [text, shift, caesarMode])

  const rot13Output = useMemo(() => (text ? rot13(text) : ''), [text])
  const rot47Output = useMemo(() => (text ? rot47(text) : ''), [text])

  const stats = useMemo(() => {
    if (activeTab === 'rot47') return rot47Stats(text)
    return caesarStats(text)
  }, [text, activeTab])

  const bruteResults = useMemo(() => {
    if (!text || activeTab !== 'brute') return []
    return bruteForceCaesar(text)
  }, [text, activeTab])

  const copy = async (value) => {
    try {
      await navigator.clipboard.writeText(value)
      messageApi.success(t.copied)
    } catch {
      messageApi.error(t.copyError)
    }
  }

  const renderExamples = (examples) => (
    <Space wrap style={{ marginTop: 12 }}>
      {t.examples}:&nbsp;
      {examples.map((ex) => (
        <Tag
          key={ex}
          color="processing"
          style={{ cursor: 'pointer', marginInlineEnd: 0 }}
          onClick={() => setText(ex)}
        >
          <Text code style={{ color: 'inherit' }}>{ex}</Text>
        </Tag>
      ))}
    </Space>
  )

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {messageContextHolder}
      <Title level={2}><LockOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Alert type="warning" showIcon message={t.alertTitle} description={t.alertBody} />

      <Card>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Text strong>{t.inputLabel}</Text>
          <TextArea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t.inputPlaceholder}
            autoSize={{ minRows: 3, maxRows: 8 }}
            showCount
          />
        </Space>
      </Card>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'caesar',
            label: t.tabCaesar,
            children: (
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <Row gutter={[16, 16]}>
                  <Col xs={24} md={12}>
                    <Card title={t.modeLabel}>
                      <Space>
                        <Button type={caesarMode === 'encode' ? 'primary' : 'default'} onClick={() => setCaesarMode('encode')}>
                          {t.modeEncode}
                        </Button>
                        <Button type={caesarMode === 'decode' ? 'primary' : 'default'} onClick={() => setCaesarMode('decode')}>
                          {t.modeDecode}
                        </Button>
                      </Space>
                    </Card>
                  </Col>
                  <Col xs={24} md={12}>
                    <Card title={t.shiftLabel}>
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                          <Text code>{t.shiftHint(shift)}</Text>
                        </Space>
                        <Slider min={1} max={25} value={shift} onChange={setShift} marks={{ 1: '1', 13: '13', 25: '25' }} />
                      </Space>
                    </Card>
                  </Col>
                </Row>

                {renderExamples(CAESAR_EXAMPLES)}

                <OutputCard
                  title={t.outputLabel}
                  value={caesarOutput}
                  onCopy={() => copy(caesarOutput)}
                  onInvert={() => setCaesarMode((m) => (m === 'encode' ? 'decode' : 'encode'))}
                  copyDisabled={!caesarOutput}
                  invertDisabled={!text}
                  t={t}
                />

                <RefTable shift={shift} t={t} />
              </Space>
            ),
          },
          {
            key: 'rot13',
            label: t.tabRot13,
            children: (
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                {renderExamples(ROT13_EXAMPLES)}
                <OutputCard
                  title={t.outputLabel}
                  value={rot13Output}
                  onCopy={() => copy(rot13Output)}
                  copyDisabled={!rot13Output}
                  t={t}
                />
              </Space>
            ),
          },
          {
            key: 'rot47',
            label: t.tabRot47,
            children: (
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                {renderExamples(ROT47_EXAMPLES)}
                <OutputCard
                  title={t.outputLabel}
                  value={rot47Output}
                  onCopy={() => copy(rot47Output)}
                  copyDisabled={!rot47Output}
                  t={t}
                />
              </Space>
            ),
          },
          {
            key: 'brute',
            label: t.tabBrute,
            children: (
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <Card title={t.bruteTitle}>
                  <Paragraph type="secondary">{t.bruteHint}</Paragraph>
                </Card>
                {bruteResults.length > 0 ? (
                  <Card>
                    <Space direction="vertical" style={{ width: '100%' }}>
                      {bruteResults.map(({ shift: s, text: decoded }) => (
                        <Row key={s} gutter={[8, 8]} align="middle">
                          <Col xs={8} sm={4}>
                            <Tag color="blue">{t.bruteShift} {s}</Tag>
                          </Col>
                          <Col xs={16} sm={20}>
                            <Text code style={{ wordBreak: 'break-word' }}>{decoded}</Text>
                          </Col>
                        </Row>
                      ))}
                    </Space>
                  </Card>
                ) : (
                  <Card><Text type="secondary">{t.outputPlaceholder}</Text></Card>
                )}
              </Space>
            ),
          },
        ]}
      />

      <Card title={t.statsTitle}>
        <Space wrap>
          <Tag>{stats.length} {t.statLength}</Tag>
          <Tag color="blue">{stats.transformed} {t.statTransformed}</Tag>
          <Tag>{stats.unchanged} {t.statUnchanged}</Tag>
        </Space>
      </Card>

      <Collapse
        items={[
          {
            key: 'source',
            label: t.sourceCol,
            children: (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Paragraph type="secondary">{t.sourceBody}</Paragraph>
                <pre style={{ margin: 0, overflowX: 'auto', maxHeight: 320 }}>
                  <code>{`${caesarEncrypt.toString()}\n\n${rot13.toString()}\n\n${rot47.toString()}\n\n${bruteForceCaesar.toString()}`}</code>
                </pre>
              </Space>
            ),
          },
        ]}
      />
    </Space>
  )
}
