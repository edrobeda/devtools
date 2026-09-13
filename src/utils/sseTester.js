// Motor do /network/sse-tester — parser SSE + stream de demonstração local.
// Nenhum dado sai do navegador: o "servidor" de demo é uma ReadableStream
// gerada na própria máquina, consumida pelo MESMO caminho de um fetch real.

export function formatBytes(n) {
  if (!Number.isFinite(n)) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let i = 0
  let v = n
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024
    i += 1
  }
  return (v >= 100 ? v.toFixed(0) : v.toFixed(1)) + ' ' + units[i]
}

function abortError() {
  return new DOMException('Aborted', 'AbortError')
}

function sleep(ms, signal) {
  if (signal && signal.aborted) return Promise.reject(abortError())
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms)
    if (signal) {
      signal.addEventListener(
        'abort',
        () => {
          clearTimeout(timer)
          reject(abortError())
        },
        { once: true }
      )
    }
  })
}

// Um bloco SSE é linhas `campo: valor` terminado por uma linha vazia.
// `:` sozinho é comentário (ignorado); campo sem `:` é ignorado (spec).
export function parseSSEFrame(raw) {
  const event = { event: null, id: null, retry: null, data: [] }
  const lines = typeof raw === 'string' ? raw.split(/\r?\n/) : raw
  for (const line of lines) {
    if (!line || line[0] === ':') continue
    const colon = line.indexOf(':')
    if (colon === -1) continue
    const field = line.slice(0, colon)
    let value = line.slice(colon + 1)
    if (value[0] === ' ') value = value.slice(1)
    if (field === 'event') event.event = value
    else if (field === 'id') event.id = value
    else if (field === 'retry') event.retry = Number(value)
    else if (field === 'data') event.data.push(value)
  }
  return event
}

// Parser incremental: recebe chunks de texto e dispara onEvent({ event, id,
// data, retry }) a cada frame completo; o buffer residual sobrevive entre
// chunks (frames que chegam "quebradas" no meio).
export function createSSEParser(onEvent) {
  let buffer = ''
  function firstBreak(text) {
    const i1 = text.indexOf('\n\n')
    const i2 = text.indexOf('\r\n\r\n')
    return i1 === -1 ? i2 : i2 === -1 ? i1 : Math.min(i1, i2)
  }
  return function feed(chunk) {
    buffer += chunk
    let idx = firstBreak(buffer)
    while (idx !== -1) {
      const raw = buffer.slice(0, idx)
      const marker = buffer[idx] === '\r' ? '\r\n\r\n' : '\n\n'
      buffer = buffer.slice(idx + marker.length)
      const ev = parseSSEFrame(raw)
      if (ev.data.length > 0) {
        onEvent({
          event: ev.event,
          id: ev.id,
          retry: ev.retry,
          data: ev.data.join('\n'),
          bytes: raw.length,
        })
      }
      idx = firstBreak(buffer)
    }
  }
}

export function sseFrame(parts) {
  return parts.join('\n') + '\n\n'
}

// Linhas dos frames de demonstração (split manual evita template literal
// com interpolação de cifrão-chave — lição de rodada anterior).
const DEMO = {
  comment: ': simulando-servidor-sse-local\n\n',
  welcome: () => sseFrame(['data: Bem-vindo ao stream de demonstração']),
  welcomeTail: '\n\n',
  ping: (n) => sseFrame(['event: ping', 'data: ' + n]),
  multiline: () => sseFrame(['data: janela: 5000', 'data: limite: 3', 'data: origem: portal-analytics']),
  notification: () =>
    sseFrame([
      'id: 42',
      'event: notification',
      'data: {"level":"info","message":"build finalizado","build":2071}',
      'retry: 3000',
    ]),
  feedback: (n) => sseFrame(['event: feedback', 'data: confirmacao-' + n]),
  finish: () => sseFrame(['data: Fim do stream de demonstração (conexão encerrada pelo servidor)']),
}

// Gera os bytes do "servidor" local, frame a frame, com pausas curtas.
// O welcome é enfileirado em DUAS partes pra exercitar o buffer do parser
// (um frame entregue "quebrado" no meio de um chunk); o frame de comentário
// (linha `:`) existe pra mostrar que ele é ignorado pela spec.
export async function* demoSseChunks(signal) {
  yield new TextEncoder().encode(DEMO.comment)
  yield new TextEncoder().encode(DEMO.welcome().split('\n\n')[0])
  await sleep(250, signal)
  yield new TextEncoder().encode(DEMO.welcomeTail)
  await sleep(600, signal)
  for (let i = 1; i <= 3; i += 1) {
    yield new TextEncoder().encode(DEMO.ping(i))
    await sleep(500, signal)
  }
  yield new TextEncoder().encode(DEMO.multiline())
  await sleep(500, signal)
  yield new TextEncoder().encode(DEMO.notification())
  await sleep(500, signal)
  yield new TextEncoder().encode(DEMO.feedback(1))
  await sleep(450, signal)
  yield new TextEncoder().encode(DEMO.feedback(2))
  await sleep(450, signal)
  yield new TextEncoder().encode(DEMO.finish())
}

// Stream local no formato de um `response.body` — o mesmo consumo do fetch.
export function createDemoStream(signal) {
  return new ReadableStream({
    start(controller) {
      const run = async () => {
        for await (const chunk of demoSseChunks(signal)) {
          if (signal && signal.aborted) throw abortError()
          controller.enqueue(chunk)
        }
        controller.close()
      }
      run().catch(() => {
        try {
          controller.error(abortError())
        } catch {
          // já fechada
        }
      })
    },
  })
}