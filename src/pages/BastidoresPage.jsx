import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Typography, List, Empty, Spin, Tag } from 'antd'
import { HistoryOutlined, EyeOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { useLanguage } from '../i18n/LanguageContext'
import { LABELS } from '../components/AppLayout'

const { Title, Paragraph, Text } = Typography

const translations = {
  pt: {
    title: 'Bastidores',
    subtitle: 'O devtools cresce sozinho: um agente autônomo roda de hora em hora adicionando e corrigindo ferramentas, e todo dia à meia-noite resume o que mudou. Aqui embaixo, sem números de negócio nem nada — só o histórico e o que mais foi usado.',
    changesTitle: 'O que mudou',
    changesEmpty: 'Ainda sem resumos registrados — o primeiro roda à meia-noite.',
    visitsTitle: 'Ferramentas mais visitadas',
    visitsEmpty: 'Ainda sem visitas registradas.',
    visitsUnit: (n) => (n === 1 ? '1 visita' : `${n} visitas`),
    visitsBotBreakdown: (bot, ai) =>
      ai > 0 ? `${bot} de bots (${ai} de IA)` : `${bot} de bots`,
  },
  en: {
    title: 'Behind the scenes',
    subtitle: 'Devtools grows on its own: an autonomous agent runs every hour adding and fixing tools, and every day at midnight it summarizes what changed. No business numbers here — just history and what got used the most.',
    changesTitle: 'What changed',
    changesEmpty: 'No summaries yet — the first one runs at midnight.',
    visitsTitle: 'Most visited tools',
    visitsEmpty: 'No visits recorded yet.',
    visitsUnit: (n) => (n === 1 ? '1 visit' : `${n} visits`),
    visitsBotBreakdown: (bot, ai) =>
      ai > 0 ? `${bot} from bots (${ai} from AI)` : `${bot} from bots`,
  },
}

async function fetchBastidores() {
  const res = await fetch('/api/bastidores')
  if (!res.ok) throw new Error('failed to fetch bastidores')
  return res.json()
}

async function fetchVisits() {
  const res = await fetch('/api/visits')
  if (!res.ok) throw new Error('failed to fetch visits')
  return res.json()
}

function labelForKey(key, l) {
  const slug = key.split('/').filter(Boolean).pop()
  return l[slug] || key
}

export default function BastidoresPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const l = LABELS[lang]

  const { data: entries, isLoading: loadingEntries } = useQuery({
    queryKey: ['bastidores-entries'],
    queryFn: fetchBastidores,
    staleTime: 5 * 60 * 1000,
  })

  const { data: visits, isLoading: loadingVisits } = useQuery({
    queryKey: ['bastidores-visits'],
    queryFn: fetchVisits,
    staleTime: 5 * 60 * 1000,
  })

  const topVisits = (visits || []).filter((v) => v.key !== '/bastidores').slice(0, 15)

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <Title level={2}>{t.title}</Title>
      <Paragraph type="secondary">{t.subtitle}</Paragraph>

      <Title level={4} style={{ marginTop: 32 }}>
        <HistoryOutlined style={{ marginRight: 8 }} />
        {t.changesTitle}
      </Title>
      {loadingEntries ? (
        <Spin />
      ) : (
        <List
          dataSource={entries || []}
          locale={{ emptyText: <Empty description={t.changesEmpty} /> }}
          renderItem={(entry) => (
            <List.Item key={entry.id}>
              <List.Item.Meta
                title={<Text type="secondary" style={{ fontWeight: 400, fontSize: 13 }}>{dayjs(entry.created_at).format('DD/MM/YYYY')}</Text>}
                description={<Text>{entry.summary}</Text>}
              />
            </List.Item>
          )}
        />
      )}

      <Title level={4} style={{ marginTop: 32 }}>
        <EyeOutlined style={{ marginRight: 8 }} />
        {t.visitsTitle}
      </Title>
      {loadingVisits ? (
        <Spin />
      ) : (
        <List
          dataSource={topVisits}
          locale={{ emptyText: <Empty description={t.visitsEmpty} /> }}
          renderItem={(v) => (
            <List.Item key={v.key}>
              <Text>{labelForKey(v.key, l)}</Text>
              <span>
                <Tag>{t.visitsUnit(v.count)}</Tag>
                {v.bot_count > 0 && (
                  <Tag color="default">{t.visitsBotBreakdown(v.bot_count, v.ai_bot_count)}</Tag>
                )}
              </span>
            </List.Item>
          )}
        />
      )}
    </div>
  )
}
