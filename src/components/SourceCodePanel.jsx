import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Button, Collapse, Typography } from 'antd'
import { CopyOutlined } from '@ant-design/icons'

const { Panel } = Collapse
const { Paragraph } = Typography

// Painel "codigo-fonte" compartilhado entre os simuladores que mostram o
// sourceCode() do motor. Antes cada pagina trazia uma copia identica do
// Collapse + <pre> + botao de copiar e do par `copy`/`copiedKey`.
//
// A saida renderizada e a mesma das paginas originais: botao de copiar
// posicionado por cima do <pre> (padding 16) e feedback de "copiado" com
// timer de 1500ms. `intro` cobre paginas que mostram um paragrafo antes do
// codigo e `defaultActiveKey` permite abrir o painel ja expandido.
export default function SourceCodePanel({
  code,
  header,
  intro,
  copyLabel = 'Copiar',
  copiedLabel = 'Copiado',
  resetDelay = 1500,
  defaultActiveKey,
}) {
  const [copied, setCopied] = useState(false)
  const timeoutRef = useRef(null)

  useEffect(() => () => clearTimeout(timeoutRef.current), [])

  const copy = useCallback(() => {
    navigator.clipboard.writeText(code).catch(() => {})
    setCopied(true)
    clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => setCopied(false), resetDelay)
  }, [code, resetDelay])

  return (
    <Collapse defaultActiveKey={defaultActiveKey}>
      <Panel header={header} key="source">
        {intro ? <Paragraph>{intro}</Paragraph> : null}
        <div style={{ position: 'relative' }}>
          <Button
            size="small"
            icon={<CopyOutlined />}
            style={{ position: 'absolute', top: 8, right: 8 }}
            onClick={copy}
          >
            {copied ? copiedLabel : copyLabel}
          </Button>
          <pre style={{ margin: 0, overflow: 'auto', padding: 16 }}>
            <code>{code}</code>
          </pre>
        </div>
      </Panel>
    </Collapse>
  )
}
