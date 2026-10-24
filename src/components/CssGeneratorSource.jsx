import React from 'react'
import { Collapse, Space, Typography } from 'antd'

const { Paragraph } = Typography

export default function CssGeneratorSource({
  sourceLabel,
  sourceBody,
  sourceCode,
  maxHeight = 320,
}) {
  return (
    <Collapse
      items={[
        {
          key: 'source',
          label: sourceLabel,
          children: (
            <Space direction="vertical" style={{ width: '100%' }}>
              <Paragraph type="secondary">{sourceBody}</Paragraph>
              <pre style={{ margin: 0, overflowX: 'auto', maxHeight }}>
                <code>{sourceCode}</code>
              </pre>
            </Space>
          ),
        },
      ]}
    />
  )
}
