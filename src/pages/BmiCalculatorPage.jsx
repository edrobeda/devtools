import React, { useMemo, useState } from 'react'
import {
  Typography,
  Card,
  InputNumber,
  Space,
  Segmented,
  Row,
  Col,
  Statistic,
  Tag,
  Alert,
  Collapse,
  Button,
  Table,
} from 'antd'
import { CalculatorOutlined, InfoCircleOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  calculateBmi,
  idealWeightRange,
  weightForBmi,
  imperialToMetric,
  metricToImperial,
  formatBmi,
  formatWeight,
  PRESETS,
  getClassificationTable,
  CATEGORIES,
} from '../utils/bmiCalculator'

const { Title, Paragraph, Text } = Typography
const { Panel } = Collapse

const sourceCode = `import {
  calculateBmi,
  idealWeightRange,
  classifyBmi,
} from '../utils/bmiCalculator'

// Peso 70 kg, altura 1.75 m
calculateBmi(70, 1.75)
// { bmi: 22.86, category: { key: 'normal', color: '#52c41a' } }

idealWeightRange(1.75)
// { min: 56.66, max: 76.31 } kg

classifyBmi(27.5)
// { key: 'overweight', min: 25, max: 29.9, color: '#faad14' }
`

const translations = {
  pt: {
    title: 'Calculadora de IMC',
    subtitle: 'Índice de Massa Corporal',
    intro: 'Calcule o IMC a partir do peso e da altura. A classificação segue os critérios da OMS para adultos e serve apenas como referência — não substitui avaliação médica.',
    unitSystem: 'Sistema de unidades',
    metric: 'Métrico (kg / cm)',
    imperial: 'Imperial (lb / ft+in)',
    weightKg: 'Peso (kg)',
    heightCm: 'Altura (cm)',
    weightLb: 'Peso (lb)',
    heightFt: 'Pés (ft)',
    heightIn: 'Polegadas (in)',
    yourBmi: 'Seu IMC',
    category: 'Classificação',
    idealWeight: 'Peso ideal (faixa saudável)',
    idealTarget: 'Peso para IMC 22',
    toNormal: 'Para atingir a faixa normal',
    gain: 'ganhar',
    lose: 'perder',
    classification: 'Classificações da OMS',
    presets: 'Exemplos de um clique',
    sourceTitle: 'Motor de cálculo',
    sourceIntro: 'O motor é puro JavaScript client-side — nenhum dado de saúde sai do navegador.',
    disclaimer: 'O IMC é uma medida de triagem populacional. Atletas, idosos, gestantes e pessoas com composição corporal atípica podem ter interpretações diferentes. Consulte um profissional de saúde para avaliação individual.',
    bmiScaleLabel: 'Escala IMC',
    yourResult: 'Seu resultado',
  },
  en: {
    title: 'BMI Calculator',
    subtitle: 'Body Mass Index',
    intro: 'Calculate BMI from weight and height. Classification follows WHO criteria for adults and is for reference only — it does not replace medical evaluation.',
    unitSystem: 'Unit system',
    metric: 'Metric (kg / cm)',
    imperial: 'Imperial (lb / ft+in)',
    weightKg: 'Weight (kg)',
    heightCm: 'Height (cm)',
    weightLb: 'Weight (lb)',
    heightFt: 'Feet (ft)',
    heightIn: 'Inches (in)',
    yourBmi: 'Your BMI',
    category: 'Classification',
    idealWeight: 'Healthy weight range',
    idealTarget: 'Weight for BMI 22',
    toNormal: 'To reach the normal range',
    gain: 'gain',
    lose: 'lose',
    classification: 'WHO classifications',
    presets: 'One-click examples',
    sourceTitle: 'Calculation engine',
    sourceIntro: 'The engine is pure client-side JavaScript — no health data leaves the browser.',
    disclaimer: 'BMI is a population screening measure. Athletes, older adults, pregnant people and those with atypical body composition may have different interpretations. Consult a healthcare professional for individual assessment.',
    bmiScaleLabel: 'BMI scale',
    yourResult: 'Your result',
  },
}

const categoryLabels = {
  pt: {
    underweight: 'Abaixo do peso',
    normal: 'Peso normal',
    overweight: 'Sobrepeso',
    obesity1: 'Obesidade grau I',
    obesity2: 'Obesidade grau II',
    obesity3: 'Obesidade grau III',
  },
  en: {
    underweight: 'Underweight',
    normal: 'Normal weight',
    overweight: 'Overweight',
    obesity1: 'Obesity class I',
    obesity2: 'Obesity class II',
    obesity3: 'Obesity class III',
  },
}

