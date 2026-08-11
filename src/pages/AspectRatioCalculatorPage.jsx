import React, { useMemo, useState } from 'react'
import {
  Typography,
  Card,
  Space,
  InputNumber,
  Row,
  Col,
  Button,
  Tag,
  Alert,
  Collapse,
  Segmented,
  Tooltip,
} from 'antd'
import {
  PictureOutlined,
  CopyOutlined,
  SwapOutlined,
  CalculatorOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  simplifyRatio,
  ratioDecimal,
  fitDimension,
  buildAspectRatioCss,
  COMMON_RATIOS,
} from '../utils/aspectRatio'
import useCopyToClipboard from '../hooks/useCopyToClipboard'

const { Title, Paragraph, Text } = Typography

const translations = {
  pt: {
    title: 'Calculadora de Proporção (Aspect Ratio)',
    intro: (
      <>
        Simplifique proporções, descubra o formato reduzido de uma resolução
        (ex: <Text code>1920×1080</Text> → <Text code>16:9</Text>) e calcule
        dimensões proporcionais a partir de uma largura ou altura. Ideal para
        imagens, vídeos, iframes e containers responsivos.
      </>
    ),
    modeSimplify: 'Simplificar',
    modeFit: 'Calcular dimensão',
    width: 'Largura',
    height: 'Altura',
    targetWidth: 'Largura desejada',
    targetHeight: 'Altura desejada',
    commonRatios: 'Proporções comuns',
    result: 'Resultado',
    simplifiedRatio: 'Proporção simplificada',
    decimal: 'Decimal',
    dimensions: 'Dimensões proporcionais',
    cssSnippet: 'Snippet CSS',
    copyCss: 'Copiar CSS',
    copied: 'Copiado!',
    invalid: 'Informe valores maiores que zero.',
    swap: 'Trocar largura/altura',
    paddingHack: 'Fallback com padding-bottom',
    alertTitle: 'Por que aspect-ratio às vezes parece não funcionar?',
    alertBody: (
      <>
        A propriedade moderna <Text code>aspect-ratio</Text> funciona em
        qualquer elemento com altura/largura automática, mas pode ser
        ignorada se você fixar <Text code>width</Text> e <Text code>
          height
        </Text>{' '}
        ao mesmo tempo. Para suporte antigo, use o hack de{' '}
        <Text code>padding-bottom</Text> em porcentagem sobre um container com{' '}
        <Text code>position: relative</Text>.
      </>
    ),
    sourceCode: 'Algoritmo-fonte',
  },
  en: {
    title: 'Aspect Ratio Calculator',
    intro: (
      <>
        Simplify ratios, find the reduced form of a resolution (e.g.{' '}
        <Text code>1920×1080</Text> → <Text code>16:9</Text>) and calculate
        proportional dimensions from a given width or height. Great for images,
        videos, iframes and responsive containers.
      </>
    ),
    modeSimplify: 'Simplify',
    modeFit: 'Fit dimension',
    width: 'Width',
    height: 'Height',
    targetWidth: 'Target width',
    targetHeight: 'Target height',
    commonRatios: 'Common ratios',
    result: 'Result',
    simplifiedRatio: 'Simplified ratio',
    decimal: 'Decimal',
    dimensions: 'Proportional dimensions',
    cssSnippet: 'CSS snippet',
    copyCss: 'Copy CSS',
    copied: 'Copied!',
    invalid: 'Enter values greater than zero.',
    swap: 'Swap width/height',
    paddingHack: 'padding-bottom fallback',
    alertTitle: 'Why does aspect-ratio sometimes seem to do nothing?',
    alertBody: (
      <>
        The modern <Text code>aspect-ratio</Text> property works on any element
        with automatic width/height, but it is ignored when you set both{' '}
        <Text code>width</Text> and <Text code>height</Text> explicitly. For
        older browsers, use the <Text code>padding-bottom</Text> percentage hack
        inside a <Text code>position: relative</Text> container.
      </>
    ),
    sourceCode: 'Source algorithm',
  },
}

function round4(n) {
  if (!Number.isFinite(n)) return '-'
  return Math.round(n * 10000) / 10000
}

const MODE = {
  SIMPLIFY: 'simplify',
  FIT: 'fit',
}

