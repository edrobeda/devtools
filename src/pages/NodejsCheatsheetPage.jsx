import React, { useMemo, useState, useCallback } from 'react'
import { Typography, Card, Space, Input, List, Tag, Radio, Alert, Button, message, Collapse } from 'antd'
import { CodeOutlined, SearchOutlined, CopyOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const CATEGORIES = [
  'cli',
  'process',
  'modules',
  'fs',
  'path',
  'http',
  'url',
  'crypto',
  'streams',
  'childproc',
  'events',
  'timers',
  'errors',
  'env',
]

const CATEGORY_COLOR = {
  cli: 'geekblue',
  process: 'cyan',
  modules: 'purple',
  fs: 'green',
  path: 'lime',
  http: 'gold',
  url: 'orange',
  crypto: 'volcano',
  streams: 'blue',
  childproc: 'magenta',
  events: 'pink',
  timers: 'red',
  errors: 'default',
  env: 'cyan',
}

const labelOf = {
  cli: { pt: 'Node CLI & scripts', en: 'Node CLI & scripts' },
  process: { pt: 'Objeto process', en: 'The process object' },
  modules: { pt: 'Módulos (CJS & ESM)', en: 'Modules (CJS & ESM)' },
  fs: { pt: 'File system (fs)', en: 'File system (fs)' },
  path: { pt: 'path', en: 'path' },
  http: { pt: 'HTTP & HTTPS', en: 'HTTP & HTTPS' },
  url: { pt: 'URL', en: 'URL' },
  crypto: { pt: 'crypto', en: 'crypto' },
  streams: { pt: 'Streams', en: 'Streams' },
  childproc: { pt: 'child_process', en: 'child_process' },
  events: { pt: 'EventEmitter', en: 'EventEmitter' },
  timers: { pt: 'Event loop & timers', en: 'Event loop & timers' },
  errors: { pt: 'Tratamento de erros', en: 'Error handling' },
  env: { pt: 'Env & configuração', en: 'Env & configuration' },
}

const COMMANDS = [
  // ─── Node CLI & scripts ──────────────────────────────────────────────────
  { cmd: 'node --version', cat: 'cli', pt: 'Versão do runtime (node, V8, libuv)', en: 'Runtime version (node, V8, libuv)' },
  { cmd: 'node -e "console.log(1+1)"', cat: 'cli', pt: 'Executa código inline (só imprime se você usar console.log)', en: 'Runs inline code (only prints if you console.log)' },
  { cmd: 'node -p "process.platform"', cat: 'cli', pt: 'Avalia a expressão e imprime o resultado', en: 'Evaluates the expression and prints the result' },
  { cmd: 'node -v', cat: 'cli', pt: 'Versão do Node.js', en: 'Node.js version' },
  { cmd: 'node -c arquivo.js', cat: 'cli', pt: 'Só checa a sintaxe, não executa', en: 'Syntax check only, does not run' },
  { cmd: 'node --watch app.js', cat: 'cli', pt: 'Reinicia o processo quando arquivos mudam (Node 18.11+)', en: 'Restarts on file changes (Node 18.11+)' },
  { cmd: 'node --inspect app.js', cat: 'cli', pt: 'Ativa o depurador na porta 9229', en: 'Enables the debugger on port 9229' },
  { cmd: 'node --inspect-brk app.js', cat: 'cli', pt: 'Pausa logo na primeira linha do script', en: 'Pauses on the very first line' },
  { cmd: 'node --trace-warnings app.js', cat: 'cli', pt: 'Mostra a stack trace completa de warnings', en: 'Shows full stack traces for warnings' },
  { cmd: 'node --max-old-space-size=4096 app.js', cat: 'cli', pt: 'Define o heap máximo da V8 em MB', en: 'Sets the V8 max old-space heap in MB' },
  { cmd: 'node --stack-trace-limit=100 app.js', cat: 'cli', pt: 'Aumenta o número de frames exibidos em stack traces', en: 'Increases the number of frames shown in stack traces' },
  { cmd: 'node --env-file=.env app.js', cat: 'cli', pt: 'Carrega variáveis de ambiente de um arquivo .env (Node 20.6+)', en: 'Loads env vars from a .env file (Node 20.6+)' },
  { cmd: 'NODE_OPTIONS="--inspect --trace-warnings" node app.js', cat: 'cli', pt: 'Passa flags via variável de ambiente (útil em CI)', en: 'Passes flags through an env var (handy in CI)' },
  { cmd: 'node --test', cat: 'cli', pt: 'Roda os testes do runner nativo node:test', en: 'Runs tests with the built-in node:test runner' },
  { cmd: 'node --experimental-strip-types app.ts', cat: 'cli', pt: 'Executa TypeScript removendo tipos sem transpilar', en: 'Runs TypeScript by stripping types (experimental)' },

  // ─── process ─────────────────────────────────────────────────────────────
  { cmd: 'process.version', cat: 'process', pt: 'Versão do Node.js atual', en: 'Current Node.js version' },
  { cmd: 'process.platform', cat: 'process', pt: 'Sistema operacional: darwin, linux, win32', en: 'OS platform: darwin, linux, win32' },
  { cmd: 'process.arch', cat: 'process', pt: 'Arquitetura da CPU: x64, arm64', en: 'CPU architecture: x64, arm64' },
  { cmd: 'process.pid', cat: 'process', pt: 'PID do processo atual', en: 'Current process PID' },
  { cmd: 'process.cwd()', cat: 'process', pt: 'Diretório de trabalho atual', en: 'Current working directory' },
  { cmd: 'process.argv', cat: 'process', pt: 'Argumentos da linha de comando (array, incluindo node e script)', en: 'Command-line arguments (array, including node and script)' },
  { cmd: 'process.env.NODE_ENV', cat: 'process', pt: 'Lê uma variável de ambiente', en: 'Reads an environment variable' },
  { cmd: 'process.exitCode = 1', cat: 'process', pt: 'Define o código de saída sem interromper a execução', en: 'Sets the exit code without killing execution' },
  { cmd: 'process.exit(1)', cat: 'process', pt: 'Encerra imediatamente com o código 1', en: 'Exits immediately with code 1' },
  { cmd: 'process.on("exit", (code) => {})', cat: 'process', pt: 'Callback síncrono logo antes de sair', en: 'Synchronous callback right before exiting' },
  { cmd: 'process.nextTick(fn)', cat: 'process', pt: 'Agenda fn para antes da próxima fase do event loop', en: 'Schedules fn before the next event loop phase' },
  { cmd: 'process.stdout.write("x")', cat: 'process', pt: 'Escreve sem nova linha automática', en: 'Writes without an automatic newline' },
  { cmd: 'process.cpuUsage()', cat: 'process', pt: 'Tempo de CPU (user + system)', en: 'CPU time (user + system)' },
  { cmd: 'process.memoryUsage()', cat: 'process', pt: 'rss, heapTotal, heapUsed e external', en: 'rss, heapTotal, heapUsed and external' },
  { cmd: 'process.kill(pid, "SIGTERM")', cat: 'process', pt: 'Envia um sinal para um processo', en: 'Sends a signal to a process' },
  { cmd: 'process.on("SIGINT", () => {})', cat: 'process', pt: 'Intercepta Ctrl+C', en: 'Intercepts Ctrl+C' },
  { cmd: 'process.env.PORT || 3000', cat: 'process', pt: 'Padrão comum para porta em servidores', en: 'Common port default pattern for servers' },

  // ─── Módulos ─────────────────────────────────────────────────────────────
  { cmd: 'module.exports = add', cat: 'modules', pt: 'Exporta um valor único no CommonJS', en: 'Exports a single value in CommonJS' },
  { cmd: 'exports.add = add', cat: 'modules', pt: 'Exporta propriedades avulsas no CommonJS', en: 'Exports named properties in CommonJS' },
  { cmd: 'const m = require("./meu-modulo.js")', cat: 'modules', pt: 'Importa um módulo local no CommonJS', en: 'Imports a local module in CommonJS' },
  { cmd: 'require("fs")', cat: 'modules', pt: 'Importa um módulo core do Node', en: 'Imports a Node core module' },
  { cmd: 'import fs from "node:fs"', cat: 'modules', pt: 'Importa módulo core no ESM (prefixo node: recomendado)', en: 'Imports a core module in ESM (node: prefix recommended)' },
  { cmd: 'export function add(a, b) {}', cat: 'modules', pt: 'Export nomeado no ESM', en: 'Named export in ESM' },
  { cmd: 'export default function() {}', cat: 'modules', pt: 'Export default no ESM', en: 'Default export in ESM' },
  { cmd: 'import { add } from "./mod.mjs"', cat: 'modules', pt: 'Import nomeado no ESM', en: 'Named import in ESM' },
  { cmd: '"type": "module" no package.json', cat: 'modules', pt: 'Faz arquivos .js serem tratados como ESM por padrão', en: 'Makes .js files ESM by default' },
  { cmd: 'import.meta.url', cat: 'modules', pt: 'URL do arquivo atual — equivalente ao __dirname no ESM', en: 'Current file URL — the ESM equivalent of __dirname' },
  { cmd: 'fileURLToPath(import.meta.url)', cat: 'modules', pt: 'Converte a URL do módulo em caminho de arquivo', en: 'Converts the module URL to a file path' },
  { cmd: 'require.main === module', cat: 'modules', pt: 'True se o arquivo for executado direto (não importado)', en: 'True if the file is run directly (not imported)' },
  { cmd: 'node --input-type=module -e "..."', cat: 'modules', pt: 'Força o modo ESM em código inline', en: 'Forces ESM mode for inline code' },
  { cmd: 'process.mainModule', cat: 'modules', pt: 'Módulo principal do processo (legado, prefera require.main)', en: 'Main module of the process (legacy, prefer require.main)' },

  // ─── File system ─────────────────────────────────────────────────────────
  { cmd: 'import fs from "node:fs/promises"', cat: 'fs', pt: 'Versão com promessas do fs (recomendada)', en: 'Promise-based fs API (recommended)' },
  { cmd: 'await fs.readFile("a.txt", "utf8")', cat: 'fs', pt: 'Lê um arquivo inteiro como texto', en: 'Reads an entire file as text' },
  { cmd: 'fs.readFileSync("a.txt", "utf8")', cat: 'fs', pt: 'Leitura síncrona (evite em servidores — bloqueia o loop)', en: 'Synchronous read (avoid in servers — blocks the loop)' },
  { cmd: 'await fs.writeFile("a.txt", "oi")', cat: 'fs', pt: 'Escreve (sobrescreve) um arquivo', en: 'Writes (overwrites) a file' },
  { cmd: 'await fs.appendFile("a.txt", "mais\n")', cat: 'fs', pt: 'Adiciona texto ao final do arquivo', en: 'Appends text to the end of a file' },
  { cmd: 'await fs.readdir("src", { recursive: true })', cat: 'fs', pt: 'Lista arquivos de um diretório (recursivo no Node 20+)', en: 'Lists files in a directory (recursive in Node 20+)' },
  { cmd: 'await fs.mkdir("a/b/c", { recursive: true })', cat: 'fs', pt: 'Cria diretórios aninhados sem erro se já existirem', en: 'Creates nested directories without erroring when they exist' },
  { cmd: 'await fs.rm("pasta", { recursive: true, force: true })', cat: 'fs', pt: 'Remove diretório recursivamente', en: 'Removes a directory recursively' },
  { cmd: 'await fs.unlink("a.txt")', cat: 'fs', pt: 'Remove um arquivo', en: 'Removes a file' },
  { cmd: 'await fs.rename("a.txt", "b.txt")', cat: 'fs', pt: 'Renomeia ou move um arquivo', en: 'Renames or moves a file' },
  { cmd: 'await fs.copyFile("a.txt", "b.txt")', cat: 'fs', pt: 'Copia um arquivo', en: 'Copies a file' },
  { cmd: 'await fs.stat("a.txt")', cat: 'fs', pt: 'Tamanho, modo e datas do arquivo (size, mtime, isFile())', en: 'File size, mode and dates (size, mtime, isFile())' },
  { cmd: 'await fs.access("a.txt", fs.constants.R_OK)', cat: 'fs', pt: 'Verifica se o arquivo existe/é legível', en: 'Checks whether the file exists/is readable' },
  { cmd: 'fs.createReadStream("big.log")', cat: 'fs', pt: 'Lê arquivos grandes em pedaços (stream)', en: 'Reads large files in chunks (stream)' },
  { cmd: 'fs.createWriteStream("out.log")', cat: 'fs', pt: 'Grava em stream sem carregar tudo na memória', en: 'Writes via stream without buffering everything' },
  { cmd: 'await fs.watch("src", (evt, file) => {})', cat: 'fs', pt: 'Observa mudanças em arquivos/diretórios', en: 'Watches files/directories for changes' },

  // ─── path ────────────────────────────────────────────────────────────────
  { cmd: 'path.join("src", "utils", "a.js")', cat: 'path', pt: 'Junta segmentos com o separador correto do SO', en: 'Joins segments with the correct OS separator' },
  { cmd: 'path.resolve("src")', cat: 'path', pt: 'Resolve para um caminho absoluto', en: 'Resolves to an absolute path' },
  { cmd: 'path.basename("/a/b/c.js")', cat: 'path', pt: '"c.js" — último segmento', en: '"c.js" — the last segment' },
  { cmd: 'path.dirname("/a/b/c.js")', cat: 'path', pt: '"/a/b" — diretório do caminho', en: '"/a/b" — the directory of the path' },
  { cmd: 'path.extname("/a/b/c.js")', cat: 'path', pt: '".js" — extensão do arquivo', en: '".js" — the file extension' },
  { cmd: 'path.parse("/a/b/c.js")', cat: 'path', pt: '{ root, dir, base, name, ext }', en: '{ root, dir, base, name, ext }' },
  { cmd: 'path.relative("/a", "/a/b/c")', cat: 'path', pt: '"b/c" — caminho relativo entre dois diretórios', en: '"b/c" — relative path between two dirs' },
  { cmd: 'path.normalize("/a//b/../c")', cat: 'path', pt: 'Limpa caminhos com slashes e .. redundantes', en: 'Cleans redundant slashes and .. segments' },
  { cmd: 'path.sep', cat: 'path', pt: 'Separador de caminho do SO ("/" ou "\\")', en: 'OS path separator ("/" or "\\")' },

  // ─── HTTP ────────────────────────────────────────────────────────────────
  { cmd: 'http.createServer((req, res) => {})', cat: 'http', pt: 'Cria um servidor HTTP básico', en: 'Creates a basic HTTP server' },
  { cmd: 'res.writeHead(200, { "Content-Type": "application/json" })', cat: 'http', pt: 'Define status e headers da resposta', en: 'Sets the response status and headers' },
  { cmd: 'res.end(JSON.stringify({ ok: true }))', cat: 'http', pt: 'Finaliza a resposta com o corpo', en: 'Ends the response with a body' },
  { cmd: 'server.listen(3000, () => {})', cat: 'http', pt: 'Sobe o servidor na porta 3000', en: 'Starts the server on port 3000' },
  { cmd: 'const server = http.createServer()', cat: 'http', pt: 'Cria o servidor sem handler (dá para adicionar depois)', en: 'Creates the server without a handler' },
  { cmd: 'req.method, req.url', cat: 'http', pt: 'Método e URL da requisição', en: 'Request method and URL' },
  { cmd: 'await fetch("https://api.exemplo.com")', cat: 'http', pt: 'Cliente HTTP nativo no Node 18+', en: 'Built-in HTTP client on Node 18+' },
  { cmd: 'for await (const chunk of req)', cat: 'http', pt: 'Lê o corpo da requisição como async iterator', en: 'Reads the request body as an async iterator' },
  { cmd: 'res.setHeader("Cache-Control", "max-age=3600")', cat: 'http', pt: 'Define um header individual', en: 'Sets a single header' },
  { cmd: 'https.createServer(options, handler)', cat: 'http', pt: 'Servidor HTTPS com cert/key', en: 'HTTPS server with cert/key' },

  // ─── URL ─────────────────────────────────────────────────────────────────
  { cmd: 'const u = new URL("https://x.com/p?q=a#h")', cat: 'url', pt: 'Parsa uma URL na API WHATWG', en: 'Parses a URL with the WHATWG API' },
  { cmd: 'u.searchParams.get("q")', cat: 'url', pt: 'Lê um parâmetro de query', en: 'Reads a query parameter' },
  { cmd: 'u.searchParams.set("x", "1")', cat: 'url', pt: 'Adiciona/altera um parâmetro de query', en: 'Adds/updates a query parameter' },
  { cmd: 'new URLSearchParams({ a: "1", b: "2" }).toString()', cat: 'url', pt: '"a=1&b=2" — serializa query params', en: '"a=1&b=2" — serializes query params' },
  { cmd: 'decodeURIComponent(value)', cat: 'url', pt: 'Decodifica valores percent-encoded', en: 'Decodes percent-encoded values' },
  { cmd: 'encodeURIComponent(value)', cat: 'url', pt: 'Codifica para uso em query strings', en: 'Encodes for use in query strings' },
  { cmd: 'u.origin, u.pathname, u.hash', cat: 'url', pt: 'https://x.com, /p, #h', en: 'https://x.com, /p, #h' },
  { cmd: 'new URL("/api", "https://base.com")', cat: 'url', pt: 'Resolve uma URL relativa contra uma base', en: 'Resolves a relative URL against a base' },

  // ─── crypto ──────────────────────────────────────────────────────────────
  { cmd: 'crypto.randomUUID()', cat: 'crypto', pt: 'UUID v4 aleatório', en: 'Random UUID v4' },
  { cmd: 'crypto.randomBytes(16).toString("hex")', cat: 'crypto', pt: '32 caracteres hex aleatórios', en: '32 random hex characters' },
  { cmd: 'createHash("sha256").update(x).digest("hex")', cat: 'crypto', pt: 'Hash de uma única passada (ex.: senha de teste)', en: 'One-shot hash (e.g. for test passwords)' },
  { cmd: 'createHmac("sha256", secret).update(x).digest("hex")', cat: 'crypto', pt: 'HMAC com chave secreta (webhooks)', en: 'HMAC with a secret key (webhooks)' },
  { cmd: 'scryptSync(senha, salt, 64)', cat: 'crypto', pt: 'Derivação de senha moderna (mais q PBKDF2)', en: 'Modern password derivation (preferred over PBKDF2)' },
  { cmd: 'timingSafeEqual(a, b)', cat: 'crypto', pt: 'Comparação em tempo constante de buffers', en: 'Constant-time buffer comparison' },
  { cmd: 'crypto.subtle.digest("SHA-256", data)', cat: 'crypto', pt: 'WebCrypto — assíncrono, retorna ArrayBuffer', en: 'WebCrypto — async, returns ArrayBuffer' },
  { cmd: 'generateKeyPairSync("rsa", options)', cat: 'crypto', pt: 'Gera par de chaves pública/privada', en: 'Generates a public/private key pair' },

  // ─── Streams ─────────────────────────────────────────────────────────────
  { cmd: 'import { pipeline } from "node:stream/promises"', cat: 'streams', pt: 'pipeline com promessas — encadeia e propaga erros', en: 'Promise-based pipeline — chains and propagates errors' },
  { cmd: 'await pipeline(src, transform, dest)', cat: 'streams', pt: 'Conecta streams cuidando de backpressure e cleanup', en: 'Connects streams handling backpressure and cleanup' },
  { cmd: 'Readable.from(array)', cat: 'streams', pt: 'Cria uma stream legível a partir de um iterável', en: 'Creates a readable stream from an iterable' },
  { cmd: 'for await (const chunk of stream)', cat: 'streams', pt: 'Consome uma stream legível assincronamente', en: 'Consumes a readable stream asynchronously' },
  { cmd: 'new Transform({ transform(chunk, enc, cb) {} })', cat: 'streams', pt: 'Stream de transformação (ex.: gzip, uppercase)', en: 'Transform stream (e.g. gzip, uppercase)' },
  { cmd: 'await finished(stream)', cat: 'streams', pt: 'Resolve quando a stream termina ou dá erro', en: 'Resolves when the stream ends or errors' },
  { cmd: 'readable.pipe(writable)', cat: 'streams', pt: 'Encadeamento simples (sem tratamento de erro próprio)', en: 'Simple chaining (no built-in error handling)' },

  // ─── child_process ───────────────────────────────────────────────────────
  { cmd: 'import { execSync } from "node:child_process"', cat: 'childproc', pt: 'execSync — roda um comando e bloqueia até terminar', en: 'execSync — runs a command and blocks until done' },
  { cmd: 'execSync("npm --version").toString()', cat: 'childproc', pt: 'Captura a saída como string', en: 'Captures the output as a string' },
  { cmd: 'spawn("ls", ["-la"], { stdio: "inherit" })', cat: 'childproc', pt: 'spawn — sem shell, direto; passe args como array', en: 'spawn — no shell, direct; pass args as an array' },
  { cmd: 'fork("worker.js")', cat: 'childproc', pt: 'Novo processo Node com canal IPC embutido', en: 'New Node process with a built-in IPC channel' },
  { cmd: 'child.stdout.on("data", cb)', cat: 'childproc', pt: 'Lê a saída do processo filho', en: 'Reads the child process output' },
  { cmd: 'child.on("exit", (code, signal) => {})', cat: 'childproc', pt: 'Evento ao terminar, com código e sinal', en: 'Event on exit, with code and signal' },
  { cmd: '{ shell: true }', cat: 'childproc', pt: 'Executa via shell (permita apenas dados confiáveis)', en: 'Runs through a shell (only with trusted input)' },

  // ─── EventEmitter ────────────────────────────────────────────────────────
  { cmd: 'class MeuEmitter extends EventEmitter {}', cat: 'events', pt: 'Extende EventEmitter para eventos próprios', en: 'Extends EventEmitter for custom events' },
  { cmd: 'emitter.on("evento", handler)', cat: 'events', pt: 'Registra um listener', en: 'Registers a listener' },
  { cmd: 'emitter.once("evento", handler)', cat: 'events', pt: 'Roda uma única vez e se remove', en: 'Runs once and removes itself' },
  { cmd: 'emitter.emit("evento", dados)', cat: 'events', pt: 'Dispara o evento com dados', en: 'Emits the event with data' },
  { cmd: 'emitter.off("evento", handler)', cat: 'events', pt: 'Remove um listener específico', en: 'Removes a specific listener' },
  { cmd: 'emitter.removeAllListeners()', cat: 'events', pt: 'Remove todos os listeners de um evento', en: 'Removes all listeners for an event' },
  { cmd: 'emitter.on("error", handler)', cat: 'events', pt: 'Sem listener de "error" uma exceção é lançada; sempre registre', en: 'Without an "error" listener an exception is thrown; always register' },
  { cmd: 'new EventEmitter({ captureRejections: true })', cat: 'events', pt: 'Captura rejeições de handlers async por listener', en: 'Captures rejections from async handlers per listener' },

  // ─── Event loop & timers ─────────────────────────────────────────────────
  { cmd: 'setTimeout(fn, 1000)', cat: 'timers', pt: 'Executa depois do intervalo (fase "timers" do loop)', en: 'Runs after the delay (loop "timers" phase)' },
  { cmd: 'setImmediate(fn)', cat: 'timers', pt: 'Executa no ciclo atual, após a fase de poll (I/O)', en: 'Runs in the current cycle, after the poll (I/O) phase' },
  { cmd: 'process.nextTick(fn)', cat: 'timers', pt: 'Antes de qualquer outra fase — roda ainda no microtask', en: 'Before any other phase — runs within the microtask queue' },
  { cmd: 'queueMicrotask(fn)', cat: 'timers', pt: 'Adiciona um microtask (como Promise.then)', en: 'Queues a microtask (like Promise.then)' },
  { cmd: 'await new Promise(r => setTimeout(r, 500))', cat: 'timers', pt: '"Sleep" em código async', en: '"Sleep" in async code' },
  { cmd: 'clearTimeout(handle) / clearInterval(handle)', cat: 'timers', pt: 'Cancela timers agendados', en: 'Cancels scheduled timers' },
  { cmd: 'setInterval(fn, 1000)', cat: 'timers', pt: 'Executa repetidamente a cada intervalo', en: 'Runs repeatedly at each interval' },

  // ─── Error handling ──────────────────────────────────────────────────────
  { cmd: 'try { await f() } catch (err) { }', cat: 'errors', pt: 'Tratamento padrão de erros em async', en: 'Standard error handling in async' },
  { cmd: 'err.code', cat: 'errors', pt: 'Códigos típicos: ENOENT, EACCES, ECONNREFUSED, ETIMEDOUT', en: 'Typical codes: ENOENT, EACCES, ECONNREFUSED, ETIMEDOUT' },
  { cmd: 'process.on("unhandledRejection", (err) => {})', cat: 'errors', pt: 'Promessa rejeitada sem catch (Node 15+ default: crash)', en: 'Promise rejected without catch (Node 15+ default: crash)' },
  { cmd: 'process.on("uncaughtException", (err) => {})', cat: 'errors', pt: 'Última rede para exceções — logue e saia, o estado pode estar corrompido', en: 'Last resort for exceptions — log and exit, state may be corrupt' },
  { cmd: 'throw new Error("msg", { cause })', cat: 'errors', pt: 'Encadeia a causa original do erro (Node 16.9+)', en: 'Chains the original error cause (Node 16.9+)' },
  { cmd: 'process.exitCode', cat: 'errors', pt: '0 = sucesso, 1 = erro não tratado, 128+sinal', en: '0 = success, 1 = unhandled error, 128+signal' },
  { cmd: 'util.promisify(fn)', cat: 'errors', pt: 'Converte callbacks error-first em promessas', en: 'Converts error-first callbacks into promises' },
  { cmd: 'setTimeout(() => { throw err }, 0)', cat: 'errors', pt: 'Vaza o erro para process.on("uncaughtException")', en: 'Leaks the error to process.on("uncaughtException")' },

  // ─── Env & configuration ────────────────────────────────────────────────
  { cmd: 'NODE_ENV=production node app.js', cat: 'env', pt: 'Convenção de ambiente (development/production/test)', en: 'Environment convention (development/production/test)' },
  { cmd: 'process.env.PORT', cat: 'env', pt: 'Porta lida do ambiente (12-factor app)', en: 'Port read from the environment (12-factor app)' },
  { cmd: 'import "dotenv/config"', cat: 'env', pt: 'Carrega .env na inicialização (lib externa)', en: 'Loads .env at startup (external package)' },
  { cmd: 'node --env-file=.env', cat: 'env', pt: 'Carrega .env sem depender de dotenv (Node 20+)', en: 'Loads .env without dotenv (Node 20+)' },
  { cmd: '.env + .gitignore', cat: 'env', pt: 'Nunca commite .env — mantenha um .env.example versionado', en: 'Never commit .env — keep a versioned .env.example' },
  { cmd: 'const port = Number(process.env.PORT) || 3000', cat: 'env', pt: 'Valor com fallback e coerção numérica', en: 'Value with fallback and numeric coercion' },
]

const translations = {
  pt: {
    title: 'Cheat Sheet de Node.js',
    intro: (
      <>
        Referência pesquisável do runtime Node.js — flags de CLI e debugging,
        objeto <Text code>process</Text>, módulos CommonJS vs ESM, módulos
        core (<Text code>fs</Text>, <Text code>path</Text>,{' '}
        <Text code>http</Text>, <Text code>crypto</Text>, streams,{' '}
        <Text code>child_process</Text>), event loop, tratamento de erros e
        variáveis de ambiente. Tudo 100% client-side (só texto de referência).
      </>
    ),
    tipTitle: 'Dicas rápidas',
    tipBody: (
      <>
        Prefira a API de promises (<Text code>fs/promises</Text>,{' '}
        <Text code>stream/promises</Text>) a callbacks. Para rodar código
        avulso use <Text code>node -p</Text> e para depurar{' '}
        <Text code>node --inspect-brk</Text> + Chrome DevTools. Sempre
        registre <Text code>process.on("unhandledRejection")</Text> para achar
        promessas órfãs, e lembre: <Text code>process.nextTick</Text> roda
        antes de <Text code>setImmediate</Text>, que roda antes de timers
        repetidos da próxima iteração.
      </>
    ),
    search: 'Buscar comando ou descrição...',
    all: 'Todos',
    empty: 'Nenhum comando encontrado. Tente outra busca ou categoria.',
    resultsOne: 'comando encontrado',
    resultsMany: 'comandos encontrados',
    copy: 'Copiar como Markdown',
    copied: 'Tabela Markdown copiada',
    copiedError: 'Não foi possível copiar',
    source: 'Fonte de dados (JSON)',
  },
  en: {
    title: 'Node.js Cheat Sheet',
    intro: (
      <>
        A searchable reference for the Node.js runtime — CLI and debugging
        flags, the <Text code>process</Text> object, CommonJS vs ESM modules,
        core modules (<Text code>fs</Text>, <Text code>path</Text>,{' '}
        <Text code>http</Text>, <Text code>crypto</Text>, streams,{' '}
        <Text code>child_process</Text>), the event loop, error handling and
        environment variables. 100% client-side (reference text only).
      </>
    ),
    tipTitle: 'Quick tips',
    tipBody: (
      <>
        Prefer the promise APIs (<Text code>fs/promises</Text>,{' '}
        <Text code>stream/promises</Text>) over callbacks. For one-off code
        use <Text code>node -p</Text>, and for debugging use{' '}
        <Text code>node --inspect-brk</Text> + Chrome DevTools. Always listen
        for <Text code>process.on("unhandledRejection")</Text> to catch orphan
        promises, and remember: <Text code>process.nextTick</Text> runs before{' '}
        <Text code>setImmediate</Text>, which runs before the next iteration
        timers.
      </>
    ),
    search: 'Search a command or description...',
    all: 'All',
    empty: 'No commands found. Try another search or category.',
    resultsOne: 'command found',
    resultsMany: 'commands found',
    copy: 'Copy as Markdown',
    copied: 'Markdown table copied',
    copiedError: 'Could not copy',
    source: 'Data source (JSON)',
  },
}

export default function NodejsCheatsheetPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [category, setCategory] = useState('all')
  const [query, setQuery] = useState('')
  const [messageApi, messageContextHolder] = message.useMessage()

  const normalized = useCallback((s) => String(s).trim().toLowerCase(), [])

  const filtered = useMemo(() => {
    const q = normalized(query)
    return COMMANDS.filter((c) => {
      if (category !== 'all' && c.cat !== category) return false
      if (!q) return true
      return (
        c.cmd.toLowerCase().includes(q) ||
        (c[lang] || '').toLowerCase().includes(q) ||
        labelOf[c.cat][lang].toLowerCase().includes(q)
      )
    })
  }, [category, query, lang, normalized])

  const mdTable = useMemo(() => {
    const head = '| Command | Category | Description |\n|---|---|---|\n'
    const rows = filtered.map((c) =>
      `| \`${c.cmd.replace(/\\|/g, '\\\\|').replace(/\n/g, '\\n')}\` | ${labelOf[c.cat][lang]} | ${(c[lang] || '').replace(/\\|/g, '\\\\|')} |`
    )
    return head + rows.join('\n')
  }, [filtered, lang])

  const copyText = useCallback(
    async (text, okMsg) => {
      try {
        await navigator.clipboard.writeText(text)
        messageApi.success(okMsg || t.copied)
      } catch {
        messageApi.error(t.copiedError || 'Error')
      }
    },
    [t, messageApi]
  )

  const resultLabel = filtered.length === 1 ? t.resultsOne : t.resultsMany

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {messageContextHolder}
      <Title level={2}><CodeOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Alert type="info" showIcon icon={<CodeOutlined />} message={t.tipTitle} description={t.tipBody} />

      <Space direction="vertical" style={{ width: '100%' }}>
        <Input
          prefix={<SearchOutlined />}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.search}
          allowClear
        />
        <Radio.Group value={category} onChange={(e) => setCategory(e.target.value)} optionType="button">
          <Radio.Button value="all">{t.all}</Radio.Button>
          {CATEGORIES.map((cat) => (
            <Radio.Button key={cat} value={cat}>{labelOf[cat][lang]}</Radio.Button>
          ))}
        </Radio.Group>
      </Space>

      <Space style={{ width: '100%', justifyContent: 'space-between' }}>
        <Text type="secondary">
          {filtered.length} {resultLabel}
        </Text>
        {filtered.length > 0 && (
          <Button size="small" icon={<CopyOutlined />} onClick={() => copyText(mdTable)}>
            {t.copy}
          </Button>
        )}
      </Space>

      <Card>
        <List
          dataSource={filtered}
          locale={{ emptyText: t.empty }}
          renderItem={(item) => (
            <List.Item key={item.cmd}>
              <Space direction="vertical" size={6} style={{ width: '100%' }}>
                <Space wrap style={{ rowGap: 6 }}>
                  <Text code style={{ fontSize: 13 }}>{item.cmd}</Text>
                  <Tag color={CATEGORY_COLOR[item.cat]}>{labelOf[item.cat][lang]}</Tag>
                  <Button size="small" type="text" icon={<CopyOutlined />} onClick={() => copyText(item.cmd)} />
                </Space>
                <Text type="secondary">{item[lang]}</Text>
              </Space>
            </List.Item>
          )}
        />
      </Card>

      <Collapse items={[
        {
          key: 'source',
          label: t.source,
          children: (
            <pre style={{ margin: 0, overflow: 'auto', fontSize: 12 }}>
              <code>{JSON.stringify(COMMANDS, null, 2)}</code>
            </pre>
          ),
        },
      ]} />
    </Space>
  )
}