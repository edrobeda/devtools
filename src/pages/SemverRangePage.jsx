import React, { useMemo, useState } from 'react'
import { Typography, Card, Input, Space, Tag, Alert, Button, Collapse, List, Empty, Row, Col } from 'antd'
import { TagsOutlined, CheckCircleOutlined, CloseCircleOutlined, CodeOutlined, ExperimentOutlined, BulbOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import { parseRange, parseVersion, normalizeRange, satisfies, compareSemver, REGEXES } from '../utils/semverRange'

const { Title, Paragraph, Text } = Typography

function declinedText(set, t) {
  if (set.isAny) return t.anyVersion
  if (set.isExact) return `${t.exact}: v = ${set.bounds.lower.semver.raw}`
  const parts = []
  if (set.bounds.lower) parts.push(`v ${set.bounds.lower.op} ${set.bounds.lower.semver.raw}`)
  if (set.bounds.upper) parts.push(`v ${set.bounds.upper.op} ${set.bounds.upper.semver.raw}`)
  if (parts.length === 0) return set.normalized
  return parts.join(` ${t.and} `)
}

function rangeErrorToText(err, t) {
  switch (err) {
    case 'empty': return t.errEmpty
    case 'or': return t.errOr
    case 'hyphen': return t.errHyphen
    case 'token': return t.errToken
    case 'version': return t.errVersion
    default: return t.errGeneric
  }
}

const translations = {
  pt: {
    title: 'Verificador de Range SemVer',
    intro: (
      <>
        Interpreta um <Text code>range</Text> no formato usado pelo npm
        (caret <Text code>^1.2.3</Text>, tilde <Text code>~1.2.3</Text>,
        x-ranges <Text code>1.2.x</Text>, faixas com hífen{' '}
        <Text code>1.2.3 - 2.3.4</Text> e alternativas <Text code>||</Text>),
        expande para os limites e testa se uma versão se encaixa — respeitando
        a regra do pré-lançamento (prerelease só casa em range que menciona o
        mesmo {<Text code>MAJOR.MINOR.PATCH</Text>} com prerelease).
      </>
    ),
    checkerTitle: 'Verificar uma versão',
    rangeLabel: 'Range',
    rangePlaceholder: 'Ex.: ^1.2.3, >=1.0.0 <2.0.0, 1.2.x',
    versionLabel: 'Versão',
    versionPlaceholder: 'Ex.: 1.2.9',
    invalidRange: 'Range inválido',
    invalidVersion: 'Versão inválida — use MAJOR.MINOR.PATCH, ex.: 1.2.9',
    satisfies: (v, r) => `"${v}" satisfaz o range "${r}"`,
    notSatisfies: (v, r) => `"${v}" NÃO satisfaz o range "${r}"`,
    matchedSet: (i) => ` (alternativa ${i + 1})`,
    normalized: 'Range normalizado',
    explainTitle: 'Como o range é interpretado',
    explainDesc: 'Para cada alternativa (separada por ||), os comparadores e limites gerados pelo motor:',
    alternative: 'Alternativa',
    comparators: 'Comparadores',
    scope: 'Limite',
    anyVersion: 'qualquer versão',
    exact: 'versão exata',
    and: 'e',
    or: 'ou',
    bulkTitle: 'Testar várias versões',
    bulkDesc: 'Uma versão por linha — o resultado usa o range acima.',
    bulkLoad: 'Carregar exemplo',
    examplesTitle: 'Exemplos de ranges',
    examplesDesc: 'Clique para carregar o range no verificador.',
    sourceTitle: 'Motor (código-fonte)',
    sourceDesc: 'Implementação ao vivo do utilitário src/utils/semverRange.js — as funções abaixo são a própria fonte executada na página.',
    presetVersionsBtn: 'Versões de teste',
    presetVersionsDesc: 'Um conjunto fixo de versões para o testador múltiplo.',
  },
  en: {
    title: 'SemVer Range Checker',
    intro: (
      <>
        Interprets a <Text code>range</Text> using npm's syntax (caret{' '}
        <Text code>^1.2.3</Text>, tilde <Text code>~1.2.3</Text>, x-ranges{' '}
        <Text code>1.2.x</Text>, hyphen ranges <Text code>1.2.3 - 2.3.4</Text>{' '}
        and <Text code>||</Text> alternates), expands it into bounds and tests
        whether a version fits — honoring the pre-release rule (a prerelease
        version only matches a range that references the same{' '}
        {<Text code>MAJOR.MINOR.PATCH</Text>} with a prerelease).
      </>
    ),
    checkerTitle: 'Check a version',
    rangeLabel: 'Range',
    rangePlaceholder: 'e.g. ^1.2.3, >=1.0.0 <2.0.0, 1.2.x',
    versionLabel: 'Version',
    versionPlaceholder: 'e.g. 1.2.9',
    invalidRange: 'Invalid range',
    invalidVersion: 'Invalid version — use MAJOR.MINOR.PATCH, e.g. 1.2.9',
    satisfies: (v, r) => `"${v}" satisfies the range "${r}"`,
    notSatisfies: (v, r) => `"${v}" does NOT satisfy the range "${r}"`,
    matchedSet: (i) => ` (alternative ${i + 1})`,
    normalized: 'Normalized range',
    explainTitle: 'How the range is interpreted',
    explainDesc: 'For each alternative (separated by ||), the comparators and bounds produced by the engine:',
    alternative: 'Alternative',
    comparators: 'Comparators',
    scope: 'Bounds',
    anyVersion: 'any version',
    exact: 'exact version',
    and: 'and',
    or: 'or',
    bulkTitle: 'Test multiple versions',
    bulkDesc: 'One version per line — results use the range above.',
    bulkLoad: 'Load example',
    examplesTitle: 'Range examples',
    examplesDesc: 'Click to load the range into the checker.',
    sourceTitle: 'Engine (source code)',
    sourceDesc: 'Live implementation of the src/utils/semverRange.js utility — the functions below are the very code running on this page.',
    presetVersionsBtn: 'Test versions',
    presetVersionsDesc: 'A fixed set of versions for the bulk tester.',
  },
}

