import React from 'react'
import { Button, Card, Tabs } from 'antd'
import { CopyOutlined } from '@ant-design/icons'

// Versao irma do CssGeneratorOutput para as paginas de gerador CSS cujo
// painel de saida e um <Tabs> sem Card externo: cada aba tem o proprio
// <Card> com o botao "Copiar" no extra e o <pre> do codigo gerado.
// Antes cada pagina trazia uma copia identica desse markup inline.
export default function CssGeneratorTabsOutput({
  cssValue,
  htmlValue,
  fullValue,
  cssLabel,
  htmlLabel,
  fullLabel,
  copy,
  copyLabel,
}) {
  return (
    <Tabs
      defaultActiveKey="css"
      items={[
        {
          key: 'css',
          label: cssLabel,
          children: (
            <Card
              extra={(
                <Button size="small" icon={<CopyOutlined />} onClick={() => copy(cssValue)}>
                  {copyLabel}
                </Button>
              )}
            >
              <pre style={{ margin: 0, overflowX: 'auto' }}>
                <code>{cssValue}</code>
              </pre>
            </Card>
          ),
        },
        {
          key: 'html',
          label: htmlLabel,
          children: (
            <Card
              extra={(
                <Button size="small" icon={<CopyOutlined />} onClick={() => copy(htmlValue)}>
                  {copyLabel}
                </Button>
              )}
            >
              <pre style={{ margin: 0, overflowX: 'auto' }}>
                <code>{htmlValue}</code>
              </pre>
            </Card>
          ),
        },
        {
          key: 'full',
          label: fullLabel,
          children: (
            <Card
              extra={(
                <Button size="small" icon={<CopyOutlined />} onClick={() => copy(fullValue)}>
                  {copyLabel}
                </Button>
              )}
            >
              <pre style={{ margin: 0, overflowX: 'auto' }}>
                <code>{fullValue}</code>
              </pre>
            </Card>
          ),
        },
      ]}
    />
  )
}
