import React, { useMemo, useState } from 'react'
import { Typography, Card, Input, Space, Tag, Alert, Button, Row, Col } from 'antd'
import { BranchesOutlined, CopyOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

// Regex oficial de https://semver.org/#is-there-a-suggested-regular-expression-in-javascript-to-check-a-semver-string
const SEMVER_RE = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/

function parseSemver(raw) {
  const str = (raw || '').trim()
  const m = SEMVER_RE.exec(str)
  if (!m) return null
  return {
    raw: str,
    major: Number(m[1]),
    minor: Number(m[2]),
    patch: Number(m[3]),
    prerelease: m[4] ? m[4].split('.') : [],
    build: m[5] ? m[5].split('.') : [],
  }
}

function compareIdentifier(a, b) {
  const aNum = /^\d+$/.test(a)
  const bNum = /^\d+$/.test(b)
  if (aNum && bNum) return Number(a) - Number(b)
  if (aNum && !bNum) return -1
  if (!aNum && bNum) return 1
  return a < b ? -1 : a > b ? 1 : 0
}

function comparePrerelease(a, b) {
  if (a.length === 0 && b.length === 0) return 0
  if (a.length === 0) return 1 // sem prerelease > com prerelease
  if (b.length === 0) return -1
  const len = Math.max(a.length, b.length)
  for (let i = 0; i < len; i++) {
    if (a[i] === undefined) return -1
    if (b[i] === undefined) return 1
    const c = compareIdentifier(a[i], b[i])
    if (c !== 0) return c
  }
  return 0
}

function compareSemver(a, b) {
  if (a.major !== b.major) return a.major - b.major
  if (a.minor !== b.minor) return a.minor - b.minor
  if (a.patch !== b.patch) return a.patch - b.patch
  return comparePrerelease(a.prerelease, b.prerelease)
}

function bump(version, type) {
  if (type === 'major') return `${version.major + 1}.0.0`
  if (type === 'minor') return `${version.major}.${version.minor + 1}.0`
  return `${version.major}.${version.minor}.${version.patch + 1}`
}

const translations = {
  pt: {
    title: 'Comparador/Validador de SemVer',
    intro: (
      <>
        Valida se uma string segue o <Text code>Semantic Versioning 2.0.0</Text>{' '}
        (<Text code>MAJOR.MINOR.PATCH-prerelease+build</Text>) e compara duas
        versões seguindo as regras oficiais de precedência — inclusive
        identificadores de prerelease comparados alfanumericamente, e versão
        sem prerelease sempre maior que a mesma versão com prerelease.
      </>
    ),
    compareTitle: 'Comparar duas versões',
    versionA: 'Versão A',
    versionB: 'Versão B',
    invalid: 'Não é uma versão SemVer válida',
    valid: 'Válida',
    result: {
      gt: 'A é maior que B',
      lt: 'A é menor que B',
      eq: 'A é igual a B (build metadata ignorado na comparação)',
    },
    bumpTitle: 'Incrementar versão',
    bumpDesc: 'A partir de uma versão base, gera a próxima major/minor/patch (zera os campos menores e descarta prerelease):',
    baseVersion: 'Versão base',
    major: 'Major',
    minor: 'Minor',
    patch: 'Patch',
    copy: 'Copiar',
  },
  en: {
    title: 'SemVer Comparator/Validator',
    intro: (
      <>
        Validates whether a string follows{' '}
        <Text code>Semantic Versioning 2.0.0</Text> (
        <Text code>MAJOR.MINOR.PATCH-prerelease+build</Text>) and compares two
        versions following the official precedence rules — including
        prerelease identifiers compared alphanumerically, and a version
        without prerelease always ranking higher than the same version with
        one.
      </>
    ),
    compareTitle: 'Compare two versions',
    versionA: 'Version A',
    versionB: 'Version B',
    invalid: 'Not a valid SemVer string',
    valid: 'Valid',
    result: {
      gt: 'A is greater than B',
      lt: 'A is less than B',
      eq: 'A equals B (build metadata is ignored in comparisons)',
    },
    bumpTitle: 'Bump version',
    bumpDesc: 'From a base version, generate the next major/minor/patch (resets lower fields and drops prerelease):',
    baseVersion: 'Base version',
    major: 'Major',
    minor: 'Minor',
    patch: 'Patch',
    copy: 'Copy',
  },
}

export default function SemverComparatorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [a, setA] = useState('1.4.0')
  const [b, setB] = useState('1.4.0-beta.2')
  const [base, setBase] = useState('2.3.1')

  const parsedA = useMemo(() => parseSemver(a), [a])
  const parsedB = useMemo(() => parseSemver(b), [b])
  const parsedBase = useMemo(() => parseSemver(base), [base])

  const cmp = parsedA && parsedB ? compareSemver(parsedA, parsedB) : null

  function copy(value) {
    navigator.clipboard.writeText(value)
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><BranchesOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card title={t.compareTitle}>
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text type="secondary">{t.versionA}</Text>
              <Input value={a} onChange={(e) => setA(e.target.value)} style={{ fontFamily: 'monospace' }} />
              <Tag color={parsedA ? 'green' : 'red'}>{parsedA ? t.valid : t.invalid}</Tag>
            </Space>
          </Col>
          <Col xs={24} md={12}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text type="secondary">{t.versionB}</Text>
              <Input value={b} onChange={(e) => setB(e.target.value)} style={{ fontFamily: 'monospace' }} />
              <Tag color={parsedB ? 'green' : 'red'}>{parsedB ? t.valid : t.invalid}</Tag>
            </Space>
          </Col>
        </Row>

        {cmp !== null && (
          <Alert
            style={{ marginTop: 16 }}
            type={cmp === 0 ? 'info' : 'success'}
            showIcon
            message={cmp > 0 ? t.result.gt : cmp < 0 ? t.result.lt : t.result.eq}
          />
        )}
      </Card>

      <Card title={t.bumpTitle}>
        <Paragraph type="secondary">{t.bumpDesc}</Paragraph>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Input value={base} onChange={(e) => setBase(e.target.value)} style={{ fontFamily: 'monospace', maxWidth: 240 }} />
          {!parsedBase ? (
            <Tag color="red">{t.invalid}</Tag>
          ) : (
            <Space wrap size="large">
              {['major', 'minor', 'patch'].map((kind) => {
                const next = bump(parsedBase, kind)
                return (
                  <Space key={kind} direction="vertical" size={4}>
                    <Text type="secondary">{t[kind]}</Text>
                    <Space>
                      <Text code>{next}</Text>
                      <Button size="small" icon={<CopyOutlined />} onClick={() => copy(next)}>{t.copy}</Button>
                    </Space>
                  </Space>
                )
              })}
            </Space>
          )}
        </Space>
      </Card>
    </Space>
  )
}
