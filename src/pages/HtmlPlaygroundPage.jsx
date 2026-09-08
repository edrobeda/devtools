import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  Button,
  Card,
  Col,
  Divider,
  Input,
  Modal,
  Row,
  Space,
  Switch,
  Tooltip,
  Typography,
} from 'antd'
import {
  CheckOutlined,
  ClearOutlined,
  CopyOutlined,
  CodeOutlined,
  DownloadOutlined,
  PlayCircleOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const EXAMPLE_HTML = [
  '<div class="card">',
  '  <h1>Hello, devtools!</h1>',
  '  <p id="counter">Clicks: 0</p>',
  '  <button id="btn">Click me</button>',
  '</div>',
].join('\n')

const EXAMPLE_CSS = [
  'body {',
  '  display: flex;',
  '  min-height: 100vh;',
  '  margin: 0;',
  '  font-family: system-ui, sans-serif;',
  '  background: #0f172a;',
  '  align-items: center;',
  '  justify-content: center;',
  '}',
  '.card {',
  '  background: #fff;',
  '  padding: 32px 40px;',
  '  border-radius: 16px;',
  '  text-align: center;',
  '  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.35);',
  '}',
  '.card h1 { margin: 0 0 8px; color: #111; }',
  '.card p { margin: 0 0 20px; color: #555; }',
  '.card button {',
  '  border: 0;',
  '  border-radius: 8px;',
  '  background: #4f46e5;',
  '  color: #fff;',
  '  padding: 10px 24px;',
  '  font-size: 15px;',
  '  cursor: pointer;',
  '  transition: transform 0.12s ease;',
  '}',
  '.card button:hover { transform: translateY(-2px); }',
  '.card button:active { transform: translateY(0); }',
].join('\n')

const EXAMPLE_JS = [
  'var count = 0;',
  'var btn = document.getElementById(\'btn\');',
  'var out = document.getElementById(\'counter\');',
  'btn.addEventListener(\'click\', function () {',
  '  count += 1;',
  '  out.textContent = \'Clicks: \' + count;',
  '  console.log(\'Button clicked\', count);',
  '});',
  'console.log(\'Ready! Edit the code and watch the preview.\');',
].join('\n')

const CAPTURE_SCRIPT = [
  '(function () {',
  '  var host = window.parent;',
  '  function send(type, payload) {',
  '    try { host.postMessage(JSON.stringify({ __devtoolsPlayground: true, type: type, payload: payload }), "*"); } catch (e) {}',
  '  }',
  '  function fmt(v) {',
  '    try {',
  '      if (typeof v === "undefined") { return "undefined"; }',
  '      if (typeof v === "function") { return "[Function]"; }',
  '      var s = JSON.stringify(v);',
  '      return s === undefined ? String(v) : s;',
  '    } catch (e) {',
  '      try { return String(v); } catch (e2) { return Object.prototype.toString.call(v); }',
  '    }',
  '  }',
  "  ['log', 'info', 'warn', 'error'].forEach(function (level) {",
  '    var orig = console[level];',
  '    console[level] = function () {',
  '      var args = Array.prototype.slice.call(arguments);',
  '      var text = args.map(fmt).join(" ");',
  '      send(level, text);',
  '      orig.apply(console, arguments);',
  '    };',
  '  });',
  '  window.addEventListener("error", function (e) {',
  '    send("error", (e.message || "Error") + " (line " + (e.lineno || "?") + ")");',
  '  });',
  '  window.addEventListener("unhandledrejection", function (e) {',
  '    send("error", "Unhandled rejection: " + fmt(e.reason));',
  '  });',
  '})();',
].join('\n')

function buildDocument(html, css, js) {
  const safeJs = js.replace(/<\/script/gi, '<\\/script')
  return [
    '<!DOCTYPE html>',
    '<html lang="en">',
    '<head>',
    '<meta charset="utf-8" />',
    '<meta name="viewport" content="width=device-width, initial-scale=1" />',
    '<style>',
    css,
    '</style>',
    '</head>',
    '<body>',
    html,
    '<script>',
    CAPTURE_SCRIPT,
    '</script>',
    '<script>',
    safeJs,
    '</script>',
    '</body>',
    '</html>',
  ].join('\n')
}

function EditorPanel({ title, value, onChange, rows, copied, onCopy, copyLabel, copiedLabel }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <Text strong>{title}</Text>
        <Button
          size="small"
          type="text"
          icon={copied ? <CheckOutlined style={{ color: '#52c41a' }} /> : <CopyOutlined />}
          onClick={onCopy}
        >
          {copied ? copiedLabel : copyLabel}
        </Button>
      </div>
      <Input.TextArea
        value={value}
        onChange={onChange}
        rows={rows}
        spellCheck={false}
        autoComplete="off"
        style={{
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
          fontSize: 13,
          lineHeight: 1.5,
        }}
      />
    </div>
  )
}