export default function BmiCalculatorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const labels = categoryLabels[lang]

  const [unitSystem, setUnitSystem] = useState('metric')
  const [weightKg, setWeightKg] = useState(70)
  const [heightCm, setHeightCm] = useState(175)
  const [weightLb, setWeightLb] = useState(154)
  const [heightFt, setHeightFt] = useState(5)
  const [heightIn, setHeightIn] = useState(9)

  const { weightKg: effectiveWeightKg, heightM: effectiveHeightM } = useMemo(() => {
    if (unitSystem === 'metric') {
      return { weightKg, heightM: heightCm / 100 }
    }
    return imperialToMetric(weightLb, heightFt, heightIn)
  }, [unitSystem, weightKg, heightCm, weightLb, heightFt, heightIn])

  const { bmi, category } = useMemo(
    () => calculateBmi(effectiveWeightKg, effectiveHeightM),
    [effectiveWeightKg, effectiveHeightM]
  )

  const ideal = useMemo(
    () => idealWeightRange(effectiveHeightM),
    [effectiveHeightM]
  )

  const target22 = useMemo(
    () => weightForBmi(effectiveHeightM, 22),
    [effectiveHeightM]
  )

  const deltaToNormal = useMemo(() => {
    if (bmi == null || !Number.isFinite(bmi)) return null
    if (bmi < 18.5) return { action: 'gain', value: ideal.min - effectiveWeightKg }
    if (bmi > 24.9) return { action: 'lose', value: effectiveWeightKg - ideal.max }
    return null
  }, [bmi, effectiveWeightKg, ideal.min, ideal.max])

  const applyPreset = (preset) => {
    if (unitSystem === 'metric') {
      setWeightKg(preset.weightKg)
      setHeightCm(Math.round(preset.heightM * 100))
    } else {
      const imperial = metricToImperial(preset.weightKg, preset.heightM)
      setWeightLb(Math.round(imperial.weightLb))
      setHeightFt(imperial.heightFt)
      setHeightIn(Math.round(imperial.heightIn * 10) / 10)
    }
  }

  const classificationColumns = [
    {
      title: t.category,
      dataIndex: 'key',
      render: (key) => <Text strong>{labels[key]}</Text>,
    },
    {
      title: 'IMC / BMI',
      dataIndex: 'range',
    },
  ]

  const scaleMarks = [
    { key: 'underweight', width: 18.5 },
    { key: 'normal', width: 6.4 },
    { key: 'overweight', width: 5 },
    { key: 'obesity1', width: 5 },
    { key: 'obesity2', width: 5 },
    { key: 'obesity3', width: 10 },
  ]

  const totalScale = scaleMarks.reduce((s, m) => s + m.width, 0)
  const markerPosition = bmi == null ? null : Math.min(Math.max((bmi / totalScale) * 100, 0), 100)

  return (
    <div style={{ padding: 24, maxWidth: 960, margin: '0 auto' }}>
      <Title level={2}>
        <CalculatorOutlined style={{ marginRight: 12 }} />
        {t.title}
      </Title>
      <Paragraph type="secondary" style={{ marginTop: -8, marginBottom: 24 }}>
        {t.subtitle}
      </Paragraph>
      <Paragraph>{t.intro}</Paragraph>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card>
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <div>
                <Text strong>{t.unitSystem}</Text>
                <Segmented
                  block
                  value={unitSystem}
                  onChange={(v) => setUnitSystem(v)}
                  options={[
                    { label: t.metric, value: 'metric' },
                    { label: t.imperial, value: 'imperial' },
                  ]}
                />
              </div>

              {unitSystem === 'metric' ? (
                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <Text strong>{t.weightKg}</Text>
                    <InputNumber
                      style={{ width: '100%' }}
                      min={1}
                      step={0.1}
                      value={weightKg}
                      onChange={(v) => setWeightKg(v ?? 0)}
                    />
                  </Col>
                  <Col span={12}>
                    <Text strong>{t.heightCm}</Text>
                    <InputNumber
                      style={{ width: '100%' }}
                      min={1}
                      step={1}
                      value={heightCm}
                      onChange={(v) => setHeightCm(v ?? 0)}
                    />
                  </Col>
                </Row>
              ) : (
                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <Text strong>{t.weightLb}</Text>
                    <InputNumber
                      style={{ width: '100%' }}
                      min={1}
                      step={0.1}
                      value={weightLb}
                      onChange={(v) => setWeightLb(v ?? 0)}
                    />
                  </Col>
                  <Col span={6}>
                    <Text strong>{t.heightFt}</Text>
                    <InputNumber
                      style={{ width: '100%' }}
                      min={0}
                      step={1}
                      value={heightFt}
                      onChange={(v) => setHeightFt(v ?? 0)}
                    />
                  </Col>
                  <Col span={6}>
                    <Text strong>{t.heightIn}</Text>
                    <InputNumber
                      style={{ width: '100%' }}
                      min={0}
                      max={11.99}
                      step={0.1}
                      value={heightIn}
                      onChange={(v) => setHeightIn(v ?? 0)}
                    />
                  </Col>
                </Row>
              )}

              <div>
                <Text strong style={{ display: 'block', marginBottom: 8 }}>{t.presets}</Text>
                <Space wrap>
                  {PRESETS.map((preset) => (
                    <Button key={preset.key} size="small" onClick={() => applyPreset(preset)}>
                      {preset.label[lang]}
                    </Button>
                  ))}
                </Space>
              </div>
            </Space>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card style={{ height: '100%' }}>
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <Statistic
                title={t.yourBmi}
                value={bmi == null ? '—' : formatBmi(bmi, lang === 'pt' ? 'pt-BR' : 'en-US')}
                valueStyle={{ fontSize: 48, color: category?.color || '#000' }}
              />
              {category && (
                <Tag
                  color={category.color}
                  style={{ fontSize: 16, padding: '4px 12px', lineHeight: '24px' }}
                >
                  {labels[category.key]}
                </Tag>
              )}
              <div>
                <Text strong>{t.idealWeight}: </Text>
                <Text>
                  {ideal.min != null
                    ? `${formatWeight(ideal.min, lang === 'pt' ? 'pt-BR' : 'en-US')} – ${formatWeight(
                        ideal.max,
                        lang === 'pt' ? 'pt-BR' : 'en-US'
                      )} kg`
                    : '—'}
                </Text>
              </div>
              <div>
                <Text strong>{t.idealTarget}: </Text>
                <Text>
                  {target22 != null
                    ? `${formatWeight(target22, lang === 'pt' ? 'pt-BR' : 'en-US')} kg`
                    : '—'}
                </Text>
              </div>
              {deltaToNormal && (
                <Alert
                  type={deltaToNormal.action === 'gain' ? 'warning' : 'info'}
                  showIcon
                  message={`${t.toNormal}: ${t[deltaToNormal.action]} ${formatWeight(
                    Math.abs(deltaToNormal.value),
                    lang === 'pt' ? 'pt-BR' : 'en-US'
                  )} kg`}
                />
              )}
            </Space>
          </Card>
        </Col>
      </Row>

      <Card style={{ marginTop: 16 }}>
        <Text strong style={{ display: 'block', marginBottom: 12 }}>{t.bmiScaleLabel}</Text>
        <div style={{ position: 'relative', height: 36, borderRadius: 6, overflow: 'hidden', display: 'flex' }}>
          {scaleMarks.map((mark) => (
            <div
              key={mark.key}
              style={{
                width: `${(mark.width / totalScale) * 100}%`,
                background: CATEGORIES[mark.key].color,
                opacity: category?.key === mark.key ? 1 : 0.55,
              }}
              title={labels[mark.key]}
            />
          ))}
          {markerPosition != null && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: `${markerPosition}%`,
                width: 4,
                background: '#000',
                transform: 'translateX(-50%)',
                boxShadow: '0 0 0 2px #fff',
              }}
            />
          )}
        </div>
        <div style={{ display: 'flex', marginTop: 6 }}>
          {scaleMarks.map((mark) => (
            <div
              key={mark.key}
              style={{ width: `${(mark.width / totalScale) * 100}%`, textAlign: 'center', fontSize: 11 }}
            >
              <Text type="secondary">{labels[mark.key]}</Text>
            </div>
          ))}
        </div>
      </Card>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} md={12}>
          <Card title={t.classification}>
            <Table
              dataSource={getClassificationTable()}
              columns={classificationColumns}
              pagination={false}
              size="small"
              rowKey="key"
              rowClassName={(record) => (record.key === category?.key ? 'bmi-active-row' : '')}
            />
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Alert
            type="info"
            showIcon
            icon={<InfoCircleOutlined />}
            message={t.disclaimer}
            style={{ height: '100%' }}
          />
        </Col>
      </Row>

      <Collapse style={{ marginTop: 24 }}>
        <Panel header={t.sourceTitle} key="source">
          <Paragraph>{t.sourceIntro}</Paragraph>
          <pre style={{ background: '#f6ffed', padding: 16, borderRadius: 8, overflow: 'auto' }}>
            <code>{sourceCode}</code>
          </pre>
        </Panel>
      </Collapse>

      <style>{`
        .bmi-active-row {
          background: #f6ffed !important;
        }
      `}</style>
    </div>
  )
}
