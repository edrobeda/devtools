import React, { useState, useMemo } from 'react'
import { Typography, Card, Space, Input, Descriptions, Alert } from 'antd'
import { CloudOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const translations = {
  pt: {
    title: 'AWS ARN Parser',
    intro: (
      <>
        Cola um ARN da AWS e vê a estrutura decomposta em partition,
        service, region, account ID, resource type e resource ID — parseado
        localmente, sem chamar a API da AWS.
      </>
    ),
    placeholder: 'arn:aws:s3:::meu-bucket/pasta/arquivo.txt',
    partition: 'Partition',
    service: 'Service',
    region: 'Region',
    account: 'Account ID',
    resourceType: 'Resource type',
    resourceId: 'Resource ID / nome',
    invalid: 'ARN inválido — formato esperado: arn:partition:service:region:account-id:resource',
    regionEmpty: '(vazio — serviço global)',
    accountEmpty: '(vazio)',
  },
  en: {
    title: 'AWS ARN Parser',
    intro: (
      <>
        Paste an AWS ARN and see it broken down into partition, service,
        region, account ID, resource type and resource ID — parsed
        locally, no call to the AWS API.
      </>
    ),
    placeholder: 'arn:aws:s3:::my-bucket/folder/file.txt',
    partition: 'Partition',
    service: 'Service',
    region: 'Region',
    account: 'Account ID',
    resourceType: 'Resource type',
    resourceId: 'Resource ID / name',
    invalid: 'Invalid ARN — expected format: arn:partition:service:region:account-id:resource',
    regionEmpty: '(empty — global service)',
    accountEmpty: '(empty)',
  },
}

function parseArn(arn) {
  const parts = arn.trim().split(':')
  if (parts.length < 6 || parts[0] !== 'arn') return null
  const [, partition, service, region, account, ...rest] = parts
  const resource = rest.join(':')
  let resourceType = ''
  let resourceId = resource
  const slashIdx = resource.indexOf('/')
  const colonIdx = resource.indexOf(':')
  if (slashIdx !== -1) {
    resourceType = resource.slice(0, slashIdx)
    resourceId = resource.slice(slashIdx + 1)
  } else if (colonIdx !== -1) {
    resourceType = resource.slice(0, colonIdx)
    resourceId = resource.slice(colonIdx + 1)
  }
  return { partition, service, region, account, resourceType, resourceId, resource }
}

export default function ArnParserPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [input, setInput] = useState('arn:aws:iam::123456789012:role/example-role')

  const parsed = useMemo(() => (input.trim() ? parseArn(input) : null), [input])

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><CloudOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card>
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t.placeholder}
          style={{ fontFamily: 'monospace' }}
        />
      </Card>

      {input.trim() && !parsed && <Alert type="error" showIcon message={t.invalid} />}

      {parsed && (
        <Card>
          <Descriptions bordered size="small" column={1}>
            <Descriptions.Item label={t.partition}><Text code>{parsed.partition}</Text></Descriptions.Item>
            <Descriptions.Item label={t.service}><Text code>{parsed.service}</Text></Descriptions.Item>
            <Descriptions.Item label={t.region}><Text code>{parsed.region || t.regionEmpty}</Text></Descriptions.Item>
            <Descriptions.Item label={t.account}><Text code>{parsed.account || t.accountEmpty}</Text></Descriptions.Item>
            {parsed.resourceType && (
              <Descriptions.Item label={t.resourceType}><Text code>{parsed.resourceType}</Text></Descriptions.Item>
            )}
            <Descriptions.Item label={t.resourceId}><Text code>{parsed.resourceId}</Text></Descriptions.Item>
          </Descriptions>
        </Card>
      )}
    </Space>
  )
}
