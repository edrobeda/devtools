import React from 'react'
import { Typography, Tag, Badge, Switch, Space } from 'antd'
import {
  SyncOutlined,
  CloseCircleOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons'
import LeaderElectionSimulator from '../components/LeaderElectionSimulator'
import * as ringEngine from '../utils/ringElectionSimulator'

const { Text } = Typography
const { STATES, MESSAGE_TYPES, nextActiveNode } = ringEngine

// Tudo que difere do Bully (textos pt/en, presets e a maquina do Chang-Roberts)
// continua nesta pagina; o shell da UI e o harness do motor sao compartilhados.
// Os dicionarios precisam manter o formato
// `const translations = { pt: { title, intro, ... } }` porque o
// scripts/generate_manifest.py extrai titulo e descricao daqui.
const translations = {
  pt: {
    title: 'Simulador de Eleição em Anel',
    intro:
      'Visualize passo a passo o algoritmo de Chang-Roberts para eleição de líder em sistemas distribuídos 100% no navegador. Os nós formam um anel lógico; a mensagem de eleição circula até o maior ID ativo se reconhecer como líder.',
    howItWorksText:
      'No algoritmo de eleição em anel (Chang-Roberts), cada processo conhece apenas seu vizinho seguinte no anel. Quando uma eleição começa, um nó envia uma mensagem ELECTION com seu próprio ID. Ao receber uma mensagem, o nó compara o ID recebido com o seu: se for maior, repassa adiante; se for menor, descarta e envia seu próprio ID; se for igual a si mesmo, deu a volta completa e ele é o líder. O líder então envia uma mensagem COORDINATOR pelo anel para que todos saibam quem venceu. No pior caso a mensagem pode dar até N voltas, resultando em O(N²) mensagens trocadas.',
    presetElection: 'Eleição simples',
    presetLeaderFailure: 'Falha do líder',
    presetHighestRecovers: 'Maior ID falha e recupera',
    presetMidFailure: 'Falha no meio do anel',
    presetTwoNodes: 'Anel com 2 nós',
    nextLabel: 'Próximo ativo',
    messageTypes: {
      ELECTION: 'ELECTION',
      COORDINATOR: 'COORDINATOR',
    },
    states: {
      NORMAL: 'Normal',
      ELECTION: 'Em eleição',
      LEADER: 'Líder',
      FAILED: 'Falho',
    },
  },
  en: {
    title: 'Ring Election Simulator',
    intro:
      'Step through the Chang-Roberts leader-election algorithm for distributed systems 100% in the browser. Nodes form a logical ring; the election message circulates until the highest active ID recognizes itself as leader.',
    howItWorksText:
      'In the ring election algorithm (Chang-Roberts), each process knows only its next neighbor in the ring. When an election starts, a node sends an ELECTION message containing its own ID. Upon receiving a message, the node compares the received ID with its own: if higher, it forwards it; if lower, it discards the message and sends its own ID; if equal to itself, the message has made a full round and this node is the leader. The leader then sends a COORDINATOR message around the ring so everyone knows the winner. In the worst case the message may travel up to N rounds, resulting in O(N²) messages exchanged.',
    presetElection: 'Simple election',
    presetLeaderFailure: 'Leader failure',
    presetHighestRecovers: 'Highest ID fails and recovers',
    presetMidFailure: 'Mid-ring failure',
    presetTwoNodes: 'Two-node ring',
    nextLabel: 'Next active',
    messageTypes: {
      ELECTION: 'ELECTION',
      COORDINATOR: 'COORDINATOR',
    },
    states: {
      NORMAL: 'Normal',
      ELECTION: 'In election',
      LEADER: 'Leader',
      FAILED: 'Failed',
    },
  },
}

const icon = <SyncOutlined style={{ marginRight: 8 }} />

const stateColors = {
  [STATES.NORMAL]: 'default',
  [STATES.ELECTION]: 'processing',
  [STATES.LEADER]: 'success',
  [STATES.FAILED]: 'error',
}

const presets = [
  { key: 'election', labelKey: 'presetElection' },
  { key: 'leader-failure', labelKey: 'presetLeaderFailure' },
  { key: 'highest-recovers', labelKey: 'presetHighestRecovers' },
  { key: 'mid-failure', labelKey: 'presetMidFailure' },
  { key: 'two-nodes', labelKey: 'presetTwoNodes' },
]

function nodePositions(count, radius, centerX, centerY) {
  return Array.from({ length: count }, (_, i) => {
    const angle = (2 * Math.PI * i) / count - Math.PI / 2
    return {
      id: i,
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    }
  })
}

// O anel desenha um SVG alem dos cards — por isso a visualizacao vem por
// render prop, definida uma vez no modulo.
function renderVisualization({ state, t, handleToggleFailure, pending }) {
  const positions = nodePositions(state.nodes.length, 130, 200, 160)

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <svg width={400} height={320} viewBox="0 0 400 320" role="img" aria-label="ring">
          {/* anel */}
          <circle
            cx={200}
            cy={160}
            r={130}
            fill="none"
            stroke="#d9d9d9"
            strokeWidth={2}
            strokeDasharray="8 6"
          />

          {/* mensagens pendentes como setas ao longo do anel */}
          {pending.map((m) => {
            const fromPos = positions[m.from]
            const toPos = positions[m.to]
            if (!fromPos || !toPos) return null
            const mx = (fromPos.x + toPos.x) / 2
            const my = (fromPos.y + toPos.y) / 2
            return (
              <g key={m.id}>
                <defs>
                  <marker id={`arrow-${m.id}`} markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto" markerUnits="strokeWidth">
                    <path d="M0,0 L0,6 L9,3 z" fill={m.type === MESSAGE_TYPES.ELECTION ? '#1677ff' : '#52c41a'} />
                  </marker>
                </defs>
                <line
                  x1={fromPos.x}
                  y1={fromPos.y}
                  x2={toPos.x}
                  y2={toPos.y}
                  stroke={m.type === MESSAGE_TYPES.ELECTION ? '#1677ff' : '#52c41a'}
                  strokeWidth={2}
                  markerEnd={`url(#arrow-${m.id})`}
                />
                <g transform={`translate(${mx} ${my})`}>
                  <rect
                    x={-42}
                    y={-12}
                    width={84}
                    height={20}
                    rx={4}
                    fill="rgba(255,255,255,0.9)"
                    stroke={m.type === MESSAGE_TYPES.ELECTION ? '#1677ff' : '#52c41a'}
                    strokeWidth={1}
                  />
                  <text
                    x={0}
                    y={3}
                    textAnchor="middle"
                    fontSize={10}
                    fill={m.type === MESSAGE_TYPES.ELECTION ? '#1677ff' : '#52c41a'}
                    fontWeight={600}
                  >
                    {m.type}({m.candidateId})
                  </text>
                </g>
              </g>
            )
          })}

          {/* nós */}
          {state.nodes.map((node) => {
            const pos = positions[node.id]
            return (
              <g key={node.id} transform={`translate(${pos.x} ${pos.y})`}>
                <circle
                  r={28}
                  fill={node.failed ? '#f5f5f5' : node.state === STATES.LEADER ? '#f6ffed' : '#ffffff'}
                  stroke={node.failed ? '#d9d9d9' : node.color}
                  strokeWidth={node.state === STATES.LEADER ? 4 : 2}
                  opacity={node.failed ? 0.7 : 1}
                />
                <text y={-4} textAnchor="middle" fontSize={12} fontWeight={700} fill={node.failed ? '#8c8c8c' : '#262626'}>
                  N{node.id}
                </text>
                <text y={10} textAnchor="middle" fontSize={9} fill="#595959">
                  ID {node.priority}
                </text>
                {node.state === STATES.LEADER && (
                  <text y={-34} textAnchor="middle" fontSize={10} fill="#52c41a" fontWeight={700}>
                    ★
                  </text>
                )}
              </g>
            )
          })}
        </svg>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        {state.nodes.map((node) => {
          const nextId = nextActiveNode(state, node.id)
          return (
            <div
              key={node.id}
              style={{
                width: 120,
                border: `2px solid ${node.failed ? '#d9d9d9' : node.color}`,
                borderRadius: 10,
                padding: 10,
                background: node.failed ? '#f5f5f5' : '#ffffff',
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
              <div style={{ fontSize: 11, marginTop: 4, color: '#595959' }}>
                {node.leaderId !== null && !node.failed ? (
                  <span>
                    {t.leaderLabel}: N{node.leaderId}
                  </span>
                ) : (
                  '—'
                )}
              </div>
              <div style={{ fontSize: 11, color: '#8c8c8c' }}>
                {t.nextLabel}: {nextId !== null ? `N${nextId}` : '—'}
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
          )
        })}
      </div>
    </Space>
  )
}

function renderPendingMessage(m, t) {
  return (
    <>
      <Tag color={m.type === MESSAGE_TYPES.ELECTION ? 'blue' : 'green'}>
        {t.messageTypes[m.type] || m.type}({m.candidateId})
      </Tag>
      <Text style={{ fontSize: 12 }}>
        N{m.from} → N{m.to}
      </Text>
    </>
  )
}

export default function RingElectionSimulatorPage() {
  return (
    <LeaderElectionSimulator
      engine={ringEngine}
      translations={translations}
      presets={presets}
      icon={icon}
      renderVisualization={renderVisualization}
      renderPendingMessage={renderPendingMessage}
    />
  )
}
