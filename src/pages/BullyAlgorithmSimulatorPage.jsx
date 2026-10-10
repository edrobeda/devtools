import React from 'react'
import { Typography, Tag, Badge, Switch, Space } from 'antd'
import {
  TrophyOutlined,
  CloseCircleOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons'
import LeaderElectionSimulator from '../components/LeaderElectionSimulator'
import * as bullyEngine from '../utils/bullyAlgorithmSimulator'

const { Text } = Typography
const { STATES } = bullyEngine

// Tudo que difere do anel (textos pt/en, presets e a maquina do Bully) continua
// nesta pagina; o shell da UI e o harness do motor sao compartilhados. Os
// dicionarios precisam manter o formato
// `const translations = { pt: { title, intro, ... } }` porque o
// scripts/generate_manifest.py extrai titulo e descricao daqui.
const translations = {
  pt: {
    title: 'Simulador do Algoritmo do Bully',
    intro:
      'Visualize passo a passo o clássico algoritmo de eleição de líder em sistemas distribuídos 100% no navegador. O nó com o maior ID entre os ativos sempre vence; falhe e recupere nós para ver novas eleições.',
    howItWorksText:
      'No Algoritmo do Bully, cada processo tem um ID único e o processo ativo de maior ID é eleito coordenador. Quando um processo detecta que o líder sumiu, ele envia uma mensagem ELECTION para todos os processos de ID maior. Se algum responder ALIVE, o solicitante desiste. Se ninguém responder, ele se autodeclara líder e anuncia COORDINATOR aos demais. Se um processo de ID maior recuperar, ele inicia nova eleição e toma a liderança.',
    presetElection: 'Eleição simples',
    presetLeaderFailure: 'Falha do líder',
    presetHighestRecovers: 'Maior ID recupera',
    presetPartition: 'Falha múltipla',
    presetTieBreak: 'Empate 2 nós',
    messageTypes: {
      ELECTION: 'ELECTION',
      ALIVE: 'ALIVE',
      COORDINATOR: 'COORDINATOR',
    },
    states: {
      NORMAL: 'Normal',
      ELECTION: 'Em eleição',
      WAITING: 'Aguardando',
      LEADER: 'Líder',
      FAILED: 'Falho',
    },
  },
  en: {
    title: 'Bully Algorithm Simulator',
    intro:
      'Step through the classic leader-election algorithm for distributed systems 100% in the browser. The active node with the highest ID always wins; fail and recover nodes to watch new elections.',
    howItWorksText:
      "In the Bully Algorithm, every process has a unique ID and the highest active ID is elected coordinator. When a process detects the leader is gone, it sends an ELECTION message to every higher-ID process. If any replies ALIVE, the requester gives up. If no one replies, it declares itself leader and broadcasts COORDINATOR to everyone else. If a higher-ID process recovers, it starts a new election and takes over.",
    presetElection: 'Simple election',
    presetLeaderFailure: 'Leader failure',
    presetHighestRecovers: 'Highest ID recovers',
    presetPartition: 'Multiple failures',
    presetTieBreak: 'Two-node tie',
    messageTypes: {
      ELECTION: 'ELECTION',
      ALIVE: 'ALIVE',
      COORDINATOR: 'COORDINATOR',
    },
    states: {
      NORMAL: 'Normal',
      ELECTION: 'In election',
      WAITING: 'Waiting',
      LEADER: 'Leader',
      FAILED: 'Failed',
    },
  },
}

const icon = <TrophyOutlined style={{ marginRight: 8 }} />

const stateColors = {
  [STATES.NORMAL]: 'default',
  [STATES.ELECTION]: 'processing',
  [STATES.WAITING]: 'warning',
  [STATES.LEADER]: 'success',
  [STATES.FAILED]: 'error',
}

const presets = [
  { key: 'election', labelKey: 'presetElection' },
  { key: 'leader-failure', labelKey: 'presetLeaderFailure' },
  { key: 'highest-recovers', labelKey: 'presetHighestRecovers' },
  { key: 'partition', labelKey: 'presetPartition' },
  { key: 'tie-break', labelKey: 'presetTieBreak' },
]

// O Bully renderiza os nos em linha (cards), enquanto o anel desenha um SVG —
// por isso a visualizacao vem por render prop, definida uma vez no modulo.
function renderVisualization({ state, t, handleToggleFailure }) {
  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 12,
          flexWrap: 'wrap',
          padding: '12px 0',
        }}
      >
        {state.nodes.map((node) => (
          <div
            key={node.id}
            style={{
              width: 130,
              border: `2px solid ${node.failed ? '#d9d9d9' : node.color}`,
              borderRadius: 10,
              padding: 10,
              background: node.failed ? '#f5f5f5' : '#f6ffed',
              opacity: node.failed ? 0.6 : 1,
              textAlign: 'center',
              transition: 'all 0.2s',
            }}
          >
            <div style={{ fontWeight: 700, fontSize: 16 }}>N{node.id}</div>
            <div style={{ fontSize: 12, color: '#595959' }}>
              {t.priorityLabel}: {node.priority}
            </div>
            <div style={{ marginTop: 4 }}>
              <Badge
                status={stateColors[node.state]}
                text={
                  <Text strong style={{ fontSize: 12 }}>
                    {t.states[node.state]}
                  </Text>
                }
              />
            </div>
            <div style={{ fontSize: 12, marginTop: 4, color: '#595959' }}>
              {node.state === STATES.LEADER ? (
                <span>
                  <CheckCircleOutlined style={{ color: '#52c41a' }} /> {t.leaderLabel}
                </span>
              ) : node.leaderId !== null && !node.failed ? (
                <span>
                  {t.leaderLabel}: N{node.leaderId}
                </span>
              ) : (
                '—'
              )}
            </div>
            <div style={{ marginTop: 6 }}>
              <Switch
                size="small"
                checked={node.failed}
                onChange={() => handleToggleFailure(node.id)}
                checkedChildren={<CloseCircleOutlined />}
                unCheckedChildren={<CheckCircleOutlined />}
              />
              <Text style={{ marginLeft: 6, fontSize: 11 }}>
                {node.failed ? t.recoverSwitch : t.failSwitch}
              </Text>
            </div>
          </div>
        ))}
      </div>
    </Space>
  )
}

function renderPendingMessage(m, t) {
  return (
    <>
      <Tag color="blue">{t.messageTypes[m.type] || m.type}</Tag>
      <Text style={{ fontSize: 12 }}>
        N{m.from} → N{m.to}
      </Text>
    </>
  )
}

export default function BullyAlgorithmSimulatorPage() {
  return (
    <LeaderElectionSimulator
      engine={bullyEngine}
      translations={translations}
      presets={presets}
      icon={icon}
      renderVisualization={renderVisualization}
      renderPendingMessage={renderPendingMessage}
    />
  )
}