const EXAMPLES = [
  { pt: 'Caret', en: 'Caret', range: '^1.2.3' },
  { pt: 'Tilde', en: 'Tilde', range: '~1.2.3' },
  { pt: 'x-range', en: 'x-range', range: '1.2.x' },
  { pt: 'Só major', en: 'Major only', range: '>=1' },
  { pt: 'Faixa com hífen', en: 'Hyphen range', range: '1.2.3 - 2.3.4' },
  { pt: 'Faixa dupla', en: 'Double bounds', range: '>=1.0.0 <2.0.0' },
  { pt: 'Alternativas', en: 'OR alternates', range: '^0.2.3 || ^0.5.0' },
  { pt: 'Excluir versão', en: 'Exclude version', range: '!=1.2.3' },
  { pt: 'Qualquer', en: 'Anything', range: '*' },
]

const PRESET_VERSIONS = ['1.2.3', '1.2.9', '1.3.0', '2.0.0-beta.1', '0.2.9', '0.5.4', '0.7.0', '1.2.3-beta.1']

export default function SemverRangePage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [rangeText, setRangeText] = useState('^1.2.3')
  const [versionText, setVersionText] = useState('1.2.9')
  const [bulkText, setBulkText] = useState(PRESET_VERSIONS.join('\n'))

  const parsed = useMemo(() => parseRange(rangeText), [rangeText])
  const versionParsed = useMemo(() => parseVersion(versionText), [versionText])
  const normalized = useMemo(() => (parsed.valid ? normalizeRange(rangeText) : null), [rangeText, parsed])

  const bulkVersions = useMemo(
    () => bulkText.split('\n').map((l) => l.trim()).filter(Boolean),
    [bulkText]
  )
  const bulkResults = useMemo(
    () => bulkVersions.map((v) => ({ version: v, result: parsed.valid ? satisfies(v, rangeText) : null })),
    [bulkVersions, rangeText, parsed]
  )

  const check = useMemo(() => {
    if (!rangeText.trim() || !versionText.trim()) return null
    const r = satisfies(versionText, rangeText)
    if (r.reason === 'range') return { kind: 'error', msg: `${t.invalidRange}: ${rangeErrorToText(r.error, t)}` }
    if (r.reason === 'version') return { kind: 'error', msg: t.invalidVersion }
    return {
      kind: r.match ? 'success' : 'warning',
      msg: r.match ? t.satisfies(versionText, rangeText) + t.matchedSet(r.setIndex) : t.notSatisfies(versionText, rangeText),
    }
  }, [rangeText, versionText, t])

  const sourceSections = [
    { title: 'SEMVER_RE', code: String(REGEXES.SEMVER_RE) },
    { title: 'parseVersion(source)', code: parseVersion.toString() },
    { title: 'parseRange(input)', code: parseRange.toString() },
    { title: 'compareSemver(a, b)', code: compareSemver.toString() },
    { title: 'satisfies(version, range)', code: satisfies.toString() },
  ]

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><TagsOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card title={t.checkerTitle}>
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text type="secondary">{t.rangeLabel}</Text>
              <Input
                value={rangeText}
                onChange={(e) => setRangeText(e.target.value)}
                placeholder={t.rangePlaceholder}
                style={{ fontFamily: 'monospace' }}
              />
              {parsed.valid ? (
                <Tag color="green" style={{ fontFamily: 'monospace' }}>{t.normalized}: {normalized}</Tag>
              ) : (
                <Tag color="red">{t.invalidRange}: {rangeErrorToText(parsed.error, t)}</Tag>
              )}
            </Space>
          </Col>
          <Col xs={24} md={12}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text type="secondary">{t.versionLabel}</Text>
              <Input
                value={versionText}
                onChange={(e) => setVersionText(e.target.value)}
                placeholder={t.versionPlaceholder}
                style={{ fontFamily: 'monospace' }}
              />
              <Tag color={versionParsed ? 'green' : 'red'}>
                {versionParsed ? versionText : t.invalidVersion}
              </Tag>
            </Space>
          </Col>
        </Row>
        {check && (
          <Alert
            style={{ marginTop: 16 }}
            type={check.kind}
            showIcon
            icon={check.kind === 'error' ? <CloseCircleOutlined /> : <CheckCircleOutlined />}
            message={check.msg}
          />
        )}
      </Card>

      <Card title={t.explainTitle}>
        <Paragraph type="secondary">{t.explainDesc}</Paragraph>
        {parsed.valid ? (
          parsed.sets.map((set, i) => (
            <Card
              key={set.raw}
              size="small"
              style={{ marginBottom: 12 }}
              title={
                <Space>
                  <Tag color="blue">{t.alternative} {i + 1}</Tag>
                  <Text code style={{ fontFamily: 'monospace' }}>{set.normalized}</Text>
                </Space>
              }
            >
              <Space direction="vertical" size={4}>
                <Text type="secondary">{t.comparators}:</Text>
                <Space wrap>
                  {set.comparators.map((c) => (
                    <Tag key={`${c.op}${c.semver.raw}`} style={{ fontFamily: 'monospace' }}>{c.op}{c.semver.raw}</Tag>
                  ))}
                </Space>
                <Text type="secondary">{t.scope}:</Text>
                <Text style={{ fontFamily: 'monospace' }}>{declinedText(set, t)}</Text>
              </Space>
            </Card>
          ))
        ) : (
          <Alert type="error" showIcon message={t.invalidRange + ': ' + rangeErrorToText(parsed.error, t)} />
        )}
      </Card>

      <Card
        title={t.bulkTitle}
        extra={<Button size="small" icon={<ExperimentOutlined />} onClick={() => setBulkText(PRESET_VERSIONS.join('\n'))}>{t.bulkLoad}</Button>}
      >
        <Paragraph type="secondary">{t.bulkDesc}</Paragraph>
        <Paragraph type="secondary">
          <BulbOutlined /> {t.presetVersionsDesc}: {PRESET_VERSIONS.join(', ')}
        </Paragraph>
        <Row gutter={16}>
          <Col xs={24} md={10}>
            <Input.TextArea
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              rows={10}
              style={{ fontFamily: 'monospace' }}
            />
          </Col>
          <Col xs={24} md={14}>
            {!parsed.valid ? (
              <Alert type="error" showIcon message={t.invalidRange + ': ' + rangeErrorToText(parsed.error, t)} />
            ) : bulkResults.length === 0 ? (
              <Empty description={t.rangeLabel + '?'} />
            ) : (
              <List
                size="small"
                bordered
                dataSource={bulkResults}
                renderItem={(item) => {
                  const ok = item.result && item.result.match
                  return (
                    <List.Item>
                      <Space>
                        <Text style={{ fontFamily: 'monospace' }}>{item.version}</Text>
                        {!item.result || item.result.reason === 'version' ? (
                          <Tag color="orange">{t.invalidVersion}</Tag>
                        ) : ok ? (
                          <Tag color="green" icon={<CheckCircleOutlined />}>
                            {t.satisfies(item.version, rangeText)}
                            {item.result.setIndex !== undefined ? t.matchedSet(item.result.setIndex) : ''}
                          </Tag>
                        ) : (
                          <Tag color="red" icon={<CloseCircleOutlined />}>
                            {t.notSatisfies(item.version, rangeText)}
                          </Tag>
                        )}
                      </Space>
                    </List.Item>
                  )
                }}
              />
            )}
          </Col>
        </Row>
      </Card>

      <Card title={t.examplesTitle}>
        <Paragraph type="secondary">{t.examplesDesc}</Paragraph>
        <Space wrap>
          {EXAMPLES.map((ex) => (
            <Button key={ex.range} size="small" style={{ fontFamily: 'monospace' }} onClick={() => setRangeText(ex.range)}>
              {ex[lang]}: {ex.range}
            </Button>
          ))}
        </Space>
      </Card>

      <Card title={t.sourceTitle}>
        <Paragraph type="secondary">{t.sourceDesc}</Paragraph>
        <Collapse
          items={sourceSections.map((sec) => ({
            key: sec.title,
            label: <Space><CodeOutlined /> <Text code>{sec.title}</Text></Space>,
            children: (
              <pre style={{ fontSize: 12, margin: 0, overflow: 'auto' }}>
                <code>{sec.code}</code>
              </pre>
            ),
          }))}
        />
      </Card>
    </Space>
  )
}