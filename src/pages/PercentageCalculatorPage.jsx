import React, { useMemo, useState } from 'react'
import {
  Typography,
  Card,
  InputNumber,
  Space,
  Collapse,
  Row,
  Col,
  Statistic,
  Divider,
  Tag,
} from 'antd'
import { PercentageOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  percentageOf,
  whatPercentage,
  percentageChange,
  applyPercentage,
  splitWithTip,
  fractionToPercentage,
  ruleOfThree,
  formatNumber,
  formatCurrency,
} from '../utils/percentageCalculator'

const { Title, Paragraph, Text } = Typography
const { Panel } = Collapse

const sourceCode = `import {
  percentageOf,
  whatPercentage,
  percentageChange,
  applyPercentage,
  splitWithTip,
  fractionToPercentage,
  ruleOfThree,
} from '../utils/percentageCalculator'

// Quanto e 20% de 250?
percentageOf(20, 250)        // 50

// 50 representa quantos % de 250?
whatPercentage(50, 250)      // 20

// Variacao de 100 para 125
percentageChange(100, 125)   // 25

// Aplicar 10% de desconto em 200
applyPercentage(200, -10)      // 180

// Regra de tres: 2 esta para 4 assim como 10 esta para X
ruleOfThree(2, 4, 10)          // 20

// Dividir 300 entre 3 pessoas com 10% de gorjeta
splitWithTip(300, 3, 10)
// { totalWithTip: 330, tipAmount: 30, perPerson: 110 }
`

const translations = {
  pt: {
    title: 'Calculadora de Porcentagem',
    intro: 'Ferramenta rapida para os calculos de porcentagem mais comuns do dia a dia: parcela, representatividade, aumento, desconto, regra de tres e divisao de conta com gorjeta.',
    of: 'Quanto e',
    ofTotal: 'de',
    ofResult: 'Resultado',
    whatIs: 'é quantos % de',
    whatResult: 'Representa',
    changeFrom: 'Variacao de',
    changeTo: 'para',
    changeResult: 'Variacao',
    applyTo: 'Aplicar',
    applyOn: 'em',
    applyResult: 'Valor final',
    tipTotal: 'Valor da conta',
    tipPeople: 'Pessoas',
    tipPercent: 'Gorjeta',
    tipResult: 'Total com gorjeta',
    tipPerPerson: 'Por pessoa',
    fractionNumerator: 'Numerador',
    fractionDenominator: 'Denominador',
    fractionResult: 'Porcentagem',
    ruleA: 'A',
    ruleB: 'B',
    ruleC: 'C',
    ruleResult: 'X (regra de tres)',
    sourceTitle: 'Motor de calculo',
    sourceIntro: 'O motor e puro JavaScript client-side e nao envia dados para lugar nenhum.',
  },
  en: {
    title: 'Percentage Calculator',
    intro: 'Quick tool for the most common percentage calculations: part, ratio, increase, discount, rule of three and bill splitting with tip.',
    of: 'What is',
    ofTotal: 'of',
    ofResult: 'Result',
    whatIs: 'is what % of',
    whatResult: 'Represents',
    changeFrom: 'Change from',
    changeTo: 'to',
    changeResult: 'Change',
    applyTo: 'Apply',
    applyOn: 'to',
    applyResult: 'Final value',
    tipTotal: 'Bill total',
    tipPeople: 'People',
    tipPercent: 'Tip',
    tipResult: 'Total with tip',
    tipPerPerson: 'Per person',
    fractionNumerator: 'Numerator',
    fractionDenominator: 'Denominator',
    fractionResult: 'Percentage',
    ruleA: 'A',
    ruleB: 'B',
    ruleC: 'C',
    ruleResult: 'X (rule of three)',
    sourceTitle: 'Calculation engine',
    sourceIntro: 'The engine is pure client-side JavaScript and does not send data anywhere.',
  },
}

