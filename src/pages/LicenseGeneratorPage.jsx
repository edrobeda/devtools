import React, { useMemo, useState } from 'react'
import {
  Typography,
  Card,
  Space,
  Input,
  Select,
  Button,
  Alert,
  Collapse,
  Row,
  Col,
  Tag,
  message,
} from 'antd'
import { FileTextOutlined, CopyOutlined, DownloadOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import { buildLicense, getLicenseOptions, LICENSES } from '../utils/licenseGenerator'

const { Title, Paragraph, Text } = Typography

const SOURCE = `
function buildLicense(options) {
  const { licenseKey = 'mit', year = '', holder = '', project = '' } = options || {}
  const license = LICENSES[licenseKey] || LICENSES.mit
  const currentYear = String(new Date().getFullYear())

  const safeYear = String(year).trim() || currentYear
  const safeHolder = String(holder).trim() || 'AUTHOR'
  const safeProject = String(project).trim() || 'this software'

  return license.template
    .replace(/{{year}}/g, safeYear)
    .replace(/{{holder}}/g, safeHolder)
    .replace(/{{project}}/g, safeProject)
}
`

const translations = {
  pt: {
    title: 'Gerador de LICENSE',
    intro:
      'Monta o arquivo LICENSE do seu repositório a partir dos templates mais usados de software livre e proprietário. Tudo acontece no navegador — nenhum dado sai daqui.',
    license: 'Licença',
    year: 'Ano de copyright',
    yearPlaceholder: new Date().getFullYear().toString(),
    holder: 'Titular (autor ou organização)',
    holderPlaceholder: 'Ex: João Silva',
    project: 'Nome do projeto',
    projectPlaceholder: 'Ex: meu-app',
    projectHint: 'Usado em licenças que mencionam o software por nome (BSD-3, proprietária etc.).',
    presets: 'Modelos de um clique',
    output: 'LICENSE gerada',
    copy: 'Copiar',
    copied: 'LICENSE copiada!',
    download: 'Baixar LICENSE',
    downloadName: 'LICENSE',
    lineCount: (n) => `${n} linha${n === 1 ? '' : 's'}`,
    byteCount: (n) => `${n} bytes`,
    sourceTitle: 'Algoritmo-fonte',
    sourceBody:
      'buildLicense escolhe o template da licença e substitui os placeholders {{year}}, {{holder}} e {{project}} pelos valores informados, usando o ano atual como fallback.',
    tipsTitle: 'Antes de usar',
    tipsBody: (
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        <li>
          Este gerador cria <Text strong>textos de licença de referência</Text>. Para decisões
          jurídicas ou comerciais, consulte um advogado ou a documentação oficial da licença.
        </li>
        <li>
          Licenças OSI aprovadas (MIT, Apache-2.0, BSD, ISC, MPL-2.0) seguem modelos amplamente
          reconhecidos, mas podem ter variações regionais.
        </li>
        <li>
          Para licenças copyleft fortes como GPL, LGPL e AGPL, use o texto oficial completo
          disponibilizado pela Free Software Foundation em vez de um resumo.
        </li>
        <li>
          A licença <Text strong>Proprietária</Text> é apenas um ponto de partida: adapte-a ao
          contrato ou EULA do seu produto.
        </li>
      </ul>
    ),
  },
  en: {
    title: 'LICENSE Generator',
    intro:
      'Builds your repository LICENSE file from the most widely used open-source and proprietary templates. Everything happens in the browser — no data leaves this page.',
    license: 'License',
    year: 'Copyright year',
    yearPlaceholder: new Date().getFullYear().toString(),
    holder: 'Copyright holder',
    holderPlaceholder: 'e.g. John Doe',
    project: 'Project name',
    projectPlaceholder: 'e.g. my-app',
    projectHint: 'Used by licenses that mention the software by name (BSD-3, proprietary, etc.).',
    presets: 'One-click templates',
    output: 'Generated LICENSE',
    copy: 'Copy',
    copied: 'LICENSE copied!',
    download: 'Download LICENSE',
    downloadName: 'LICENSE',
    lineCount: (n) => `${n} line${n === 1 ? '' : 's'}`,
    byteCount: (n) => `${n} bytes`,
    sourceTitle: 'Source code',
    sourceBody:
      'buildLicense picks the license template and replaces the {{year}}, {{holder}} and {{project}} placeholders with the provided values, falling back to the current year.',
    tipsTitle: 'Before you use it',
    tipsBody: (
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        <li>
          This generator creates <Text strong>reference license texts</Text>. For legal or
          commercial decisions, consult an attorney or the official license documentation.
        </li>
        <li>
          OSI-approved licenses (MIT, Apache-2.0, BSD, ISC, MPL-2.0) follow widely recognized
          templates, but regional variations may apply.
        </li>
        <li>
          For strong copyleft licenses such as GPL, LGPL and AGPL, use the complete official text
          provided by the Free Software Foundation rather than a summary.
        </li>
        <li>
          The <Text strong>Proprietary</Text> license is only a starting point: adapt it to your
          product contract or EULA.
        </li>
      </ul>
    ),
  },
}

export default function LicenseGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [options, setOptions] = useState({
    licenseKey: 'mit',
    year: '',
    holder: '',
    project: '',
  })

  const licenseOptions = useMemo(() => getLicenseOptions(lang), [lang])

  const output = useMemo(() => buildLicense(options), [options])
  const lineCount = output ? output.split('\n').length : 0
  const byteCount = useMemo(() => new Blob([output]).size, [output])

  const updateField = (field, value) => {
    setOptions((prev) => ({ ...prev, [field]: value }))
  }

  const applyPreset = (key) => {
    setOptions((prev) => ({ ...prev, licenseKey: key }))
  }

  const copyOutput = () => {
    navigator.clipboard.writeText(output)
    message.success(t.copied)
  }

  const downloadOutput = () => {
    const blob = new Blob([output], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = t.downloadName
    a.click()
    URL.revokeObjectURL(url)
  }

  const selectedLicense = LICENSES[options.licenseKey]

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><FileTextOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Alert type="info" showIcon message={t.tipsTitle} description={t.tipsBody} />

      <Card title={t.presets}>
        <Space wrap>
          {Object.values(LICENSES).map((license) => (
            <Button
              key={license.key}
              type={options.licenseKey === license.key ? 'primary' : 'default'}
              size="small"
              onClick={() => applyPreset(license.key)}
            >
              {license.label[lang] || license.label.en}
            </Button>
          ))}
        </Space>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={10}>
          <Card title={t.license}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div>
                <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>{t.license}</Text>
                <Select
                  style={{ width: '100%' }}
                  value={options.licenseKey}
                  onChange={(v) => updateField('licenseKey', v)}
                  options={licenseOptions}
                />
                {selectedLicense && (
                  <Paragraph type="secondary" style={{ marginTop: 4, marginBottom: 0, fontSize: 12 }}>
                    {selectedLicense.name} — SPDX: <Text code>{selectedLicense.spdx}</Text>{' '}
                    {selectedLicense.osi && <Tag color="green">OSI</Tag>}
                  </Paragraph>
                )}
              </div>

              <div>
                <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>{t.year}</Text>
                <Input
                  value={options.year}
                  onChange={(e) => updateField('year', e.target.value)}
                  placeholder={t.yearPlaceholder}
                />
              </div>

              <div>
                <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>{t.holder}</Text>
                <Input
                  value={options.holder}
                  onChange={(e) => updateField('holder', e.target.value)}
                  placeholder={t.holderPlaceholder}
                />
              </div>

              <div>
                <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>{t.project}</Text>
                <Input
                  value={options.project}
                  onChange={(e) => updateField('project', e.target.value)}
                  placeholder={t.projectPlaceholder}
                />
                <Paragraph type="secondary" style={{ marginTop: 4, marginBottom: 0, fontSize: 12 }}>
                  {t.projectHint}
                </Paragraph>
              </div>
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={14}>
          <Card
            title={t.output}
            extra={
              <Space>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {t.lineCount(lineCount)} · {t.byteCount(byteCount)}
                </Text>
                <Button size="small" icon={<CopyOutlined />} onClick={copyOutput}>{t.copy}</Button>
                <Button size="small" icon={<DownloadOutlined />} onClick={downloadOutput}>{t.download}</Button>
              </Space>
            }
          >
            <pre
              style={{
                margin: 0,
                overflowX: 'auto',
                background: '#0d1117',
                color: '#e6edf3',
                padding: 12,
                borderRadius: 8,
                maxHeight: 520,
                fontSize: 12.5,
                lineHeight: 1.6,
              }}
            >
              <code>{output}</code>
            </pre>
          </Card>
        </Col>
      </Row>

      <Collapse
        items={[
          {
            key: 'source',
            label: t.sourceTitle,
            children: (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Paragraph type="secondary">{t.sourceBody}</Paragraph>
                <pre style={{ margin: 0, overflowX: 'auto', maxHeight: 400 }}>
                  <code>{SOURCE}</code>
                </pre>
              </Space>
            ),
          },
        ]}
      />
    </Space>
  )
}
