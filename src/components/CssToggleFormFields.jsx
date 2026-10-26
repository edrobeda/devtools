import React from 'react'
import { Typography, Space, Slider, Segmented, ColorPicker, Input, Switch } from 'antd'

const { Text } = Typography

// Controles reutilizados pelas paginas de gerador de controle nativo em CSS
// (checkbox customizado e radio button customizado).
//
// Antes cada pagina repetia a mesma linha de "rotulo + controle" (com o
// rotulo em negrito de um lado e o valor/slider/cor do outro). Cada
// componente aqui renderiza UM elemento, para que a contagem de
// .ant-space-item dentro do Card de configuracoes continue exatamente a
// mesma de antes da extracao.

// Rotulo do slider + valor formatado (px por padrao).
export function SliderField({ label, value, unit = 'px' }) {
  return (
    <Space style={{ width: '100%', justifyContent: 'space-between' }}>
      <Text>{label}</Text>
      <Text code>{`${value}${unit}`}</Text>
    </Space>
  )
}

// Rotulo + seletor de cor.
export function ColorField({ label, value, onChange }) {
  return (
    <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
      <Text>{label}</Text>
      <ColorPicker value={value} onChange={onChange} showText />
    </Space>
  )
}

// Rotulo + switch.
export function SwitchField({ label, checked, onChange }) {
  return (
    <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
      <Text>{label}</Text>
      <Switch size="small" checked={checked} onChange={onChange} />
    </Space>
  )
}

// Rotulo + grupo de opcoes segmentadas.
export function SegmentedField({ label, value, onChange, options, style }) {
  return (
    <Space direction="vertical" size={4} style={style}>
      <Text>{label}</Text>
      <Segmented
        style={{ width: '100%' }}
        block
        value={value}
        onChange={onChange}
        options={options}
      />
    </Space>
  )
}

// Rotulo + campo de texto livre (usado pela sombra).
export function TextField({ label, value, onChange, placeholder }) {
  return (
    <Space direction="vertical" size={4} style={{ width: '100%' }}>
      <Text>{label}</Text>
      <Input value={value} onChange={onChange} placeholder={placeholder} />
    </Space>
  )
}
