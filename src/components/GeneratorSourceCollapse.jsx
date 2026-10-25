import React from 'react'
import { Collapse, Space, Typography } from 'antd'

const { Paragraph } = Typography

// Bloco "codigo-fonte" compartilhado pelas paginas de gerador: um Collapse
// com o titulo do bloco, o paragrafo explicativo e o <pre> com o codigo.
// Antes cada pagina trazia uma copia identica desse markup inline.
export default function GeneratorSourceCollapse({
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
