import React, { useRef, useState } from 'react'
import { Typography, Card, Space, Input, Button, Tag, message, Alert } from 'antd'
import { TrophyOutlined, PlusOutlined, SyncOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

// Paleta categórica fixa (8 matizes) — a ordem nunca é embaralhada, só
// ciclada se houver mais de 8 nomes. A identidade de cada fatia não depende
// só da cor: a legenda abaixo da roleta sempre mostra o nome ao lado do
// mesmo tom usado na fatia.
const WHEEL_COLORS = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#4a3aa7', '#e34948']

const DEFAULT_NAMES = ['Ana', 'Bruno', 'Carla', 'Diego']

function buildGradient(names) {
  const n = names.length
  const sliceAngle = 360 / n
  const stops = names.map((_, i) => {
    const color = WHEEL_COLORS[i % WHEEL_COLORS.length]
    const start = i * sliceAngle
    const end = start + sliceAngle
    return `${color} ${start}deg ${end}deg`
  })
  return `conic-gradient(${stops.join(', ')})`
}

const translations = {
  pt: {
    title: 'Roleta de Sorteio',
    intro: 'Adiciona os nomes (ex.: quem revisa esse PR, quem apresenta na daily, quem paga o café) e gira a roleta pra sortear um deles — sem servidor, sem viés: cada nome tem exatamente a mesma chance.',
    addPlaceholder: 'Digite um nome e pressione Enter',
    add: 'Adicionar',
    spin: 'Girar',
    spinning: 'Girando...',
    winner: 'Sorteado',
    needAtLeastTwo: 'Adicione pelo menos 2 nomes pra girar',
    duplicate: 'Esse nome já está na lista',
    reset: 'Restaurar exemplo',
    namesTitle: 'Participantes',
  },
  en: {
    title: 'Team Roulette',
    intro: 'Add names (e.g. who reviews this PR, who presents at the daily, who pays for coffee) and spin the wheel to pick one — no server, no bias: every name has exactly the same odds.',
    addPlaceholder: 'Type a name and press Enter',
    add: 'Add',
    spin: 'Spin',
    spinning: 'Spinning...',
    winner: 'Winner',
    needAtLeastTwo: 'Add at least 2 names to spin',
    duplicate: 'That name is already on the list',
    reset: 'Reset to sample',
    namesTitle: 'Participants',
  },
}

export default function TeamRoulettePage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [names, setNames] = useState(DEFAULT_NAMES)
  const [inputValue, setInputValue] = useState('')
  const [rotation, setRotation] = useState(0)
  const [spinning, setSpinning] = useState(false)
  const [winner, setWinner] = useState(null)
  const pendingWinnerRef = useRef(null)

  function addName() {
    const name = inputValue.trim()
    if (!name) return
    if (names.some((n) => n.toLowerCase() === name.toLowerCase())) {
      message.warning(t.duplicate)
      return
    }
    setNames([...names, name])
    setInputValue('')
    setWinner(null)
  }

  function removeName(name) {
    setNames(names.filter((n) => n !== name))
    setWinner(null)
  }

  function spin() {
    if (names.length < 2) {
      message.warning(t.needAtLeastTwo)
      return
    }
    const winnerIndex = Math.floor(Math.random() * names.length)
    const sliceAngle = 360 / names.length
    const sliceCenter = winnerIndex * sliceAngle + sliceAngle / 2
    const currentMod = ((rotation % 360) + 360) % 360
    const deltaToTarget = (((360 - sliceCenter) - currentMod) % 360 + 360) % 360
    const extraSpins = 5 + Math.floor(Math.random() * 3)
    pendingWinnerRef.current = names[winnerIndex]
    setWinner(null)
    setSpinning(true)
    setRotation(rotation + 360 * extraSpins + deltaToTarget)
  }

  function handleTransitionEnd() {
    if (!spinning) return
    setSpinning(false)
    setWinner(pendingWinnerRef.current)
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><TrophyOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Space.Compact style={{ width: '100%', maxWidth: 400 }}>
            <Input
              placeholder={t.addPlaceholder}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onPressEnter={addName}
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={addName}>{t.add}</Button>
          </Space.Compact>

          <div>
            <Text strong style={{ display: 'block', marginBottom: 8 }}>{t.namesTitle}</Text>
            <Space size={[8, 8]} wrap>
              {names.map((name, i) => (
                <Tag
                  key={name}
                  closable
                  onClose={() => removeName(name)}
                  style={{ background: WHEEL_COLORS[i % WHEEL_COLORS.length], color: '#fff', border: 'none', fontSize: 13, padding: '4px 8px' }}
                >
                  {name}
                </Tag>
              ))}
            </Space>
          </div>

          {names.length < 2 && <Alert type="warning" showIcon message={t.needAtLeastTwo} />}

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, padding: '16px 0' }}>
            <div style={{ position: 'relative', width: 260, height: 260 }}>
              <div
                style={{
                  position: 'absolute',
                  top: -6,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 0,
                  height: 0,
                  borderLeft: '12px solid transparent',
                  borderRight: '12px solid transparent',
                  borderTop: '18px solid #0b0b0b',
                  zIndex: 2,
                }}
              />
              <div
                onTransitionEnd={handleTransitionEnd}
                style={{
                  width: 260,
                  height: 260,
                  borderRadius: '50%',
                  background: names.length > 0 ? buildGradient(names) : '#f0f0f0',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
                  transform: `rotate(${rotation}deg)`,
                  transition: 'transform 3s cubic-bezier(0.2, 0.8, 0.2, 1)',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: '#fff',
                  boxShadow: '0 0 0 2px rgba(0,0,0,0.08)',
                }}
              />
            </div>

            <Button type="primary" size="large" icon={<SyncOutlined spin={spinning} />} onClick={spin} loading={spinning} disabled={names.length < 2}>
              {spinning ? t.spinning : t.spin}
            </Button>

            {winner && (
              <Alert
                type="success"
                showIcon
                icon={<TrophyOutlined />}
                message={`${t.winner}: ${winner}`}
                style={{ fontSize: 15 }}
              />
            )}
          </div>
        </Space>
      </Card>
    </Space>
  )
}