export default function AspectRatioCalculatorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [copied, copy] = useCopyToClipboard(1500)

  const [mode, setMode] = useState(MODE.SIMPLIFY)
  const [w, setW] = useState(1920)
  const [h, setH] = useState(1080)
  const [targetW, setTargetW] = useState(800)
  const [targetH, setTargetH] = useState(undefined)

  const ratio = useMemo(() => simplifyRatio(w, h), [w, h])
  const decimal = useMemo(() => ratioDecimal(w, h), [w, h])
  const fit = useMemo(
    () => fitDimension(w, h, { width: targetW, height: targetH }),
    [w, h, targetW, targetH]
  )
  const css = useMemo(() => buildAspectRatioCss(w, h, 'ratio-box'), [w, h])

  const isValid = Number.isFinite(w) && Number.isFinite(h) && w > 0 && h > 0

  const handleSwap = () => {
    setW(h)
    setH(w)
  }

  const applyPreset = (preset) => {
    setW(preset.width)
    setH(preset.height)
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}>
        <PictureOutlined /> {t.title}
      </Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Segmented
            value={mode}
            onChange={setMode}
            block
            options={[
              { value: MODE.SIMPLIFY, label: t.modeSimplify, icon: <CalculatorOutlined /> },
              { value: MODE.FIT, label: t.modeFit, icon: <SwapOutlined /> },
            ]}
          />

          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} sm={10}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text type="secondary">{t.width}</Text>
                <InputNumber
                  min={1}
                  value={w}
                  onChange={(v) => setW(v ?? 1)}
                  style={{ width: '100%' }}
                  step={1}
                />
              </Space>
            </Col>
            <Col xs={24} sm={4} style={{ textAlign: 'center' }}>
              <Tooltip title={t.swap}>
                <Button icon={<SwapOutlined />} onClick={handleSwap} />
              </Tooltip>
            </Col>
            <Col xs={24} sm={10}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text type="secondary">{t.height}</Text>
                <InputNumber
                  min={1}
                  value={h}
                  onChange={(v) => setH(v ?? 1)}
                  style={{ width: '100%' }}
                  step={1}
                />
              </Space>
            </Col>
          </Row>

          {mode === MODE.FIT && (
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Text type="secondary">{t.targetWidth}</Text>
                  <InputNumber
                    min={1}
                    value={targetW}
                    onChange={(v) => {
                      setTargetW(v)
                      if (v !== undefined && v !== null) setTargetH(undefined)
                    }}
                    style={{ width: '100%' }}
                    step={1}
                  />
                </Space>
              </Col>
              <Col xs={24} sm={12}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Text type="secondary">{t.targetHeight}</Text>
                  <InputNumber
                    min={1}
                    value={targetH}
                    onChange={(v) => {
                      setTargetH(v)
                      if (v !== undefined && v !== null) setTargetW(undefined)
                    }}
                    style={{ width: '100%' }}
                    step={1}
                  />
                </Space>
              </Col>
            </Row>
          )}

          <div>
            <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
              {t.commonRatios}
            </Text>
            <Space size={[8, 8]} wrap>
              {COMMON_RATIOS.map((preset) => (
                <Button key={preset.label} size="small" onClick={() => applyPreset(preset)}>
                  {preset.label}
                </Button>
              ))}
            </Space>
          </div>
        </Space>
      </Card>

      <Card title={t.result}>
        {!isValid ? (
          <Alert type="error" message={t.invalid} showIcon />
        ) : (
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12}>
                <Space direction="vertical">
                  <Text type="secondary">{t.simplifiedRatio}</Text>
                  <Text strong style={{ fontSize: 24, fontFamily: 'monospace' }}>
                    {ratio ? `${ratio.width}:${ratio.height}` : '-'}
                  </Text>
                </Space>
              </Col>
              <Col xs={24} sm={12}>
                <Space direction="vertical">
                  <Text type="secondary">{t.decimal}</Text>
                  <Text strong style={{ fontSize: 24, fontFamily: 'monospace' }}>
                    {round4(decimal)}
                  </Text>
                </Space>
              </Col>
            </Row>

            {mode === MODE.FIT && fit && (
              <div>
                <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
                  {t.dimensions}
                </Text>
                <Text strong style={{ fontSize: 18, fontFamily: 'monospace' }}>
                  {Math.round(fit.width)} × {Math.round(fit.height)}
                </Text>
              </div>
            )}

            <div>
              <Space style={{ marginBottom: 8 }}>
                <Text type="secondary">{t.cssSnippet}</Text>
                <Button
                  size="small"
                  icon={<CopyOutlined />}
                  onClick={() => copy(css)}
                >
                  {copied ? t.copied : t.copyCss}
                </Button>
              </Space>
              <pre
                style={{
                  margin: 0,
                  padding: 12,
                  background: '#f6ffed',
                  border: '1px solid #b7eb8f',
                  borderRadius: 6,
                  fontSize: 13,
                  overflow: 'auto',
                }}
              >
                <code>{css}</code>
              </pre>
            </div>
          </Space>
        )}
      </Card>

      <Alert type="info" message={t.alertTitle} description={t.alertBody} showIcon />

      <Collapse ghost>
        <Collapse.Panel header={t.sourceCode} key="source">
          <pre
            style={{
              margin: 0,
              padding: 12,
              background: '#f5f5f5',
              borderRadius: 6,
              fontSize: 12,
              overflow: 'auto',
            }}
          >
            <code>{buildAspectRatioCss.toString()}</code>
          </pre>
        </Collapse.Panel>
      </Collapse>
    </Space>
  )
}
