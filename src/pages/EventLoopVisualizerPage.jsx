import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  Typography,
  Card,
  Space,
  Button,
  Input,
  Select,
  Tag,
  Alert,
  Statistic,
  Row,
  Col,
  Table,
  Tooltip,
  Empty,
  Collapse,
} from 'antd'
import {
  PlayCircleOutlined,
  ReloadOutlined,
  WarningOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

// ───────────────────────── sandbox ─────────────────────────

const MAX_ENTRIES = 240
const MAX_TICKS_PER_TIMER = 6
const QUIET_MS = 300
const MAX_RUN_MS = 3000
const LONG_TASK_MS = 50
const BLOCKING_MS = 200

// Trecho injetado antes do código do usuário. Não interpola nada — é uma
// string estática, então o código colado nunca é interpretado como template.
const PREAMBLE = `// instrumentado pelo visualizador: cada callback vira uma "tarefa" medida
const { note, setTimeout, setInterval, clearTimeout, clearInterval,
        requestAnimationFrame, cancelAnimationFrame,
        requestIdleCallback, cancelIdleCallback, console } = __api;`

// Profundidade do call stack *dentro* do código colado. Todo frame do
// sandbox vem de um new Function, então aparece no stack como "eval at ...";
// um deles é a raiz do código do usuário — o resto é aninhamento real.
// Navegadores com outro formato de stack simplesmente mostram 0.
function depthOf() {
  const stack = new Error().stack
  if (!stack) return 0
  let n = 0
  for (const line of stack.split('\n')) {
    if (line.indexOf('eval at') !== -1) n += 1
  }
  return Math.max(0, n - 1)
}

function stringifyArg(value) {
  if (typeof value === 'string') return value
  if (value === null || value === undefined) return String(value)
  if (typeof value === 'function') return '[function ' + (value.name || 'anon') + ']'
  if (typeof value === 'symbol' || typeof value === 'bigint') return String(value)
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  try {
    const json = JSON.stringify(value)
    return json === undefined ? String(value) : json
  } catch {
    return String(value)
  }
}

function runSandbox(code, onFinish) {
  const nativeSetTimeout = window.setTimeout.bind(window)
  const nativeClearTimeout = window.clearTimeout.bind(window)
  const nativeSetInterval = window.setInterval.bind(window)
  const nativeClearInterval = window.clearInterval.bind(window)
  const nativeRaf = typeof window.requestAnimationFrame === 'function' ? window.requestAnimationFrame.bind(window) : null
  const nativeCancelRaf = typeof window.cancelAnimationFrame === 'function' ? window.cancelAnimationFrame.bind(window) : null
  const nativeIdle = typeof window.requestIdleCallback === 'function' ? window.requestIdleCallback.bind(window) : null
  const nativeCancelIdle = typeof window.cancelIdleCallback === 'function' ? window.cancelIdleCallback.bind(window) : null

  const entries = []
  const tasks = []
  const ticks = new Map()
  const timeoutIds = new Set()
  const intervalIds = new Set()
  const frameIds = new Set()
  const idleIds = new Set()

  const t0 = performance.now()
  let lastEvent = t0
  let scriptFinished = false
  let currentTask = null
  let finished = false
  let nextTaskId = 1
  let truncated = false
  let pollId = null

  function record(label) {
    const now = performance.now()
    lastEvent = now
    if (entries.length >= MAX_ENTRIES) {
      truncated = true
      return
    }
    entries.push({
      seq: entries.length + 1,
      label,
      kind: currentTask ? currentTask.kind : scriptFinished ? 'microtask' : 'script',
      taskId: currentTask ? currentTask.id : -1,
      depth: depthOf(),
      t: now - t0,
    })
  }

  function wrapTask(fn, opts) {
    if (typeof fn !== 'function') return fn
    const { kind, label, ticksKey = null, stopFn = null, onDone = null } = opts
    return function (...args) {
      if (finished) return undefined
      if (ticksKey) {
        const n = (ticks.get(ticksKey) || 0) + 1
        ticks.set(ticksKey, n)
        if (n > MAX_TICKS_PER_TIMER) {
          if (stopFn) stopFn()
          if (onDone) onDone()
          return undefined
        }
      }
      const start = performance.now()
      const task = {
        id: nextTaskId,
        kind,
        label,
        start: start - t0,
        end: null,
        duration: null,
      }
      nextTaskId += 1
      tasks.push(task)
      currentTask = task
      try {
        return fn.apply(this, args)
      } catch (err) {
        // erro dentro do callback vira uma entrada do log em vez de sumir
        // num uncaught error do console — é o que interessa no visualizador
        record('[erro no callback] ' + (err instanceof Error ? err.message : String(err)))
        return undefined
      } finally {
        const end = performance.now()
        task.end = end - t0
        task.duration = end - start
        currentTask = null
        lastEvent = end
        if (onDone) onDone()
      }
    }
  }

  function sandboxSetTimeout(fn, delay = 0, ...args) {
    const ms = Math.max(0, Number(delay) || 0)
    const box = { id: null }
    const wrapped = wrapTask(fn, {
      kind: 'timeout',
      label: 'setTimeout(' + ms + 'ms)',
      onDone: () => {
        if (box.id !== null) timeoutIds.delete(box.id)
      },
    })
    box.id = nativeSetTimeout(wrapped, ms, ...args)
    timeoutIds.add(box.id)
    return box.id
  }

  function sandboxSetInterval(fn, delay = 0, ...args) {
    const ms = Math.max(0, Number(delay) || 0)
    const box = { id: null }
    const wrapped = wrapTask(fn, {
      kind: 'interval',
      label: 'setInterval(' + ms + 'ms)',
      ticksKey: 'interval-' + Math.random().toString(36).slice(2),
      stopFn: () => {
        if (box.id !== null) {
          nativeClearInterval(box.id)
          intervalIds.delete(box.id)
        }
      },
    })
    box.id = nativeSetInterval(wrapped, ms, ...args)
    intervalIds.add(box.id)
    return box.id
  }

  function sandboxClearTimeout(id) {
    timeoutIds.delete(id)
    nativeClearTimeout(id)
  }

  function sandboxClearInterval(id) {
    intervalIds.delete(id)
    nativeClearInterval(id)
  }

  function sandboxRaf(cb) {
    if (!nativeRaf) return sandboxSetTimeout(cb, 16)
    const box = { id: null }
    const wrapped = wrapTask(cb, {
      kind: 'frame',
      label: 'requestAnimationFrame',
      onDone: () => {
        if (box.id !== null) frameIds.delete(box.id)
      },
    })
    box.id = nativeRaf(wrapped)
    frameIds.add(box.id)
    return box.id
  }

  function sandboxCancelRaf(id) {
    frameIds.delete(id)
    if (nativeCancelRaf) nativeCancelRaf(id)
  }

  function sandboxIdle(cb) {
    const box = { id: null }
    const wrapped = wrapTask(cb, {
      kind: 'idle',
      label: 'requestIdleCallback',
      onDone: () => {
        if (box.id !== null) idleIds.delete(box.id)
      },
    })
    if (nativeIdle) {
      box.id = nativeIdle((deadline) => wrapped(deadline))
      idleIds.add(box.id)
      return box.id
    }
    // shim: navegadores sem requestIdleCallback recebem um setTimeout(1ms)
    return sandboxSetTimeout(() => wrapped({ didTimeout: false, timeRemaining: () => 0 }), 1)
  }

  function sandboxCancelIdle(id) {
    idleIds.delete(id)
    if (nativeCancelIdle) nativeCancelIdle(id)
  }

  const api = {
    note: (...args) => record(args.map(stringifyArg).join(' ')),
    console: {
      log: (...args) => record(args.map(stringifyArg).join(' ')),
      info: (...args) => record(args.map(stringifyArg).join(' ')),
      warn: (...args) => record(args.map(stringifyArg).join(' ')),
      error: (...args) => record(args.map(stringifyArg).join(' ')),
      debug: (...args) => record(args.map(stringifyArg).join(' ')),
    },
    setTimeout: sandboxSetTimeout,
    setInterval: sandboxSetInterval,
    clearTimeout: sandboxClearTimeout,
    clearInterval: sandboxClearInterval,
    requestAnimationFrame: sandboxRaf,
    cancelAnimationFrame: sandboxCancelRaf,
    requestIdleCallback: sandboxIdle,
    cancelIdleCallback: sandboxCancelIdle,
  }

  function clearAll() {
    timeoutIds.forEach((id) => nativeClearTimeout(id))
    intervalIds.forEach((id) => nativeClearInterval(id))
    frameIds.forEach((id) => nativeCancelRaf && nativeCancelRaf(id))
    idleIds.forEach((id) => nativeCancelIdle && nativeCancelIdle(id))
    timeoutIds.clear()
    intervalIds.clear()
    frameIds.clear()
    idleIds.clear()
    if (pollId !== null) {
      nativeClearTimeout(pollId)
      pollId = null
    }
  }

  function finish(reason) {
    if (finished) return
    finished = true
    clearAll()
    onFinish({ entries, tasks, total: performance.now() - t0, truncated, reason })
  }

  function cancel() {
    if (finished) return
    finished = true
    clearAll()
  }

  // Encerra quando a fila ficou parada (nada agendado e nada logado há
  // QUIET_MS) ou quando estourou o teto de MAX_RUN_MS.
  function poll() {
    if (finished) return
    const now = performance.now()
    const quiet = now - lastEvent > QUIET_MS
    if (quiet && timeoutIds.size === 0 && intervalIds.size === 0) {
      finish('idle')
      return
    }
    if (now - t0 > MAX_RUN_MS) {
      finish('limit')
      return
    }
    pollId = nativeSetTimeout(poll, 80)
  }

  let error = null
  try {
    const fn = new Function('__api', PREAMBLE + '\n' + code)
    fn(api)
  } catch (err) {
    error = err instanceof Error ? err.message : String(err)
    record('[erro] ' + error)
  }
  scriptFinished = true
  lastEvent = performance.now()
  if (error) {
    nativeSetTimeout(() => finish('error'), 0)
  } else {
    pollId = nativeSetTimeout(poll, QUIET_MS)
  }

  return cancel
}

// ───────────────────────── exemplos ─────────────────────────

const PRESETS = [
  {
    id: 'ordem-basica',
    label: { pt: '1. Ordem básica: script, microtask, macrotask', en: '1. Basic order: script, microtask, macrotask' },
    code: `note('1 — script: começa a rodar (call stack)')

Promise.resolve().then(() => {
  note('2 — .then: microtask')
})

queueMicrotask(() => {
  note('3 — queueMicrotask: microtask (mesma fila do .then)')
})

setTimeout(() => {
  note('5 — setTimeout: macrotask')
}, 0)

note('4 — script: terminou, mas o loop ainda tem trabalho na fila')`,
  },
  {
    id: 'async-await',
    label: { pt: '2. async/await x setTimeout', en: '2. async/await vs setTimeout' },
    code: `async function buscar(nome) {
  note('buscar: disparo de ' + nome)
  await new Promise((resolve) => setTimeout(resolve, 10))
  note('buscar: resposta de ' + nome)
  return nome.toUpperCase()
}

async function main() {
  note('main: antes do primeiro await')
  const a = buscar('alfa')
  const b = buscar('bravo')
  note('main: as duas promessas já foram disparadas')
  await a
  note('main: alfa resolvido')
  await b
  note('main: bravo resolvido')
}

main()
note('script terminou')`,
  },
  {
    id: 'starvation',
    label: { pt: '3. Microtasks adiam macrotasks (starvation)', en: '3. Microtasks starve macrotasks' },
    code: `let n = 0

function encher() {
  n += 1
  note('microtask ' + n + ' — a fila só esvazia quando ela acaba')
  if (n < 5) {
    queueMicrotask(encher)
    return
  }
  note('cadeia acabou: agora o macrotask pode rodar')
}

note('script: agendando o macrotask')
setTimeout(() => {
  note('macrotask: rodou depois de esperar 5 microtasks')
}, 0)

queueMicrotask(encher)
note('script: terminou')`,
  },
  {
    id: 'long-task',
    label: { pt: '4. Long task travando a interface', en: '4. Long task freezing the UI' },
    code: `note('script: agendando um macrotask pesado')

setTimeout(() => {
  note('entrou no trabalho síncrono — a interface travou aqui')
  const inicio = performance.now()
  let total = 0
  while (performance.now() - inicio < 150) {
    total += Math.sqrt(total + 1)
  }
  note('terminou o trabalho pesado')
}, 0)

note('script: terminou antes do macrotask começar')`,
  },
  {
    id: 'timers',
    label: { pt: '5. setTimeout x setInterval x rAF', en: '5. setTimeout vs setInterval vs rAF' },
    code: `let ticks = 0
const intervalo = setInterval(() => {
  ticks += 1
  note('setInterval: tick ' + ticks)
  if (ticks === 3) {
    clearInterval(intervalo)
    note('setInterval: limpo no tick 3')
  }
}, 0)

setTimeout(() => note('setTimeout(0): uma macrotask comum'), 0)

requestAnimationFrame(() => {
  note('requestAnimationFrame: roda antes da próxima pintura')
})

for (let i = 1; i <= 3; i += 1) {
  setTimeout(() => {
    note('setTimeout aninhado ' + i + ': o browser limita a ~4ms')
  }, 0)
}`,
  },
]

const LOOP_PATTERN = /while\s*\(\s*(true|1)\s*\)|for\s*\(\s*;\s*;/

// ───────────────────────── lanes ─────────────────────────

const KIND_META = {
  script: { color: '#1677ff', bg: '#e6f4ff', border: '#91caff' },
  microtask: { color: '#722ed1', bg: '#f9f0ff', border: '#d3adf7' },
  timeout: { color: '#d46b08', bg: '#fff7e6', border: '#ffd591' },
  interval: { color: '#c41d7f', bg: '#fff0f6', border: '#ff85c0' },
  frame: { color: '#08979c', bg: '#e6fffb', border: '#87e8de' },
  idle: { color: '#595959', bg: '#fafafa', border: '#d9d9d9' },
}

const LANE_ORDER = ['script', 'microtask', 'timeout', 'interval', 'frame', 'idle']

const LANE_H = 34
const LANE_LABEL_W = 128
const DOT = 22
const MIN_GAP = 26

function Timeline({ entries, tasks, total, t }) {
  const layout = useMemo(() => {
    const lanes = {}
    for (const kind of LANE_ORDER) lanes[kind] = []
    const usable = Math.max(total, 0.001)
    const plotW = Math.max(560, Math.min(1000, Math.round(usable * 30)))
    const toX = (ms) => LANE_LABEL_W + (ms / usable) * plotW

    for (const entry of entries) {
      const lane = lanes[entry.kind]
      if (!lane) continue
      lane.push({ entry, x: toX(entry.t) })
    }

    let maxX = LANE_LABEL_W + plotW
    for (const kind of LANE_ORDER) {
      const lane = lanes[kind]
      lane.sort((a, b) => a.x - b.x)
      for (let i = 1; i < lane.length; i += 1) {
        if (lane[i].x - lane[i - 1].x < MIN_GAP) lane[i].x = lane[i - 1].x + MIN_GAP
      }
      if (lane.length) maxX = Math.max(maxX, lane[lane.length - 1].x)
    }

    const width = Math.round(maxX + 40)
    const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => ({
      left: LANE_LABEL_W + plotW * f,
      label: (usable * f).toFixed(usable < 10 ? 2 : 0),
    }))

    return { lanes, toX, width, ticks }
  }, [entries, total])

  const usedKinds = LANE_ORDER.filter((kind) => (layout.lanes[kind] || []).length > 0)

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
        {usedKinds.map((kind) => (
          <Tag key={kind} style={{ color: KIND_META[kind].color, background: KIND_META[kind].bg, borderColor: KIND_META[kind].border }}>
            {t[kind + 'Lane']}
          </Tag>
        ))}
        <Tag>{t.barsLegend}</Tag>
      </div>

      <div style={{ overflowX: 'auto', paddingBottom: 4 }}>
        <div style={{ width: layout.width, position: 'relative' }}>
          <div style={{ position: 'relative', height: 22, marginLeft: LANE_LABEL_W }}>
            {layout.ticks.map((tick) => (
              <div
                key={tick.left}
                style={{
                  position: 'absolute',
                  left: tick.left,
                  top: 0,
                  transform: 'translateX(-50%)',
                  fontSize: 11,
                  color: '#8c8c8c',
                  fontFamily: 'monospace',
                  whiteSpace: 'nowrap',
                }}
              >
                {tick.label}ms
              </div>
            ))}
          </div>

          {usedKinds.map((kind) => {
            const meta = KIND_META[kind]
            return (
              <div
                key={kind}
                style={{
                  position: 'relative',
                  height: LANE_H,
                  marginLeft: LANE_LABEL_W,
                  borderTop: '1px dashed #f0f0f0',
                }}
              >
                {tasks
                  .filter((task) => task.kind === kind)
                  .map((task) => {
                    const left = layout.toX(task.start)
                    const width = Math.max(6, layout.toX(task.end ?? task.start) - left)
                    const long = task.duration >= LONG_TASK_MS
                    return (
                      <Tooltip
                        key={task.id}
                        title={task.label + ' — ' + t.taskTip({ ms: task.duration ?? 0 })}
                      >
                        <div
                          style={{
                            position: 'absolute',
                            left,
                            width,
                            top: 11,
                            height: 11,
                            borderRadius: 6,
                            background: long ? '#ff4d4f' : meta.bg,
                            border: '1px solid ' + (long ? '#a8071a' : meta.border),
                            opacity: long ? 0.85 : 0.9,
                          }}
                        />
                      </Tooltip>
                    )
                  })}

                {layout.lanes[kind].map(({ entry, x }) => (
                  <Tooltip
                    key={entry.seq}
                    title={entry.label + ' — ' + t.atMs({ ms: entry.t })}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        left: x - DOT / 2,
                        top: (LANE_H - DOT) / 2,
                        width: DOT,
                        height: DOT,
                        borderRadius: '50%',
                        background: meta.color,
                        color: '#fff',
                        fontSize: 11,
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
                        cursor: 'default',
                      }}
                    >
                      {entry.seq}
                    </div>
                  </Tooltip>
                ))}
              </div>
            )
          })}

          {usedKinds.map((kind) => {
            const meta = KIND_META[kind]
            return (
              <div
                key={'label-' + kind}
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 22 + usedKinds.indexOf(kind) * LANE_H + 4,
                  width: LANE_LABEL_W - 8,
                  textAlign: 'right',
                  fontSize: 12,
                  color: meta.color,
                  fontWeight: 600,
                }}
              >
                {t[kind + 'Lane']}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ───────────────────────── traduções ─────────────────────────

const translations = {
  pt: {
    title: 'Visualizador do Event Loop',
    intro: (
      <>
        O JavaScript é <Text strong>single-threaded</Text>, mas não é monotarefa: quando o
        script principal termina, o navegador esvazia <Text strong>toda a fila de microtasks</Text>{' '}
        antes de pegar a próxima <Text strong>macrotask</Text>. É esse ciclo — call stack,
        fila de microtasks, fila de tarefas — que decide a ordem real das coisas no seu
        código. Cole um snippet abaixo: a página <Text strong>executa ele de verdade</Text>,
        instrumentando <Text code>setTimeout</Text>, <Text code>setInterval</Text>,{' '}
        <Text code>requestAnimationFrame</Text> e <Text code>console.log</Text>, e mostra a
        ordem das execuções numa linha do tempo com o tempo de cada callback.
      </>
    ),
    codeTitle: 'Código',
    run: 'Executar',
    rerun: 'Executar de novo',
    reset: 'Voltar ao exemplo',
    resetTitle: 'Roda o exemplo selecionado no seu navegador e registra a ordem',
    placeholder: 'Cole aqui um trecho de JavaScript. Use note(...) ou console.log(...) para marcar os pontos.',
    loopWarning:
      'Cuidado: um laço síncrono infinito (while (true)) trava a aba — o event loop nunca mais cede. Recarregue a página se isso acontecer.',
    sandboxNote:
      'O código roda no corpo de uma função, então await no topo não compila: envolva em (async () => { ... })(). Nada é enviado para fora — a execução é local.',
    timelineTitle: 'Linha do tempo',
    waiting: 'Clique em "Executar" para ver a linha do tempo.',
    legendHint: 'Cada círculo é uma chamada de note()/console.log, numerada na ordem real. A barra é a duração do callback da macrotask.',
    barsLegend: 'barra = duração da macrotask',
    taskTip: ({ ms }) => 'durou ' + ms.toFixed(2) + 'ms',
    atMs: ({ ms }) => '+' + ms.toFixed(2) + 'ms',
    scriptLane: 'Script (call stack)',
    microtaskLane: 'Microtask (.then / await)',
    timeoutLane: 'setTimeout',
    intervalLane: 'setInterval',
    frameLane: 'requestAnimationFrame',
    idleLane: 'requestIdleCallback',
    logTitle: 'Ordem de execução',
    emptyLog: 'Nada registrado ainda.',
    tasksTitle: 'Macrotasks medidas',
    tasksEmpty: 'Nenhuma macrotask executada — o código só rodou de forma síncrona.',
    colTask: 'Tarefa',
    colStart: 'Início',
    colDuration: 'Duração',
    colEntries: 'Entradas',
    tagLong: 'long task',
    tagBlocking: 'bloqueio severo',
    truncated: ({ n }) => 'Registro truncado em ' + n + ' entradas (o código nunca ficou ocioso a tempo).',
    statsEntries: 'Chamadas registradas',
    statsMicro: 'Microtasks',
    statsMacro: 'Macrotasks',
    statsLongest: 'Callback mais longo',
    statsTotal: 'Tempo observado',
    alertLong: ({ ms }) =>
      'Uma macrotask passou de ' + ms + 'ms. Acima de ~50ms o navegador considera um long task e a interface não responde; a 60fps cada quadro tem só 16,7ms.',
    alertBlocking: ({ ms }) =>
      'Uma macrotask passou de ' + ms + 'ms — bloqueio severo. Nada de interface, animação ou input acontece enquanto esse callback roda.',
    rulesTitle: 'Regras do event loop',
    rules: [
      'O script roda inteiro antes de qualquer outra coisa: enquanto a call stack não esvazia, nem microtask nem macrotask executam.',
      'Quando o script termina, o navegador drena a fila de microtasks por completo — .then, await, queueMicrotask, MutationObserver.',
      'Só depois que a fila de microtasks fica vazia o event loop pega a próxima macrotask: setTimeout, setInterval, eventos, fetch, requestAnimationFrame.',
      'Cada macrotask é um turn novo: ao terminar, a fila de microtasks é drenada de novo antes da próxima macrotask.',
      'Uma microtask que enfileira outra microtask adia todas as macrotasks: a fila nunca esvazia (starvation) e a interface congela.',
      'await só faz o código esperar — ele não bloqueia a thread. A partir do await, o resto da função vira microtask.',
      'Atrasos de setTimeout não são garantidos: são um mínimo. Tempo de renderização e timers aninhados empurram a execução (~4ms após 5 níveis).',
    ],
    refTitle: 'Referência rápida',
    refIntro: 'Onde cada API enfileira o seu callback — e quando ele roda de verdade.',
    colApi: 'API',
    colQueue: 'Fila',
    colWhen: 'Quando roda',
    qSync: 'Síncrono',
    qMicro: 'Microtask',
    qMacro: 'Macrotask',
    qRender: 'Renderização',
    qIdle: 'Idle',
    whenMicroThen: 'Assim que a call stack esvazia, antes de qualquer macrotask',
    whenMicroAwait: 'No próximo checkpoint de microtasks (logo depois da macrotask atual)',
    whenMicroQueue: 'No próximo checkpoint de microtasks',
    whenMacroTimeout: 'Depois de no mínimo o atraso pedido, quando uma task está livre',
    whenMacroInterval: 'Repete, com o mesmo mecanismo do setTimeout',
    whenMacroFetch: 'No thread pool do browser; o .then continua como microtask',
    whenRenderRaf: 'Logo antes da próxima pintura da tela (ideal para animação)',
    whenIdleIdle: 'Só quando o navegador está ocioso e o frame já foi pintado',
    whenSync: 'Imediatamente, ainda dentro do script',
    sourceTitle: 'Como o sandbox funciona',
    sourceIntro:
      'O código é executado de verdade numa Function, com os timers substituídos por wrappers que medem a duração de cada callback. Uma chamada registrada fora de qualquer callback timed só pode ter acontecido num checkpoint de microtasks — é assim que a página classifica cada linha.',
    resetTitle: 'Zerar a execução',
  },
  en: {
    title: 'Event Loop Visualizer',
    intro: (
      <>
        JavaScript is <Text strong>single-threaded</Text>, but it is not single-task: when the
        main script finishes, the browser drains the <Text strong>entire microtask queue</Text>{' '}
        before picking the next <Text strong>macrotask</Text>. That cycle — call stack,
        microtask queue, task queue — decides the real order of things in your code. Paste a
        snippet below: the page <Text strong>actually runs it</Text>, instrumenting{' '}
        <Text code>setTimeout</Text>, <Text code>setInterval</Text>,{' '}
        <Text code>requestAnimationFrame</Text> and <Text code>console.log</Text>, and shows
        the execution order on a timeline with the measured duration of each callback.
      </>
    ),
    codeTitle: 'Code',
    run: 'Run',
    rerun: 'Run again',
    reset: 'Back to example',
    resetTitle: 'Runs the selected example in your browser and records the order',
    placeholder: 'Paste a JavaScript snippet here. Use note(...) or console.log(...) to mark the points.',
    loopWarning:
      'Careful: an infinite synchronous loop (while (true)) freezes the tab — the event loop never yields again. Reload the page if that happens.',
    sandboxNote:
      'The code runs inside a function body, so top-level await does not compile: wrap it in (async () => { ... })(). Nothing is sent anywhere — execution is local.',
    timelineTitle: 'Timeline',
    waiting: 'Click "Run" to see the timeline.',
    legendHint: 'Each circle is a note()/console.log call, numbered in real execution order. The bar is the duration of the macrotask callback.',
    barsLegend: 'bar = macrotask duration',
    taskTip: ({ ms }) => 'took ' + ms.toFixed(2) + 'ms',
    atMs: ({ ms }) => '+' + ms.toFixed(2) + 'ms',
    scriptLane: 'Script (call stack)',
    microtaskLane: 'Microtask (.then / await)',
    timeoutLane: 'setTimeout',
    intervalLane: 'setInterval',
    frameLane: 'requestAnimationFrame',
    idleLane: 'requestIdleCallback',
    logTitle: 'Execution order',
    emptyLog: 'Nothing recorded yet.',
    tasksTitle: 'Measured macrotasks',
    tasksEmpty: 'No macrotask ran — the code was fully synchronous.',
    colTask: 'Task',
    colStart: 'Start',
    colDuration: 'Duration',
    colEntries: 'Entries',
    tagLong: 'long task',
    tagBlocking: 'severe block',
    truncated: ({ n }) => 'Log truncated at ' + n + ' entries (the code never went idle in time).',
    statsEntries: 'Recorded calls',
    statsMicro: 'Microtasks',
    statsMacro: 'Macrotasks',
    statsLongest: 'Longest callback',
    statsTotal: 'Observed time',
    alertLong: ({ ms }) =>
      'A macrotask took over ' + ms + 'ms. Past ~50ms the browser calls it a long task and the UI stops responding; at 60fps a frame is only 16.7ms.',
    alertBlocking: ({ ms }) =>
      'A macrotask took over ' + ms + 'ms — severe blocking. No UI, animation or input happens while that callback runs.',
    rulesTitle: 'Event loop rules',
    rules: [
      'The whole script runs before anything else: while the call stack is not empty, neither microtasks nor macrotasks run.',
      'When the script ends, the browser drains the whole microtask queue — .then, await, queueMicrotask, MutationObserver.',
      'Only once the microtask queue is empty does the event loop pick the next macrotask: setTimeout, setInterval, events, fetch, requestAnimationFrame.',
      'Every macrotask is a new turn: when it ends, the microtask queue is drained again before the next macrotask.',
      'A microtask that enqueues another microtask delays every macrotask: the queue never empties (starvation) and the UI freezes.',
      'await only makes your code wait — it does not block the thread. Everything after an await becomes a microtask.',
      'setTimeout delays are not guaranteed: they are a minimum. Rendering and nested timers push execution out (~4ms after 5 levels).',
    ],
    refTitle: 'Quick reference',
    refIntro: 'Where each API enqueues its callback — and when it really runs.',
    colApi: 'API',
    colQueue: 'Queue',
    colWhen: 'When it runs',
    qSync: 'Sync',
    qMicro: 'Microtask',
    qMacro: 'Macrotask',
    qRender: 'Rendering',
    qIdle: 'Idle',
    whenMicroThen: 'As soon as the call stack empties, before any macrotask',
    whenMicroAwait: 'At the next microtask checkpoint (right after the current macrotask)',
    whenMicroQueue: 'At the next microtask checkpoint',
    whenMacroTimeout: 'After at least the requested delay, when a task slot is free',
    whenMacroInterval: 'Repeats, using the same mechanism as setTimeout',
    whenMacroFetch: 'On the browser thread pool; the .then continuation is a microtask',
    whenRenderRaf: 'Right before the next paint (ideal for animation)',
    whenIdleIdle: 'Only when the browser is idle and the frame is already painted',
    whenSync: 'Immediately, still inside the script',
    sourceTitle: 'How the sandbox works',
    sourceIntro:
      'The code really runs in a Function, with the timers replaced by wrappers that measure each callback duration. A call recorded outside any timed callback can only have happened in a microtask checkpoint — that is how the page classifies every line.',
    resetTitle: 'Reset the run',
  },
}

// ───────────────────────── página ─────────────────────────

function kindTagProps(kind) {
  const meta = KIND_META[kind]
  return { style: { color: meta.color, background: meta.bg, borderColor: meta.border } }
}

export default function EventLoopVisualizerPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [presetId, setPresetId] = useState(PRESETS[0].id)
  const [code, setCode] = useState(PRESETS[0].code)
  const [result, setResult] = useState(null)
  const [running, setRunning] = useState(false)
  const cancelRef = useRef(null)
  const runRef = useRef(0)
  const aliveRef = useRef(true)

  useEffect(() => {
    aliveRef.current = true
    return () => {
      aliveRef.current = false
      if (cancelRef.current) cancelRef.current()
    }
  }, [])

  const currentPreset = PRESETS.find((p) => p.id === presetId) || PRESETS[0]
  const isPresetCode = code === currentPreset.code
  const hasLoopWarning = LOOP_PATTERN.test(code)

  const stats = useMemo(() => {
    if (!result) return null
    const micro = result.entries.filter((e) => e.kind === 'microtask').length
    const script = result.entries.filter((e) => e.kind === 'script').length
    const macro = result.tasks.length
    const longest = result.tasks.reduce((max, task) => Math.max(max, task.duration ?? 0), 0)
    const blocking = result.tasks.filter((task) => (task.duration ?? 0) >= BLOCKING_MS)
    const long = result.tasks.filter((task) => (task.duration ?? 0) >= LONG_TASK_MS)
    return { micro, script, macro, longest, blocking, long }
  }, [result])

  const taskRows = useMemo(() => {
    if (!result) return []
    return result.tasks.map((task) => ({
      key: task.id,
      task,
      entries: result.entries.filter((e) => e.taskId === task.id).length,
    }))
  }, [result])

  const referenceRows = useMemo(() => {
    const rows = [
      { api: 'note(...) / console.log(...)', queue: 'sync', when: t.whenSync },
      { api: 'Promise.then(onFulfilled)', queue: 'micro', when: t.whenMicroThen },
      { api: 'await', queue: 'micro', when: t.whenMicroAwait },
      { api: 'queueMicrotask()', queue: 'micro', when: t.whenMicroQueue },
      { api: 'setTimeout()', queue: 'macro', when: t.whenMacroTimeout },
      { api: 'setInterval()', queue: 'macro', when: t.whenMacroInterval },
      { api: 'fetch() (depois do .then)', queue: 'macro', when: t.whenMacroFetch },
      { api: 'requestAnimationFrame()', queue: 'render', when: t.whenRenderRaf },
      { api: 'requestIdleCallback()', queue: 'idle', when: t.whenIdleIdle },
    ]
    const queueLabel = { sync: t.qSync, micro: t.qMicro, macro: t.qMacro, render: t.qRender, idle: t.qIdle }
    const queueColor = { sync: '#1677ff', micro: '#722ed1', macro: '#d46b08', render: '#08979c', idle: '#595959' }
    return rows.map((row) => ({
      key: row.api,
      api: <Text code>{row.api}</Text>,
      queue: <Tag style={{ color: queueColor[row.queue], borderColor: queueColor[row.queue] }}>{queueLabel[row.queue]}</Tag>,
      when: row.when,
    }))
  }, [t])

  const handleRun = () => {
    if (cancelRef.current) cancelRef.current()
    runRef.current += 1
    const thisRun = runRef.current
    setResult(null)
    setRunning(true)
    const handle = runSandbox(code, (payload) => {
      if (!aliveRef.current || runRef.current !== thisRun) return
      setResult(payload)
      setRunning(false)
    })
    cancelRef.current = handle
  }

  const handlePreset = (id) => {
    const preset = PRESETS.find((p) => p.id === id) || PRESETS[0]
    if (cancelRef.current) cancelRef.current()
    setPresetId(id)
    setCode(preset.code)
    setResult(null)
    setRunning(false)
  }

  const handleReset = () => {
    setCode(currentPreset.code)
    setResult(null)
    setRunning(false)
  }

  const taskColumns = [
    {
      title: t.colTask,
      dataIndex: 'task',
      key: 'task',
      render: (_, row) => (
        <Space size={4} wrap>
          <Tag {...kindTagProps(row.task.kind)}>{t[row.task.kind + 'Lane']}</Tag>
          <Text code>{row.task.label}</Text>
        </Space>
      ),
    },
    {
      title: t.colStart,
      dataIndex: ['task', 'start'],
      key: 'start',
      width: 110,
      render: (value) => <Text type="secondary">+{value.toFixed(2)}ms</Text>,
    },
    {
      title: t.colDuration,
      dataIndex: ['task', 'duration'],
      key: 'duration',
      width: 210,
      render: (value) => (
        <Space size={4}>
          <Text strong>{value.toFixed(2)}ms</Text>
          {value >= BLOCKING_MS && <Tag color="error">{t.tagBlocking}</Tag>}
          {value >= LONG_TASK_MS && value < BLOCKING_MS && <Tag color="warning">{t.tagLong}</Tag>}
        </Space>
      ),
    },
    {
      title: t.colEntries,
      dataIndex: 'entries',
      key: 'entries',
      width: 90,
    },
  ]

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <div>
        <Title level={2}>{t.title}</Title>
        <Paragraph>{t.intro}</Paragraph>
      </div>

      <Card title={t.codeTitle} extra={
        <Space size={8} wrap>
          <Select
            value={presetId}
            onChange={handlePreset}
            style={{ minWidth: 300 }}
            options={PRESETS.map((p) => ({ value: p.id, label: p.label[lang] }))}
          />
          <Button onClick={handleReset} disabled={isPresetCode} title={t.resetTitle}>
            <ReloadOutlined /> {t.reset}
          </Button>
          <Button type="primary" onClick={handleRun} loading={running}>
            <PlayCircleOutlined /> {result ? t.rerun : t.run}
          </Button>
        </Space>
      }>
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          <Input.TextArea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder={t.placeholder}
            autoSize={{ minRows: 10, maxRows: 26 }}
            style={{ fontFamily: 'monospace', fontSize: 13 }}
            spellCheck={false}
          />
          <Text type="secondary" style={{ fontSize: 12 }}>{t.sandboxNote}</Text>
          {hasLoopWarning && (
            <Alert type="warning" showIcon icon={<WarningOutlined />} message={t.loopWarning} />
          )}
        </Space>
      </Card>

      {stats && result && (
        <Row gutter={[12, 12]}>
          <Col xs={12} md={6}>
            <Card size="small"><Statistic title={t.statsEntries} value={result.entries.length} /></Card>
          </Col>
          <Col xs={12} md={6}>
            <Card size="small"><Statistic title={t.statsMicro} value={stats.micro} /></Card>
          </Col>
          <Col xs={12} md={6}>
            <Card size="small"><Statistic title={t.statsMacro} value={stats.macro} /></Card>
          </Col>
          <Col xs={12} md={6}>
            <Card size="small">
              <Statistic
                title={t.statsLongest}
                value={stats.longest}
                precision={2}
                suffix="ms"
                valueStyle={{ color: stats.longest >= LONG_TASK_MS ? '#cf1322' : undefined }}
              />
            </Card>
          </Col>
          <Col xs={12} md={6}>
            <Card size="small">
              <Statistic title={t.statsTotal} value={result.total} precision={0} suffix="ms" />
            </Card>
          </Col>
        </Row>
      )}

      {stats && stats.blocking.length > 0 && (
        <Alert
          type="error"
          showIcon
          icon={<ClockCircleOutlined />}
          message={t.alertBlocking({ ms: Math.round(stats.longest) })}
        />
      )}
      {stats && stats.blocking.length === 0 && stats.long.length > 0 && (
        <Alert
          type="warning"
          showIcon
          icon={<ClockCircleOutlined />}
          message={t.alertLong({ ms: Math.round(stats.longest) })}
        />
      )}
      {result && result.truncated && (
        <Alert type="info" showIcon message={t.truncated({ n: result.entries.length })} />
      )}

      <Card title={t.timelineTitle}>
        {result ? (
          <>
            <Paragraph type="secondary" style={{ marginTop: 0 }}>{t.legendHint}</Paragraph>
            <Timeline entries={result.entries} tasks={result.tasks} total={result.total} t={t} />
          </>
        ) : (
          <Empty description={t.waiting} />
        )}
      </Card>

      <Card title={t.logTitle}>
        {!result || result.entries.length === 0 ? (
          <Empty description={t.emptyLog} />
        ) : (
          <div style={{ maxHeight: 360, overflow: 'auto', fontFamily: 'monospace', fontSize: 13 }}>
            {result.entries.map((entry) => {
              const meta = KIND_META[entry.kind]
              return (
                <div
                  key={entry.seq}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '5px 8px',
                    borderLeft: '3px solid ' + meta.border,
                    background: entry.seq % 2 === 0 ? 'rgba(0,0,0,0.02)' : 'transparent',
                  }}
                >
                  <span style={{ color: '#bfbfbf', width: 34, flexShrink: 0 }}>{entry.seq}.</span>
                  <span
                    style={{
                      color: meta.color,
                      background: meta.bg,
                      border: '1px solid ' + meta.border,
                      borderRadius: 10,
                      padding: '0 8px',
                      fontSize: 11,
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                    }}
                  >
                    {t[entry.kind + 'Lane']}
                  </span>
                  <span style={{ flex: 1, minWidth: 0, wordBreak: 'break-word' }}>{entry.label}</span>
                  {entry.depth > 0 && (
                    <span style={{ color: '#bfbfbf', fontSize: 11, flexShrink: 0 }}>
                      {'·'.repeat(Math.min(entry.depth, 6))} prof. {entry.depth}
                    </span>
                  )}
                  <span style={{ color: '#8c8c8c', width: 92, textAlign: 'right', flexShrink: 0 }}>
                    +{entry.t.toFixed(2)}ms
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      <Card title={t.tasksTitle}>
        <Table
          size="small"
          columns={taskColumns}
          dataSource={taskRows}
          pagination={false}
          locale={{ emptyText: t.tasksEmpty }}
          scroll={{ x: 520 }}
        />
      </Card>

      <Card title={t.rulesTitle}>
        <ol style={{ margin: 0, paddingLeft: 20 }}>
          {t.rules.map((rule) => (
            <li key={rule} style={{ marginBottom: 8 }}>{rule}</li>
          ))}
        </ol>
      </Card>

      <Card title={t.refTitle}>
        <Paragraph type="secondary" style={{ marginTop: 0 }}>{t.refIntro}</Paragraph>
        <Table
          size="small"
          columns={[
            { title: t.colApi, dataIndex: 'api', key: 'api' },
            { title: t.colQueue, dataIndex: 'queue', key: 'queue', width: 140 },
            { title: t.colWhen, dataIndex: 'when', key: 'when' },
          ]}
          dataSource={referenceRows}
          pagination={false}
          scroll={{ x: 480 }}
        />
      </Card>

      <Collapse
        items={[
          {
            key: 'source',
            label: t.sourceTitle,
            children: (
              <div>
                <Paragraph type="secondary">{t.sourceIntro}</Paragraph>
                <pre style={{ margin: 0, overflowX: 'auto' }}>
                  <code>{PREAMBLE}</code>
                </pre>
              </div>
            ),
          },
        ]}
      />
    </Space>
  )
}
