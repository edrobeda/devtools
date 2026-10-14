import React, { useEffect, useRef, useState } from 'react'
import {
  Typography,
  Card,
  Space,
  Button,
  Slider,
  Tag,
  Row,
  Col,
  Statistic,
  Progress,
  Alert,
} from 'antd'
import { ThunderboltOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const sourceCode = `// Roda uma lista de tarefas com no maximo "concurrency" em paralelo.
// As demais esperam na fila: quando uma termina, a proxima comeca.
async function pooledMap(items, worker, concurrency = 5) {
  const results = new Array(items.length)
  let next = 0

  // Um worker puxa o proximo indice da fila e so para quando ela esvazia.
  async function run() {
    while (next < items.length) {
      const i = next++            // indice unico, sem duas tarefas no mesmo item
      results[i] = await worker(items[i], i)
    }
  }

  // Sobe no maximo "concurrency" workers simultaneos e espera TODOS acabarem.
  const workers = Array.from(
    { length: Math.min(concurrency, items.length) },
    () => run(),
  )
  await Promise.all(workers)
  return results
}

// Uso: no maximo 4 downloads por vez, nao 200 de uma vez.
const data = await pooledMap(
  urls,
  (url) => fetch(url).then((r) => r.json()),
  4,
)`

const PENDING_COLOR = '#8c8c8c'
const RUNNING_COLOR = '#1677ff'
const DONE_COLOR = '#52c41a'

const translations = {
  pt: {
    title: 'Snippet: Promise Pool (limite de concorrência)',
    intro: (
      <>
        Promise.all dispara <Text code>todas</Text> as tarefas de uma vez. Se
        são 200 requisições, seu servidor (ou o serviço de fora) recebe 200
        chamadas simultâneas de uma vez só. Um <Text code>Promise pool</Text>{' '}
        limita isso: roda no máximo <Text code>N</Text> tarefas ao mesmo tempo
        e enfileira as demais, puxando a próxima assim que uma vaga abre. É o
        mesmo padrão por trás de um semáforo, de um pool de conexões e do
        limite de downloads do seu gerenciador de arquivos.
      </>
    ),
    sourceTitle: 'Código-fonte',
    demoTitle: 'Demo: tarefas concorrentes com limite',
    demoIntro: (
      <>
        Cada quadradinho é uma tarefa que leva um tempo aleatório. Escolha
        quantas tarefas e o limite de concorrência e clique em rodar: repare
        que nunca há mais que <Text code>N</Text> barras animando ao mesmo
        tempo — as demais ficam na fila.
      </>
    ),
    taskCount: 'Tarefas',
    concurrency: 'Concorrência (N)',
    run: 'Rodar',
    reset: 'Limpar',
    running: 'Rodando…',
    statRunning: 'Em execução',
    statDone: 'Concluídas',
    statQueued: 'Na fila',
    statPeak: 'Pico de concorrência',
    task: 'Tarefa',
    peakOk: 'Respeitou o limite',
    peakOver: 'Acima do limite',
    limitNote: 'O pico nunca passa de N — é exatamente o que o pool garante.',
    doneNote: 'Todas as tarefas terminaram.',
    pitfallsTitle: 'Quando usar (e o que observar)',
    pitfalls: [
      'Use quando o volume de tarefas é muito maior que a capacidade que o recurso aceita: APIs com rate limit, uploads, scraping, processamento em lote.',
      'O `next++` é a peça-chave: cada worker pega um índice diferente sem duas tarefas caírem no mesmo item. Como o JS é single-threaded, não precisa de lock.',
      'Se uma tarefa lançar erro, `await worker(...)` rejeita e o `while` daquele worker para. Muitas vezes você quer capturar por tarefa (ex.: guardar o erro no resultado) pra que uma falha não derrube o lote inteiro.',
      'A ordem de conclusão não é a ordem da lista: a tarefa 5 pode terminar antes da 3. Se a ordem importa, ou recolha pelos índices ou aceite a reordenação.',
      'Serve pro mesmo propósito de uma lib como `p-limit` ou `p-map`. Saber implementar à mão ajuda a entender semáforos, pools de conexão e backpressure.',
      'Cuidado com o limite baixo demais: N=1 é serial e joga a vantagem da concorrência fora. Calibre com o gargalo real (CPU, rede, limite do serviço).',
    ],
  },
  en: {
    title: 'Snippet: Promise Pool (concurrency limit)',
    intro: (
      <>
        Promise.all fires <Text code>every</Text> task at once. If there are 200
        requests, your server (or the external service) gets 200 simultaneous
        calls in one shot. A <Text code>promise pool</Text> caps that: it runs
        at most <Text code>N</Text> tasks at the same time and queues the rest,
        pulling the next one as soon as a slot frees up. It is the same pattern
        behind a semaphore, a connection pool, and your download manager's
        max-connections setting.
      </>
    ),
    sourceTitle: 'Source code',
    demoTitle: 'Demo: concurrent tasks under a limit',
    demoIntro: (
      <>
        Each little box is a task that takes a random amount of time. Pick how
        many tasks and the concurrency limit, then hit run: notice there are
        never more than <Text code>N</Text> bars animating at once — the rest
        wait in the queue.
      </>
    ),
    taskCount: 'Tasks',
    concurrency: 'Concurrency (N)',
    run: 'Run',
    reset: 'Clear',
    running: 'Running…',
    statRunning: 'Running',
    statDone: 'Completed',
    statQueued: 'Queued',
    statPeak: 'Peak concurrency',
    task: 'Task',
    peakOk: 'Stayed within the limit',
    peakOver: 'Above the limit',
    limitNote: 'The peak never exceeds N — that is exactly what the pool guarantees.',
    doneNote: 'All tasks finished.',
    pitfallsTitle: 'When to use it (and what to watch)',
    pitfalls: [
      'Use it when the number of tasks is far larger than what the resource can absorb: rate-limited APIs, uploads, scraping, batch processing.',
      'The `next++` is the key detail: each worker grabs a distinct index so no two tasks land on the same item. Since JS is single-threaded, no lock is needed.',
      'If a task throws, `await worker(...)` rejects and that worker\'s `while` stops. Often you want to catch per task (e.g. store the error in the result) so one failure does not take the whole batch down.',
      'Completion order is not list order: task 5 may finish before task 3. If order matters, either collect by index or accept the reshuffle.',
      'It serves the same purpose as a library such as `p-limit` or `p-map`. Implementing it by hand helps you understand semaphores, connection pools, and backpressure.',
      'Beware of a limit that is too low: N=1 is serial and throws away the concurrency win. Calibrate against the real bottleneck (CPU, network, service limit).',
    ],
  },
}

export default function PromisePoolSnippetPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [taskCount, setTaskCount] = useState(12)
  const [concurrency, setConcurrency] = useState(3)
  const [tasks, setTasks] = useState([])
  const [running, setRunning] = useState(false)
  const [peak, setPeak] = useState(0)
  const runIdRef = useRef(0)

  // Cancela qualquer animacao em andamento se a pagina for desmontada.
  useEffect(() => () => {
    runIdRef.current++
  }, [])

  // Pico de concorrencia observado — so aumenta, por isso nao entra em loop.
  useEffect(() => {
    if (!running) return
    const active = tasks.filter((x) => x.status === 'running').length
    setPeak((prev) => (active > prev ? active : prev))
  }, [tasks, running])

  const activeCount = tasks.filter((x) => x.status === 'running').length
  const doneCount = tasks.filter((x) => x.status === 'done').length
  const queuedCount = tasks.length - activeCount - doneCount
  const allDone = tasks.length > 0 && doneCount === tasks.length

  function animate(task, runId, setTask) {
    return new Promise((resolve) => {
      const start = performance.now()
      const step = () => {
        if (runId !== runIdRef.current) {
          resolve()
          return
        }
        const elapsed = performance.now() - start
        const progress = Math.min(100, (elapsed / task.duration) * 100)
        setTask(task.id, { progress })
        if (progress >= 100) {
          resolve()
          return
        }
        setTimeout(step, 50)
      }
      step()
    })
  }

  async function run() {
    const runId = ++runIdRef.current
    const list = Array.from({ length: taskCount }, (_, i) => ({
      id: i,
      duration: 600 + Math.floor(Math.random() * 1400),
      status: 'pending',
      progress: 0,
    }))
    setTasks(list)
    setRunning(true)
    setPeak(0)

    const setTask = (id, patch) =>
      setTasks((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)))

    let next = 0
    async function worker() {
      while (runIdRef.current === runId && next < list.length) {
        const task = list[next++]
        setTask(task.id, { status: 'running' })
        await animate(task, runId, setTask)
        if (runIdRef.current !== runId) return
        setTask(task.id, { status: 'done', progress: 100 })
      }
    }

    const workers = Array.from(
      { length: Math.min(concurrency, list.length) },
      () => worker(),
    )
    await Promise.all(workers)
    if (runIdRef.current === runId) setRunning(false)
  }

  function reset() {
    runIdRef.current++
    setTasks([])
    setRunning(false)
    setPeak(0)
  }

  function taskColor(status) {
    if (status === 'done') return DONE_COLOR
    if (status === 'running') return RUNNING_COLOR
    return PENDING_COLOR
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><ThunderboltOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card title={t.sourceTitle}>
        <pre style={{ margin: 0, overflowX: 'auto' }}>
          <code>{sourceCode}</code>
        </pre>
      </Card>

      <Card title={t.demoTitle}>
        <Paragraph type="secondary">{t.demoIntro}</Paragraph>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Space align="center" wrap size="large">
            <Space align="center">
              <Text type="secondary" style={{ width: 120, display: 'inline-block' }}>
                {t.taskCount}: {taskCount}
              </Text>
              <Slider
                min={4}
                max={24}
                value={taskCount}
                onChange={setTaskCount}
                disabled={running}
                style={{ width: 180 }}
              />
            </Space>
            <Space align="center">
              <Text type="secondary" style={{ width: 150, display: 'inline-block' }}>
                {t.concurrency}: {concurrency}
              </Text>
              <Slider
                min={1}
                max={8}
                value={concurrency}
                onChange={setConcurrency}
                disabled={running}
                style={{ width: 180 }}
              />
            </Space>
          </Space>

          <Space wrap>
            <Button type="primary" loading={running} onClick={run}>
              {running ? t.running : t.run}
            </Button>
            <Button onClick={reset} disabled={running || tasks.length === 0}>
              {t.reset}
            </Button>
          </Space>

          {tasks.length > 0 && (
            <>
              <Row gutter={[16, 16]}>
                <Col xs={12} sm={6}>
                  <Statistic title={t.statRunning} value={activeCount} />
                </Col>
                <Col xs={12} sm={6}>
                  <Statistic title={t.statDone} value={doneCount} />
                </Col>
                <Col xs={12} sm={6}>
                  <Statistic title={t.statQueued} value={queuedCount} />
                </Col>
                <Col xs={12} sm={6}>
                  <Statistic
                    title={t.statPeak}
                    value={peak}
                    suffix={
                      <Tag color={peak <= concurrency ? 'green' : 'red'} style={{ marginLeft: 8 }}>
                        {peak <= concurrency ? t.peakOk : t.peakOver}
                      </Tag>
                    }
                  />
                </Col>
              </Row>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                  gap: 8,
                }}
              >
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    style={{
                      border: `1px solid ${taskColor(task.status)}`,
                      borderLeft: `4px solid ${taskColor(task.status)}`,
                      borderRadius: 6,
                      padding: '6px 8px',
                      background: 'rgba(127,127,127,0.04)',
                    }}
                  >
                    <Text style={{ fontSize: 12, color: taskColor(task.status) }}>
                      {t.task} #{task.id + 1}
                    </Text>
                    <Progress
                      percent={Math.round(task.progress)}
                      size="small"
                      showInfo={false}
                      strokeColor={taskColor(task.status)}
                    />
                  </div>
                ))}
              </div>

              {allDone && <Alert type="success" showIcon message={t.doneNote} />}
            </>
          )}

          <Alert type="info" showIcon message={t.limitNote} />
        </Space>
      </Card>

      <Card title={t.pitfallsTitle}>
        <ul style={{ margin: 0, paddingLeft: 20 }}>
          {t.pitfalls.map((p, i) => (
            <li key={i} style={{ marginBottom: 6 }}>
              <Text>{p}</Text>
            </li>
          ))}
        </ul>
      </Card>
    </Space>
  )
}
