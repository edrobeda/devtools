import React from 'react'
import { Button, Card, Space } from 'antd'

// Card de "modelos de um clique" das paginas de gerador: um botao por preset,
// com o preset ativo destacado. `presets` e um objeto
// { [key]: { label: { [lang]: texto } } } e `onSelect` recebe a chave.
export default function GeneratorPresetButtons({
  title,
  presets,
  activePreset,
  onSelect,
  lang,
}) {
  return (
    <Card title={title}>
      <Space wrap>
        {Object.entries(presets).map(([key, preset]) => (
          <Button
            key={key}
            type={activePreset === key ? 'primary' : 'default'}
            size="small"
            onClick={() => onSelect(key)}
          >
            {preset.label[lang]}
          </Button>
        ))}
      </Space>
    </Card>
  )
}
