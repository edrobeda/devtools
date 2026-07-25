import React, { useMemo, useState } from 'react'
import { Typography, Card, Space, Slider, Checkbox, Button, InputNumber, List, message } from 'antd'
import { KeyOutlined, CopyOutlined, ReloadOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const LOWER = 'abcdefghijklmnopqrstuvwxyz'
const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const NUMBERS = '0123456789'
const SYMBOLS = '!@#$%^&*()_+-=[]{}|;:,.<>?'
const AMBIGUOUS = 'il1Lo0O'

const translations = {
  pt: {
    title: 'Gerador de Senha',
    intro: (
      <>
        Gera senhas aleatórias com <Text code>crypto.getRandomValues</Text>{' '}
        (mais forte que <Text code>Math.random</Text>), direto no navegador —
        nenhuma senha gerada aqui trafega pela rede.
      </>
    ),
    length: 'Comprimento',
    lowercase: 'Minúsculas (a-z)',
    uppercase: 'Maiúsculas (A-Z)',
    numbers: 'Números (0-9)',
    symbols: 'Símbolos (!@#$...)',
    excludeAmbiguous: 'Excluir caracteres ambíguos (i, l, 1, L, o, 0, O)',
    quantity: 'Quantidade',
    generate: 'Gerar',
    copy: 'Copiar',
    copyAll: 'Copiar todas',
    copied: 'Copiado!',
    noCharset: 'Selecione pelo menos um tipo de caractere.',
  },
  en: {
    title: 'Password Generator',
    intro: (
      <>
        Generates random passwords with <Text code>crypto.getRandomValues</Text>{' '}
        (stronger than <Text code>Math.random</Text>), right in the browser —
        no password generated here ever touches the network.
      </>
    ),
    length: 'Length',
    lowercase: 'Lowercase (a-z)',
    uppercase: 'Uppercase (A-Z)',
    numbers: 'Numbers (0-9)',
    symbols: 'Symbols (!@#$...)',
    excludeAmbiguous: 'Exclude ambiguous characters (i, l, 1, L, o, 0, O)',
    quantity: 'Quantity',
    generate: 'Generate',
    copy: 'Copy',
    copyAll: 'Copy all',
    copied: 'Copied!',
    noCharset: 'Select at least one character type.',
  },
}

function buildCharset({ lowercase, uppercase, numbers, symbols, excludeAmbiguous }) {
  let charset = ''
  if (lowercase) charset += LOWER
  if (uppercase) charset += UPPER
  if (numbers) charset += NUMBERS
  if (symbols) charset += SYMBOLS
  if (excludeAmbiguous) {
    charset = charset.split('').filter((c) => !AMBIGUOUS.includes(c)).join('')
  }
  return charset
}

function randomPassword(charset, length) {
  const values = new Uint32Array(length)
  crypto.getRandomValues(values)
  let result = ''
  for (let i = 0; i < length; i++) {
    result += charset[values[i] % charset.length]
  }
  return result
}

export default function PasswordGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [length, setLength] = useState(16)
  const [lowercase, setLowercase] = useState(true)
  const [uppercase, setUppercase] = useState(true)
  const [numbers, setNumbers] = useState(true)
  const [symbols, setSymbols] = useState(true)
  const [excludeAmbiguous, setExcludeAmbiguous] = useState(false)
  const [quantity, setQuantity] = useState(5)
  const [passwords, setPasswords] = useState([])

  const charset = useMemo(
    () => buildCharset({ lowercase, uppercase, numbers, symbols, excludeAmbiguous }),
    [lowercase, uppercase, numbers, symbols, excludeAmbiguous]
  )

  function generate() {
    if (!charset) {
      message.warning(t.noCharset)
      return
    }
    const list = Array.from({ length: quantity }, () => randomPassword(charset, length))
    setPasswords(list)
  }

  function copy(text) {
    navigator.clipboard.writeText(text)
    message.success(t.copied)
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><KeyOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <div>
            <Text>{t.length}: {length}</Text>
            <Slider min={4} max={64} value={length} onChange={setLength} />
          </div>

          <Space direction="vertical">
            <Checkbox checked={lowercase} onChange={(e) => setLowercase(e.target.checked)}>{t.lowercase}</Checkbox>
            <Checkbox checked={uppercase} onChange={(e) => setUppercase(e.target.checked)}>{t.uppercase}</Checkbox>
            <Checkbox checked={numbers} onChange={(e) => setNumbers(e.target.checked)}>{t.numbers}</Checkbox>
            <Checkbox checked={symbols} onChange={(e) => setSymbols(e.target.checked)}>{t.symbols}</Checkbox>
            <Checkbox checked={excludeAmbiguous} onChange={(e) => setExcludeAmbiguous(e.target.checked)}>{t.excludeAmbiguous}</Checkbox>
          </Space>

          <Space align="center">
            <Text>{t.quantity}</Text>
            <InputNumber min={1} max={50} value={quantity} onChange={setQuantity} />
            <Button type="primary" icon={<ReloadOutlined />} onClick={generate}>{t.generate}</Button>
          </Space>
        </Space>
      </Card>

      {passwords.length > 0 && (
        <Card
          extra={<Button size="small" icon={<CopyOutlined />} onClick={() => copy(passwords.join('\n'))}>{t.copyAll}</Button>}
        >
          <List
            dataSource={passwords}
            renderItem={(pwd) => (
              <List.Item
                actions={[
                  <Button key="copy" size="small" icon={<CopyOutlined />} onClick={() => copy(pwd)}>{t.copy}</Button>,
                ]}
              >
                <Text code style={{ fontSize: 14 }}>{pwd}</Text>
              </List.Item>
            )}
          />
        </Card>
      )}
    </Space>
  )
}
