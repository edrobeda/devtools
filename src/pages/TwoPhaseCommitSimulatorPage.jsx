import React from 'react'
import { Typography } from 'antd'
import CommitProtocolSimulator from '../components/CommitProtocolSimulator'
import * as twoPhaseEngine from '../utils/twoPhaseCommitSimulator'
import engineSource from '../utils/twoPhaseCommitSimulator.js?raw'

const { Text } = Typography
const { PHASES, DECISIONS } = twoPhaseEngine

// Tudo que difere do 3PC (textos pt/en, labels de falha, presets e maquina de
// fases) continua nesta pagina; o shell da UI e o harness do motor sao
// compartilhados. Os dicionarios precisam manter o formato
// `const translations = { pt: { title, intro, ... } }` porque o
// scripts/generate_manifest.py extrai título e descrição daqui.
const translations = {
  pt: {
    title: 'Simulador de Two-Phase Commit',
    intro:
      'Experimente o protocolo Two-Phase Commit (2PC) 100% no navegador. Acompanhe as fases de preparacao e decisao entre um coordenador e varios participantes, veja como votos, falhas e recuperacao determinam se uma transacao distribuida faz COMMIT ou ABORT.',
    crashPrepareLabel: 'Cai no prepare',
    crashDecisionLabel: 'Cai no decision',
    coordinatorCrashBefore: 'Antes da decisao',
    coordinatorCrashAfter: 'Depois da decisao',
    explanation: (
      <>
        O <Text code>Two-Phase Commit</Text> garante atomicidade em transacoes distribuidas.
        Na <Text code>fase 1</Text> o coordenador envia <Text code>PREPARE</Text> e cada participante
        vota <Text code>YES</Text> ou <Text code>NO</Text>. Na <Text code>fase 2</Text>, se todos
        votaram YES, o coordenador envia <Text code>COMMIT</Text>; caso contrario envia{' '}
        <Text code>ABORT</Text>. Os participantes aplicam e respondem <Text code>ACK</Text>.
        Falhas antes da decisao podem bloquear nos ate a recuperacao do coordenador.
      </>
    ),
  },
  en: {
    title: 'Two-Phase Commit Simulator',
    intro:
      'Experiment with the Two-Phase Commit (2PC) protocol 100% in the browser. Follow the prepare and decision phases between a coordinator and multiple participants, and see how votes, crashes, and recovery determine whether a distributed transaction commits or aborts.',
    crashPrepareLabel: 'Crash on prepare',
    crashDecisionLabel: 'Crash on decision',
    coordinatorCrashBefore: 'Before decision',
    coordinatorCrashAfter: 'After decision',
    explanation: (
      <>
        The <Text code>Two-Phase Commit</Text> protocol ensures atomicity in distributed transactions.
        In <Text code>phase 1</Text> the coordinator sends <Text code>PREPARE</Text> and each participant
        votes <Text code>YES</Text> or <Text code>NO</Text>. In <Text code>phase 2</Text>, if everyone
        voted YES, the coordinator sends <Text code>COMMIT</Text>; otherwise it sends{' '}
        <Text code>ABORT</Text>. Participants apply the decision and reply with <Text code>ACK</Text>.
        Failures before the decision can block nodes until the coordinator recovers.
      </>
    ),
  },
}

const crashFields = [
  { key: 'crashPrepare', labelKey: 'crashPrepareLabel' },
  { key: 'crashDecision', labelKey: 'crashDecisionLabel' },
]

const coordinatorCrashOptions = [
  { value: 'before-decision', labelKey: 'coordinatorCrashBefore' },
  { value: 'after-decision', labelKey: 'coordinatorCrashAfter' },
]

const rowLayout = { label: 6, vote: 6, switch: 6, switchXs: 12, switchLabelFontSize: 12, switchLabelMarginLeft: 8 }

const phaseLabels = {
  pt: {
    [PHASES.IDLE]: 'Ocioso',
    [PHASES.PREPARE_SENT]: 'PREPARE enviado',
    [PHASES.VOTES_RECEIVED]: 'Votos recebidos',
    [PHASES.DECISION_MADE]: 'Decisao tomada',
    [PHASES.DECISION_DELIVERED]: 'Decisao entregue',
    [PHASES.DONE]: 'Finalizado',
  },
  en: {
    [PHASES.IDLE]: 'Idle',
    [PHASES.PREPARE_SENT]: 'PREPARE sent',
    [PHASES.VOTES_RECEIVED]: 'Votes received',
    [PHASES.DECISION_MADE]: 'Decision made',
    [PHASES.DECISION_DELIVERED]: 'Decision delivered',
    [PHASES.DONE]: 'Done',
  },
}

const engine = { ...twoPhaseEngine, sourceCode: () => engineSource }

function renderNodeAck(node) {
  return `ACK: ${node.acked ? 'yes' : 'no'}`
}

function finishedDescription(sim) {
  return sim.coordinator.decision === DECISIONS.COMMIT
    ? 'Toda a transacao foi commitada.'
    : 'A transacao foi abortada.'
}

export default function TwoPhaseCommitSimulatorPage() {
  return (
    <CommitProtocolSimulator
      engine={engine}
      translations={translations}
      crashFields={crashFields}
      coordinatorCrashOptions={coordinatorCrashOptions}
      rowLayout={rowLayout}
      phaseLabels={phaseLabels}
      renderNodeAck={renderNodeAck}
      finishedDescription={finishedDescription}
      sourceCode={engine.sourceCode}
    />
  )
}
