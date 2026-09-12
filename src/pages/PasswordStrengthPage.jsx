import React, { useState, useMemo } from 'react'
import {
  Typography, Card, Space, Input, InputNumber, Checkbox, Row, Col,
  Tag, Table, Alert, Collapse, Divider, Progress, Segmented,
} from 'antd'
import {
  SafetyCertificateOutlined, EyeInvisibleOutlined, EyeTwoTone,
  InfoCircleOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const translations = {
  pt: {
    title: 'Checador de Força de Senha',
    intro: (
      <>
        Digita uma senha pra ver a entropia estimada (bits), as combinações
        possíveis e o tempo de quebra por força bruta — ou usa o modo
        Planejar pra configurar comprimento e charset antes de definir uma
        política de senhas. Tudo calculado no navegador, a senha nunca sai
        daqui.
      </>
    ),
    modeAnalyze: 'Analisar senha',
    modePlan: 'Planejar',
    placeholder: 'Digite uma senha para testar',
    passwordLength: 'Comprimento da senha',
    charsets: 'Conjunto de caracteres',
    lowercase: 'Minúsculas (a–z)',
    uppercase: 'Maiúsculas (A–Z)',
    numbers: 'Números (0–9)',
    symbols: 'Símbolos (!@#$%...)',
    customChars: 'Caracteres customizados',
    customCount: 'Quantidade',
    chars: 'caracteres',
    results: 'Resultados',
    poolSize: 'Tamanho do pool',
    totalCombinations: 'Combinações possíveis',
    entropyBits: 'Entropia',
    bits: 'bits',
    crackTimes: 'Tempos estimados de quebra',
    attackType: 'Tipo de ataque',
    rate: 'Velocidade',
    estimatedTime: 'Tempo estimado',
    attack1b: 'Força bruta (GPU caseiro)',
    attack10b: 'Força bruta (GPU dedicado)',
    attack100b: 'Força bruta (ASIC)',
    rate1b: '1 bilhão/s',
    rate10b: '10 bilhões/s',
    rate100b: '100 bilhões/s',
    instant: 'instantâneo',
    veryWeak: 'Muito fraca',
    weak: 'Fraca',
    fair: 'Razoável',
    good: 'Boa',
    strong: 'Forte',
    veryStrong: 'Muito forte',
    excellent: 'Excelente',
    requirements: 'Requisitos de entropia por padrão',
    standard: 'Padrão',
    minEntropy: 'Entropia mínima',
    yourPassword: 'Sua senha',
    pass: '✓ Atende',
    fail: '✗ Não atende',
    nist: 'NIST SP 800-63B',
    nistDesc: 'Mínimo 8 caracteres, sem requisito explícito de entropia',
    pciDss: 'PCI DSS v4.0',
    pciDssDesc: 'Mínimo 12 caracteres para admin, 8 para usuários',
    owasp: 'OWASP ASVS',
    owaspDesc: 'Mínimo 64 caracteres para credenciais armazenadas',
    mitre: 'MITRE ATT&CK',
    mitreDesc: 'Senhas de contas de serviço: 20+ caracteres',
    dropbox: 'Dropbox (recomendação)',
    dropboxDesc: '80+ bits de entropia para senhas de usuário',
    google: 'Google (recomendação)',
    googleDesc: '12+ caracteres com mistura de tipos',
    formula: 'Fórmula',
    formulaDesc: 'Entropia = L × log₂(R), onde L = comprimento e R = tamanho do pool de caracteres',
    collapseTitle: 'Como funciona o cálculo',
    collapseContent: (
      <>
        <Paragraph>
          A entropia de uma senha mede o quão imprevisível ela é. Quanto
          maior a entropia (em bits), mais tentativas um atacante precisa
          fazer pra adivinhá-la.
        </Paragraph>
        <Paragraph>
          <Text strong>Entropia = L × log₂(R)</Text> onde <Text code>L</Text> é
          o comprimento da senha e <Text code>R</Text> é o tamanho do pool de
          caracteres. Cada bit extra de entropia dobra o número de tentativas
          necessárias.
        </Paragraph>
        <Paragraph>
          O tempo de quebra depende da velocidade do atacante. GPUs modernas
          podem testar bilhões de hashes por segundo (bcrypt, scrypt ou
          Argon2 limitam isso drasticamente — use hashing lento!).
        </Paragraph>
      </>
    ),
    guidelines: (
      <>
        Esses são guias — a entropia sozinha não conta a história toda.
        Senhas de dicionário, padrões de teclado e repetições reduzem a
        entropia real. Use Argon2id/bcrypt/scrypt pra hashing e senhas longas
        pra compensar.
      </>
    ),
    note: 'Estimativa simplificada baseada em entropia de alfabeto — não considera padrões previsíveis (datas, palavras de dicionário, sequências de teclado).',
  },
  en: {
    title: 'Password Strength Checker',
    intro: (
      <>
        Type a password to see its estimated entropy (bits), possible
        combinations, and brute-force crack time — or use Plan mode to
        configure length and character set before defining a password policy.
        Everything is computed in the browser, the password never leaves this
        page.
      </>
    ),
    modeAnalyze: 'Analyze password',
    modePlan: 'Plan',
    placeholder: 'Type a password to test',
    passwordLength: 'Password length',
    charsets: 'Character sets',
    lowercase: 'Lowercase (a–z)',
    uppercase: 'Uppercase (A–Z)',
    numbers: 'Numbers (0–9)',
    symbols: 'Symbols (!@#$%...)',
    customChars: 'Custom characters',
    customCount: 'Count',
    chars: 'characters',
    results: 'Results',
    poolSize: 'Pool size',
    totalCombinations: 'Total combinations',
    entropyBits: 'Entropy',
    bits: 'bits',
    crackTimes: 'Estimated crack times',
    attackType: 'Attack type',
    rate: 'Speed',
    estimatedTime: 'Estimated time',
    attack1b: 'Brute force (home GPU)',
    attack10b: 'Brute force (dedicated GPU)',
    attack100b: 'Brute force (ASIC)',
    rate1b: '1 billion/s',
    rate10b: '10 billion/s',
    rate100b: '100 billion/s',
    instant: 'instant',
    veryWeak: 'Very weak',
    weak: 'Weak',
    fair: 'Fair',
    good: 'Good',
    strong: 'Strong',
    veryStrong: 'Very strong',
    excellent: 'Excellent',
    requirements: 'Entropy requirements by standard',
    standard: 'Standard',
    minEntropy: 'Min entropy',
    yourPassword: 'Your password',
    pass: '✓ Pass',
    fail: '✗ Fail',
    nist: 'NIST SP 800-63B',
    nistDesc: 'Minimum 8 characters, no explicit entropy requirement',
    pciDss: 'PCI DSS v4.0',
    pciDssDesc: 'Minimum 12 characters for admin, 8 for users',
    owasp: 'OWASP ASVS',
    owaspDesc: 'Minimum 64 characters for stored credentials',
    mitre: 'MITRE ATT&CK',
    mitreDesc: 'Service account passwords: 20+ characters',
    dropbox: 'Dropbox (recommendation)',
    dropboxDesc: '80+ bits of entropy for user passwords',
    google: 'Google (recommendation)',
    googleDesc: '12+ characters with mixed types',
    formula: 'Formula',
    formulaDesc: 'Entropy = L × log₂(R), where L = length and R = pool size',
    collapseTitle: 'How the calculation works',
    collapseContent: (
      <>
        <Paragraph>
          Password entropy measures how unpredictable a password is. The
          higher the entropy (in bits), the more attempts an attacker needs
          to guess it.
        </Paragraph>
        <Paragraph>
          <Text strong>Entropy = L × log₂(R)</Text> where <Text code>L</Text> is
          the password length and <Text code>R</Text> is the character pool size.
          Each extra bit of entropy doubles the number of required attempts.
        </Paragraph>
        <Paragraph>
          Crack time depends on attacker speed. Modern GPUs can test billions
          of hashes per second (bcrypt, scrypt, or Argon2 drastically limit
          this — always use slow hashing!).
        </Paragraph>
      </>
    ),
    guidelines: (
      <>
        These are guidelines — entropy alone doesn&apos;t tell the whole story.
        Dictionary words, keyboard patterns, and repetitions reduce real-world
        entropy. Use Argon2id/bcrypt/scrypt for hashing and long passwords to
        compensate.
      </>
    ),
    note: 'Simplified estimate based on character-set entropy — does not account for predictable patterns (dates, dictionary words, keyboard sequences).',
  },
}

const POOL_SIZES = {
  lowercase: 26,
  uppercase: 26,
  numbers: 10,
  symbols: 33,
}

const STRENGTH_LEVELS = [
  { maxBits: 28, key: 'veryWeak', color: '#ff4d4f', level: 1 },
  { maxBits: 36, key: 'weak', color: '#ff7a45', level: 2 },
  { maxBits: 60, key: 'fair', color: '#faad14', level: 3 },
  { maxBits: 80, key: 'good', color: '#73d13d', level: 4 },
  { maxBits: 100, key: 'strong', color: '#52c41a', level: 5 },
  { maxBits: 128, key: 'veryStrong', color: '#389e0d', level: 6 },
  { maxBits: Infinity, key: 'excellent', color: '#0958d9', level: 7 },
]

const STANDARDS = [
  { bits: 28, label: 'NIST', key: 'nist' },
  { bits: 40, label: 'PCI DSS', key: 'pciDss' },
  { bits: 60, label: 'OWASP', key: 'owasp' },
  { bits: 80, label: 'Dropbox', key: 'dropbox' },
  { bits: 100, label: 'MITRE', key: 'mitre' },
  { bits: 128, label: 'Google', key: 'google' },
]

const ATTACKERS = [
  { key: 'attacker1b', rate: 1e9 },
  { key: 'attacker10b', rate: 1e10 },
  { key: 'attacker100b', rate: 1e11 },
]

function getStrength(bits) {
  for (const s of STRENGTH_LEVELS) {
    if (bits <= s.maxBits) return s
  }
  return STRENGTH_LEVELS[STRENGTH_LEVELS.length - 1]
}

function calcCrackTime(combinations, ratePerSec) {
  const halfCombinations = combinations / 2
  return halfCombinations / ratePerSec
}

function formatDuration(seconds) {
  if (!isFinite(seconds) || seconds < 0.001) return null
  const steps = [
    { threshold: 1, unit: 's', div: 1 },
    { threshold: 60, unit: 'm', div: 60 },
    { threshold: 60, unit: 'h', div: 60 },
    { threshold: 24, unit: 'd', div: 24 },
    { threshold: 365.25, unit: 'y', div: 365.25 },
  ]
  let val = seconds
  for (let i = 0; i < steps.length; i++) {
    const next = i + 1 < steps.length ? steps[i + 1].threshold : Infinity
    if (val < next) {
      const rounded = val < 10 ? val.toFixed(1) : Math.round(val)
      return `${rounded} ${steps[i].unit}`
    }
    val /= steps[i].div
  }
  if (val > 1e15) return `${val.toExponential(1)} y`
  return `${Math.round(val)} y`
}

export default function PasswordStrengthPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [mode, setMode] = useState('analyze')
  const [password, setPassword] = useState('')
  const [length, setLength] = useState(12)
  const [useLower, setUseLower] = useState(true)
  const [useUpper, setUseUpper] = useState(true)
  const [useNumbers, setUseNumbers] = useState(true)
  const [useSymbols, setUseSymbols] = useState(false)
  const [customEnabled, setCustomEnabled] = useState(false)
  const [customCount, setCustomCount] = useState(0)

  const result = useMemo(() => {
    const breakdown = []
    let pool = 0
    let len = 0

    if (mode === 'analyze') {
      len = password.length
      if (/[a-z]/.test(password)) { pool += POOL_SIZES.lowercase; breakdown.push({ label: t.lowercase, count: POOL_SIZES.lowercase }) }
      if (/[A-Z]/.test(password)) { pool += POOL_SIZES.uppercase; breakdown.push({ label: t.uppercase, count: POOL_SIZES.uppercase }) }
      if (/[0-9]/.test(password)) { pool += POOL_SIZES.numbers; breakdown.push({ label: t.numbers, count: POOL_SIZES.numbers }) }
      if (/[^a-zA-Z0-9]/.test(password)) { pool += POOL_SIZES.symbols; breakdown.push({ label: t.symbols, count: POOL_SIZES.symbols }) }
    } else {
      len = length
      if (useLower) { pool += POOL_SIZES.lowercase; breakdown.push({ label: t.lowercase, count: POOL_SIZES.lowercase }) }
      if (useUpper) { pool += POOL_SIZES.uppercase; breakdown.push({ label: t.uppercase, count: POOL_SIZES.uppercase }) }
      if (useNumbers) { pool += POOL_SIZES.numbers; breakdown.push({ label: t.numbers, count: POOL_SIZES.numbers }) }
      if (useSymbols) { pool += POOL_SIZES.symbols; breakdown.push({ label: t.symbols, count: POOL_SIZES.symbols }) }
      if (customEnabled && customCount > 0) {
        pool += customCount
        breakdown.push({ label: t.customChars, count: customCount })
      }
    }

    const entropy = pool > 0 && len > 0 ? len * Math.log2(pool) : 0
    const combinations = pool > 0 && len > 0 ? Math.pow(pool, len) : 0
    const strength = pool === 0 || len === 0
      ? { level: 0, key: 'veryWeak', color: '#d9d9d9' }
      : getStrength(entropy)
    const crackTimes = ATTACKERS.map((a) => ({
      ...a,
      time: combinations > 0 ? calcCrackTime(combinations, a.rate) : 0,
    }))

    return { pool, breakdown, length: len, entropy, combinations, strength, crackTimes }
  }, [mode, password, length, useLower, useUpper, useNumbers, useSymbols, customEnabled, customCount, t])

  const attackNames = {
    attacker1b: t.attack1b,
    attacker10b: t.attack10b,
    attacker100b: t.attack100b,
  }
  const attackRates = {
    attacker1b: t.rate1b,
    attacker10b: t.rate10b,
    attacker100b: t.rate100b,
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><SafetyCertificateOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card>
        <Segmented
          value={mode}
          onChange={setMode}
          options={[{ label: t.modeAnalyze, value: 'analyze' }, { label: t.modePlan, value: 'plan' }]}
          style={{ marginBottom: 16 }}
        />
        {mode === 'analyze' ? (
          <Input.Password
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t.placeholder}
            iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
            size="large"
          />
        ) : (
          <Row gutter={24}>
            <Col xs={24} md={12}>
              <Card type="inner" title={t.passwordLength}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <InputNumber
                    min={1}
                    max={128}
                    value={length}
                    onChange={(v) => setLength(v || 1)}
                    style={{ width: '100%' }}
                    size="large"
                  />
                  <Progress
                    percent={Math.min(100, (length / 128) * 100)}
                    strokeColor={result.strength.color}
                    showInfo={false}
                  />
                  <Text type="secondary">{length} {t.chars}</Text>
                </Space>
              </Card>
            </Col>
            <Col xs={24} md={12}>
              <Card type="inner" title={t.charsets}>
                <Space direction="vertical">
                  <Checkbox checked={useLower} onChange={(e) => setUseLower(e.target.checked)}>
                    {t.lowercase} <Text type="secondary">({POOL_SIZES.lowercase} {t.chars})</Text>
                  </Checkbox>
                  <Checkbox checked={useUpper} onChange={(e) => setUseUpper(e.target.checked)}>
                    {t.uppercase} <Text type="secondary">({POOL_SIZES.uppercase} {t.chars})</Text>
                  </Checkbox>
                  <Checkbox checked={useNumbers} onChange={(e) => setUseNumbers(e.target.checked)}>
                    {t.numbers} <Text type="secondary">({POOL_SIZES.numbers} {t.chars})</Text>
                  </Checkbox>
                  <Checkbox checked={useSymbols} onChange={(e) => setUseSymbols(e.target.checked)}>
                    {t.symbols} <Text type="secondary">({POOL_SIZES.symbols} {t.chars})</Text>
                  </Checkbox>
                  <Divider style={{ margin: '4px 0' }} />
                  <Checkbox checked={customEnabled} onChange={(e) => setCustomEnabled(e.target.checked)}>
                    {t.customChars}
                  </Checkbox>
                  {customEnabled && (
                    <InputNumber
                      min={1}
                      max={1000}
                      value={customCount}
                      onChange={(v) => setCustomCount(v || 1)}
                      placeholder={t.customCount}
                      style={{ width: 160 }}
                    />
                  )}
                </Space>
              </Card>
            </Col>
          </Row>
        )}
      </Card>

      <Progress
        percent={Math.min(100, (result.strength.level / STRENGTH_LEVELS.length) * 100)}
        strokeColor={result.strength.color}
        showInfo={false}
      />
      <Text strong style={{ color: result.strength.color }}>{t[result.strength.key]}</Text>

      <Card title={t.formula}>
        <Paragraph>
          <Text strong>Entropy = L × log₂(R)</Text>
          {' — '}
          <Text type="secondary">{t.formulaDesc}</Text>
        </Paragraph>
        <Collapse items={[{
          key: '1',
          label: t.collapseTitle,
          children: t.collapseContent,
        }]} />
      </Card>

      <Card title={t.results}>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <Card type="inner" title={t.poolSize}>
              <Text strong style={{ fontSize: 24 }}>{result.pool}</Text>
              {result.breakdown.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  {result.breakdown.map((b) => (
                    <Tag key={b.label} style={{ marginBottom: 4 }}>{b.label}: {b.count}</Tag>
                  ))}
                </div>
              )}
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card type="inner" title={t.entropyBits}>
              <Text strong style={{ fontSize: 24, color: result.strength.color }}>
                {result.entropy.toFixed(1)} {t.bits}
              </Text>
              <div style={{ marginTop: 8 }}>
                <Tag color={result.strength.color}>{t[result.strength.key]}</Tag>
              </div>
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card type="inner" title={t.totalCombinations}>
              <Text strong style={{ fontSize: 20, wordBreak: 'break-all' }}>
                {result.combinations > 0
                  ? `10^${(Math.log10(result.combinations)).toFixed(1)}`
                  : '—'}
              </Text>
              <div style={{ marginTop: 4 }}>
                <Text type="secondary">
                  {result.combinations > 0
                    ? `≈ ${result.combinations.toExponential(2)}`
                    : '—'}
                </Text>
              </div>
            </Card>
          </Col>
        </Row>
      </Card>

      <Card title={t.crackTimes}>
        <Table
          dataSource={result.crackTimes}
          rowKey="key"
          pagination={false}
          size="small"
          columns={[
            {
              title: t.attackType,
              dataIndex: 'key',
              render: (key) => attackNames[key],
            },
            {
              title: t.rate,
              dataIndex: 'key',
              render: (key) => attackRates[key],
            },
            {
              title: t.estimatedTime,
              render: (_, record) => {
                const time = formatDuration(record.time)
                if (!time) return <Text type="success">{t.instant}</Text>
                return <Text strong>{time}</Text>
              },
            },
          ]}
        />
      </Card>

      <Card title={t.requirements}>
        <Table
          dataSource={STANDARDS}
          rowKey="bits"
          pagination={false}
          size="small"
          columns={[
            {
              title: t.standard,
              dataIndex: 'label',
            },
            {
              title: t.minEntropy,
              dataIndex: 'bits',
              render: (bits) => <Text strong>{bits} bits</Text>,
            },
            {
              title: lang === 'pt' ? 'Descrição' : 'Description',
              dataIndex: 'key',
              render: (key) => t[key + 'Desc'],
            },
            {
              title: t.yourPassword,
              render: (_, record) => {
                const ok = result.entropy >= record.bits
                return (
                  <Tag color={ok ? 'success' : 'error'}>
                    {ok ? t.pass : t.fail}
                  </Tag>
                )
              },
            },
          ]}
        />
        <Alert
          style={{ marginTop: 16 }}
          type="info"
          showIcon
          icon={<InfoCircleOutlined />}
          message={t.guidelines}
        />
      </Card>

      <Paragraph type="secondary" style={{ fontSize: 12 }}>{t.note}</Paragraph>
    </Space>
  )
}