export default function PercentageCalculatorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  // Estado de cada calculadora
  const [ofPercent, setOfPercent] = useState(20)
  const [ofTotal, setOfTotal] = useState(250)

  const [whatPart, setWhatPart] = useState(50)
  const [whatTotal, setWhatTotal] = useState(250)

  const [changeFrom, setChangeFrom] = useState(100)
  const [changeTo, setChangeTo] = useState(125)

  const [applyValue, setApplyValue] = useState(200)
  const [applyPercent, setApplyPercent] = useState(-10)

  const [tipTotal, setTipTotal] = useState(300)
  const [tipPeople, setTipPeople] = useState(3)
  const [tipPercent, setTipPercent] = useState(10)

  const [fractionNum, setFractionNum] = useState(1)
  const [fractionDen, setFractionDen] = useState(4)

  const [ruleA, setRuleA] = useState(2)
  const [ruleB, setRuleB] = useState(4)
  const [ruleC, setRuleC] = useState(10)

  const ofResult = useMemo(() => percentageOf(ofPercent, ofTotal), [ofPercent, ofTotal])
  const whatResult = useMemo(() => whatPercentage(whatPart, whatTotal), [whatPart, whatTotal])
  const changeResult = useMemo(() => percentageChange(changeFrom, changeTo), [changeFrom, changeTo])
  const applyResult = useMemo(() => applyPercentage(applyValue, applyPercent), [applyValue, applyPercent])
  const tipResult = useMemo(() => splitWithTip(tipTotal, tipPeople, tipPercent), [tipTotal, tipPeople, tipPercent])
  const fractionResult = useMemo(() => fractionToPercentage(fractionNum, fractionDen), [fractionNum, fractionDen])
  const ruleResult = useMemo(() => ruleOfThree(ruleA, ruleB, ruleC), [ruleA, ruleB, ruleC])

  const fmtPct = (v) => `${formatNumber(v)}%`

  return (
    <div style={{ padding: 24, maxWidth: 960, margin: '0 auto' }}>
      <Title level={2}>
        <PercentageOutlined style={{ marginRight: 12 }} />
        {t.title}
      </Title>
      <Paragraph>{t.intro}</Paragraph>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card title={`${t.of} X% ${t.ofTotal} Y`}>
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <div>
                <Text strong>%</Text>
                <InputNumber
                  style={{ width: '100%' }}
                  value={ofPercent}
                  onChange={(v) => setOfPercent(v ?? 0)}
                />
              </div>
              <div>
                <Text strong>{t.ofTotal}</Text>
                <InputNumber
                  style={{ width: '100%' }}
                  value={ofTotal}
                  onChange={(v) => setOfTotal(v ?? 0)}
                />
              </div>
              <Divider style={{ margin: '12px 0' }} />
              <Statistic title={t.ofResult} value={formatNumber(ofResult)} />
            </Space>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card title={`X ${t.whatIs} Y`}>
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <div>
                <Text strong>X</Text>
                <InputNumber
                  style={{ width: '100%' }}
                  value={whatPart}
                  onChange={(v) => setWhatPart(v ?? 0)}
                />
              </div>
              <div>
                <Text strong>Y</Text>
                <InputNumber
                  style={{ width: '100%' }}
                  value={whatTotal}
                  onChange={(v) => setWhatTotal(v ?? 0)}
                />
              </div>
              <Divider style={{ margin: '12px 0' }} />
              <Statistic title={t.whatResult} value={fmtPct(whatResult)} />
            </Space>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card title={`${t.changeFrom} X ${t.changeTo} Y`}>
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <div>
                <Text strong>{t.changeFrom}</Text>
                <InputNumber
                  style={{ width: '100%' }}
                  value={changeFrom}
                  onChange={(v) => setChangeFrom(v ?? 0)}
                />
              </div>
              <div>
                <Text strong>{t.changeTo}</Text>
                <InputNumber
                  style={{ width: '100%' }}
                  value={changeTo}
                  onChange={(v) => setChangeTo(v ?? 0)}
                />
              </div>
              <Divider style={{ margin: '12px 0' }} />
              <Statistic
                title={t.changeResult}
                value={fmtPct(changeResult)}
                valueStyle={{ color: changeResult >= 0 ? '#52c41a' : '#ff4d4f' }}
                prefix={changeResult > 0 ? '+' : changeResult < 0 ? '-' : ''}
              />
            </Space>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card title={`${t.applyTo} X% ${t.applyOn} Y`}>
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <div>
                <Text strong>%</Text>
                <InputNumber
                  style={{ width: '100%' }}
                  value={applyPercent}
                  onChange={(v) => setApplyPercent(v ?? 0)}
                />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {applyPercent >= 0 ? 'aumento' : 'desconto'} / {applyPercent >= 0 ? 'increase' : 'discount'}
                </Text>
              </div>
              <div>
                <Text strong>{t.applyOn}</Text>
                <InputNumber
                  style={{ width: '100%' }}
                  value={applyValue}
                  onChange={(v) => setApplyValue(v ?? 0)}
                />
              </div>
              <Divider style={{ margin: '12px 0' }} />
              <Statistic
                title={t.applyResult}
                value={formatCurrency(applyResult, lang === 'pt' ? 'pt-BR' : 'en-US', 'BRL')}
              />
            </Space>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card title={`${t.fractionNumerator} / ${t.fractionDenominator}`}>
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <div>
                <Text strong>{t.fractionNumerator}</Text>
                <InputNumber
                  style={{ width: '100%' }}
                  value={fractionNum}
                  onChange={(v) => setFractionNum(v ?? 0)}
                />
              </div>
              <div>
                <Text strong>{t.fractionDenominator}</Text>
                <InputNumber
                  style={{ width: '100%' }}
                  value={fractionDen}
                  onChange={(v) => setFractionDen(v ?? 0)}
                />
              </div>
              <Divider style={{ margin: '12px 0' }} />
              <Statistic title={t.fractionResult} value={fmtPct(fractionResult)} />
            </Space>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card title={`${t.ruleA} → ${t.ruleB} = ${t.ruleC} → X`}>
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <Row gutter={8}>
                <Col span={12}>
                  <Text strong>{t.ruleA}</Text>
                  <InputNumber
                    style={{ width: '100%' }}
                    value={ruleA}
                    onChange={(v) => setRuleA(v ?? 0)}
                  />
                </Col>
                <Col span={12}>
                  <Text strong>{t.ruleB}</Text>
                  <InputNumber
                    style={{ width: '100%' }}
                    value={ruleB}
                    onChange={(v) => setRuleB(v ?? 0)}
                  />
                </Col>
              </Row>
              <div>
                <Text strong>{t.ruleC}</Text>
                <InputNumber
                  style={{ width: '100%' }}
                  value={ruleC}
                  onChange={(v) => setRuleC(v ?? 0)}
                />
              </div>
              <Divider style={{ margin: '12px 0' }} />
              <Statistic title={t.ruleResult} value={formatNumber(ruleResult)} />
            </Space>
          </Card>
        </Col>

        <Col xs={24} md={24}>
          <Card title={`${t.tipTotal} + ${t.tipPercent}`}>
            <Row gutter={[16, 16]} align="middle">
              <Col xs={24} md={6}>
                <Text strong>{t.tipTotal}</Text>
                <InputNumber
                  style={{ width: '100%' }}
                  value={tipTotal}
                  onChange={(v) => setTipTotal(v ?? 0)}
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
                  parser={(value) => value.replace(/\./g, '').replace(',', '.')}
                />
              </Col>
              <Col xs={24} md={6}>
                <Text strong>{t.tipPeople}</Text>
                <InputNumber
                  style={{ width: '100%' }}
                  min={1}
                  value={tipPeople}
                  onChange={(v) => setTipPeople(v ?? 1)}
                />
              </Col>
              <Col xs={24} md={6}>
                <Text strong>{t.tipPercent} (%)</Text>
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  value={tipPercent}
                  onChange={(v) => setTipPercent(v ?? 0)}
                />
              </Col>
              <Col xs={24} md={6}>
                <Space direction="vertical" size="small">
                  <Statistic
                    title={t.tipResult}
                    value={formatCurrency(tipResult.totalWithTip, lang === 'pt' ? 'pt-BR' : 'en-US', 'BRL')}
                  />
                  <Text type="secondary">
                    {t.tipPerPerson}: <Text strong>{formatCurrency(tipResult.perPerson, lang === 'pt' ? 'pt-BR' : 'en-US', 'BRL')}</Text>
                  </Text>
                  <Tag color="blue">{t.tipPercent}: {formatCurrency(tipResult.tipAmount, lang === 'pt' ? 'pt-BR' : 'en-US', 'BRL')}</Tag>
                </Space>
              </Col>
            </Row>
          </Card>
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
    </div>
  )
}