export default function HtmlPlaygroundPage() {
  const { lang } = useLanguage()
  const translations = {
    pt: {
      title: 'Playground HTML/CSS/JS',
      intro:
        'Edite HTML, CSS e JavaScript e veja o resultado ao vivo em um iframe isolado. Saídas de console.log(), avisos e erros de execução aparecem no painel Console.',
      run: 'Executar',
      download: 'Baixar HTML',
      viewHtml: 'Ver HTML completo',
      example: 'Exemplo',
      autorun: 'Execução automática',
      shortcut: 'Atalho: Ctrl+Enter para executar',
      console: 'Console',
      consoleEmpty: 'Nenhuma saída ainda. Use console.log() no seu código.',
      clear: 'Limpar',
      copy: 'Copiar',
      copied: 'Copiado!',
      preview: 'Pré-visualização',
      close: 'Fechar',
    },
    en: {
      title: 'HTML/CSS/JS Playground',
      intro:
        'Edit HTML, CSS and JavaScript and see the result live in a sandboxed iframe. console.log() output, warnings and runtime errors show up in the Console panel.',
      run: 'Run',
      download: 'Download HTML',
      viewHtml: 'View full HTML',
      example: 'Example',
      autorun: 'Auto-run',
      shortcut: 'Shortcut: Ctrl+Enter to run',
      console: 'Console',
      consoleEmpty: 'No output yet. Use console.log() in your code.',
      clear: 'Clear',
      copy: 'Copy',
      copied: 'Copied!',
      preview: 'Preview',
      close: 'Close',
    },
  }
  const t = translations[lang] || translations.en

  const [html, setHtml] = useState(EXAMPLE_HTML)
  const [css, setCss] = useState(EXAMPLE_CSS)
  const [js, setJs] = useState(EXAMPLE_JS)
  const [srcDoc, setSrcDoc] = useState('')
  const [autorun, setAutorun] = useState(true)
  const [runId, setRunId] = useState(0)
  const [entries, setEntries] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [copied, setCopied] = useState(null)
  const iframeRef = useRef(null)

  const runNow = useCallback(() => {
    setSrcDoc(buildDocument(html, css, js))
    setEntries([])
    setRunId((id) => id + 1)
  }, [html, css, js])

  useEffect(() => {
    if (!autorun) return undefined
    const id = setTimeout(() => {
      setSrcDoc(buildDocument(html, css, js))
      setEntries([])
      setRunId((r) => r + 1)
    }, 600)
    return () => clearTimeout(id)
  }, [html, css, js, autorun])

  useEffect(() => {
    const onKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault()
        runNow()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [runNow])

  useEffect(() => {
    const onMessage = (e) => {
      if (!iframeRef.current || e.source !== iframeRef.current.contentWindow) return
      let data
      try {
        data = JSON.parse(e.data)
      } catch (err) {
        return
      }
      if (!data || data.__devtoolsPlayground !== true) return
      setEntries((prev) => {
        const next = prev.concat({ type: data.type || 'log', text: String(data.payload) })
        return next.length > 200 ? next.slice(next.length - 200) : next
      })
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  const copyText = (key, text) => {
    const done = () => {
      setCopied(key)
      setTimeout(() => setCopied((c) => (c === key ? null : c)), 1500)
    }
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(done).catch(done)
    } else {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      try {
        document.execCommand('copy')
      } catch (err) {
        // ignore
      }
      document.body.removeChild(ta)
      done()
    }
  }

  const handleDownload = () => {
    const doc = srcDoc || buildDocument(html, css, js)
    const blob = new Blob([doc], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'playground.html'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleReset = () => {
    setHtml(EXAMPLE_HTML)
    setCss(EXAMPLE_CSS)
    setJs(EXAMPLE_JS)
    setAutorun(true)
    setSrcDoc(buildDocument(EXAMPLE_HTML, EXAMPLE_CSS, EXAMPLE_JS))
    setEntries([])
    setRunId((r) => r + 1)
  }

  const entryColors = {
    log: 'rgba(0, 0, 0, 0.85)',
    info: 'rgba(0, 0, 0, 0.65)',
    warn: '#d48806',
    error: '#ff4d4f',
  }

  return (
    <div>
      <Title level={3}>{t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Card>
          <Space wrap>
            <Button type="primary" icon={<PlayCircleOutlined />} onClick={runNow}>
              {t.run}
            </Button>
            <Button icon={<DownloadOutlined />} onClick={handleDownload}>
              {t.download}
            </Button>
            <Button icon={<CodeOutlined />} onClick={() => setModalOpen(true)}>
              {t.viewHtml}
            </Button>
            <Button icon={<ReloadOutlined />} onClick={handleReset}>
              {t.example}
            </Button>
            <Divider type="vertical" />
            <Text>{t.autorun}</Text>
            <Switch checked={autorun} onChange={setAutorun} />
          </Space>
        </Card>

        <Row gutter={[16, 16]}>
          <Col xs={24} lg={14}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <EditorPanel
                title="HTML"
                value={html}
                onChange={(e) => setHtml(e.target.value)}
                rows={6}
                copied={copied === 'html'}
                onCopy={() => copyText('html', html)}
                copyLabel={t.copy}
                copiedLabel={t.copied}
              />
              <EditorPanel
                title="CSS"
                value={css}
                onChange={(e) => setCss(e.target.value)}
                rows={6}
                copied={copied === 'css'}
                onCopy={() => copyText('css', css)}
                copyLabel={t.copy}
                copiedLabel={t.copied}
              />
              <EditorPanel
                title="JS"
                value={js}
                onChange={(e) => setJs(e.target.value)}
                rows={7}
                copied={copied === 'js'}
                onCopy={() => copyText('js', js)}
                copyLabel={t.copy}
                copiedLabel={t.copied}
              />
            </Space>
          </Col>

          <Col xs={24} lg={10}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Card
                size="small"
                title={t.preview}
                extra={
                  <Tooltip title={t.shortcut}>
                    <Text type="secondary" style={{ fontSize: 12 }}>Ctrl+Enter</Text>
                  </Tooltip>
                }
              >
                <iframe
                  key={runId}
                  ref={iframeRef}
                  title={t.preview}
                  srcDoc={srcDoc}
                  sandbox="allow-scripts allow-modals allow-forms allow-popups"
                  style={{
                    width: '100%',
                    height: 400,
                    border: '1px solid #f0f0f0',
                    borderRadius: 6,
                    background: '#fff',
                  }}
                />
              </Card>

              <Card
                size="small"
                title={t.console}
                extra={
                  <Button
                    size="small"
                    type="text"
                    icon={<ClearOutlined />}
                    onClick={() => setEntries([])}
                  >
                    {t.clear}
                  </Button>
                }
                styles={{ body: { padding: 0 } }}
              >
                {entries.length === 0 ? (
                  <div style={{ padding: 16, color: '#999', fontSize: 13 }}>{t.consoleEmpty}</div>
                ) : (
                  <div
                    style={{
                      maxHeight: 220,
                      overflow: 'auto',
                      padding: '8px 12px',
                      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
                      fontSize: 13,
                    }}
                  >
                    {entries.map((entry, i) => (
                      <div
                        key={i}
                        style={{
                          color: entryColors[entry.type] || entryColors.log,
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                          marginBottom: 2,
                        }}
                      >
                        {entry.text}
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </Space>
          </Col>
        </Row>
      </Space>

      <Modal
        open={modalOpen}
        title={t.viewHtml}
        onCancel={() => setModalOpen(false)}
        onOk={() => setModalOpen(false)}
        width={760}
        footer={
          <Button onClick={() => setModalOpen(false)}>{t.close}</Button>
        }
      >
        <pre
          style={{
            maxHeight: 420,
            overflow: 'auto',
            fontSize: 12,
            lineHeight: 1.5,
            background: '#0f172a',
            color: '#e2e8f0',
            padding: 12,
            borderRadius: 8,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {srcDoc || buildDocument(html, css, js)}
        </pre>
      </Modal>
    </div>
  )
}