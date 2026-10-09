import React from 'react'
import { Typography } from 'antd'
import CommitProtocolSimulator from '../components/CommitProtocolSimulator'
import * as threePhaseEngine from '../utils/threePhaseCommitSimulator'
import engineSource from '../utils/threePhaseCommitSimulator.js?raw'

const { Text } = Typography
const { PHASES, DECISIONS } = threePhaseEngine

// Tudo que difere do 2PC (textos pt/en, labels de falha, presets e maquina de
// fases) continua nesta pagina; o shell da UI e o harness do motor sao
// compartilhados. Os dicionarios precisam manter o formato
// `const translations = { pt: { title, intro, ... } }` porque o
// scripts/generate_manifest.py extrai título e descrição daqui.
const translations = {
  pt: {
    title: 'Simulador de Three-Phase Commit',
    intro:
      'Experimente o protocolo Three-Phase Commit (3PC) 100% no navegador. Acompanhe as fases canCommit, preCommit e doCommit entre um coordenador e varios participantes, e veja como a fase extra evita o bloqueio do 2PC quando o coordenador cai depois de uma decisao de commit.',
    crashCanCommitLabel: 'Cai no canCommit',
    crashPreCommitLabel: 'Cai no preCommit',
    crashDoCommitLabel: 'Cai no doCommit',
    coordinatorCrashBeforePreCommit: 'Antes do preCommit',
    coordinatorCrashAfterPreCommit: 'Depois do preCommit',
    coordinatorCrashAfterDoCommit: 'Depois do doCommit',
    explanation: (
      <>
        O <Text code>Three-Phase Commit</Text> estende o 2PC com uma fase intermediaria para evitar bloqueios.
        Na <Text code>fase 1</Text> o coordenador envia <Text code>CAN_COMMIT</Text> e os participantes respondem{' '}
        <Text code>YES</Text> ou <Text code>NO</Text>. Na <Text code>fase 2</Text>, se todos votarem YES, o
        coordenador envia <Text code>PRE_COMMIT</Text> e os participantes entram no estado{' '}
        <Text code>PRE_COMMITTED</Text>. Na <Text code>fase 3</Text> o coordenador envia{' '}
        <Text code>DO_COMMIT</Text> e a transacao e efetivada. Se o coordenador cair depois do{' '}
        <Text code>PRE_COMMIT</Text>, os participantes podem completar o commit por timeout sozinhos; se cair
        antes, abortam.
      </>
    ),
  },
  en: {
    title: 'Three-Phase Commit Simulator',
    intro:
      'Experiment with the Three-Phase Commit (3PC) protocol 100% in the browser. Follow the canCommit, preCommit and doCommit phases between a coordinator and several participants, and see how the extra phase avoids the blocking problem of 2PC when the coordinator crashes after a commit decision.',
    crashCanCommitLabel: 'Crash on canCommit',
    crashPreCommitLabel: 'Crash on preCommit',
    crashDoCommitLabel: 'Crash on doCommit',
    coordinatorCrashBeforePreCommit: 'Before preCommit',
    coordinatorCrashAfterPreCommit: 'After preCommit',
    coordinatorCrashAfterDoCommit: 'After doCommit',
    explanation: (
      <>
        The <Text code>Three-Phase Commit</Text> protocol extends 2PC with an intermediate phase to avoid
        blocking. In <Text code>phase 1</Text> the coordinator sends <Text code>CAN_COMMIT</Text> and
        participants reply <Text code>YES</Text> or <Text code>NO</Text>. In{' '}
        <Text code>phase 2</Text>, if everyone voted YES, the coordinator sends{' '}
        <Text code>PRE_COMMIT</Text> and participants enter the <Text code>PRE_COMMITTED</Text> state. In{' '}
        <Text code>phase 3</Text> the coordinator sends <Text code>DO_COMMIT</Text> and the transaction is
        finalized. If the coordinator crashes after <Text code>PRE_COMMIT</Text>, participants can complete
        the commit by timeout on their own; if it crashes before, they abort.
      </>
    ),
  },
}

const crashFields = [
  { key: 'crashCanCommit', labelKey: 'crashCanCommitLabel' },
  { key: 'crashPreCommit', labelKey: 'crashPreCommitLabel' },
  { key: 'crashDoCommit', labelKey: 'crashDoCommitLabel' },
]

const coordinatorCrashOptions = [
  { value: 'before-precommit', labelKey: 'coordinatorCrashBeforePreCommit' },
  { value: 'after-precommit', labelKey: 'coordinatorCrashAfterPreCommit' },
  { value: 'after-docommit', labelKey: 'coordinatorCrashAfterDoCommit' },
]

const rowLayout = { label: 4, vote: 5, switch: 5, switchXs: 8, switchLabelFontSize: 11, switchLabelMarginLeft: 4 }

const phaseLabels = {
  pt: {
    [PHASES.IDLE]: 'Ocioso',
    [PHASES.CAN_COMMIT_SENT]: 'CAN_COMMIT enviado',
    [PHASES.VOTES_RECEIVED]: 'Votos recebidos',
    [PHASES.PRE_COMMIT_SENT]: 'PRE_COMMIT enviado',
    [PHASES.PRE_COMMIT_ACKED]: 'ACKs do PRE_COMMIT',
    [PHASES.DO_COMMIT_SENT]: 'DO_COMMIT enviado',
    [PHASES.DONE]: 'Finalizado',
  },
  en: {
    [PHASES.IDLE]: 'Idle',
    [PHASES.CAN_COMMIT_SENT]: 'CAN_COMMIT sent',
    [PHASES.VOTES_RECEIVED]: 'Votes received',
    [PHASES.PRE_COMMIT_SENT]: 'PRE_COMMIT sent',
    [PHASES.PRE_COMMIT_ACKED]: 'PRE_COMMIT ACKs',
    [PHASES.DO_COMMIT_SENT]: 'DO_COMMIT sent',
    [PHASES.DONE]: 'Done',
  },
}

const engine = { ...threePhaseEngine, sourceCode: () => engineSource }

function renderNodeAck(node) {
  return `ACK: preCommit=${node.ackedPreCommit ? 'yes' : 'no'} / doCommit=${node.ackedDoCommit ? 'yes' : 'no'}`
}

function finishedDescription(sim) {
  if (sim.coordinator.decision !== DECISIONS.COMMIT) {
    return 'A transacao foi abortada.'
  }
  if (sim.recoveryCommit) {
    return 'A transacao foi commitada mesmo com a queda do coordenador (timeout do 3PC).'
  }
  return 'Toda a transacao foi commitada.'
}

export default function ThreePhaseCommitSimulatorPage() {
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
