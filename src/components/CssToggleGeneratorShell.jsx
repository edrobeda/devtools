import React from 'react'
import { Typography, Card, Space, Alert, Row, Col, Segmented, message } from 'antd'
import CssGeneratorOutput from './CssGeneratorOutput'
import GeneratorSourceCollapse from './GeneratorSourceCollapse'

const { Title, Paragraph } = Typography
const { useMessage } = message

// Shell compartilhado das paginas de gerador de controle nativo em CSS
// (checkbox customizado e radio button customizado).
//
// Antes cada pagina trazia uma copia identica do mesmo esqueleto: titulo com
// icone, intro, alerta de "como funciona", Card de configuracoes (com o
// Segmented de presets e os controles), Card de preview (com o CSS gerado
// injetado e o controle de exemplo), Card de saida com as 3 abas (CSS, HTML
// e bloco completo) e o painel de codigo-fonte.
//
// O que fica na pagina e o que e proprio de cada gerador: os textos, os
// controles especificos e o markup do preview. `settings` e um slot com os
// controles do formulario e `preview` e o no do controle de exemplo; o
// `copy` (com o toast de "Copiado!") tambem e o mesmo nas duas paginas, entao
// mora aqui.

export default function CssToggleGeneratorShell({
  icon,
  title,
  intro,
  tipTitle,
  tipBody,
  settingsTitle,
  presetOrder,
  onPreset,
  settings,
  previewTitle,
  previewHint,
  cssOutput,
  preview,
  presetsTitle,
  cssLabel,
  htmlLabel,
  fullLabel,
  htmlOutput,
  fullOutput,
  copyLabel,
  copiedLabel,
  copyErrorLabel,
  sourceLabel,
  sourceBody,
  sourceCode,
}) {
  const [messageApi, messageContextHolder] = useMessage()

  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      messageApi.success(copiedLabel)
    } catch {
      messageApi.error(copyErrorLabel)
    }
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {messageContextHolder}
      <Title level={2}>{icon} {title}</Title>
      <Paragraph type="secondary">{intro}</Paragraph>

      <Alert type="info" showIcon message={tipTitle} description={tipBody} />

      <Row gutter={[24, 24]}>
        <Col xs={24} md={10}>
          <Card title={settingsTitle}>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <Segmented
                style={{ width: '100%' }}
                block
                value={null}
                onChange={onPreset}
                options={presetOrder.map((key) => ({
                  value: key,
                  label: key.charAt(0).toUpperCase() + key.slice(1),
                }))}
              />
              {settings}
            </Space>
          </Card>
        </Col>

        <Col xs={24} md={14}>
          <Card title={previewTitle}>
            <div
              style={{
                border: '1px solid #f0f0f0',
                borderRadius: 8,
                padding: 40,
                background: '#fafafa',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 180,
              }}
            >
              <style>{cssOutput}</style>
              {preview}
            </div>
            <Paragraph type="secondary" style={{ marginTop: 12, marginBottom: 0 }}>
              {previewHint}
            </Paragraph>
          </Card>
        </Col>
      </Row>

      <CssGeneratorOutput
        title={presetsTitle}
        tabs={[
          { key: 'css', label: cssLabel, value: cssOutput },
          { key: 'html', label: htmlLabel, value: htmlOutput },
          { key: 'full', label: fullLabel, value: fullOutput },
        ]}
        copyValue={cssOutput}
        tabsCopyValue={fullOutput}
        copy={copy}
        copyLabel={copyLabel}
      />

      <GeneratorSourceCollapse
        sourceLabel={sourceLabel}
        sourceBody={sourceBody}
        sourceCode={sourceCode}
      />
    </Space>
  )
}
