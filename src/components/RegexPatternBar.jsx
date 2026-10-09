import React from 'react'
import { Card, Space, Input, Select, Checkbox, Typography, Row, Col } from 'antd'
import { FLAG_OPTIONS } from '../utils/regexShared'

const { Text } = Typography

// Card de padrão + flags compartilhado entre o Regex Explainer e o Regex
// Railroad. O que muda entre as páginas (lista de presets e botões de ação)
// entra via props/children, pra manter a saída renderizada idêntica.
export default function RegexPatternBar({
  title,
  pattern,
  onPatternChange,
  placeholder,
  flagStr,
  flags,
  onFlagsChange,
  flagsLabel,
  flagsHelp,
  presetsLabel,
  presetOptions,
  onPresetChange,
  children,
}) {
  return (
    <Card title={title}>
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={14}>
            <Input
              value={pattern}
              onChange={(e) => onPatternChange(e.target.value)}
              placeholder={placeholder}
              style={{ fontFamily: 'monospace' }}
              addonBefore="/"
              addonAfter={flagStr || ' '}
            />
          </Col>
          <Col xs={24} md={10}>
            <Select
              style={{ width: '100%' }}
              placeholder={presetsLabel}
              allowClear
              onChange={onPresetChange}
              options={presetOptions}
            />
          </Col>
        </Row>
        <Space direction="vertical" size={4}>
          <Text type="secondary">{flagsLabel}</Text>
          <Checkbox.Group options={FLAG_OPTIONS} value={flags} onChange={onFlagsChange} />
          <Text type="secondary" style={{ fontSize: 12 }}>{flagsHelp}</Text>
        </Space>
        <Space wrap>{children}</Space>
      </Space>
    </Card>
  )
}
